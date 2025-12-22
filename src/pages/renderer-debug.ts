import { FireworkType } from '@/core/types';
import { Particle } from '@/core/Particle';
import { Firework } from '@/core/Firework';
import { random, getDistributedX } from '@/utils/math';
import '@/styles/main.css';
import '@/styles/renderer-debug.css';

interface RenderConfig {
  skyTop: string;
  skyBottom: string;
  waterHeight: number;
  reflectionAlpha: number;
  waterColor: string;
  trailFade: number;
  blendMode: GlobalCompositeOperation;
  autoLaunch: boolean;
  launchRate: number;
}

const DEFAULT_CONFIG: RenderConfig = {
  skyTop: '#020514',
  skyBottom: '#182042',
  waterHeight: 0.2,
  reflectionAlpha: 0.3,
  waterColor: '#000514',
  trailFade: 0.2,
  blendMode: 'lighter',
  autoLaunch: true,
  launchRate: 0.98,
};

class RendererDebug {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig = { ...DEFAULT_CONFIG };
  private particles: Particle[] = [];
  private fireworks: Firework[] = [];
  private width: number = 0;
  private height: number = 0;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    this.ctx = ctx;

    this.setupCanvas();
    this.setupControls();
    this.loop();
  }

  private setupCanvas(): void {
    const container = document.querySelector('.canvas-container');
    if (!container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', () => {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      resize();
    });
  }

  private setupControls(): void {
    // Color inputs
    this.bindColorInput('skyTop', (v) => (this.config.skyTop = v));
    this.bindColorInput('skyBottom', (v) => (this.config.skyBottom = v));
    this.bindColorInput('waterColor', (v) => (this.config.waterColor = v));

    // Range inputs
    this.bindRangeInput('waterHeight', 'waterHeightVal', (v) => (this.config.waterHeight = v));
    this.bindRangeInput('reflectionAlpha', 'reflectionAlphaVal', (v) => (this.config.reflectionAlpha = v));
    this.bindRangeInput('trailFade', 'trailFadeVal', (v) => (this.config.trailFade = v));
    this.bindRangeInput('launchRate', 'launchRateVal', (v) => (this.config.launchRate = v));

    // Select
    const blendMode = document.getElementById('blendMode') as HTMLSelectElement;
    blendMode?.addEventListener('change', () => {
      this.config.blendMode = blendMode.value as GlobalCompositeOperation;
    });

    // Checkbox
    const autoLaunch = document.getElementById('autoLaunch') as HTMLInputElement;
    autoLaunch?.addEventListener('change', () => {
      this.config.autoLaunch = autoLaunch.checked;
    });

    // Buttons
    document.getElementById('launchBtn')?.addEventListener('click', () => {
      this.launchFirework();
    });

    document.getElementById('resetBtn')?.addEventListener('click', () => {
      this.resetConfig();
    });
  }

  private bindColorInput(id: string, onChange: (value: string) => void): void {
    const input = document.getElementById(id) as HTMLInputElement;
    input?.addEventListener('input', () => {
      onChange(input.value);
    });
  }

  private bindRangeInput(id: string, valueId: string, onChange: (value: number) => void): void {
    const input = document.getElementById(id) as HTMLInputElement;
    const valueEl = document.getElementById(valueId);

    input?.addEventListener('input', () => {
      const value = parseFloat(input.value);
      onChange(value);
      if (valueEl) valueEl.textContent = value.toFixed(2);
    });
  }

  private resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };

    // Update UI
    (document.getElementById('skyTop') as HTMLInputElement).value = this.config.skyTop;
    (document.getElementById('skyBottom') as HTMLInputElement).value = this.config.skyBottom;
    (document.getElementById('waterColor') as HTMLInputElement).value = this.config.waterColor;
    (document.getElementById('waterHeight') as HTMLInputElement).value = String(this.config.waterHeight);
    (document.getElementById('reflectionAlpha') as HTMLInputElement).value = String(this.config.reflectionAlpha);
    (document.getElementById('trailFade') as HTMLInputElement).value = String(this.config.trailFade);
    (document.getElementById('launchRate') as HTMLInputElement).value = String(this.config.launchRate);
    (document.getElementById('blendMode') as HTMLSelectElement).value = this.config.blendMode;
    (document.getElementById('autoLaunch') as HTMLInputElement).checked = this.config.autoLaunch;

    document.getElementById('waterHeightVal')!.textContent = this.config.waterHeight.toFixed(2);
    document.getElementById('reflectionAlphaVal')!.textContent = this.config.reflectionAlpha.toFixed(2);
    document.getElementById('trailFadeVal')!.textContent = this.config.trailFade.toFixed(2);
    document.getElementById('launchRateVal')!.textContent = this.config.launchRate.toFixed(2);
  }

  private launchFirework(): void {
    const types: FireworkType[] = ['kiku', 'willow', 'botan'];
    const type = types[Math.floor(Math.random() * types.length)]!;
    const x = getDistributedX(this.width);
    const targetY = random(this.height * 0.15, this.height * 0.4);
    const hue = random(0, 360);

    const fw = new Firework(
      x,
      targetY,
      type,
      hue,
      this.height,
      this.width,
      {
        onExplode: (particles) => {
          this.particles.push(...particles);
        },
      },
      0.5
    );

    this.fireworks.push(fw);
  }

  private drawBackground(): void {
    const { ctx, width, height, config } = this;

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, config.skyTop);
    grad.addColorStop(1, config.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Trail fade
    ctx.fillStyle = `rgba(0, 5, 20, ${config.trailFade})`;
    ctx.fillRect(0, 0, width, height);
  }

  private drawWater(): void {
    const { ctx, width, height, config } = this;
    const waterY = height * (1 - config.waterHeight);

    ctx.globalCompositeOperation = 'source-over';

    // Parse water color to RGB
    const r = parseInt(config.waterColor.slice(1, 3), 16);
    const g = parseInt(config.waterColor.slice(3, 5), 16);
    const b = parseInt(config.waterColor.slice(5, 7), 16);

    const waterGrad = ctx.createLinearGradient(0, waterY, 0, height);
    waterGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
    waterGrad.addColorStop(1, config.waterColor);

    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, width, height - waterY);
  }

  private update(): void {
    // Auto launch
    if (this.config.autoLaunch && Math.random() > this.config.launchRate) {
      this.launchFirework();
    }

    // Update fireworks
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i]!;
      fw.update();
      if (fw.dead) {
        this.fireworks.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.update();
      if (!p.isAlive) {
        this.particles.splice(i, 1);
      }
    }
  }

  private draw(): void {
    const { ctx, config } = this;

    this.drawBackground();

    ctx.globalCompositeOperation = config.blendMode;

    // Draw fireworks
    for (const fw of this.fireworks) {
      fw.draw(ctx);
    }

    // Draw particles
    for (const p of this.particles) {
      p.draw(ctx, this.height);
    }

    this.drawWater();

    // Info overlay
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`粒子数: ${this.particles.length} | 烟花数: ${this.fireworks.length}`, 10, 20);
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    this.update();
    this.draw();
  };
}

// Initialize
new RendererDebug();
