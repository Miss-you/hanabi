import { AudioEvent, MusicSection, SectionType } from "@/core/types";
import { TUNING } from "@/config/tuning";

/**
 * Window for analyzing energy patterns
 */
interface AnalysisWindow {
  startTime: number;
  endTime: number;
  avgEnergy: number;
  eventCount: number;
  climaxCount: number;
  trend: "rising" | "falling" | "stable";
}

/**
 * SectionDetector - Analyzes audio events to detect music structure
 * Uses energy curves and event density to identify song sections
 */
export class SectionDetector {
  private windowSize: number; // seconds per window
  private minSectionDuration: number; // minimum section length

  constructor(
    windowSize: number = TUNING.sectionDetector.windowSize,
    minSectionDuration: number = TUNING.sectionDetector.minSectionDuration,
  ) {
    this.windowSize = windowSize;
    this.minSectionDuration = minSectionDuration;
  }

  /**
   * Detect music sections from audio events
   */
  detect(events: AudioEvent[], duration: number): MusicSection[] {
    if (events.length === 0 || duration <= 0) {
      return [
        this.createSection(
          "verse",
          0,
          duration,
          TUNING.sectionDetector.defaultEnergy,
          0,
        ),
      ];
    }

    // Step 1: Create analysis windows
    const windows = this.createWindows(events, duration);

    // Step 2: Calculate energy curve and detect patterns
    this.calculateTrends(windows);

    // Step 3: Classify windows into section types
    const rawSections = this.classifyWindows(windows, duration);

    // Step 4: Merge adjacent sections of same type
    const mergedSections = this.mergeSections(rawSections);

    // Step 5: Apply minimum duration constraints
    const finalSections = this.applyMinDuration(mergedSections, duration);

    return finalSections;
  }

  /**
   * Create analysis windows from events
   */
  private createWindows(
    events: AudioEvent[],
    duration: number,
  ): AnalysisWindow[] {
    const windows: AnalysisWindow[] = [];
    const windowCount = Math.ceil(duration / this.windowSize);

    for (let i = 0; i < windowCount; i++) {
      const startTime = i * this.windowSize;
      const endTime = Math.min((i + 1) * this.windowSize, duration);

      // Get events in this window
      const windowEvents = events.filter(
        (e) => e.explodeTime >= startTime && e.explodeTime < endTime,
      );

      // Calculate metrics
      const avgEnergy =
        windowEvents.length > 0
          ? windowEvents.reduce((sum, e) => sum + e.energy, 0) /
            windowEvents.length
          : 0;
      const climaxCount = windowEvents.filter((e) => e.isClimax).length;

      windows.push({
        startTime,
        endTime,
        avgEnergy,
        eventCount: windowEvents.length,
        climaxCount,
        trend: "stable",
      });
    }

    return windows;
  }

  /**
   * Calculate energy trends between windows
   */
  private calculateTrends(windows: AnalysisWindow[]): void {
    const trendThreshold = TUNING.sectionDetector.trendThreshold;
    for (let i = 1; i < windows.length; i++) {
      const prev = windows[i - 1]!;
      const curr = windows[i]!;
      const diff = curr.avgEnergy - prev.avgEnergy;

      if (diff > trendThreshold) {
        curr.trend = "rising";
      } else if (diff < -trendThreshold) {
        curr.trend = "falling";
      } else {
        curr.trend = "stable";
      }
    }
  }

