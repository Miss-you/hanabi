import { Particle } from "@/core/Particle";

/**
 * Particle system manager for updating and rendering particles
 */
export class ParticleSystem {
  private particles: Particle[] = [];

  /**
   * Get current particle count
   */
  get count(): number {
    return this.particles.length;
  }

  /**
   * Add particles to the system
   */
  add(particles: Particle | Particle[]): void {
    if (Array.isArray(particles)) {
      this.particles.push(...particles);
    } else {
      this.particles.push(particles);
    }
  }

  /**
   * Update all particles and remove dead ones
   */
  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.update();
      if (!p.isAlive) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Draw all particles
   */
  draw(ctx: CanvasRenderingContext2D, screenHeight: number): void {
    for (const p of this.particles) {
      p.draw(ctx, screenHeight);
    }
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }

  /**
   * Get all particles (for debugging)
   */
  getParticles(): readonly Particle[] {
    return this.particles;
  }
}
