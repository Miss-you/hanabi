/**
 * Beat detection result
 */
export interface BeatInfo {
  /** Detected BPM */
  bpm: number;
  /** Beat timestamps in seconds */
  beats: number[];
  /** Detection confidence (0-1) */
  confidence: number;
  /** Beat interval in seconds */
  beatInterval: number;
}

/**
 * Beat detector using onset detection and tempo estimation
 */
export class BeatDetector {
  private fps: number;

  constructor(fps: number = 60) {
    this.fps = fps;
  }

  /**
   * Detect beats from bass energy curve
   */
  detectBeats(bassEnergy: Float32Array, duration: number): BeatInfo {
    // 1. Find onsets (sudden increases in energy)
    const onsets = this.detectOnsets(bassEnergy);

    // 2. Estimate tempo from onset intervals
    const { bpm, confidence } = this.estimateTempo(onsets, duration);

    // 3. Generate beat grid aligned to detected tempo
    const beatInterval = 60 / bpm;
    const beats = this.generateBeatGrid(onsets, beatInterval, duration);

    return {
      bpm,
      beats,
      confidence,
      beatInterval,
    };
  }

  /**
   * Detect onset points (peaks in energy)
   */
  private detectOnsets(energy: Float32Array): number[] {
    const onsets: number[] = [];
    const windowSize = Math.floor(this.fps * 0.1); // 100ms window
    const threshold = 0.15;

    // Calculate local average for adaptive thresholding
    for (let i = windowSize; i < energy.length - windowSize; i++) {
      // Local average
      let localSum = 0;
      for (let j = i - windowSize; j < i + windowSize; j++) {
        localSum += energy[j]!;
      }
      const localAvg = localSum / (windowSize * 2);

      // Check if current point is a peak above threshold
      const current = energy[i]!;
      const prev = energy[i - 1]!;
      const next = energy[i + 1]!;

      const isPeak = current > prev && current > next;
      const aboveThreshold = current > localAvg + threshold;
      const aboveMinimum = current > 0.1;

      if (isPeak && aboveThreshold && aboveMinimum) {
        // Check minimum distance from last onset (avoid double triggers)
        const timeInSeconds = i / this.fps;
        const lastOnset = onsets[onsets.length - 1];
        if (!lastOnset || timeInSeconds - lastOnset > 0.15) {
          onsets.push(timeInSeconds);
        }
      }
    }

    return onsets;
  }

  /**
   * Estimate tempo from onset intervals
   */
  private estimateTempo(
    onsets: number[],
    _duration: number,
  ): { bpm: number; confidence: number } {
    if (onsets.length < 4) {
      return { bpm: 120, confidence: 0 }; // Default fallback
    }

    // Calculate intervals between consecutive onsets
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      const interval = onsets[i]! - onsets[i - 1]!;
      // Only consider reasonable intervals (60-200 BPM range)
      if (interval > 0.3 && interval < 1.0) {
        intervals.push(interval);
      }
    }

    if (intervals.length < 2) {
      return { bpm: 120, confidence: 0 };
    }

    // Use histogram to find most common interval
    const histogram = new Map<number, number>();
    const binSize = 0.02; // 20ms bins

    for (const interval of intervals) {
      const bin = Math.round(interval / binSize) * binSize;
      histogram.set(bin, (histogram.get(bin) || 0) + 1);
    }

    // Find most frequent interval
    let maxCount = 0;
    let bestInterval = 0.5;
    for (const [interval, count] of histogram) {
      if (count > maxCount) {
        maxCount = count;
        bestInterval = interval;
      }
    }

    // Calculate BPM from interval
    let bpm = 60 / bestInterval;

    // Normalize BPM to common range (80-160)
    while (bpm < 80) bpm *= 2;
    while (bpm > 160) bpm /= 2;

    // Calculate confidence based on consistency
    const confidence = Math.min(1, maxCount / (intervals.length * 0.5));

    return { bpm: Math.round(bpm), confidence };
  }

  /**
   * Generate a regular beat grid aligned to detected onsets
   */
  private generateBeatGrid(
    onsets: number[],
    beatInterval: number,
    duration: number,
  ): number[] {
    const beats: number[] = [];

    // Find best starting point by checking alignment with onsets
    let bestOffset = 0;
    let bestScore = 0;

    for (let offset = 0; offset < beatInterval; offset += 0.01) {
      let score = 0;
      for (const onset of onsets) {
        // Check how close onset is to a beat
        const beatPhase = (onset - offset) % beatInterval;
        const distance = Math.min(beatPhase, beatInterval - beatPhase);
        if (distance < 0.05) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestOffset = offset;
      }
    }

    // Generate beats
    for (let t = bestOffset; t < duration; t += beatInterval) {
      beats.push(t);
    }

    return beats;
  }

  /**
   * Get beat number (1-4) for a given time
   */
  static getBeatNumber(
    time: number,
    beatInterval: number,
    offset: number = 0,
  ): number {
    const beatIndex = Math.floor((time - offset) / beatInterval);
    return (beatIndex % 4) + 1;
  }

  /**
   * Check if a time is on a beat
   */
  static isOnBeat(
    time: number,
    beats: number[],
    tolerance: number = 0.05,
  ): boolean {
    for (const beat of beats) {
      if (Math.abs(time - beat) < tolerance) {
        return true;
      }
    }
    return false;
  }
}