  /**
   * Classify windows into section types
   */
  private classifyWindows(
    windows: AnalysisWindow[],
    duration: number,
  ): MusicSection[] {
    const sections: MusicSection[] = [];
    const tuning = TUNING.sectionDetector;

    // Calculate global thresholds
    const allEnergies = windows.map((w) => w.avgEnergy).filter((e) => e > 0);
    const avgEnergy =
      allEnergies.length > 0
        ? allEnergies.reduce((a, b) => a + b, 0) / allEnergies.length
        : tuning.defaultEnergy;
    const maxEnergy = Math.max(...allEnergies, tuning.defaultEnergy);

    const highThreshold =
      avgEnergy + (maxEnergy - avgEnergy) * tuning.highThresholdFactor;
    const lowThreshold = avgEnergy * tuning.lowThresholdFactor;

    for (const window of windows) {
      let type: SectionType;
      const { avgEnergy: energy, climaxCount, trend, eventCount } = window;

      // Determine section type based on energy and patterns
      if (
        climaxCount > tuning.climaxCountThreshold ||
        energy > highThreshold * tuning.climaxEnergyFactor
      ) {
        type = "climax";
      } else if (
        energy > highThreshold * tuning.chorusEnergyFactor &&
        eventCount > tuning.chorusEventCount
      ) {
        type = "chorus";
      } else if (
        trend === "rising" &&
        energy > avgEnergy * tuning.prechorusEnergyFactor
      ) {
        type = "prechorus";
      } else if (energy < lowThreshold || eventCount < tuning.lowEventCount) {
        // Check position for intro/outro
        if (window.startTime < duration * tuning.introPosition) {
          type = "intro";
        } else if (window.endTime > duration * tuning.outroPosition) {
          type = "outro";
        } else {
          type = "bridge";
        }
      } else {
        type = "verse";
      }

      sections.push(
        this.createSection(
          type,
          window.startTime,
          window.endTime,
          energy,
          eventCount / this.windowSize,
        ),
      );
    }

    return sections;
  }

  /**
   * Merge adjacent sections of the same type
   */
  private mergeSections(sections: MusicSection[]): MusicSection[] {
    if (sections.length === 0) return [];

    const merged: MusicSection[] = [];
    let current = { ...sections[0]! };

    for (let i = 1; i < sections.length; i++) {
      const next = sections[i]!;

      if (next.type === current.type) {
        // Merge: extend current section
        current.endTime = next.endTime;
        current.energy = (current.energy + next.energy) / 2;
        current.density = (current.density + next.density) / 2;
      } else {
        // Save current and start new
        merged.push(current);
        current = { ...next };
      }
    }

    merged.push(current);
    return merged;
  }

  /**
   * Apply minimum duration constraints
   */
  private applyMinDuration(
    sections: MusicSection[],
    duration: number,
  ): MusicSection[] {
    const result: MusicSection[] = [];

    for (const section of sections) {
      const sectionDuration = section.endTime - section.startTime;

      if (sectionDuration < this.minSectionDuration && result.length > 0) {
        // Too short: merge with previous section
        const prev = result[result.length - 1]!;
        prev.endTime = section.endTime;
        prev.energy = (prev.energy + section.energy) / 2;
        prev.density = (prev.density + section.density) / 2;
      } else {
        result.push(section);
      }
    }

    // Ensure we have at least one section
    if (result.length === 0) {
      result.push(
        this.createSection(
          "verse",
          0,
          duration,
          TUNING.sectionDetector.defaultEnergy,
          0,
        ),
      );
    }

    return result;
  }

  /**
   * Create a music section object
   */
  private createSection(
    type: SectionType,
    startTime: number,
    endTime: number,
    energy: number,
    density: number,
  ): MusicSection {
    return {
      type,
      startTime,
      endTime,
      energy,
      density,
    };
  }

  /**
   * Get section at a specific time
   */
  static getSectionAt(
    sections: MusicSection[],
    time: number,
  ): MusicSection | null {
    for (const section of sections) {
      if (time >= section.startTime && time < section.endTime) {
        return section;
      }
    }
    return null;
  }

  /**
   * Check if time is near a section transition
   */
  static isNearTransition(
    sections: MusicSection[],
    time: number,
    threshold: number = TUNING.sectionDetector.transitionThreshold,
  ): boolean {
    for (const section of sections) {
      if (Math.abs(time - section.startTime) < threshold) {
        return true;
      }
    }
    return false;
  }
}
