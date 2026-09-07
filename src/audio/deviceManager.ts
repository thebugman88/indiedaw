/**
 * Audio Hardware Device Recognition & Direct Monitoring Manager
 * Detects professional audio interfaces (Focusrite Scarlett, PreSonus, Behringer, Rode, etc.)
 * and USB headsets/headphones (Corsair, HyperX, SteelSeries, Razer, etc.)
 */

export interface RecognizedHardware {
  brand: string;
  model: string;
  category: 'audio-interface' | 'usb-headphone' | 'usb-mic' | 'built-in' | 'generic';
  badgeColor: string; // Tailwind color class
  isStudioGrade: boolean;
  iconType: 'focusrite' | 'corsair' | 'interface' | 'headphones' | 'mic';
}

export interface AudioDeviceInfo {
  deviceId: string;
  groupId: string;
  kind: MediaDeviceKind;
  label: string;
  hardware: RecognizedHardware;
}

export class DeviceManager {
  private inputDevices: AudioDeviceInfo[] = [];
  private outputDevices: AudioDeviceInfo[] = [];
  private selectedInputId: string = 'default';
  private selectedOutputId: string = 'default';

  // Live direct monitoring
  private monitoringStream: MediaStream | null = null;
  private monitoringSourceNode: MediaStreamAudioSourceNode | null = null;
  private monitoringGainNode: GainNode | null = null;
  private isDirectMonitoringActive: boolean = false;
  private monitoringVolume: number = 0.8;

  // Live test input meter
  private testMeterStream: MediaStream | null = null;
  private testMeterAnalyser: AnalyserNode | null = null;
  private testMeterAnimId: number | null = null;

  // Listeners
  public onDevicesChanged?: (inputs: AudioDeviceInfo[], outputs: AudioDeviceInfo[]) => void;
  public onHardwarePlugged?: (hardware: RecognizedHardware, isInput: boolean) => void;
  public onMonitoringLevelChange?: (level: number) => void;

