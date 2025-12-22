import { FireworkType, VISUAL_CONFIG } from "@/core/types";
import { Particle } from "@/core/Particle";
import { Firework } from "@/core/Firework";
import { random } from "@/utils/math";
import "@/styles/main.css";
import "@/styles/launcher-test.css";

type DistributionType = "center" | "spread" | "random";

interface LaunchConfig {
  launchX: number; // percentage 0-100
  targetY: number; // percentage 0-100
  type: FireworkType | "random";
  salvoCount: number;
  salvoDelay: number;
  distribution: DistributionType;
  energy: number;
}

class LauncherTest {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: LaunchConfig = {
    launchX: 50,
    targetY: 25,
    type: "kiku",
    salvoCount: 5,
    salvoDelay: 50,
    distribution: "spread",
    energy: 0.5,
  };
  private particles: Particle[] = [];
  private fireworks: Firework[] = [];
  private width: number = 0;
  private height: number = 0;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get canvas context");
    this.ctx = ctx;

    this.setupCanvas();
    this.setupControls();
    this.loop();
  }

  private setupCanvas(): void {
    const container = document.querySelector(
      ".canvas-container",
    ) as HTMLElement | null;
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
    window.addEventListener("resize", () => {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      resize();
    });

    // Canvas click to set position
    const crosshair = document.getElementById("crosshair");
    container.addEventListener("mousemove", (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (crosshair) {
        crosshair.style.display = "block";
        crosshair.style.left = `${x}px`;
        crosshair.style.top = `${y}px`;
      }
    });

    container.addEventListener("mouseleave", () => {
      if (crosshair) crosshair.style.display = "none";
    });

    container.addEventListener("click", (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      this.config.launchX = Math.max(5, Math.min(95, x));
      this.config.targetY = Math.max(10, Math.min(60, y));

      // Update UI
      (document.getElementById("launchX") as HTMLInputElement).value = String(
        this.config.launchX,
      );
      (document.getElementById("targetY") as HTMLInputElement).value = String(
        this.config.targetY,
      );
      document.getElementById("launchXVal")!.textContent =
        `${Math.round(this.config.launchX)}%`;
      document.getElementById("targetYVal")!.textContent =
        `${Math.round(this.config.targetY)}%`;

      // Launch on click
      this.launchSingle();
    });
  }

  private setupControls(): void {
    // Range inputs
    this.bindRangeInput(
      "launchX",
      "launchXVal",
      (v) => (this.config.launchX = v),
      "%",
    );
    this.bindRangeInput(
      "targetY",
      "targetYVal",
      (v) => (this.config.targetY = v),
      "%",
    );
    this.bindRangeInput(
      "salvoCount",
      "salvoCountVal",
      (v) => (this.config.salvoCount = v),
    );
    this.bindRangeInput(
      "salvoDelay",
      "salvoDelayVal",
      (v) => (this.config.salvoDelay = v),
      "ms",
    );
    this.bindRangeInput("energy", "energyVal", (v) => (this.config.energy = v));

    // Type buttons
    document.querySelectorAll(".type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".type-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.config.type = btn.getAttribute("data-type") as
          | FireworkType
          | "random";
      });
    });

    // Distribution select
    const distribution = document.getElementById(
      "distribution",
    ) as HTMLSelectElement;
    distribution?.addEventListener("change", () => {
      this.config.distribution = distribution.value as DistributionType;
    });

    // Buttons
    document
      .getElementById("singleBtn")
      ?.addEventListener("click", () => this.launchSingle());
    document
      .getElementById("salvoBtn")
      ?.addEventListener("click", () => this.launchSalvo());
    document
      .getElementById("clearBtn")
      ?.addEventListener("click", () => this.clear());
  }

  private bindRangeInput(
    id: string,
    valueId: string,
    onChange: (value: number) => void,
    suffix: string = "",
  ): void {
    const input = document.getElementById(id) as HTMLInputElement;
    const valueEl = document.getElementById(valueId);

    input?.addEventListener("input", () => {
      const value = parseFloat(input.value);
      onChange(value);
      if (valueEl) {
        valueEl.textContent =
          suffix === "%"
            ? `${Math.round(value)}${suffix}`
            : `${value.toFixed(2)}${suffix}`;
      }
    });
  }

  private getFireworkType(): FireworkType {
    if (this.config.type === "random") {
      const types: FireworkType[] = ["kiku", "willow", "botan"];
      return types[Math.floor(Math.random() * types.length)]!;
    }
    return this.config.type;
  }

  private launchSingle(): void {
    const x = (this.config.launchX / 100) * this.width;
    const targetY = (this.config.targetY / 100) * this.height;
    const hue = random(0, 360);
    const type = this.getFireworkType();

    const fw = new Firework(
      x,
      targetY,
      type,
      hue,
      this.height,
      this.width,
      { onExplode: (particles) => this.particles.push(...particles) },
      this.config.energy,
    );

    this.fireworks.push(fw);
  }

  private launchSalvo(): void {
    const { salvoCount, salvoDelay, distribution } = this.config;

    for (let i = 0; i < salvoCount; i++) {
      setTimeout(() => {
        let x: number;
        const baseX = (this.config.launchX / 100) * this.width;

        switch (distribution) {
          case "center":
            x = baseX + random(-30, 30);
            break;
          case "spread":
            x = this.width * (0.1 + (0.8 * i) / (salvoCount - 1 || 1));
            break;
          case "random":
            x = random(this.width * 0.1, this.width * 0.9);
            break;
          default:
            x = baseX;
        }

        const targetY =
          (this.config.targetY / 100) * this.height + random(-50, 50);
        const hue = random(0, 360);
        const type = this.getFireworkType();

        const fw = new Firework(
          x,
          Math.max(this.height * 0.1, Math.min(this.height * 0.6, targetY)),
          type,
          hue,
          this.height,
          this.width,
          { onExplode: (particles) => this.particles.push(...particles) },
          this.config.energy,
        );

        this.fireworks.push(fw);
      }, i * salvoDelay);
    }
  }

  private clear(): void {
    this.particles = [];
    this.fireworks = [];
  }

  private update(): void {
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

    // Update stats
    document.getElementById("particleCount")!.textContent = String(
      this.particles.length,
    );
    document.getElementById("fireworkCount")!.textContent = String(
      this.fireworks.length,
    );
  }

  private draw(): void {
    const { ctx, width, height } = this;

    // Background
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, VISUAL_CONFIG.SKY_GRADIENT_TOP);
    grad.addColorStop(1, VISUAL_CONFIG.SKY_GRADIENT_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Trail fade
    ctx.fillStyle = "rgba(0, 5, 20, 0.2)";
    ctx.fillRect(0, 0, width, height);

    // Draw target indicator
    const targetX = (this.config.launchX / 100) * width;
    const targetY = (this.config.targetY / 100) * height;
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#fff";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(targetX, height);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(targetX, targetY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw fireworks and particles
    ctx.globalCompositeOperation = "lighter";

    for (const fw of this.fireworks) {
      fw.draw(ctx);
    }

    for (const p of this.particles) {
      p.draw(ctx, height);
    }

    // Water
    ctx.globalCompositeOperation = "source-over";
    const waterY = height * (1 - VISUAL_CONFIG.WATER_HEIGHT_RATIO);
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, height);
    waterGrad.addColorStop(0, "rgba(0, 5, 20, 0.6)");
    waterGrad.addColorStop(1, "#000");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, width, height - waterY);
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    this.update();
    this.draw();
  };
}

// Initialize
new LauncherTest();
