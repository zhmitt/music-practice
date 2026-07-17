/**
 * Simple onset detector using Web Audio API's AnalyserNode.
 *
 * Detects sharp energy increases (transients) from microphone input.
 * Uses a spectral flux approach: compare the current spectral frame
 * with the previous one and fire an onset when the difference exceeds
 * a threshold and enough time has passed since the last onset.
 */

export interface OnsetEvent {
  /** Timestamp relative to AudioContext.currentTime, in ms. */
  timestampMs: number;
}

export type OnsetCallback = (event: OnsetEvent) => void;

const FFT_SIZE = 512;
const MIN_ONSET_GAP_MS = 60; // minimum ms between onsets (prevents double-triggers)

export class OnsetDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  private prevSpectrum: Float32Array | null = null;
  private lastOnsetTime = 0;
  private rafId: number | null = null;
  private callback: OnsetCallback | null = null;

  /** Dynamic threshold — adapts to ambient level. */
  private threshold = 12;
  private noiseFloor = 0;
  private frameCount = 0;

  /** Start listening to the microphone. */
  async start(callback: OnsetCallback): Promise<void> {
    this.callback = callback;

    this.audioCtx = new AudioContext();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });

    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0;

    this.source.connect(this.analyser);

    this.prevSpectrum = null;
    this.lastOnsetTime = 0;
    this.noiseFloor = 0;
    this.frameCount = 0;

    this.tick();
  }

  /** Stop listening and release resources. */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.audioCtx?.state !== 'closed') {
      this.audioCtx?.close();
    }
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.callback = null;
  }

  private tick = (): void => {
    this.rafId = requestAnimationFrame(this.tick);
    if (!this.analyser || !this.audioCtx) return;

    const bins = this.analyser.frequencyBinCount;
    const spectrum = new Float32Array(bins);
    this.analyser.getFloatFrequencyData(spectrum);

    if (this.prevSpectrum) {
      // Spectral flux: sum of positive differences (half-wave rectified)
      let flux = 0;
      for (let i = 0; i < bins; i++) {
        const diff = spectrum[i] - this.prevSpectrum[i];
        if (diff > 0) flux += diff;
      }

      // Adaptive threshold: calibrate from first 20 frames
      this.frameCount++;
      if (this.frameCount <= 20) {
        this.noiseFloor = Math.max(this.noiseFloor, flux);
        this.threshold = this.noiseFloor * 1.8 + 8;
      }

      const nowMs = this.audioCtx.currentTime * 1000;
      const gapOk = nowMs - this.lastOnsetTime > MIN_ONSET_GAP_MS;

      if (flux > this.threshold && gapOk) {
        this.lastOnsetTime = nowMs;
        this.callback?.({ timestampMs: nowMs });
      }
    }

    this.prevSpectrum = spectrum;
  };
}
