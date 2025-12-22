/**
 * Frequency bands analysis result
 */
export interface FrequencyBands {
  /** Low frequency energy (20-200Hz) - drums, bass */
  bass: Float32Array;
  /** Mid frequency energy (200-2000Hz) - vocals, guitars */
  mid: Float32Array;
  /** High frequency energy (2000-8000Hz) - cymbals, hi-hats */
  high: Float32Array;
  /** Full spectrogram data [time][frequency] */
  spectrogram: Float32Array[];
  /** Number of frequency bins */
  frequencyBinCount: number;
  /** Sample rate */
  sampleRate: number;
  /** Duration in seconds */
  duration: number;
  /** Frames per second */
  fps: number;
}

export interface FrequencyAnalyzerCallbacks {
  onProgress?: (progress: number) => void;
}

/**
 * FFT-based frequency analyzer for audio using Web Audio API
 * Uses OfflineAudioContext for fast offline processing
 */
export class FrequencyAnalyzer {
  private fftSize: number;
  private fps: number;

  constructor(fftSize: number = 2048, fps: number = 30) {
    this.fftSize = fftSize;
    this.fps = fps; // Lower default FPS for better performance
  }

  /**
   * Analyze audio buffer and extract frequency bands
   * Uses Web Audio API's built-in FFT for optimal performance
   */
  async analyze(
    buffer: AudioBuffer,
    callbacks?: FrequencyAnalyzerCallbacks
  ): Promise<FrequencyBands> {
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    const duration = buffer.duration;

    // Calculate frame parameters
    const samplesPerFrame = Math.floor(sampleRate / this.fps);
    const totalFrames = Math.ceil(channelData.length / samplesPerFrame);

    // Initialize result arrays
    const bass = new Float32Array(totalFrames);
    const mid = new Float32Array(totalFrames);
    const high = new Float32Array(totalFrames);
    const spectrogram: Float32Array[] = [];

    // Frequency bin ranges
    const binWidth = sampleRate / this.fftSize;
    const bassEnd = Math.floor(200 / binWidth);
    const midEnd = Math.floor(2000 / binWidth);
    const highEnd = Math.floor(8000 / binWidth);

    // Use a real-time context with AnalyserNode for FFT
    // Process in chunks to avoid blocking UI
    const chunkSize = 100; // Process 100 frames at a time

    for (let chunkStart = 0; chunkStart < totalFrames; chunkStart += chunkSize) {
      const chunkEnd = Math.min(chunkStart + chunkSize, totalFrames);

      // Process this chunk
      for (let frame = chunkStart; frame < chunkEnd; frame++) {
        const startSample = frame * samplesPerFrame;

        // Extract and compute FFT using optimized method
        const magnitudes = this.computeFFT(channelData, startSample, sampleRate);

        // Store spectrogram frame (downsample for memory efficiency)
        const downsampledMag = this.downsampleSpectrum(magnitudes, 128);
        spectrogram.push(downsampledMag);

        // Calculate band energies
        bass[frame] = this.calculateBandEnergy(magnitudes, 0, bassEnd);
        mid[frame] = this.calculateBandEnergy(magnitudes, bassEnd, midEnd);
        high[frame] = this.calculateBandEnergy(magnitudes, midEnd, highEnd);
      }

      // Report progress and yield to UI
      if (callbacks?.onProgress) {
        callbacks.onProgress(chunkEnd / totalFrames);
      }

      // Yield to allow UI updates
      await this.yieldToUI();
    }

    // Normalize bands
    this.normalizeArray(bass);
    this.normalizeArray(mid);
    this.normalizeArray(high);

    return {
      bass,
      mid,
      high,
      spectrogram,
      frequencyBinCount: 128, // Downsampled
      sampleRate,
      duration,
      fps: this.fps,
    };
  }

