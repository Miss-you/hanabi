import { AudioEvent, MusicSection, LaunchCommand } from "@/core/types";
import { BeatInfo } from "@/audio/BeatDetector";
import { FrequencyBands } from "@/audio/FrequencyAnalyzer";
import { FireworkLauncher } from "@/engine/FireworkLauncher";
import { PatternLibrary } from "./PatternLibrary";
import { SectionDetector } from "./SectionDetector";
import { RuleEngine, MusicContext } from "./RuleEngine";

/**
 * Input data for preparing a track
 */
export interface TrackData {
  events: AudioEvent[];
  beatInfo: BeatInfo;
  freqBands: FrequencyBands;
  duration: number;
}

/**
 * Scheduled command with execution time
 */
interface ScheduledCommand {
  command: LaunchCommand;
  executed: boolean;
}

/**
 * Choreographer - Main orchestration engine for music-synced firework displays
 *
 * Integrates:
 * - PatternLibrary: 10 artistic firework patterns
 * - SectionDetector: Music structure analysis
 * - RuleEngine: Priority-based decision making
 */
export class Choreographer {
  private patternLibrary: PatternLibrary;
  private sectionDetector: SectionDetector;
  private ruleEngine: RuleEngine;
  private launcher: FireworkLauncher | null = null;

  // Track state
  private sections: MusicSection[] = [];
  private events: AudioEvent[] = [];
  private beatInfo: BeatInfo | null = null;
  private duration: number = 0;
  private scheduledCommands: ScheduledCommand[] = [];

  // Playback state
  private currentEventIndex: number = 0;
  private recentEvents: AudioEvent[] = [];
  private readonly recentEventsWindow: number = 2; // seconds

  // Energy boost config for sparse fireworks
  private recentLaunches: number[] = []; // timestamps of recent launches
  private readonly launchTrackingWindow: number = 3; // seconds to track
  private readonly minEnergyFloor: number = 0.55; // minimum energy when sparse
  private readonly sparseThreshold: number = 3; // if <= this many launches in window, boost energy

  constructor() {
    this.patternLibrary = new PatternLibrary();
    this.sectionDetector = new SectionDetector();
    this.ruleEngine = new RuleEngine();
  }

  /**
   * Set the firework launcher instance
   */
  setLauncher(launcher: FireworkLauncher): void {
    this.launcher = launcher;
  }

  /**
   * Prepare choreography for a track
   * Analyzes the music and pre-computes section structure
   */
  prepareTrack(data: TrackData): void {
    this.events = [...data.events].sort(
      (a, b) => a.explodeTime - b.explodeTime,
    );
    this.beatInfo = data.beatInfo;
    this.duration = data.duration;

    // Detect music sections
    this.sections = this.sectionDetector.detect(this.events, this.duration);

    // Reset playback state
    this.reset();

    console.log("[Choreographer] Track prepared:", {
      events: this.events.length,
      sections: this.sections.length,
      bpm: this.beatInfo.bpm,
      duration: this.duration,
    });
    console.log("[Choreographer] Detected sections:", this.sections);
  }

  /**
   * Reset playback state
   */
  reset(): void {
    this.currentEventIndex = 0;
    this.recentEvents = [];
    this.scheduledCommands = [];
    this.recentLaunches = [];
    this.ruleEngine.reset();
  }

  /**
   * Update choreography at current playback time
   * Called on each animation frame during playback
   */
  update(currentTime: number): void {
    if (!this.launcher || this.events.length === 0) return;

    // Process events up to current time
    while (
      this.currentEventIndex < this.events.length &&
      this.events[this.currentEventIndex]!.explodeTime <= currentTime + 0.5 // Look ahead 500ms
    ) {
      const event = this.events[this.currentEventIndex]!;
      this.processEvent(event, currentTime);
      this.currentEventIndex++;
    }

    // Execute scheduled commands
    this.executeScheduledCommands(currentTime);

    // Clean up old recent events
    this.recentEvents = this.recentEvents.filter(
      (e) => currentTime - e.explodeTime < this.recentEventsWindow,
    );
  }

