import {
  AudioEvent,
  MusicSection,
  PatternType,
  LaunchCommand,
  SectionType,
} from '@/core/types';
import { BeatInfo } from '@/audio/BeatDetector';

/**
 * Context available to rules for evaluation
 */
export interface MusicContext {
  currentTime: number;
  currentEvent: AudioEvent;
  currentSection: MusicSection | null;
  beatInfo: BeatInfo | null;
  duration: number;
  screenWidth: number;
  screenHeight: number;
  recentEvents: AudioEvent[];
}

/**
 * Choreography rule definition
 */
export interface ChoreographyRule {
  id: string;
  priority: number;
  cooldown: number; // seconds
  exclusive: boolean; // if true, no lower priority rules will fire
  condition: (context: MusicContext) => boolean;
  action: (context: MusicContext) => LaunchCommand | null;
}

/**
 * Rule state for tracking cooldowns
 */
interface RuleState {
  lastFired: number;
}

/**
 * RuleEngine - Evaluates choreography rules based on music context
 */
export class RuleEngine {
  private rules: ChoreographyRule[] = [];
  private ruleStates: Map<string, RuleState> = new Map();

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * Register built-in choreography rules
   */
  private registerDefaultRules(): void {
    // Priority 100: Grand Finale (last 10 seconds)
    this.addRule({
      id: 'finale',
      priority: 100,
      cooldown: 10,
      exclusive: true,
      condition: (ctx) => {
        return ctx.duration - ctx.currentTime < 10 && ctx.currentEvent.energy > 0.6;
      },
      action: (ctx) => ({
        pattern: 'finale',
        launchTime: ctx.currentTime,
        params: {
          duration: 0,
          targetY: ctx.screenHeight * 0.2,
          energy: ctx.currentEvent.energy,
        },
      }),
    });

    // Priority 90: Climax Salvo
    this.addRule({
      id: 'climax_salvo',
      priority: 90,
      cooldown: 2,
      exclusive: true,
      condition: (ctx) => {
        return (
          ctx.currentSection?.type === 'climax' &&
          ctx.currentEvent.isClimax &&
          ctx.currentEvent.type === 'bass'
        );
      },
      action: (ctx) => ({
        pattern: 'salvo',
        launchTime: ctx.currentTime,
        params: {
          duration: 0,
          targetY: ctx.screenHeight * 0.2,
          count: Math.floor(15 + ctx.currentEvent.energy * 10),
          interval: 40,
          energy: ctx.currentEvent.energy,
        },
      }),
    });

    // Priority 85: Beat Drop (first beat after quiet section)
    this.addRule({
      id: 'beat_drop',
      priority: 85,
      cooldown: 4,
      exclusive: true,
      condition: (ctx) => {
        if (!ctx.beatInfo || ctx.recentEvents.length < 3) return false;

        // Check if this is near a beat
        const nearBeat = ctx.beatInfo.beats.some(
          (beat) => Math.abs(beat - ctx.currentTime) < 0.1
        );
        if (!nearBeat) return false;

        // Check if recent events were low energy
        const recentEnergy =
          ctx.recentEvents.slice(-3).reduce((sum, e) => sum + e.energy, 0) / 3;
        return recentEnergy < 0.3 && ctx.currentEvent.energy > 0.6;
      },
      action: (ctx) => ({
        pattern: 'cluster',
        launchTime: ctx.currentTime,
        params: {
          duration: 0,
          targetY: ctx.screenHeight * 0.2,
          count: 5,
          energy: ctx.currentEvent.energy,
          x: ctx.screenWidth / 2,
        },
      }),
    });

    // Priority 80: Section Transition
    this.addRule({
      id: 'section_transition',
      priority: 80,
      cooldown: 8,
      exclusive: false,
      condition: (ctx) => {
        if (!ctx.currentSection) return false;
        // Near section start (within 0.5s)
        return ctx.currentTime - ctx.currentSection.startTime < 0.5;
      },
      action: (ctx) => {
        const sectionPatterns: Record<SectionType, PatternType> = {
          intro: 'scatter',
          verse: 'single',
          prechorus: 'rising',
          chorus: 'symmetric',
          bridge: 'cross',
          climax: 'salvo',
          outro: 'scatter',
        };
        const pattern = sectionPatterns[ctx.currentSection!.type] || 'single';

        return {
          pattern,
          launchTime: ctx.currentTime,
          params: {
            duration: 0,
            targetY: ctx.screenHeight * 0.25,
            energy: ctx.currentEvent.energy,
          },
        };
      },
    });

    // Priority 70: Chorus Symmetric
    this.addRule({
      id: 'chorus_symmetric',
      priority: 70,
      cooldown: 1.5,
      exclusive: false,
      condition: (ctx) => {
        return (
          ctx.currentSection?.type === 'chorus' &&
          ctx.currentEvent.type === 'bass' &&
          ctx.currentEvent.energy > 0.5
        );
      },
      action: (ctx) => ({
        pattern: 'symmetric',
        launchTime: ctx.currentTime,
        params: {
          duration: 0,
          targetY: ctx.currentEvent.targetY,
          count: 2,
          spread: 0.25,
          energy: ctx.currentEvent.energy,
        },
      }),
    });

    // Priority 60: Piano Beat Sync
    this.addRule({
      id: 'piano_beat_sync',
      priority: 60,
      cooldown: 0.3,
      exclusive: false,
      condition: (ctx) => {
        if (ctx.currentEvent.type !== 'piano' || !ctx.beatInfo) return false;

        // Check if event is near a beat
        const nearestBeat = ctx.beatInfo.beats.reduce((nearest, beat) => {
          const dist = Math.abs(beat - ctx.currentEvent.explodeTime);
          return dist < Math.abs(nearest - ctx.currentEvent.explodeTime)
            ? beat
            : nearest;
        }, ctx.beatInfo.beats[0] ?? 0);

        return Math.abs(nearestBeat - ctx.currentEvent.explodeTime) < 0.05;
      },
      action: (ctx) => ({
        pattern: 'single',
        launchTime: ctx.currentTime,
        params: {
          duration: 0,
          targetY: ctx.currentEvent.targetY,
          energy: Math.max(0.5, ctx.currentEvent.energy * 0.9), // Ensure minimum visibility
          type: 'piano',
          hue: 45, // Golden warm color
        },
      }),
    });

    // Priority 50: Bass Impact
    this.addRule({
      id: 'bass_impact',
      priority: 50,
      cooldown: 0.35,
      exclusive: false,
      condition: (ctx) => {
        return ctx.currentEvent.type === 'bass' && ctx.currentEvent.energy > 0.4;
      },
      action: (ctx) => ({
        pattern: 'single',
        launchTime: ctx.currentTime,
        params: {
          duration: 0,
          targetY: ctx.currentEvent.targetY,
          energy: ctx.currentEvent.energy,
          type: ctx.currentEvent.isClimax ? 'willow' : 'kiku',
        },
      }),
    });

    // Priority 40: Mid Accent
    this.addRule({
      id: 'mid_accent',
      priority: 40,
      cooldown: 0.2,
      exclusive: false,
      condition: (ctx) => {
        return ctx.currentEvent.type === 'mid' && ctx.currentEvent.energy > 0.3;
      },
      action: (ctx) => ({
        pattern: 'single',
        launchTime: ctx.currentTime,
        params: {
          duration: 0,
          targetY: ctx.currentEvent.targetY,
          energy: ctx.currentEvent.energy * 0.8,
          type: 'botan',
        },
      }),
    });

    // Priority 20: Ambient Scatter (background fill)
    this.addRule({
      id: 'ambient_scatter',
      priority: 20,
      cooldown: 3,
      exclusive: false,
      condition: (ctx) => {
        return (
          ctx.currentEvent.type === 'piano' &&
          ctx.currentSection?.type !== 'climax' &&
          ctx.currentEvent.energy < 0.3
        );
      },
      action: (ctx) => ({
        pattern: 'scatter',
        launchTime: ctx.currentTime,
        params: {
          duration: 0,
          targetY: ctx.screenHeight * 0.4,
          count: 3,
          energy: 0.45, // Raised from 0.25 for better visibility
        },
      }),
    });

    // Sort rules by priority
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add a custom rule
   */
  addRule(rule: ChoreographyRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
    this.ruleStates.set(rule.id, { lastFired: -Infinity });
  }

  /**
   * Evaluate rules and return matching commands
   */
  evaluate(context: MusicContext): LaunchCommand[] {
    const commands: LaunchCommand[] = [];

    for (const rule of this.rules) {
      const state = this.ruleStates.get(rule.id) ?? { lastFired: -Infinity };

      // Check cooldown
      if (context.currentTime - state.lastFired < rule.cooldown) {
        continue;
      }

      // Check condition
      if (!rule.condition(context)) {
        continue;
      }

      // Execute action
      const command = rule.action(context);
      if (command) {
        commands.push(command);
        state.lastFired = context.currentTime;
        this.ruleStates.set(rule.id, state);

        // If exclusive, stop checking lower priority rules
        if (rule.exclusive) {
          break;
        }
      }
    }

    return commands;
  }

  /**
   * Reset all rule states
   */
  reset(): void {
    for (const [id] of this.ruleStates) {
      this.ruleStates.set(id, { lastFired: -Infinity });
    }
  }

  /**
   * Get rule by ID
   */
  getRule(id: string): ChoreographyRule | undefined {
    return this.rules.find((r) => r.id === id);
  }

  /**
   * Update rule cooldown
   */
  setRuleCooldown(id: string, cooldown: number): void {
    const rule = this.getRule(id);
    if (rule) {
      rule.cooldown = cooldown;
    }
  }
}
