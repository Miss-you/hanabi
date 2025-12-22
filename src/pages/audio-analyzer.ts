import { AudioAnalyzer, AnalysisResult } from "@/audio/AudioAnalyzer";
import { FrequencyAnalyzer, FrequencyBands } from "@/audio/FrequencyAnalyzer";
import { BeatDetector, BeatInfo } from "@/audio/BeatDetector";
import { AudioEvent } from "@/core/types";
import "@/styles/main.css";
import "@/styles/audio-analyzer.css";

class AudioAnalyzerDemo {
  private audioAnalyzer: AudioAnalyzer;
  private frequencyAnalyzer: FrequencyAnalyzer;
  private beatDetector: BeatDetector;

  private result: AnalysisResult | null = null;
  private frequencyBands: FrequencyBands | null = null;
  private beatInfo: BeatInfo | null = null;

  private audioBuffer: AudioBuffer | null = null;
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private duration: number = 0;

  // Canvases
  private spectrogramCanvas: HTMLCanvasElement;
  private spectrogramCtx: CanvasRenderingContext2D;
  private bassCanvas: HTMLCanvasElement;
  private bassCtx: CanvasRenderingContext2D;
  private midCanvas: HTMLCanvasElement;
  private midCtx: CanvasRenderingContext2D;
  private highCanvas: HTMLCanvasElement;
  private highCtx: CanvasRenderingContext2D;
  private beatCanvas: HTMLCanvasElement;
  private beatCtx: CanvasRenderingContext2D;

