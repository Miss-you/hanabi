import { AudioEvent, FireworkType } from "@/core/types";
import { TUNING } from "@/config/tuning";

export interface TimelineCallbacks {
  onBass?: (event: AudioEvent) => void;
  onMid?: (event: AudioEvent) => void;
  onPiano?: (event: AudioEvent) => void;
  onClimax?: (event: AudioEvent) => void;
  onTick?: (time: number) => void;
}

/**
 * Timeline manages event scheduling for audio-synced fireworks
 */
export class Timeline {
  private events: AudioEvent[] = [];
  private currentIndex: number = 0;
  private startTime: number = 0;
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private callbacks: TimelineCallbacks;
  private lastSalvoTime: number = TUNING.timeline.initialSalvoTime;

  isPlaying: boolean = false;
  isPaused: boolean = false;

  constructor(callbacks: TimelineCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Load events from analysis result
   */
  loadEvents(events: AudioEvent[]): void {
    this.events = [...events];
    this.currentIndex = 0;
    this.lastSalvoTime = TUNING.timeline.initialSalvoTime;
  }

  /**
   * Start playback with audio buffer
   */
  async play(buffer: AudioBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Stop any existing source
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // Ignore
      }
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.audioContext.destination);
    this.source.start(0);

    this.startTime = this.audioContext.currentTime;
    this.currentIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;

    this.source.onended = () => {
      this.isPlaying = false;
    };
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (this.audioContext && this.audioContext.state === "running") {
      await this.audioContext.suspend();
      this.isPaused = true;
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
      this.isPaused = false;
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // Ignore
      }
      this.source = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
  }

  /**
   * Stop playback and release audio resources
   */
  async close(): Promise<void> {
    this.stop();
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {
        // Ignore close errors
      }
      this.audioContext = null;
    }
  }

  /**
   * Get current playback time
   */
  get currentTime(): number {
    if (!this.audioContext || !this.isPlaying) return 0;
    return this.audioContext.currentTime - this.startTime;
  }

  /**
   * Check and fire events for current time
   */
  update(): void {
    if (!this.isPlaying || this.isPaused) return;

    const time = this.currentTime;

    // Call onTick if provided (for Choreographer)
    this.callbacks.onTick?.(time);

    // Process events
    while (
      this.currentIndex < this.events.length &&
      this.events[this.currentIndex]!.launchTime <= time
    ) {
      const event = this.events[this.currentIndex]!;
      this.fireEvent(event, time);
      this.currentIndex++;
    }
  }

  /**
   * Fire appropriate callback for event
   */
  private fireEvent(event: AudioEvent, currentTime: number): void {
    switch (event.type) {
      case "bass":
        if (
          event.isClimax &&
          currentTime - this.lastSalvoTime > TUNING.timeline.climaxCooldown
        ) {
          this.callbacks.onClimax?.(event);
          this.lastSalvoTime = currentTime;
        } else {
          this.callbacks.onBass?.(event);
        }
        break;
      case "mid":
        this.callbacks.onMid?.(event);
        break;
      case "piano":
        this.callbacks.onPiano?.(event);
        break;
    }
  }

  /**
   * Get events for visualization
   */
  getEvents(): readonly AudioEvent[] {
    return this.events;
  }

  /**
   * Get event type to firework type mapping
   */
  static eventToFireworkType(
    eventType: AudioEvent["type"],
    isClimax: boolean,
  ): FireworkType {
    switch (eventType) {
      case "bass":
        return isClimax || Math.random() > TUNING.timeline.climaxWillowRoll
          ? "willow"
          : "kiku";
      case "mid":
        return "botan";
      case "piano":
        return "botan";
      default:
        return "kiku";
    }
  }
}
