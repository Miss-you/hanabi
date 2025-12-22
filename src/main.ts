import { Renderer } from "@/engine/Renderer";
import { ParticleSystem } from "@/engine/ParticleSystem";
import { FireworkLauncher } from "@/engine/FireworkLauncher";
import { AudioAnalyzer } from "@/audio/AudioAnalyzer";
import { FrequencyAnalyzer } from "@/audio/FrequencyAnalyzer";
import { BeatDetector } from "@/audio/BeatDetector";
import { Timeline } from "@/audio/Timeline";
import { Choreographer } from "@/choreography/Choreographer";
import { FireworkType } from "@/core/types";
import { TUNING } from "@/config/tuning";
import { logDebug } from "@/utils/logger";
import "./styles/main.css";

type AppMode = "idle" | "demo" | "music";

class HanabiApp {
  private renderer: Renderer;
  private particleSystem: ParticleSystem;
  private launcher: FireworkLauncher;
  private audioAnalyzer: AudioAnalyzer;
  private frequencyAnalyzer: FrequencyAnalyzer;
  private beatDetector: BeatDetector;
  private choreographer: Choreographer;
  private timeline: Timeline;

  private mode: AppMode = "idle";
  private isPaused: boolean = false;
  private demoTimer: number = 0;
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Canvas not found");

    this.renderer = new Renderer(canvas);
    this.particleSystem = new ParticleSystem();
    this.launcher = new FireworkLauncher(
      this.renderer.width,
      this.renderer.height,
      (particles) => this.particleSystem.add(particles),
    );
    this.audioAnalyzer = new AudioAnalyzer(this.renderer.height);
    this.frequencyAnalyzer = new FrequencyAnalyzer();
    this.beatDetector = new BeatDetector();
    this.choreographer = new Choreographer();
    this.choreographer.setLauncher(this.launcher);

    // Use Choreographer for music mode
    this.timeline = new Timeline({
      onTick: (time) => this.choreographer.update(time),
    });

