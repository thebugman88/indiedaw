import { EffectChain, MasterChain } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private maxDuration = 0;

  // Master bus
  private masterInput: GainNode | null = null;
  private masterLowCut: BiquadFilterNode | null = null;
  private masterShaper: WaveShaperNode | null = null;
  private masterBusComp: DynamicsCompressorNode | null = null;
  private masterAir: BiquadFilterNode | null = null;
  private masterVolume: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  // Track chains map
  private trackNodes: Map<
    string,
    {
      buffer: AudioBuffer | null;
      source: AudioBufferSourceNode | null;
      inputGain: GainNode;
      lowCut: BiquadFilterNode;
      eqLow: BiquadFilterNode;
      eqMid: BiquadFilterNode;
      eqHigh: BiquadFilterNode;
      eqAir: BiquadFilterNode;
      compressor: DynamicsCompressorNode;
      makeupGain: GainNode;
      saturation: WaveShaperNode;
      delay: DelayNode;
      delayFeedback: GainNode;
      delayWet: GainNode;
      delayDry: GainNode;
      reverbConvolver: ConvolverNode;
      reverbWet: GainNode;
      reverbDry: GainNode;
      volume: GainNode;
      panner: StereoPannerNode;
      analyser: AnalyserNode;
      levelData: Uint8Array;
      muted: boolean;
      userVolume: number;
    }
  > = new Map();

  // Animation frame loop
  private animFrameId: number | null = null;
  public onTimeUpdate?: (time: number) => void;
  public onPlayStateChange?: (isPlaying: boolean) => void;

  // Microphone recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private micStream: MediaStream | null = null;

  constructor() {
    // Lazy initialized on first user gesture
  }

  public getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.setupMasterChain();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private setupMasterChain() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.masterInput = ctx.createGain();

    // 30Hz high-pass filter
    this.masterLowCut = ctx.createBiquadFilter();
    this.masterLowCut.type = 'highpass';
    this.masterLowCut.frequency.value = 32;

    // Tape saturation
    this.masterShaper = ctx.createWaveShaper();
    this.masterShaper.curve = this.makeDistortionCurve(10);
    this.masterShaper.oversample = '2x';

    // Master Bus Compressor
    this.masterBusComp = ctx.createDynamicsCompressor();
    this.masterBusComp.threshold.value = -14;
    this.masterBusComp.ratio.value = 2.5;
    this.masterBusComp.attack.value = 0.03;
    this.masterBusComp.release.value = 0.15;

    // Air shelf filter
    this.masterAir = ctx.createBiquadFilter();
    this.masterAir.type = 'highshelf';
    this.masterAir.frequency.value = 11000;
    this.masterAir.gain.value = 1.5;

    // Master Volume
    this.masterVolume = ctx.createGain();
    this.masterVolume.gain.value = 1.0;

    // Brickwall Limiter
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -0.5;
    this.masterLimiter.ratio.value = 20.0;
    this.masterLimiter.attack.value = 0.001;
    this.masterLimiter.release.value = 0.05;

    // Analyser for VU meter
    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;

    // Wire up master chain:
    // masterInput -> masterLowCut -> masterShaper -> masterBusComp -> masterAir -> masterVolume -> masterLimiter -> masterAnalyser -> destination
    this.masterInput.connect(this.masterLowCut);
    this.masterLowCut.connect(this.masterShaper);
    this.masterShaper.connect(this.masterBusComp);
    this.masterBusComp.connect(this.masterAir);
    this.masterAir.connect(this.masterVolume);
    this.masterVolume.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(ctx.destination);
  }

  public registerTrack(trackId: string) {
    const ctx = this.getAudioContext();
    if (this.trackNodes.has(trackId)) return;

    const inputGain = ctx.createGain();

    // Low Cut Filter
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = 80;

    // 4-band Parametric EQ
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 200;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1200;
    eqMid.Q.value = 1.2;

    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'peaking';
    eqHigh.frequency.value = 4500;

    const eqAir = ctx.createBiquadFilter();
    eqAir.type = 'highshelf';
    eqAir.frequency.value = 10500;

    // Compressor & Makeup
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.015;
    compressor.release.value = 0.12;

    const makeupGain = ctx.createGain();
    makeupGain.gain.value = 1.0;

    // Saturation
    const saturation = ctx.createWaveShaper();
    saturation.curve = this.makeDistortionCurve(0);

    // Delay FX send
    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.25;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.25;
    const delayWet = ctx.createGain();
    delayWet.gain.value = 0;
    const delayDry = ctx.createGain();
    delayDry.gain.value = 1.0;

    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(delayWet);

    // Reverb FX send (algorithmic synthetic impulse)
    const reverbConvolver = ctx.createConvolver();
    reverbConvolver.buffer = this.createImpulseResponse(ctx, 2.0, 2.0);
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0;
    const reverbDry = ctx.createGain();
    reverbDry.gain.value = 1.0;

    reverbConvolver.connect(reverbWet);

    // Track output volume and panner
    const volume = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;

    // Wire:
    // inputGain -> lowCut -> eqLow -> eqMid -> eqHigh -> eqAir -> compressor -> makeupGain -> saturation
    inputGain.connect(lowCut);
    lowCut.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(eqAir);
    eqAir.connect(compressor);
    compressor.connect(makeupGain);
    makeupGain.connect(saturation);

    // Post-saturation split into dry, delay, reverb
    saturation.connect(delayDry);
    saturation.connect(delay);
    saturation.connect(reverbDry);
    saturation.connect(reverbConvolver);

    // Join back into track volume
    delayDry.connect(volume);
    delayWet.connect(volume);
    reverbDry.connect(volume);
    reverbWet.connect(volume);

    // volume -> panner -> analyser -> masterInput
    volume.connect(panner);
    panner.connect(analyser);
    if (this.masterInput) {
      analyser.connect(this.masterInput);
    }

    this.trackNodes.set(trackId, {
      buffer: null,
      source: null,
      inputGain,
      lowCut,
      eqLow,
      eqMid,
      eqHigh,
      eqAir,
      compressor,
      makeupGain,
      saturation,
      delay,
      delayFeedback,
      delayWet,
      delayDry,
      reverbConvolver,
      reverbWet,
      reverbDry,
      volume,
      panner,
      analyser,
      levelData: new Uint8Array(analyser.frequencyBinCount),
      muted: false,
      userVolume: 1.0,
    });
  }

  public setTrackBuffer(trackId: string, buffer: AudioBuffer | null) {
    this.registerTrack(trackId);
    const node = this.trackNodes.get(trackId);
    if (!node) return;
    node.buffer = buffer;
    this.recalcMaxDuration();
  }

  public getTrackBuffer(trackId: string): AudioBuffer | null {
    return this.trackNodes.get(trackId)?.buffer || null;
  }

  public setTrackVolume(trackId: string, volume: number) {
    this.registerTrack(trackId);
    const node = this.trackNodes.get(trackId);
    if (!node) return;
    node.userVolume = volume;
    if (!node.muted) {
      node.volume.gain.setTargetAtTime(volume, this.ctx?.currentTime || 0, 0.02);
    }
  }

  public setTrackPan(trackId: string, pan: number) {
    this.registerTrack(trackId);
    const node = this.trackNodes.get(trackId);
    if (!node) return;
    node.panner.pan.setTargetAtTime(pan, this.ctx?.currentTime || 0, 0.02);
  }

  public setTrackMute(trackId: string, muted: boolean) {
    this.registerTrack(trackId);
    const node = this.trackNodes.get(trackId);
    if (!node) return;
    node.muted = muted;
    const targetGain = muted ? 0 : node.userVolume;
    node.volume.gain.setTargetAtTime(targetGain, this.ctx?.currentTime || 0, 0.02);
  }

  public setTrackFX(trackId: string, chain: EffectChain) {
    this.registerTrack(trackId);
    const node = this.trackNodes.get(trackId);
    if (!node || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Low Cut
    if (chain.lowCut.enabled) {
      node.lowCut.frequency.setTargetAtTime(chain.lowCut.freq, now, 0.02);
    } else {
      node.lowCut.frequency.setTargetAtTime(10, now, 0.02);
    }

    // EQ
    if (chain.eq.enabled) {
      node.eqLow.frequency.setTargetAtTime(chain.eq.lowFreq, now, 0.02);
      node.eqLow.gain.setTargetAtTime(chain.eq.lowGain, now, 0.02);

      node.eqMid.frequency.setTargetAtTime(chain.eq.midFreq, now, 0.02);
      node.eqMid.Q.setTargetAtTime(chain.eq.midQ, now, 0.02);
      node.eqMid.gain.setTargetAtTime(chain.eq.midGain, now, 0.02);

      node.eqHigh.frequency.setTargetAtTime(chain.eq.highFreq, now, 0.02);
      node.eqHigh.gain.setTargetAtTime(chain.eq.highGain, now, 0.02);

      node.eqAir.frequency.setTargetAtTime(chain.eq.highAirFreq, now, 0.02);
      node.eqAir.gain.setTargetAtTime(chain.eq.highAirGain, now, 0.02);
    } else {
      node.eqLow.gain.setTargetAtTime(0, now, 0.02);
      node.eqMid.gain.setTargetAtTime(0, now, 0.02);
      node.eqHigh.gain.setTargetAtTime(0, now, 0.02);
      node.eqAir.gain.setTargetAtTime(0, now, 0.02);
    }

    // Compressor
    if (chain.compressor.enabled) {
      node.compressor.threshold.setTargetAtTime(chain.compressor.threshold, now, 0.02);
      node.compressor.ratio.setTargetAtTime(chain.compressor.ratio, now, 0.02);
      node.compressor.attack.setTargetAtTime(chain.compressor.attack, now, 0.02);
      node.compressor.release.setTargetAtTime(chain.compressor.release, now, 0.02);
      const linGain = Math.pow(10, chain.compressor.gain / 20);
      node.makeupGain.gain.setTargetAtTime(linGain, now, 0.02);
    } else {
      node.compressor.threshold.setTargetAtTime(0, now, 0.02);
      node.makeupGain.gain.setTargetAtTime(1.0, now, 0.02);
    }

    // Saturation
    if (chain.saturation.enabled && chain.saturation.drive > 0) {
      node.saturation.curve = this.makeDistortionCurve(chain.saturation.drive * 40);
    } else {
      node.saturation.curve = this.makeDistortionCurve(0);
    }

    // Delay
    if (chain.delay.enabled && chain.delay.mix > 0) {
      node.delay.delayTime.setTargetAtTime(chain.delay.time, now, 0.02);
      node.delayFeedback.gain.setTargetAtTime(chain.delay.feedback, now, 0.02);
      node.delayWet.gain.setTargetAtTime(chain.delay.mix, now, 0.02);
      node.delayDry.gain.setTargetAtTime(1 - chain.delay.mix * 0.4, now, 0.02);
    } else {
      node.delayWet.gain.setTargetAtTime(0, now, 0.02);
      node.delayDry.gain.setTargetAtTime(1.0, now, 0.02);
    }

    // Reverb
    if (chain.reverb.enabled && chain.reverb.mix > 0) {
      node.reverbWet.gain.setTargetAtTime(chain.reverb.mix, now, 0.02);
      node.reverbDry.gain.setTargetAtTime(1 - chain.reverb.mix * 0.4, now, 0.02);
    } else {
      node.reverbWet.gain.setTargetAtTime(0, now, 0.02);
      node.reverbDry.gain.setTargetAtTime(1.0, now, 0.02);
    }
  }

  public setMasterChain(chain: MasterChain) {
    if (!this.ctx || !this.masterLowCut) return;
    const now = this.ctx.currentTime;

    if (chain.lowCut30) {
      this.masterLowCut.frequency.setTargetAtTime(32, now, 0.02);
    } else {
      this.masterLowCut.frequency.setTargetAtTime(10, now, 0.02);
    }

    if (chain.tapeWarmth > 0 && this.masterShaper) {
      this.masterShaper.curve = this.makeDistortionCurve(chain.tapeWarmth * 25);
    }

    if (this.masterBusComp) {
      this.masterBusComp.threshold.setTargetAtTime(chain.busCompThreshold, now, 0.02);
      this.masterBusComp.ratio.setTargetAtTime(chain.busCompRatio, now, 0.02);
    }

    if (this.masterAir) {
      this.masterAir.gain.setTargetAtTime(chain.highAirBoost, now, 0.02);
    }

    if (this.masterLimiter) {
      this.masterLimiter.threshold.setTargetAtTime(chain.ceiling, now, 0.02);
    }
  }

  public setMasterVolume(volume: number) {
    if (!this.ctx || !this.masterVolume) return;
    this.masterVolume.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
  }

  private recalcMaxDuration() {
    let max = 0;
    this.trackNodes.forEach((node) => {
      if (node.buffer && node.buffer.duration > max) {
        max = node.buffer.duration;
      }
    });
    this.maxDuration = max;
  }

  public getMaxDuration(): number {
    return this.maxDuration;
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) {
      return this.pauseOffset;
    }
    const elapsed = this.ctx.currentTime - this.startTime;
    return Math.min(this.maxDuration, elapsed);
  }

  public play(startOffset?: number) {
    const ctx = this.getAudioContext();
    if (this.isPlaying) return;

    const offset = typeof startOffset === 'number' ? startOffset : this.pauseOffset;
    this.pauseOffset = offset;
    this.startTime = ctx.currentTime - offset;

    // Start all track buffer sources in sync
    this.trackNodes.forEach((node) => {
      if (!node.buffer) return;
      if (node.source) {
        try {
          node.source.stop();
          node.source.disconnect();
        } catch (_) {}
      }
      const src = ctx.createBufferSource();
      src.buffer = node.buffer;
      src.connect(node.inputGain);

      const trackOffset = Math.min(offset, node.buffer.duration);
      if (offset < node.buffer.duration) {
        src.start(0, trackOffset);
      }
      node.source = src;
    });

    this.isPlaying = true;
    this.onPlayStateChange?.(true);

    this.startTrackingLoop();
  }

  public pause() {
    if (!this.isPlaying || !this.ctx) return;
    this.pauseOffset = this.getCurrentTime();
    this.stopSources();
    this.isPlaying = false;
    this.onPlayStateChange?.(false);
    this.stopTrackingLoop();
  }

  public stop() {
    this.pauseOffset = 0;
    this.stopSources();
    this.isPlaying = false;
    this.onPlayStateChange?.(false);
    this.stopTrackingLoop();
    this.onTimeUpdate?.(0);
  }

  public seek(targetTime: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this.pauseOffset = Math.max(0, Math.min(this.maxDuration, targetTime));
    this.onTimeUpdate?.(this.pauseOffset);
    if (wasPlaying) {
      this.play(this.pauseOffset);
    }
  }

  private stopSources() {
    this.trackNodes.forEach((node) => {
      if (node.source) {
        try {
          node.source.stop();
          node.source.disconnect();
        } catch (_) {}
        node.source = null;
      }
    });
  }

  private startTrackingLoop() {
    this.stopTrackingLoop();
    const update = () => {
      const cur = this.getCurrentTime();
      this.onTimeUpdate?.(cur);

      if (this.maxDuration > 0 && cur >= this.maxDuration) {
        this.stop();
        return;
      }

      this.animFrameId = requestAnimationFrame(update);
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  private stopTrackingLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public getTrackLevel(trackId: string): number {
    const node = this.trackNodes.get(trackId);
    if (!node || node.muted || !this.isPlaying) return 0;
    node.analyser.getByteFrequencyData(node.levelData);
    let sum = 0;
    for (let i = 0; i < node.levelData.length; i++) {
      sum += node.levelData[i];
    }
    const avg = sum / node.levelData.length;
    return Math.min(1, (avg / 255) * 1.6);
  }

  public getMasterLevel(): { left: number; right: number } {
    if (!this.masterAnalyser || !this.isPlaying) return { left: 0, right: 0 };
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / data.length;
    const norm = Math.min(1, (avg / 255) * 1.5);
    return { left: norm, right: Math.min(1, norm * 0.96) };
  }

  /**
   * Decodes an uploaded audio file into an AudioBuffer safely across all browser engines.
   */
  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
    const arrayBuffer = await file.arrayBuffer();

    return new Promise<AudioBuffer>((resolve, reject) => {
      try {
        // Clone arrayBuffer so Web Audio API detachment doesn't invalidate
        const copy = arrayBuffer.slice(0);
        let settled = false;

        const handleSuccess = (decoded: AudioBuffer) => {
          if (settled) return;
          settled = true;
          if (!decoded || decoded.length === 0) {
            reject(new Error('Decoded audio track contains 0 audio frames.'));
          } else {
            resolve(decoded);
          }
        };

        const handleError = (err: any) => {
          if (settled) return;
          settled = true;
          reject(err instanceof Error ? err : new Error('Unable to decode audio format (unsupported or corrupted file).'));
        };

        const res = ctx.decodeAudioData(copy, handleSuccess, handleError);
        if (res && typeof res.then === 'function') {
          res.then(handleSuccess).catch(handleError);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Starts recording from microphone or external audio interface.
   */
  public async startMicrophoneRecording(deviceId?: string): Promise<void> {
    this.recordedChunks = [];
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId && deviceId !== 'default' ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 2,
        sampleRate: 48000,
      },
    };

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      // Fallback if strict constraints fail
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    this.mediaRecorder = new MediaRecorder(this.micStream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    this.mediaRecorder.start(50);
  }

  /**
   * Stops recording and returns decoded AudioBuffer.
   */
  public async stopMicrophoneRecording(): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('MediaRecorder not initialized'));
      }
      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          const arrayBuf = await blob.arrayBuffer();
          const ctx = this.getAudioContext();
          const audioBuffer = await ctx.decodeAudioData(arrayBuf);

          // Stop mic tracks
          if (this.micStream) {
            this.micStream.getTracks().forEach((track) => track.stop());
            this.micStream = null;
          }
          resolve(audioBuffer);
        } catch (err) {
          reject(err);
        }
      };
      this.mediaRecorder.stop();
    });
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 20;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private createImpulseResponse(
    ctx: AudioContext,
    duration: number,
    decay: number
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
    return impulse;
  }
}

export const audioEngine = new AudioEngine();