  constructor() {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        this.refreshDevices();
      });
    }
  }

  /**
   * Profiler that identifies audio hardware by label signatures.
   */
  public profileHardware(label: string, kind: MediaDeviceKind): RecognizedHardware {
    const l = label.toLowerCase();

    // Focusrite Scarlett / Vocaster / Clarett
    if (l.includes('focusrite') || l.includes('scarlett') || l.includes('vocaster') || l.includes('clarett')) {
      let model = 'Scarlett Audio Interface';
      if (l.includes('solo')) model = 'Scarlett Solo Studio';
      else if (l.includes('2i2')) model = 'Scarlett 2i2 Studio';
      else if (l.includes('4i4')) model = 'Scarlett 4i4';
      else if (l.includes('vocaster')) model = 'Vocaster Studio';
      else if (l.includes('studio')) model = 'Scarlett Studio';

      return {
        brand: 'Focusrite',
        model,
        category: 'audio-interface',
        badgeColor: 'bg-red-600 text-white border-red-500',
        isStudioGrade: true,
        iconType: 'focusrite',
      };
    }

    // Corsair USB Headphones / Headsets
    if (l.includes('corsair')) {
      let model = 'Corsair USB Headset';
      if (l.includes('hs80')) model = 'Corsair HS80 RGB USB';
      else if (l.includes('void')) model = 'Corsair VOID RGB Elite';
      else if (l.includes('virtuoso')) model = 'Corsair Virtuoso Hi-Fi';
      else if (l.includes('hs60') || l.includes('hs70')) model = 'Corsair HS Series';

      return {
        brand: 'Corsair',
        model,
        category: 'usb-headphone',
        badgeColor: 'bg-amber-500 text-black border-amber-400 font-semibold',
        isStudioGrade: true,
        iconType: 'corsair',
      };
    }

    // Universal Audio (Apollo, Volt)
    if (l.includes('universal audio') || l.includes('volt') || l.includes('apollo')) {
      return {
        brand: 'Universal Audio',
        model: l.includes('apollo') ? 'Apollo Twin/x' : 'Volt Studio Interface',
        category: 'audio-interface',
        badgeColor: 'bg-emerald-600 text-white border-emerald-500',
        isStudioGrade: true,
        iconType: 'interface',
      };
    }

    // PreSonus AudioBox / Studio
    if (l.includes('presonus') || l.includes('audiobox') || l.includes('studio 24')) {
      return {
        brand: 'PreSonus',
        model: 'PreSonus AudioBox Studio',
        category: 'audio-interface',
        badgeColor: 'bg-blue-600 text-white border-blue-500',
        isStudioGrade: true,
        iconType: 'interface',
      };
    }

    // Behringer U-Phoria / UMC
    if (l.includes('behringer') || l.includes('umc') || l.includes('u-phoria')) {
      return {
        brand: 'Behringer',
        model: 'U-Phoria UMC Studio',
        category: 'audio-interface',
        badgeColor: 'bg-yellow-600 text-white border-yellow-500',
        isStudioGrade: true,
        iconType: 'interface',
      };
    }

    // Rode (NT-USB, Wireless GO, PodMic, AI-1)
    if (l.includes('rode') || l.includes('røde')) {
      return {
        brand: 'RØDE',
        model: l.includes('wireless') ? 'Wireless GO' : 'RØDE Studio Mic',
        category: 'usb-mic',
        badgeColor: 'bg-orange-600 text-white border-orange-500',
        isStudioGrade: true,
        iconType: 'mic',
      };
    }

    // Blue Yeti / Snowball / Logitech
    if (l.includes('yeti') || l.includes('snowball') || l.includes('blue')) {
      return {
        brand: 'Blue Microphones',
        model: l.includes('yeti') ? 'Blue Yeti Pro' : 'Blue Studio Mic',
        category: 'usb-mic',
        badgeColor: 'bg-cyan-600 text-white border-cyan-500',
        isStudioGrade: true,
        iconType: 'mic',
      };
    }

    // Other Gaming / Hi-Fi USB Headsets (HyperX, SteelSeries, Razer)
    if (l.includes('hyperx') || l.includes('steelseries') || l.includes('razer') || l.includes('arctis')) {
      const brand = l.includes('hyperx') ? 'HyperX' : l.includes('steelseries') ? 'SteelSeries' : 'Razer';
      return {
        brand,
        model: `${brand} USB Headset`,
        category: 'usb-headphone',
        badgeColor: 'bg-purple-600 text-white border-purple-500',
        isStudioGrade: false,
        iconType: 'headphones',
      };
    }

    // Shure, Motu, SSL, Audient, Yamaha, Steinberg
    if (
      l.includes('shure') ||
      l.includes('motu') ||
      l.includes('ssl') ||
      l.includes('solid state') ||
      l.includes('audient') ||
      l.includes('yamaha') ||
      l.includes('steinberg')
    ) {
      let brand = 'Studio Hardware';
      if (l.includes('shure')) brand = 'Shure';
      else if (l.includes('motu')) brand = 'MOTU';
      else if (l.includes('ssl')) brand = 'Solid State Logic';
      else if (l.includes('audient')) brand = 'Audient';
      else if (l.includes('steinberg')) brand = 'Steinberg';

      return {
        brand,
        model: `${brand} Professional Interface`,
        category: 'audio-interface',
        badgeColor: 'bg-zinc-700 text-white border-zinc-500',
        isStudioGrade: true,
        iconType: 'interface',
      };
    }

    // Built-in or generic fallback
    if (l.includes('internal') || l.includes('built-in') || l.includes('default') || l.includes('macbook')) {
      return {
        brand: 'System',
        model: kind === 'audioinput' ? 'Built-in Microphone' : 'Built-in Speakers',
        category: 'built-in',
        badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        isStudioGrade: false,
        iconType: kind === 'audioinput' ? 'mic' : 'headphones',
      };
    }

    return {
      brand: 'Standard Device',
      model: label || (kind === 'audioinput' ? 'Audio Input' : 'Audio Output'),
      category: 'generic',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      isStudioGrade: false,
      iconType: kind === 'audioinput' ? 'mic' : 'headphones',
    };
  }

  /**
   * Refreshes the list of available devices.
   */
  public async refreshDevices(): Promise<{ inputs: AudioDeviceInfo[]; outputs: AudioDeviceInfo[] }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return { inputs: [], outputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const newInputs: AudioDeviceInfo[] = [];
      const newOutputs: AudioDeviceInfo[] = [];

      for (const d of devices) {
        if (d.kind === 'audioinput') {
          const hardware = this.profileHardware(d.label, 'audioinput');
          newInputs.push({
            deviceId: d.deviceId,
            groupId: d.groupId,
            kind: d.kind,
            label: d.label || `Microphone (${d.deviceId.slice(0, 5)})`,
            hardware,
          });
        } else if (d.kind === 'audiooutput') {
          const hardware = this.profileHardware(d.label, 'audiooutput');
          newOutputs.push({
            deviceId: d.deviceId,
            groupId: d.groupId,
            kind: d.kind,
            label: d.label || `Speakers / Headphones (${d.deviceId.slice(0, 5)})`,
            hardware,
          });
        }
      }

      this.inputDevices = newInputs;
      this.outputDevices = newOutputs;

      if (this.onDevicesChanged) {
        this.onDevicesChanged(this.inputDevices, this.outputDevices);
      }

      return { inputs: this.inputDevices, outputs: this.outputDevices };
    } catch (e) {
      console.warn('Could not enumerate audio devices:', e);
      return { inputs: this.inputDevices, outputs: this.outputDevices };
    }
  }

  public getInputDevices(): AudioDeviceInfo[] {
    return this.inputDevices;
  }

  public getOutputDevices(): AudioDeviceInfo[] {
    return this.outputDevices;
  }

  private lastAudioCtx: AudioContext | null = null;

  public getSelectedInputId(): string {
    return this.selectedInputId;
  }

  public setSelectedInputId(deviceId: string) {
    this.selectedInputId = deviceId;
    if (this.isDirectMonitoringActive && this.lastAudioCtx) {
      // Re-route direct monitoring stream to new input
      this.startDirectMonitoring(this.lastAudioCtx, this.monitoringVolume);
    }
  }

  public getSelectedOutputId(): string {
    return this.selectedOutputId;
  }

  public async setSelectedOutputId(deviceId: string, audioCtx?: AudioContext): Promise<void> {
    this.selectedOutputId = deviceId;
    if (audioCtx && typeof (audioCtx as any).setSinkId === 'function') {
      try {
        await (audioCtx as any).setSinkId(deviceId === 'default' ? '' : deviceId);
      } catch (e) {
        console.warn('Could not setSinkId on AudioContext:', e);
      }
    }
  }

  /**
   * Direct software/hardware monitoring (Direct Monitor / Hear Yourself)
   * Plays incoming microphone audio directly into headphones with zero perceptible latency.
   */
  public async startDirectMonitoring(audioCtx: AudioContext, volume: number = 0.8): Promise<void> {
    this.stopDirectMonitoring();
    this.lastAudioCtx = audioCtx;
    this.monitoringVolume = volume;

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: this.selectedInputId && this.selectedInputId !== 'default'
            ? { exact: this.selectedInputId }
            : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          ...( { latency: 0 } as any ),
        },
      };

      this.monitoringStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.monitoringSourceNode = audioCtx.createMediaStreamSource(this.monitoringStream);
      this.monitoringGainNode = audioCtx.createGain();
      this.monitoringGainNode.gain.value = volume;

      this.monitoringSourceNode.connect(this.monitoringGainNode);
      this.monitoringGainNode.connect(audioCtx.destination);
      this.isDirectMonitoringActive = true;
    } catch (err) {
      console.error('Failed to start direct monitoring:', err);
      this.isDirectMonitoringActive = false;
    }
  }

  public stopDirectMonitoring(): void {
    if (this.monitoringGainNode) {
      try {
        this.monitoringGainNode.disconnect();
      } catch (e) {}
      this.monitoringGainNode = null;
    }
    if (this.monitoringSourceNode) {
      try {
        this.monitoringSourceNode.disconnect();
      } catch (e) {}
      this.monitoringSourceNode = null;
    }
    if (this.monitoringStream) {
      this.monitoringStream.getTracks().forEach((t) => t.stop());
      this.monitoringStream = null;
    }
    this.isDirectMonitoringActive = false;
  }

  public setMonitoringVolume(vol: number): void {
    this.monitoringVolume = vol;
    if (this.monitoringGainNode) {
      this.monitoringGainNode.gain.value = vol;
    }
  }

  public getIsDirectMonitoringActive(): boolean {
    return this.isDirectMonitoringActive;
  }

  /**
   * Helper to inspect active input hardware for badges
   */
  public getActiveInputHardware(): RecognizedHardware | null {
    const found = this.inputDevices.find((d) => d.deviceId === this.selectedInputId);
    if (found) return found.hardware;
    if (this.inputDevices.length > 0) return this.inputDevices[0].hardware;
    return null;
  }

  /**
   * Helper to inspect active output hardware for badges
   */
  public getActiveOutputHardware(): RecognizedHardware | null {
    const found = this.outputDevices.find((d) => d.deviceId === this.selectedOutputId);
    if (found) return found.hardware;
    if (this.outputDevices.length > 0) return this.outputDevices[0].hardware;
    return null;
  }
}

export const deviceManager = new DeviceManager();
