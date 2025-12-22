import { VISUAL_CONFIG } from '@/core/types';

/**
 * Canvas renderer for firework visualization
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;

  width: number = 0;
  height: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Get the 2D rendering context
   */
  get context(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Handle canvas resize
   */
  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * Clear and draw background
   */
  drawBackground(): void {
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';

    // Sky gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, VISUAL_CONFIG.SKY_GRADIENT_TOP);
    grad.addColorStop(1, VISUAL_CONFIG.SKY_GRADIENT_BOTTOM);

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Trail fade effect
    this.ctx.fillStyle = 'rgba(0, 5, 20, 0.2)';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw water surface overlay
   */
  drawWater(): void {
    const waterY = this.height * (1 - VISUAL_CONFIG.WATER_HEIGHT_RATIO);

    this.ctx.globalCompositeOperation = 'source-over';
    const waterGrad = this.ctx.createLinearGradient(0, waterY, 0, this.height);
    waterGrad.addColorStop(0, 'rgba(0, 5, 20, 0.6)');
    waterGrad.addColorStop(1, '#000');

    this.ctx.fillStyle = waterGrad;
    this.ctx.fillRect(0, waterY, this.width, this.height - waterY);
  }

  /**
   * Set composite operation for additive blending
   */
  setLighterBlend(): void {
    this.ctx.globalCompositeOperation = 'lighter';
  }

  /**
   * Reset composite operation
   */
  resetBlend(): void {
    this.ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Get horizon Y position (water line)
   */
  get horizonY(): number {
    return this.height * (1 - VISUAL_CONFIG.WATER_HEIGHT_RATIO);
  }
}
