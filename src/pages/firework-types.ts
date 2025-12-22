import { FireworkType } from '@/core/types';
import { Particle } from '@/core/Particle';
import { Firework } from '@/core/Firework';
import { random } from '@/utils/math';
import '@/styles/main.css';
import '@/styles/firework-types.css';

interface PanelState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: Particle[];
  fireworks: Firework[];
  type: FireworkType;
  params: {
    count: number;
    speed: number;
    gravity: number;
  };
}

class FireworkTypesDemo {
  private panels: Map<FireworkType, PanelState> = new Map();

  constructor() {
    this.initPanels();
    this.loop();
  }

  private initPanels(): void {
    const panelElements = document.querySelectorAll('.firework-panel');

    panelElements.forEach((panel) => {
      const type = panel.getAttribute('data-type') as FireworkType;
      const canvas = panel.querySelector('.preview-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const state: PanelState = {
        canvas,
        ctx,
        particles: [],
        fireworks: [],
        type,
        params: {
          count: parseInt(
            panel.querySelector<HTMLInputElement>('[data-param="count"]')
              ?.value || '100'
          ),
          speed: parseInt(
            panel.querySelector<HTMLInputElement>('[data-param="speed"]')
              ?.value || '5'
          ),
          gravity: parseFloat(
            panel.querySelector<HTMLInputElement>('[data-param="gravity"]')
              ?.value || '0.05'
          ),
        },
      };

      this.panels.set(type, state);

      // Launch button
      panel.querySelector('.launch-btn')?.addEventListener('click', () => {
        this.launchFirework(type);
      });

      // Parameter inputs
      panel.querySelectorAll('input[data-param]').forEach((input) => {
        input.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement;
          const param = target.getAttribute('data-param');
          if (param && param in state.params) {
            (state.params as Record<string, number>)[param] =
              parseFloat(target.value);
          }
        });
      });
    });
  }

  private launchFirework(type: FireworkType): void {
    const state = this.panels.get(type);
    if (!state) return;

    const rect = state.canvas.getBoundingClientRect();
    const x = rect.width / 2;
    const targetY = rect.height * 0.3;
    const hue = random(0, 360);

    const fw = new Firework(
      x,
      targetY,
      type,
      hue,
      rect.height,
      rect.width,
      {
        onExplode: (particles) => {
          // Apply custom speed to particles
          particles.forEach((p) => {
            const angle = Math.atan2(p.vy, p.vx);
            const baseSpeed =
              Math.sqrt(p.vx * p.vx + p.vy * p.vy) *
              (state.params.speed / 5);
            p.vx = Math.cos(angle) * baseSpeed;
            p.vy = Math.sin(angle) * baseSpeed;
          });

          // Limit to custom count
          const limited = particles.slice(0, state.params.count);
          state.particles.push(...limited);
        },
      },
      0.5
    );

    state.fireworks.push(fw);
  }

  private updatePanel(state: PanelState): void {
    // Update fireworks
    for (let i = state.fireworks.length - 1; i >= 0; i--) {
      const fw = state.fireworks[i]!;
      fw.update();
      if (fw.dead) {
        state.fireworks.splice(i, 1);
      }
    }

    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i]!;
      p.update();
      if (!p.isAlive) {
        state.particles.splice(i, 1);
      }
    }
  }

  private drawPanel(state: PanelState): void {
    const { ctx, canvas } = state;
    const rect = canvas.getBoundingClientRect();

    // Clear
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Trail fade
    ctx.fillStyle = 'rgba(0, 5, 20, 0.2)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.globalCompositeOperation = 'lighter';

    // Draw fireworks
    for (const fw of state.fireworks) {
      fw.draw(ctx);
    }

    // Draw particles
    for (const p of state.particles) {
      p.draw(ctx, rect.height);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);

    for (const state of this.panels.values()) {
      this.updatePanel(state);
      this.drawPanel(state);
    }
  };
}

// Initialize
new FireworkTypesDemo();
