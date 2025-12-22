import { Particle } from "@/core/Particle";
import { ParticleConfig } from "@/core/types";
import { random, hslColor } from "@/utils/math";
import "@/styles/main.css";
import "@/styles/particle-physics.css";

interface PhysicsParams {
  friction: number;
  gravity: number;
  decay: number;
  trail: number;
  lineWidth: number;
  hue: number;
  count: number;
  speed: number;
}

const DEFAULT_PARAMS: PhysicsParams = {
  friction: 0.95,
  gravity: 0.05,
  decay: 0.01,
  trail: 10,
  lineWidth: 2,
  hue: 0,
  count: 50,
  speed: 5,
};

class ParticlePhysicsDemo {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private params: PhysicsParams = { ...DEFAULT_PARAMS };

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get canvas context");
    this.ctx = ctx;

    this.setupCanvas();
    this.setupEventListeners();
    this.loop();
  }

  private setupCanvas(): void {
    const container = document.querySelector(".canvas-container");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(dpr, dpr);

    window.addEventListener("resize", () => this.setupCanvas());
  }

  private setupEventListeners(): void {
    // Canvas click
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.emitAt(x, y);
    });

    // Control buttons
    document.getElementById("emitBtn")?.addEventListener("click", () => {
      const rect = this.canvas.getBoundingClientRect();
      this.emitAt(rect.width / 2, rect.height / 2);
    });

    document.getElementById("clearBtn")?.addEventListener("click", () => {
      this.particles = [];
    });

    document.getElementById("resetBtn")?.addEventListener("click", () => {
      this.resetParams();
    });

    // Parameter sliders
    this.setupSlider("friction", (v) => (this.params.friction = v));
    this.setupSlider("gravity", (v) => (this.params.gravity = v));
    this.setupSlider("decay", (v) => (this.params.decay = v));
    this.setupSlider("trail", (v) => (this.params.trail = v));
    this.setupSlider("lineWidth", (v) => (this.params.lineWidth = v));
    this.setupSlider("hue", (v) => (this.params.hue = v));
    this.setupSlider("count", (v) => (this.params.count = v));
    this.setupSlider("speed", (v) => (this.params.speed = v));
  }

  private setupSlider(id: string, onChange: (value: number) => void): void {
    const slider = document.getElementById(id) as HTMLInputElement;
    const valueDisplay = document.getElementById(`${id}Val`);

    if (slider) {
      slider.addEventListener("input", () => {
        const value = parseFloat(slider.value);
        onChange(value);
        if (valueDisplay) valueDisplay.textContent = slider.value;
      });
    }
  }

  private resetParams(): void {
    this.params = { ...DEFAULT_PARAMS };

    // Update UI
    const sliders: Array<keyof PhysicsParams> = [
      "friction",
      "gravity",
      "decay",
      "trail",
      "lineWidth",
      "hue",
      "count",
      "speed",
    ];

    for (const key of sliders) {
      const slider = document.getElementById(key) as HTMLInputElement;
      const valueDisplay = document.getElementById(`${key}Val`);
      if (slider) {
        slider.value = String(this.params[key]);
        if (valueDisplay) valueDisplay.textContent = String(this.params[key]);
      }
    }
  }

  private emitAt(x: number, y: number): void {
    const config: Partial<ParticleConfig> = {
      friction: this.params.friction,
      gravity: this.params.gravity,
      decayMin: this.params.decay * 0.8,
      decayMax: this.params.decay * 1.2,
      maxHistory: this.params.trail,
      lineWidth: this.params.lineWidth,
    };

    const color = hslColor(this.params.hue, 100, 60);

    for (let i = 0; i < this.params.count; i++) {
      const p = new Particle(x, y, color, "kiku", config);
      const angle = random(0, Math.PI * 2);
      const speed = random(this.params.speed * 0.5, this.params.speed * 1.5);
      p.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.particles.push(p);
    }
  }

  private update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.update();
      if (!p.isAlive) {
        this.particles.splice(i, 1);
      }
    }
  }

  private draw(): void {
    const rect = this.canvas.getBoundingClientRect();

    // Clear with fade
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    this.ctx.fillStyle = "rgba(0, 5, 20, 0.2)";
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw particles
    this.ctx.globalCompositeOperation = "lighter";

    for (const p of this.particles) {
      p.draw(this.ctx, rect.height);
    }

    this.ctx.globalCompositeOperation = "source-over";

    // Draw particle count
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "12px monospace";
    this.ctx.fillText(`粒子数: ${this.particles.length}`, 10, 20);
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    this.update();
    this.draw();
  };
}

// Initialize
new ParticlePhysicsDemo();
