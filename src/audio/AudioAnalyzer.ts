import { AudioEvent, AudioEventType } from "@/core/types";
import { calculateLaunchParams, random } from "@/utils/math";
import { TUNING } from "@/config/tuning";

export interface AnalysisResult {
  timeline: AudioEvent[];
  duration: number;
  waveform: Float32Array;
  sampleRate: number;
}

export interface AnalysisCallbacks {
  onProgress?: (progress: number) => void;
  onComplete?: (result: AnalysisResult) => void;
}

/**
 * Offline audio analyzer for beat and event detection
 */
export class AudioAnalyzer {
  private screenHeight: number;

  constructor(screenHeight: number) {
    this.screenHeight = screenHeight;
  }

  /**
   * Update screen dimensions
   */
  resize(height: number): void {
    this.screenHeight = height;
  }

  /**
   * Analyze audio buffer and generate event timeline
   */
  async analyze(
    buffer: AudioBuffer,
    callbacks?: AnalysisCallbacks,
  ): Promise<AnalysisResult> {
    const tuning = TUNING.audioAnalyzer;
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const step = Math.floor(sampleRate / tuning.analysisFps);

    const timeline: AudioEvent[] = [];

    // State for detection
    let climaxEnergy = 0;
    let lastBassTime = 0;
    let lastMidTime = 0;

    const totalSteps = Math.ceil(channelData.length / step);
    let processedSteps = 0;

    for (let i = 0; i < channelData.length; i += step) {
      // Calculate RMS energy
      let sum = 0;
      for (let j = 0; j < step && i + j < channelData.length; j++) {
        sum += channelData[i + j]! * channelData[i + j]!;
      }
      const rms = Math.sqrt(sum / step);
      const time = i / sampleRate;

      // Climax detection
      if (rms > tuning.climaxRmsThreshold) {
        climaxEnergy++;
      } else {
        climaxEnergy = Math.max(0, climaxEnergy - 1);
      }
      const isClimaxNow = climaxEnergy > tuning.climaxFramesThreshold;

      // Thresholds and cooldowns
      const bassThresh = isClimaxNow
        ? tuning.bass.thresholdClimax
        : tuning.bass.threshold;
      const bassCoolDown = isClimaxNow
        ? tuning.bass.cooldownClimax
        : tuning.bass.cooldown;
      const midThresh = tuning.mid.threshold;
      const isQuiet = rms < tuning.piano.quietMax && rms > tuning.piano.quietMin;

      // Bass events (loud peaks)
      if (rms > bassThresh && time - lastBassTime > bassCoolDown) {
        const params = calculateLaunchParams(
          this.screenHeight,
          random(tuning.bass.launchRatioMin, tuning.bass.launchRatioMax),
        );
        timeline.push({
          launchTime: time - params.duration,
          explodeTime: time,
          type: "bass" as AudioEventType,
          isClimax: isClimaxNow,
          targetY: params.targetY,
          energy: rms,
        });
        lastBassTime = time;
      }
      // Mid events
      else if (rms > midThresh && time - lastMidTime > tuning.mid.cooldown) {
        const params = calculateLaunchParams(
          this.screenHeight,
          random(tuning.mid.launchRatioMin, tuning.mid.launchRatioMax),
        );
        timeline.push({
          launchTime: time - params.duration,
          explodeTime: time,
          type: "mid" as AudioEventType,
          isClimax: isClimaxNow,
          targetY: params.targetY,
          energy: rms,
        });
        lastMidTime = time;
      }
      // Piano/quiet events
      else if (isQuiet && time - lastMidTime > tuning.piano.cooldown) {
        const params = calculateLaunchParams(
          this.screenHeight,
          random(tuning.piano.launchRatioMin, tuning.piano.launchRatioMax),
        );
        timeline.push({
          launchTime: time - params.duration,
          explodeTime: time,
          type: "piano" as AudioEventType,
          isClimax: false,
          targetY: params.targetY,
          energy: rms * tuning.piano.energyScale,
        });
        lastMidTime = time;
      }

      // Report progress
      processedSteps++;
      if (processedSteps % tuning.progressStep === 0 && callbacks?.onProgress) {
        callbacks.onProgress(processedSteps / totalSteps);
      }
    }

    // Sort by launch time
    timeline.sort((a, b) => a.launchTime - b.launchTime);

    // Create simplified waveform for visualization
    const waveformSamples = tuning.waveformSamples;
    const waveformStep = Math.floor(channelData.length / waveformSamples);
    const waveform = new Float32Array(waveformSamples);

    for (let i = 0; i < waveformSamples; i++) {
      let max = 0;
      const start = i * waveformStep;
      for (let j = 0; j < waveformStep && start + j < channelData.length; j++) {
        max = Math.max(max, Math.abs(channelData[start + j]!));
      }
      waveform[i] = max;
    }

    const result: AnalysisResult = {
      timeline,
      duration: buffer.duration,
      waveform,
      sampleRate,
    };

    callbacks?.onComplete?.(result);
    return result;
  }

  /**
   * Export analysis result as JSON
   */
  static exportJSON(result: AnalysisResult): string {
    return JSON.stringify(
      {
        duration: result.duration,
        sampleRate: result.sampleRate,
        eventCount: result.timeline.length,
        events: result.timeline.map((e) => ({
          type: e.type,
          time: e.explodeTime.toFixed(3),
          energy: e.energy.toFixed(3),
          isClimax: e.isClimax,
        })),
      },
      null,
      2,
    );
  }
}