  constructor() {
    this.audioAnalyzer = new AudioAnalyzer(window.innerHeight);
    this.frequencyAnalyzer = new FrequencyAnalyzer(2048, 30); // 30fps for better performance
    this.beatDetector = new BeatDetector(30);

    // Get all canvases
    this.spectrogramCanvas = document.getElementById(
      "spectrogramCanvas",
    ) as HTMLCanvasElement;
    this.bassCanvas = document.getElementById(
      "bassCanvas",
    ) as HTMLCanvasElement;
    this.midCanvas = document.getElementById("midCanvas") as HTMLCanvasElement;
    this.highCanvas = document.getElementById(
      "highCanvas",
    ) as HTMLCanvasElement;
    this.beatCanvas = document.getElementById(
      "beatCanvas",
    ) as HTMLCanvasElement;

    this.spectrogramCtx = this.getContext(this.spectrogramCanvas);
    this.bassCtx = this.getContext(this.bassCanvas);
    this.midCtx = this.getContext(this.midCanvas);
    this.highCtx = this.getContext(this.highCanvas);
    this.beatCtx = this.getContext(this.beatCanvas);

    this.setupCanvases();
    this.setupEventListeners();
    this.loop();
  }

  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get canvas context");
    return ctx;
  }

  private setupCanvases(): void {
    const setupCanvas = (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
    ) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    setupCanvas(this.spectrogramCanvas, this.spectrogramCtx);
    setupCanvas(this.bassCanvas, this.bassCtx);
    setupCanvas(this.midCanvas, this.midCtx);
    setupCanvas(this.highCanvas, this.highCtx);
    setupCanvas(this.beatCanvas, this.beatCtx);

    window.addEventListener("resize", () => {
      // Reset transforms and re-setup
      [
        { canvas: this.spectrogramCanvas, ctx: this.spectrogramCtx },
        { canvas: this.bassCanvas, ctx: this.bassCtx },
        { canvas: this.midCanvas, ctx: this.midCtx },
        { canvas: this.highCanvas, ctx: this.highCtx },
        { canvas: this.beatCanvas, ctx: this.beatCtx },
      ].forEach(({ canvas, ctx }) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        setupCanvas(canvas, ctx);
      });

      // Redraw if we have data
      if (this.frequencyBands) {
        this.drawAllVisualizations();
      }
    });
  }

  private setupEventListeners(): void {
    const audioInput = document.getElementById(
      "audioInput",
    ) as HTMLInputElement;
    const playBtn = document.getElementById("playBtn");
    const stopBtn = document.getElementById("stopBtn");
    const exportBtn = document.getElementById("exportBtn");

    audioInput?.addEventListener("change", (e) => this.handleFileUpload(e));
    playBtn?.addEventListener("click", () => this.play());
    stopBtn?.addEventListener("click", () => this.stop());
    exportBtn?.addEventListener("click", () => this.exportJSON());
  }

  private async handleFileUpload(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const fileName = document.getElementById("fileName");
    if (fileName) fileName.textContent = file.name;

    this.setStatus("加载音频中...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      this.audioContext = new AudioContext();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;

      // Run multiple analyses
      this.setStatus("分析频谱...");
      this.frequencyBands = await this.frequencyAnalyzer.analyze(
        this.audioBuffer,
        {
          onProgress: (p) =>
            this.setStatus(`分析频谱: ${Math.round(p * 100)}%`),
        },
      );

      this.setStatus("检测节拍...");
      this.beatInfo = this.beatDetector.detectBeats(
        this.frequencyBands.bass,
        this.duration,
      );

      this.setStatus("提取事件...");
      this.result = await this.audioAnalyzer.analyze(this.audioBuffer, {
        onProgress: (p) => this.setStatus(`提取事件: ${Math.round(p * 100)}%`),
      });

      // Update BPM display
      this.updateBpmDisplay();

      // Draw all visualizations
      this.drawAllVisualizations();

      this.setStatus(
        `分析完成: BPM=${this.beatInfo.bpm}, ${this.result.timeline.length}个事件`,
      );

      this.enableControls();
    } catch (error) {
      console.error("Analysis failed:", error);
      this.setStatus("分析失败");
    }
  }

  private updateBpmDisplay(): void {
    if (!this.beatInfo) return;

    const bpmValue = document.getElementById("bpmValue");
    const confidenceValue = document.getElementById("confidenceValue");

    if (bpmValue) bpmValue.textContent = String(this.beatInfo.bpm);
    if (confidenceValue) {
      confidenceValue.textContent = `${Math.round(this.beatInfo.confidence * 100)}%`;
    }
  }

  private drawAllVisualizations(): void {
    this.drawSpectrogram();
    this.drawBandEnergy(
      this.bassCtx,
      this.bassCanvas,
      this.frequencyBands?.bass,
      "#ff5555",
    );
    this.drawBandEnergy(
      this.midCtx,
      this.midCanvas,
      this.frequencyBands?.mid,
      "#55ff55",
    );
    this.drawBandEnergy(
      this.highCtx,
      this.highCanvas,
      this.frequencyBands?.high,
      "#5599ff",
    );
    this.drawBeatGrid();
    this.drawTimeline();
  }

  private drawSpectrogram(): void {
    if (!this.frequencyBands) return;

    const ctx = this.spectrogramCtx;
    const rect = this.spectrogramCanvas.getBoundingClientRect();
    const { spectrogram, frequencyBinCount } = this.frequencyBands;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const timeSteps = spectrogram.length;
    const freqSteps = Math.min(frequencyBinCount, 256); // Limit frequency bins for display
    const pixelWidth = rect.width / timeSteps;
    const pixelHeight = rect.height / freqSteps;

    // Draw spectrogram with color mapping
    for (let t = 0; t < timeSteps; t++) {
      const frame = spectrogram[t];
      if (!frame) continue;

      for (let f = 0; f < freqSteps; f++) {
        const value = frame[f] ?? 0;
        const intensity = Math.min(1, value * 3); // Boost for visibility

        // Color mapping: low=blue, mid=green, high=red/yellow
        const hue = 240 - intensity * 240; // Blue to red
        const saturation = 80;
        const lightness = intensity * 50;

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(
          t * pixelWidth,
          rect.height - (f + 1) * pixelHeight, // Flip y-axis
          Math.ceil(pixelWidth) + 1,
          Math.ceil(pixelHeight) + 1,
        );
      }
    }

    // Draw frequency labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "10px sans-serif";
    ctx.fillText("8kHz", 5, 15);
    ctx.fillText("2kHz", 5, rect.height * 0.5);
    ctx.fillText("200Hz", 5, rect.height - 5);
  }

  private drawBandEnergy(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    data: Float32Array | undefined,
    color: string,
  ): void {
    if (!data) return;

    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw energy bars
    const barWidth = rect.width / data.length;

    ctx.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
      const value = data[i] ?? 0;
      const barHeight = value * rect.height * 0.9;
      ctx.fillRect(
        i * barWidth,
        rect.height - barHeight,
        Math.max(1, barWidth - 0.5),
        barHeight,
      );
    }

    // Draw threshold line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, rect.height * 0.5);
    ctx.lineTo(rect.width, rect.height * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawBeatGrid(): void {
    if (!this.beatInfo) return;

    const ctx = this.beatCtx;
    const rect = this.beatCanvas.getBoundingClientRect();
    const { beats, beatInterval } = this.beatInfo;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw beat markers
    const duration = this.duration;

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i]!;
      const x = (beat / duration) * rect.width;
      const beatNumber = BeatDetector.getBeatNumber(
        beat,
        beatInterval,
        beats[0] ?? 0,
      );

      // Different style for beat 1 (downbeat)
      const isDownbeat = beatNumber === 1;

      ctx.fillStyle = isDownbeat ? "#ffaa00" : "rgba(255, 170, 0, 0.5)";
      ctx.fillRect(
        x - 1,
        isDownbeat ? 5 : 15,
        2,
        isDownbeat ? rect.height - 10 : rect.height - 30,
      );

      // Beat number label for downbeats
      if (isDownbeat && i % 4 === 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "10px sans-serif";
        ctx.fillText(String(Math.floor(i / 4) + 1), x + 4, rect.height - 5);
      }
    }

    // Draw beat number indicators at top
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "9px sans-serif";
    ctx.fillText("小节", 5, 12);
  }

  private drawTimeline(): void {
    if (!this.result) return;

    const container = document.getElementById("timelineContainer");
    if (!container) return;

    const { timeline, duration } = this.result;
    const rows = container.querySelectorAll(".timeline-row");

    // Clear existing events
    rows.forEach((row) => {
      const eventsArea = row.querySelector(".events-area");
      if (eventsArea) {
        eventsArea
          .querySelectorAll(".timeline-event")
          .forEach((el) => el.remove());
      }
    });

    // Group events by type
    const eventsByType: Record<string, AudioEvent[]> = {
      bass: [],
      mid: [],
      piano: [],
      climax: [],
    };

    for (const event of timeline) {
      if (event.isClimax) {
        eventsByType["climax"]?.push(event);
      } else {
        eventsByType[event.type]?.push(event);
      }
    }

    // Draw events
    rows.forEach((row) => {
      const type = row.getAttribute("data-type");
      if (!type) return;

      const eventsArea = row.querySelector(".events-area");
      if (!eventsArea) return;

      const events = eventsByType[type] || [];
      const areaWidth = eventsArea.clientWidth;

      for (const event of events) {
        const el = document.createElement("div");
        el.className = `timeline-event ${type}`;
        el.style.left = `${(event.explodeTime / duration) * areaWidth}px`;
        el.style.width = "4px";
        eventsArea.appendChild(el);
      }
    });
  }

  private async play(): Promise<void> {
    if (!this.audioBuffer || !this.audioContext) return;

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // Ignore
      }
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.audioContext.destination);
    this.source.start(0);

    this.startTime = this.audioContext.currentTime;
    this.isPlaying = true;

    // Show playheads
    this.setPlayheadsVisible(true);

    this.source.onended = () => {
      this.isPlaying = false;
      this.setPlayheadsVisible(false);
    };
  }

  private stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // Ignore
      }
    }
    this.isPlaying = false;
    this.setPlayheadsVisible(false);
  }

  private setPlayheadsVisible(visible: boolean): void {
    const playheads = document.querySelectorAll(".playhead");
    playheads.forEach((el) => {
      (el as HTMLElement).style.display = visible ? "block" : "none";
    });
  }

  private exportJSON(): void {
    if (!this.result || !this.beatInfo) return;

    const exportData = {
      ...JSON.parse(AudioAnalyzer.exportJSON(this.result)),
      bpm: this.beatInfo.bpm,
      beats: this.beatInfo.beats,
      beatConfidence: this.beatInfo.confidence,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "audio-analysis.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  private enableControls(): void {
    const playBtn = document.getElementById("playBtn") as HTMLButtonElement;
    const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
    const exportBtn = document.getElementById("exportBtn") as HTMLButtonElement;

    if (playBtn) playBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = false;
  }

  private setStatus(text: string): void {
    const status = document.getElementById("status");
    if (status) status.textContent = text;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);

    if (this.isPlaying && this.audioContext && this.duration > 0) {
      const currentTime = this.audioContext.currentTime - this.startTime;
      const progress = currentTime / this.duration;

      // Update playheads
      const spectrogramRect = this.spectrogramCanvas.getBoundingClientRect();
      const beatRect = this.beatCanvas.getBoundingClientRect();

      const spectrogramPlayhead = document.getElementById(
        "spectrogramPlayhead",
      );
      const beatPlayhead = document.getElementById("beatPlayhead");

      if (spectrogramPlayhead) {
        spectrogramPlayhead.style.left = `${progress * spectrogramRect.width}px`;
      }
      if (beatPlayhead) {
        beatPlayhead.style.left = `${progress * beatRect.width}px`;
      }

      // Update progress bar
      const progressFill = document.getElementById("progressFill");
      if (progressFill) {
        progressFill.style.width = `${progress * 100}%`;
      }

      // Update time display
      const timeDisplay = document.getElementById("timeDisplay");
      if (timeDisplay) {
        timeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(this.duration)}`;
      }
    }
  };
}

// Initialize
new AudioAnalyzerDemo();
