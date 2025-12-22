import {
  FireworkType,
  ParticleConfig,
  PARTICLE_CONFIGS,
  Point,
  VISUAL_CONFIG,
} from "./types";
import { random } from "@/utils/math";

/**
 * Particle class representing a single firework particle
 */
export class Particle {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  alpha: number = 1;
  color: string;
  type: FireworkType;

  private friction: number;
  private gravity: number;
  private decay: number;
  private history: Point[] = [];
  private maxHistory: number;
  private lineWidth: number;

  constructor(
    x: number,
    y: number,
    color: string,
    type: FireworkType,
    config?: Partial<ParticleConfig>,
  ) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type;

    // Merge default config with custom overrides
    const baseConfig = PARTICLE_CONFIGS[type];
    const finalConfig = { ...baseConfig, ...config };

    this.friction = finalConfig.friction;
    this.gravity = finalConfig.gravity;
    this.decay = random(finalConfig.decayMin, finalConfig.decayMax);
    this.maxHistory = finalConfig.maxHistory;
    this.lineWidth = finalConfig.lineWidth;
  }

  /**
   * Check if particle is still alive
   */
  get isAlive(): boolean {
    return this.alpha > 0;
  }

  /**
   * Update particle physics
   */
  update(): void {
    // Record position for trail
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Apply physics
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  /**
   * Draw particle and its trail
   */
  draw(ctx: CanvasRenderingContext2D, screenHeight: number): void {
    const a = Math.max(0, this.alpha);
    ctx.globalAlpha = a;

    // Draw trail
    if (this.history.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.history[0]!.x, this.history[0]!.y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i]!.x, this.history[i]!.y);
      }
      ctx.lineTo(this.x, this.y);

      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.lineWidth;
      ctx.stroke();
    } else {
      // Fallback for single point
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.type === "willow" ? 1.5 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shimmer effect for willow
    if (this.type === "willow" && Math.random() > 0.8) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw reflection
    this.drawReflection(ctx, screenHeight);
  }

  /**
   * Draw water reflection of particle
   */
  private drawReflection(
    ctx: CanvasRenderingContext2D,
    screenHeight: number,
  ): void {
    const horizon = screenHeight * (1 - VISUAL_CONFIG.WATER_HEIGHT_RATIO);

    if (this.y < horizon) {
      const refY = horizon + (horizon - this.y);
      if (refY < screenHeight) {
        ctx.globalAlpha =
          Math.max(0, this.alpha) * VISUAL_CONFIG.REFLECTION_ALPHA;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, refY, this.type === "willow" ? 1.5 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Set particle velocity
   */
  setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  /**
   * Override color (used for willow golden effect)
   */
  setColor(color: string): void {
    this.color = color;
  }
}
