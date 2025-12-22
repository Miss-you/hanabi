import { describe, it, expect } from "vitest";
import { BeatDetector } from "@/audio/BeatDetector";
import { TUNING } from "@/config/tuning";

describe("BeatDetector", () => {
  it("falls back to default bpm when onsets are insufficient", () => {
    const duration = 10;
    const detector = new BeatDetector(TUNING.beatDetector.fps);
    const energy = new Float32Array(duration * TUNING.beatDetector.fps);

    const result = detector.detectBeats(energy, duration);

    expect(result.bpm).toBe(TUNING.beatDetector.tempo.fallbackBpm);
    expect(result.confidence).toBe(0);
    expect(result.beatInterval).toBeCloseTo(
      60 / TUNING.beatDetector.tempo.fallbackBpm,
      5,
    );
    expect(result.beats.length).toBeGreaterThan(0);
  });

  it("detects on-beat times within tolerance", () => {
    const beats = [0.5, 1.0, 1.5];

    expect(BeatDetector.isOnBeat(1.02, beats, 0.05)).toBe(true);
    expect(BeatDetector.isOnBeat(1.2, beats, 0.05)).toBe(false);
  });
});