    this.setupEventListeners();
    this.setupResize();
    this.loop();
  }

  private setupEventListeners(): void {
    const demoBtn = document.getElementById("demoBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const audioInput = document.getElementById(
      "audioInput",
    ) as HTMLInputElement;

    demoBtn?.addEventListener("click", () => this.startDemo());
    pauseBtn?.addEventListener("click", () => this.togglePause());
    audioInput?.addEventListener("change", (e) => this.handleAudioUpload(e));
  }

  private setupResize(): void {
    window.addEventListener("resize", () => {
      this.launcher.resize(this.renderer.width, this.renderer.height);
      this.audioAnalyzer.resize(this.renderer.height);
    });
  }

  private startDemo(): void {
    this.mode = "demo";
    this.demoTimer = 0;
    void this.timeline.close();
    this.setStatus("模式: 演示 (自动编排)");
  }

  private togglePause(): void {
    if (this.mode === "idle") return;

    const pauseBtn = document.getElementById("pauseBtn");
    if (this.isPaused) {
      this.isPaused = false;
      if (pauseBtn) pauseBtn.textContent = "暂停";
      this.timeline.resume();
    } else {
      this.isPaused = true;
      if (pauseBtn) pauseBtn.textContent = "继续";
      this.timeline.pause();
    }
  }

  private async handleAudioUpload(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.mode = "music";
    this.isPaused = false;
    this.setStatus("加载音频中...");

    try {
      await this.validateAudioFile(file);
      await this.timeline.close();

      const arrayBuffer = await file.arrayBuffer();
      const decodeContext = new AudioContext();
      try {
        this.audioBuffer = await decodeContext.decodeAudioData(arrayBuffer);
      } finally {
        await decodeContext.close();
      }
      const duration = this.audioBuffer.duration;

      // Step 1: Basic audio analysis for events
      this.setStatus("分析音频事件... (1/3)");
      const result = await this.audioAnalyzer.analyze(this.audioBuffer, {
        onProgress: (p) => {
          this.setStatus(`分析事件: ${Math.round(p * 100)}%`);
        },
      });

      // Step 2: Frequency band analysis
      this.setStatus("分析频率特征... (2/3)");
      const freqBands = await this.frequencyAnalyzer.analyze(this.audioBuffer);

      // Step 3: Beat detection
      this.setStatus("检测节拍... (3/3)");
      const beatInfo = this.beatDetector.detectBeats(freqBands.bass, duration);

      // Prepare choreographer with all analysis data
      this.setStatus("准备编排...");
      this.choreographer.prepareTrack({
        events: result.timeline,
        beatInfo,
        freqBands,
        duration,
      });

      // Load events into timeline (for timing reference)
      this.timeline.loadEvents(result.timeline);

      // Display stats
      const stats = this.choreographer.getStats();
      logDebug("[HanabiApp] Choreography ready:", stats);
      this.setStatus(`正在播放: ${file.name} | BPM: ${Math.round(stats.bpm)}`);

      await this.timeline.play(this.audioBuffer);
    } catch (error) {
      console.error("Audio loading failed:", error);
      this.setStatus(
        error instanceof Error ? error.message : "音频加载失败",
      );
      this.mode = "idle";
      this.audioBuffer = null;
    } finally {
      input.value = "";
    }
  }

  private runDemoLogic(): void {
    this.demoTimer++;

    // Phase-based thresholds
    const demo = TUNING.demo;
    let threshold: number = demo.thresholdBase;
    if (this.demoTimer > demo.midPhaseStart) threshold = demo.thresholdMid;
    if (this.demoTimer > demo.latePhaseStart) threshold = demo.thresholdLate;

    if (Math.random() > threshold) {
      const type: FireworkType =
        this.demoTimer > demo.latePhaseStart
          ? Math.random() > demo.latePhaseWillowChance
            ? "willow"
            : "kiku"
          : this.demoTimer > demo.midPhaseStart
            ? "kiku"
            : "botan";
      this.launcher.launch(type);
    }

    if (this.demoTimer > demo.resetAfter) this.demoTimer = 0;
  }

  private getFileExtension(file: File): string | null {
    const parts = file.name.split(".");
    if (parts.length < 2) return null;
    return parts[parts.length - 1]!.toLowerCase();
  }

  private async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      const cleanup = () => {
        URL.revokeObjectURL(url);
        audio.src = "";
      };

      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        cleanup();
        resolve(duration);
      };
      audio.onerror = () => {
        cleanup();
        reject(new Error("音频元数据读取失败"));
      };

      audio.src = url;
    });
  }

  private async validateAudioFile(file: File): Promise<void> {
    const tuning = TUNING.audioUpload;
    const extension = this.getFileExtension(file);
    const mimeAllowed = tuning.allowedMimeTypes.some(
      (type) => type === file.type,
    );
    const extAllowed =
      extension !== null &&
      tuning.allowedExtensions.some((ext) => ext === extension);

    if (!mimeAllowed && !extAllowed) {
      throw new Error("不支持的音频格式，请使用 mp3/wav/ogg");
    }

    if (file.size > tuning.maxFileBytes) {
      const maxMb = Math.round(tuning.maxFileBytes / (1024 * 1024));
      throw new Error(`音频文件过大（最大 ${maxMb}MB）`);
    }

    const duration = await this.getAudioDuration(file);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("无法读取音频时长");
    }
    if (duration > tuning.maxDurationSeconds) {
      const maxMinutes = Math.round(tuning.maxDurationSeconds / 60);
      throw new Error(`音频时长过长（最大 ${maxMinutes} 分钟）`);
    }
  }

  private setStatus(text: string): void {
    const status = document.getElementById("status");
    if (status) status.textContent = text;
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);

    if (this.isPaused) return;

    // Background
    this.renderer.drawBackground();

    // Mode logic
    if (this.mode === "music") {
      this.timeline.update();
    } else if (this.mode === "demo") {
      this.runDemoLogic();
    }

    // Update and draw
    this.renderer.setLighterBlend();

    this.launcher.update();
    this.launcher.draw(this.renderer.context);

    this.particleSystem.update();
    this.particleSystem.draw(this.renderer.context, this.renderer.height);

    // Water overlay
    this.renderer.drawWater();
  };
}

// Initialize app
new HanabiApp();