  /**
   * Process a single audio event
   */
  private processEvent(event: AudioEvent, currentTime: number): void {
    if (!this.launcher) return;

    // Add to recent events
    this.recentEvents.push(event);

    // Build music context
    const context: MusicContext = {
      currentTime,
      currentEvent: event,
      currentSection: SectionDetector.getSectionAt(this.sections, currentTime),
      beatInfo: this.beatInfo,
      duration: this.duration,
      screenWidth: this.launcher.getScreenWidth(),
      screenHeight: this.launcher.getScreenHeight(),
      recentEvents: [...this.recentEvents],
    };

    // Evaluate rules
    const commands = this.ruleEngine.evaluate(context);

    // Schedule commands for execution
    for (const command of commands) {
      this.scheduleCommand(command);
    }
  }

  /**
   * Schedule a command for later execution
   */
  private scheduleCommand(command: LaunchCommand): void {
    this.scheduledCommands.push({
      command,
      executed: false,
    });
  }

  /**
   * Execute scheduled commands that are due
   */
  private executeScheduledCommands(currentTime: number): void {
    if (!this.launcher) return;

    for (const scheduled of this.scheduledCommands) {
      if (scheduled.executed) continue;

      // Check if it's time to execute
      if (currentTime >= scheduled.command.launchTime) {
        this.executeCommand(scheduled.command);
        scheduled.executed = true;
      }
    }

    // Clean up executed commands
    this.scheduledCommands = this.scheduledCommands.filter((s) => !s.executed);
  }

  /**
   * Execute a launch command with energy floor protection
   */
  private executeCommand(command: LaunchCommand): void {
    if (!this.launcher) return;

    const now = command.launchTime;

    // Clean up old launch records
    this.recentLaunches = this.recentLaunches.filter(
      (t) => now - t < this.launchTrackingWindow,
    );

    // Check if we're in a sparse period
    const recentCount = this.recentLaunches.length;
    const isSparse = recentCount <= this.sparseThreshold;

    // Apply energy floor for sparse periods
    const adjustedParams = { ...command.params };
    if (isSparse && adjustedParams.energy !== undefined) {
      // Boost energy: the sparser, the bigger
      const boostFactor = 1 + (this.sparseThreshold - recentCount) * 0.15;
      const boostedEnergy = Math.max(
        this.minEnergyFloor,
        adjustedParams.energy * boostFactor,
      );
      adjustedParams.energy = Math.min(1.0, boostedEnergy);
    } else if (isSparse && adjustedParams.energy === undefined) {
      // Set a default high energy for sparse periods
      adjustedParams.energy = this.minEnergyFloor;
    }

    // Record this launch
    this.recentLaunches.push(now);

    try {
      this.patternLibrary.execute(
        command.pattern,
        this.launcher,
        adjustedParams,
      );
    } catch (error) {
      console.warn(
        "[Choreographer] Failed to execute pattern:",
        command.pattern,
        error,
      );
    }
  }

  /**
   * Get current music section
   */
  getCurrentSection(time: number): MusicSection | null {
    return SectionDetector.getSectionAt(this.sections, time);
  }

  /**
   * Get all detected sections
   */
  getSections(): MusicSection[] {
    return [...this.sections];
  }

  /**
   * Get beat info
   */
  getBeatInfo(): BeatInfo | null {
    return this.beatInfo;
  }

  /**
   * Check if near a section transition
   */
  isNearTransition(time: number, threshold: number = 0.5): boolean {
    return SectionDetector.isNearTransition(this.sections, time, threshold);
  }

  /**
   * Manually trigger a pattern (for testing or special effects)
   */
  triggerPattern(
    pattern: LaunchCommand["pattern"],
    params: Partial<LaunchCommand["params"]> = {},
  ): void {
    if (!this.launcher) return;

    const defaultParams: LaunchCommand["params"] = {
      duration: 0,
      targetY: this.launcher.getScreenHeight() * 0.25,
      energy: 0.6,
    };

    this.patternLibrary.execute(pattern, this.launcher, {
      ...defaultParams,
      ...params,
    });
  }

  /**
   * Get statistics about the choreography
   */
  getStats(): {
    totalEvents: number;
    totalSections: number;
    sectionBreakdown: Record<string, number>;
    bpm: number;
    duration: number;
  } {
    const sectionBreakdown: Record<string, number> = {};
    for (const section of this.sections) {
      sectionBreakdown[section.type] =
        (sectionBreakdown[section.type] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      totalSections: this.sections.length,
      sectionBreakdown,
      bpm: this.beatInfo?.bpm ?? 0,
      duration: this.duration,
    };
  }
}
