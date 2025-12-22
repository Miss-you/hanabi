import { FireworkType, PatternType } from '@/core/types';
import { FireworkLauncher } from '@/engine/FireworkLauncher';
import { random } from '@/utils/math';

/**
 * Pattern execution parameters
 */
export interface PatternParams {
  count?: number;
  x?: number;
  targetY?: number;
  energy?: number;
  hue?: number;
  type?: FireworkType;
  direction?: 'left' | 'right' | 'center' | 'outward';
  spread?: number;
  interval?: number;
  duration?: number;
}

/**
 * Pattern interface for firework display patterns
 */
export interface Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void;
}

/**
 * 单发 (Single Shot) - Clean single firework
 */
class SinglePattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const x = params.x ?? random(width * 0.2, width * 0.8);
    const targetY = params.targetY ?? height * random(0.15, 0.35);
    const energy = params.energy ?? 0.5;
    const hue = params.hue ?? random(0, 360);
    const type = params.type ?? 'botan';

    launcher.launchAt(type, x, targetY, energy, hue);
  }
}

/**
 * 齐射 (Salvo/Barrage) - Rapid successive launches
 */
class SalvoPattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const count = params.count ?? 15;
    const interval = params.interval ?? 50;
    const spread = params.spread ?? 0.6;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const x = random(width * (0.5 - spread / 2), width * (0.5 + spread / 2));
        const targetY = height * random(0.1, 0.4);
        const energy = random(0.4, 0.8);
        const hue = params.hue ?? random(0, 360);
        const type: FireworkType = Math.random() > 0.5 ? 'willow' : 'kiku';
        const instant = Math.random() > 0.9;

        launcher.launchAt(type, x, targetY, energy, hue, instant);
      }, i * interval);
    }
  }
}

/**
 * 瀑布流 (Cascade) - Sequential launches creating a flowing wave
 */
class CascadePattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const count = params.count ?? 8;
    const direction = params.direction ?? 'left';
    const duration = params.duration ?? 1000;
    const interval = duration / count;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        let x: number;
        const progress = i / (count - 1);

        switch (direction) {
          case 'left':
            x = width * (0.1 + progress * 0.8);
            break;
          case 'right':
            x = width * (0.9 - progress * 0.8);
            break;
          case 'center':
            x = width * (0.5 + (progress - 0.5) * 0.6);
            break;
          case 'outward':
            x = i % 2 === 0
              ? width * (0.5 - progress * 0.4)
              : width * (0.5 + progress * 0.4);
            break;
          default:
            x = width * (0.1 + progress * 0.8);
        }

        const targetY = height * random(0.15, 0.35);
        const energy = params.energy ?? 0.5;
        const hue = (params.hue ?? 0) + i * 15;
        const type = params.type ?? 'kiku';

        launcher.launchAt(type, x, targetY, energy, hue % 360);
      }, i * interval);
    }
  }
}

/**
 * 对称双发 (Symmetric) - Bilateral mirror launches
 */
class SymmetricPattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const count = params.count ?? 2;
    const spread = params.spread ?? 0.3;
    const centerX = width / 2;

    for (let i = 0; i < count; i++) {
      const offset = (i + 1) * spread * width / (count + 1);
      const targetY = height * random(0.15, 0.35);
      const energy = params.energy ?? 0.6;
      const hue = params.hue ?? random(0, 360);
      const type = params.type ?? 'kiku';

      // Left side
      launcher.launchAt(type, centerX - offset, targetY, energy, hue);
      // Right side
      launcher.launchAt(type, centerX + offset, targetY, energy, hue);
    }
  }
}

/**
 * 升序阶梯 (Rising) - Progressive height increase
 */
class RisingPattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const count = params.count ?? 5;
    const interval = params.interval ?? 200;
    const startY = height * 0.4;
    const endY = height * 0.1;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const progress = i / (count - 1);
        const x = width * (0.3 + progress * 0.4);
        const targetY = startY - progress * (startY - endY);
        const energy = 0.4 + progress * 0.4;
        const hue = (params.hue ?? 30) + i * 20;
        const type = params.type ?? 'botan';

        launcher.launchAt(type, x, targetY, energy, hue % 360);
      }, i * interval);
    }
  }
}

/**
 * 节拍脉冲 (Pulse) - Rhythmic beat-synced launches
 */
class PulsePattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const count = params.count ?? 4;
    const interval = params.interval ?? 500; // Beat interval in ms

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const isDownbeat = i % 4 === 0;
        const x = random(width * 0.2, width * 0.8);
        const targetY = height * (isDownbeat ? 0.15 : 0.25);
        const energy = isDownbeat ? 0.8 : 0.5;
        const hue = params.hue ?? random(0, 360);
        const type: FireworkType = isDownbeat ? 'kiku' : 'botan';

        launcher.launchAt(type, x, targetY, energy, hue);
      }, i * interval);
    }
  }
}

/**
 * 聚簇爆发 (Cluster) - Multiple fireworks at same position
 */
class ClusterPattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const count = params.count ?? 4;
    const x = params.x ?? width * random(0.3, 0.7);
    const targetY = params.targetY ?? height * random(0.15, 0.3);
    const baseHue = params.hue ?? random(0, 360);

    const types: FireworkType[] = ['kiku', 'botan', 'willow'];

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const offsetX = random(-30, 30);
        const offsetY = random(-20, 20);
        const hue = (baseHue + i * 30) % 360;
        const type = types[i % types.length]!;
        const energy = random(0.5, 0.8);

        launcher.launchAt(type, x + offsetX, targetY + offsetY, energy, hue);
      }, i * 30);
    }
  }
}

/**
 * 交叉对角 (Cross) - Crossing diagonal patterns
 */
class CrossPattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const pairs = params.count ?? 3;
    const interval = params.interval ?? 150;
    const intersectY = height * 0.25;

    for (let i = 0; i < pairs; i++) {
      setTimeout(() => {
        const offset = (i + 1) * 0.15;
        const hue = (params.hue ?? 0) + i * 40;
        const type = params.type ?? 'kiku';
        const energy = params.energy ?? 0.6;

        // Left to center
        launcher.launchAt(type, width * offset, intersectY, energy, hue);
        // Right to center
        launcher.launchAt(type, width * (1 - offset), intersectY, energy, (hue + 180) % 360);
      }, i * interval);
    }
  }
}

/**
 * 稀疏散点 (Scatter) - Gentle random scattered lights
 */
class ScatterPattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const count = params.count ?? 5;
    const duration = params.duration ?? 2000;
    const baseEnergy = params.energy ?? 0.4;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const x = random(width * 0.1, width * 0.9);
        const targetY = height * random(0.2, 0.5);
        // Use base energy with slight variation, ensure minimum 0.35
        const energy = Math.max(0.35, baseEnergy * random(0.8, 1.2));
        const hue = params.hue ?? random(30, 60); // Warm golden tones

        launcher.launchAt('piano', x, targetY, energy, hue);
      }, random(0, duration));
    }
  }
}

/**
 * 大结局 (Finale) - Maximum intensity grand finale
 */
class FinalePattern implements Pattern {
  execute(launcher: FireworkLauncher, params: PatternParams): void {
    const width = launcher.getScreenWidth();
    const height = launcher.getScreenHeight();

    const intensity = params.energy ?? 1.0;
    const baseCount = Math.floor(30 * intensity);

    // Phase 1: Build-up (0-1s)
    for (let i = 0; i < baseCount / 3; i++) {
      setTimeout(() => {
        const x = random(width * 0.1, width * 0.9);
        const targetY = height * random(0.15, 0.4);
        const energy = random(0.5, 0.8);
        const hue = random(0, 360);
        const type: FireworkType = Math.random() > 0.5 ? 'kiku' : 'botan';

        launcher.launchAt(type, x, targetY, energy, hue);
      }, random(0, 1000));
    }

    // Phase 2: Peak (1-2s)
    for (let i = 0; i < baseCount / 2; i++) {
      setTimeout(() => {
        const x = random(width * 0.05, width * 0.95);
        const targetY = height * random(0.1, 0.35);
        const energy = random(0.7, 1.0);
        const hue = random(0, 360);
        const type: FireworkType = Math.random() > 0.3 ? 'willow' : 'kiku';
        const instant = Math.random() > 0.7;

        launcher.launchAt(type, x, targetY, energy, hue, instant);
      }, 1000 + random(0, 1000));
    }

    // Phase 3: Climax with symmetry (2-3s)
    for (let i = 0; i < baseCount / 6; i++) {
      setTimeout(() => {
        const offset = random(0.1, 0.4) * width;
        const targetY = height * random(0.1, 0.25);
        const energy = 0.9;
        const hue = random(0, 60); // Warm finale colors

        launcher.launchAt('willow', width / 2 - offset, targetY, energy, hue);
        launcher.launchAt('willow', width / 2 + offset, targetY, energy, hue);
      }, 2000 + i * 100);
    }
  }
}

/**
 * Pattern Library - Registry of all firework display patterns
 */
export class PatternLibrary {
  private patterns: Map<PatternType, Pattern> = new Map();

  constructor() {
    this.registerBuiltinPatterns();
  }

  private registerBuiltinPatterns(): void {
    this.patterns.set('single', new SinglePattern());
    this.patterns.set('salvo', new SalvoPattern());
    this.patterns.set('cascade', new CascadePattern());
    this.patterns.set('symmetric', new SymmetricPattern());
    this.patterns.set('rising', new RisingPattern());
    this.patterns.set('pulse', new PulsePattern());
    this.patterns.set('cluster', new ClusterPattern());
    this.patterns.set('cross', new CrossPattern());
    this.patterns.set('scatter', new ScatterPattern());
    this.patterns.set('finale', new FinalePattern());
  }

  /**
   * Get a pattern by type
   */
  get(type: PatternType): Pattern {
    const pattern = this.patterns.get(type);
    if (!pattern) {
      throw new Error(`Unknown pattern type: ${type}`);
    }
    return pattern;
  }

  /**
   * Execute a pattern with given parameters
   */
  execute(type: PatternType, launcher: FireworkLauncher, params: PatternParams): void {
    const pattern = this.get(type);
    pattern.execute(launcher, params);
  }

  /**
   * Check if a pattern type exists
   */
  has(type: PatternType): boolean {
    return this.patterns.has(type);
  }
}
