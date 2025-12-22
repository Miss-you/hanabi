import { AudioEvent, AudioEventType } from "@/core/types";
import { calculateLaunchParams, random } from "@/utils/math";

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
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const step = Math.floor(sampleRate / 60); // 60 FPS analysis

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
      if (rms > 0.3) {
        climaxEnergy++;
      } else {
        climaxEnergy = Math.max(0, climaxEnergy - 1);
      }
      const isClimaxNow = climaxEnergy > 60;

      // Thresholds and cooldowns
      const bassThresh = isClimaxNow ? 0.3 : 0.4;
      const bassCoolDown = isClimaxNow ? 0.2 : 0.35;
      const midThresh = 0.15;
      const isQuiet = rms < 0.15 && rms > 0.05;

      // Bass events (loud peaks)
      if (rms > bassThresh && time - lastBassTime > bassCoolDown) {
        const params = calculateLaunchParams(
          this.screenHeight,
          random(0.15, 0.3),
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
      else if (rms > midThresh && time - lastMidTime > 0.15) {
        const params = calculateLaunchParams(
          this.screenHeight,
          random(0.4, 0.6),
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
      else if (isQuiet && time - lastMidTime > 0.8) {
        const params = calculateLaunchParams(
          this.screenHeight,
          random(0.3, 0.7),
        );
        timeline.push({
          launchTime: time - params.duration,
          explodeTime: time,
          type: "piano" as AudioEventType,
          isClimax: false,
          targetY: params.targetY,
          energy: rms * 0.8,
        });
        lastMidTime = time;
      }

      // Report progress
      processedSteps++;
      if (processedSteps % 100 === 0 && callbacks?.onProgress) {
        callbacks.onProgress(processedSteps / totalSteps);
      }
    }

    // Sort by launch time
    timeline.sort((a, b) => a.launchTime - b.launchTime);

    // Create simplified waveform for visualization
    const waveformSamples = 1000;
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
