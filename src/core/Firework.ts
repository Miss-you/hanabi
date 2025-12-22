import { FireworkType, TrailPoint } from "./types";
import { Particle } from "./Particle";
import { random, hslColor } from "@/utils/math";

export interface FireworkCallbacks {
  onExplode: (particles: Particle[]) => void;
}

/**
 * Firework class representing a rising firework shell
 */
export class Firework {
  x: number;
  y: number;
  targetY: number;
  type: FireworkType;
  hue: number;
  energy: number;
  delay: number;

  private vx: number;
  private vy: number;
  private gravity: number = 0.25;
  private trail: TrailPoint[] = [];
  private travelTime: number;
  private frames: number = 0;
  private callbacks: FireworkCallbacks;

  exploded: boolean = false;
  dead: boolean = false;

  constructor(
    x: number,
    targetY: number,
    type: FireworkType,
    hue: number,
    screenHeight: number,
    screenWidth: number,
    callbacks: FireworkCallbacks,
    energy: number = 0.5,
    delay: number = 0,
  ) {
    this.x = x;
    this.y = screenHeight;
    this.targetY = targetY;
    this.type = type;
    this.hue = hue;
    this.energy = energy;
    this.delay = delay;
    this.callbacks = callbacks;

    // Calculate initial velocity to reach target height
    const dist = screenHeight - targetY;
    const v0 = Math.sqrt(2 * this.gravity * dist);

    this.vx = (screenWidth / 2 - x) * 0.005 + random(-0.5, 0.5);
    this.vy = -v0;
    this.travelTime = Math.ceil(v0 / this.gravity);
  }

  /**
   * Update firework position
   */
  update(): void {
    if (this.delay > 0) {
      this.delay--;
      return;
    }

    if (this.exploded) return;

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.frames++;

    // Update trail
    this.trail.push({ x: this.x, y: this.y, alpha: 1 });
    if (this.trail.length > 10) this.trail.shift();
    this.trail.forEach((t) => (t.alpha -= 0.1));

    // Check explosion condition
    if (this.vy >= 0 || this.frames >= this.travelTime) {
      this.explode();
    }
  }

  /**
   * Draw rising firework
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.delay > 0 || this.exploded) return;

    ctx.globalAlpha = 1;
    ctx.strokeStyle = hslColor(this.hue, 80, 80);
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (this.trail.length > 1) {
      ctx.moveTo(this.trail[0]!.x, this.trail[0]!.y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i]!.x, this.trail[i]!.y);
      }
      ctx.stroke();
    }

    // Draw head
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Trigger explosion and spawn particles
   */
  private explode(): void {
    this.exploded = true;
    this.dead = true;

    const particles = this.createParticles();
    this.callbacks.onExplode(particles);
  }

  /**
   * Create explosion particles based on firework type
   */
  private createParticles(): Particle[] {
    const particles: Particle[] = [];
    const energyScale = this.energy * 2;

    // Determine particle count based on type and energy
    const baseCount =
      this.type === "kiku" ? 150 : this.type === "willow" ? 100 : 80;
    const count = Math.min(
      400,
      Math.floor(baseCount * (0.8 + energyScale * 0.5)),
    );

    const colorHsl = hslColor(this.hue, 100, 60);

    for (let i = 0; i < count; i++) {
      const p = new Particle(this.x, this.y, colorHsl, this.type);
      const angle = random(0, Math.PI * 2);

      // Calculate speed based on type and energy
      const sizeMult = 0.8 + energyScale * 0.4;
      let speed: number;

      switch (this.type) {
        case "kiku":
          speed = random(3, 6) * sizeMult;
          break;
        case "willow":
          speed = random(2, 5) * sizeMult;
          p.setColor(hslColor(45, 100, random(50, 80)));
          break;
        case "botan":
          speed = random(1, 8) * sizeMult;
          break;
        case "piano":
          speed = random(1, 4) * sizeMult;
          break;
        default:
          speed = random(2, 5) * sizeMult;
      }

      p.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      particles.push(p);
    }

    return particles;
  }

  /**
   * Immediately explode at current position
   */
  explodeNow(): void {
    this.y = this.targetY;
    this.vy = 0;
    this.explode();
  }
}
