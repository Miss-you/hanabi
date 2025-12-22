import { Renderer } from '@/engine/Renderer';
import { ParticleSystem } from '@/engine/ParticleSystem';
import { FireworkLauncher } from '@/engine/FireworkLauncher';
import { AudioAnalyzer } from '@/audio/AudioAnalyzer';
import { FrequencyAnalyzer } from '@/audio/FrequencyAnalyzer';
import { BeatDetector } from '@/audio/BeatDetector';
import { Timeline } from '@/audio/Timeline';
import { Choreographer } from '@/choreography/Choreographer';
import { FireworkType } from '@/core/types';
import './styles/main.css';

type AppMode = 'idle' | 'demo' | 'music';

class HanabiApp {
  private renderer: Renderer;
  private particleSystem: ParticleSystem;
  private launcher: FireworkLauncher;
  private audioAnalyzer: AudioAnalyzer;
  private frequencyAnalyzer: FrequencyAnalyzer;
  private beatDetector: BeatDetector;
  private choreographer: Choreographer;
  private timeline: Timeline;

  private mode: AppMode = 'idle';
  private isPaused: boolean = false;
  private demoTimer: number = 0;
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');

    this.renderer = new Renderer(canvas);
    this.particleSystem = new ParticleSystem();
    this.launcher = new FireworkLauncher(
      this.renderer.width,
      this.renderer.height,
      (particles) => this.particleSystem.add(particles)
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
    const demoBtn = document.getElementById('demoBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const audioInput = document.getElementById('audioInput') as HTMLInputElement;

    demoBtn?.addEventListener('click', () => this.startDemo());
    pauseBtn?.addEventListener('click', () => this.togglePause());
    audioInput?.addEventListener('change', (e) => this.handleAudioUpload(e));
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.launcher.resize(this.renderer.width, this.renderer.height);
      this.audioAnalyzer.resize(this.renderer.height);
    });
  }

  private startDemo(): void {
    this.mode = 'demo';
    this.demoTimer = 0;
    this.timeline.stop();
    this.setStatus('模式: 演示 (自动编排)');
  }

  private togglePause(): void {
    if (this.mode === 'idle') return;

    const pauseBtn = document.getElementById('pauseBtn');
    if (this.isPaused) {
      this.isPaused = false;
      if (pauseBtn) pauseBtn.textContent = '暂停';
      this.timeline.resume();
    } else {
      this.isPaused = true;
      if (pauseBtn) pauseBtn.textContent = '继续';
      this.timeline.pause();
    }
  }

  private async handleAudioUpload(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.mode = 'music';
    this.setStatus('加载音频中...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const duration = this.audioBuffer.duration;

      // Step 1: Basic audio analysis for events
      this.setStatus('分析音频事件... (1/3)');
      const result = await this.audioAnalyzer.analyze(this.audioBuffer, {
        onProgress: (p) => {
          this.setStatus(`分析事件: ${Math.round(p * 100)}%`);
        },
      });

      // Step 2: Frequency band analysis
      this.setStatus('分析频率特征... (2/3)');
      const freqBands = await this.frequencyAnalyzer.analyze(this.audioBuffer);

      // Step 3: Beat detection
      this.setStatus('检测节拍... (3/3)');
      const beatInfo = this.beatDetector.detectBeats(freqBands.bass, duration);

      // Prepare choreographer with all analysis data
      this.setStatus('准备编排...');
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
      console.log('[HanabiApp] Choreography ready:', stats);
      this.setStatus(`正在播放: ${file.name} | BPM: ${Math.round(stats.bpm)}`);

      await this.timeline.play(this.audioBuffer);
    } catch (error) {
      console.error('Audio loading failed:', error);
      this.setStatus('音频加载失败');
      this.mode = 'idle';
    }
  }

  private runDemoLogic(): void {
    this.demoTimer++;

    // Phase-based thresholds
    let threshold = 0.98;
    if (this.demoTimer > 300) threshold = 0.95;
    if (this.demoTimer > 900) threshold = 0.85;

    if (Math.random() > threshold) {
      const type: FireworkType =
        this.demoTimer > 900
          ? Math.random() > 0.5
            ? 'willow'
            : 'kiku'
          : this.demoTimer > 300
            ? 'kiku'
            : 'botan';
      this.launcher.launch(type);
    }

    if (this.demoTimer > 1300) this.demoTimer = 0;
  }

  private setStatus(text: string): void {
    const status = document.getElementById('status');
    if (status) status.textContent = text;
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);

    if (this.isPaused) return;

    // Background
    this.renderer.drawBackground();

    // Mode logic
    if (this.mode === 'music') {
      this.timeline.update();
    } else if (this.mode === 'demo') {
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
