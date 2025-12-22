import { FireworkType, LaunchConfig } from '@/core/types';
import { Firework } from '@/core/Firework';
import { Particle } from '@/core/Particle';
import { random, getDistributedX } from '@/utils/math';

/**
 * FireworkLauncher manages firework creation and launching
 */
export class FireworkLauncher {
  private fireworks: Firework[] = [];
  private screenWidth: number;
  private screenHeight: number;
  private onParticlesCreated: (particles: Particle[]) => void;

  constructor(
    screenWidth: number,
    screenHeight: number,
    onParticlesCreated: (particles: Particle[]) => void
  ) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.onParticlesCreated = onParticlesCreated;
  }

  /**
   * Update screen dimensions
   */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  /**
   * Get current firework count
   */
  get count(): number {
    return this.fireworks.length;
  }

  /**
   * Launch a new firework
   */
  launch(
    type: FireworkType,
    instant: boolean = false,
    targetY?: number,
    energy: number = 0.5,
    x?: number
  ): void {
    const launchX = x ?? getDistributedX(this.screenWidth);
    const tY = targetY ?? random(this.screenHeight * 0.1, this.screenHeight * 0.4);
    const hue = random(0, 360);

    const fw = new Firework(
      launchX,
      tY,
      type,
      hue,
      this.screenHeight,
      this.screenWidth,
      { onExplode: this.onParticlesCreated },
      energy
    );

    if (instant) {
      fw.explodeNow();
    } else {
      this.fireworks.push(fw);
    }
  }

  /**
   * Launch a firework with full control over all parameters
   */
  launchAt(
    type: FireworkType,
    x: number,
    targetY: number,
    energy: number,
    hue: number,
    instant: boolean = false
  ): void {
    const fw = new Firework(
      x,
      targetY,
      type,
      hue,
      this.screenHeight,
      this.screenWidth,
      { onExplode: this.onParticlesCreated },
      energy
    );

    if (instant) {
      fw.explodeNow();
    } else {
      this.fireworks.push(fw);
    }
  }

  /**
   * Launch multiple fireworks from configurations
   */
  launchMultiple(configs: LaunchConfig[]): void {
    for (const config of configs) {
      if (config.delay && config.delay > 0) {
        setTimeout(() => {
          this.launchAt(
            config.type,
            config.x,
            config.targetY,
            config.energy,
            config.hue,
            config.instant
          );
        }, config.delay);
      } else {
        this.launchAt(
          config.type,
          config.x,
          config.targetY,
          config.energy,
          config.hue,
          config.instant
        );
      }
    }
  }

  /**
   * Launch a salvo of fireworks
   */
  salvo(count: number, interval: number = 50): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const type: FireworkType =
          Math.random() > 0.4
            ? 'willow'
            : Math.random() > 0.5
              ? 'kiku'
              : 'botan';
        const instant = Math.random() > 0.9;
        const targetY = this.screenHeight * random(0.1, 0.5);
        this.launch(type, instant, targetY, random(0.3, 0.8));
      }, i * interval);
    }
  }

  /**
   * Get screen dimensions (for patterns)
   */
  getScreenWidth(): number {
    return this.screenWidth;
  }

  getScreenHeight(): number {
    return this.screenHeight;
  }

  /**
   * Update all active fireworks
   */
  update(): void {
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i]!;
      fw.update();
      if (fw.dead) {
        this.fireworks.splice(i, 1);
      }
    }
  }

  /**
   * Draw all active fireworks
   */
  draw(ctx: CanvasRenderingContext2D): void {
    for (const fw of this.fireworks) {
      fw.draw(ctx);
    }
  }

  /**
   * Clear all fireworks
   */
  clear(): void {
    this.fireworks = [];
  }
}