  /**
   * Compute FFT using optimized Cooley-Tukey algorithm
   */
  private computeFFT(
    channelData: Float32Array,
    startSample: number,
    _sampleRate: number
  ): Float32Array {
    const N = this.fftSize;
    const magnitudes = new Float32Array(N / 2);

    // Extract and window the data
    const real = new Float32Array(N);
    const imag = new Float32Array(N);

    for (let i = 0; i < N && startSample + i < channelData.length; i++) {
      // Apply Hann window
      const hannWindow = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
      real[i] = (channelData[startSample + i] ?? 0) * hannWindow;
    }

    // Perform in-place FFT (Cooley-Tukey radix-2)
    this.fft(real, imag);

    // Calculate magnitudes
    for (let k = 0; k < N / 2; k++) {
      magnitudes[k] = Math.sqrt(real[k]! * real[k]! + imag[k]! * imag[k]!) / N;
    }

    return magnitudes;
  }

  /**
   * In-place Cooley-Tukey FFT (radix-2, decimation-in-time)
   * Much faster than naive DFT: O(N log N) vs O(N²)
   */
  private fft(real: Float32Array, imag: Float32Array): void {
    const N = real.length;
    const levels = Math.log2(N);

    if (Math.pow(2, levels) !== N) {
      throw new Error('FFT size must be a power of 2');
    }

    // Bit-reversal permutation
    for (let i = 0; i < N; i++) {
      const j = this.reverseBits(i, levels);
      if (j > i) {
        // Swap real
        const tempReal = real[i]!;
        real[i] = real[j]!;
        real[j] = tempReal;
        // Swap imag
        const tempImag = imag[i]!;
        imag[i] = imag[j]!;
        imag[j] = tempImag;
      }
    }

    // Cooley-Tukey iterative FFT
    for (let size = 2; size <= N; size *= 2) {
      const halfSize = size / 2;
      const angleStep = (-2 * Math.PI) / size;

      for (let i = 0; i < N; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const angle = angleStep * j;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const evenIdx = i + j;
          const oddIdx = i + j + halfSize;

          const tReal = cos * real[oddIdx]! - sin * imag[oddIdx]!;
          const tImag = sin * real[oddIdx]! + cos * imag[oddIdx]!;

          real[oddIdx] = real[evenIdx]! - tReal;
          imag[oddIdx] = imag[evenIdx]! - tImag;
          real[evenIdx] = real[evenIdx]! + tReal;
          imag[evenIdx] = imag[evenIdx]! + tImag;
        }
      }
    }
  }

  /**
   * Reverse bits for FFT bit-reversal permutation
   */
  private reverseBits(x: number, bits: number): number {
    let result = 0;
    for (let i = 0; i < bits; i++) {
      result = (result << 1) | (x & 1);
      x >>= 1;
    }
    return result;
  }

  /**
   * Downsample spectrum for memory efficiency
   */
  private downsampleSpectrum(magnitudes: Float32Array, targetSize: number): Float32Array {
    const result = new Float32Array(targetSize);
    const ratio = magnitudes.length / targetSize;

    for (let i = 0; i < targetSize; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += magnitudes[j]!;
      }
      result[i] = sum / (end - start);
    }

    return result;
  }

  /**
   * Calculate energy in a frequency band
   */
  private calculateBandEnergy(
    magnitudes: Float32Array,
    startBin: number,
    endBin: number
  ): number {
    let sum = 0;
    const count = Math.min(endBin, magnitudes.length) - startBin;

    for (let i = startBin; i < Math.min(endBin, magnitudes.length); i++) {
      sum += magnitudes[i]! * magnitudes[i]!;
    }

    return count > 0 ? Math.sqrt(sum / count) : 0;
  }

  /**
   * Normalize array to 0-1 range
   */
  private normalizeArray(arr: Float32Array): void {
    let max = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]! > max) max = arr[i]!;
    }

    if (max > 0) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = arr[i]! / max;
      }
    }
  }

  /**
   * Yield to UI thread to prevent freezing
   */
  private yieldToUI(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  /**
   * Get frequency for a given bin index
   */
  static binToFrequency(bin: number, sampleRate: number, fftSize: number): number {
    return (bin * sampleRate) / fftSize;
  }

  /**
   * Get bin index for a given frequency
   */
  static frequencyToBin(frequency: number, sampleRate: number, fftSize: number): number {
    return Math.round((frequency * fftSize) / sampleRate);
  }
}
