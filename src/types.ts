export type TrackType =
  | 'backing'
  | 'split-vocals'
  | 'lead-vocals'
  | 'harmony'
  | 'instrument'
  | 'custom';

export type VocalPresetId =
  | 'baritone'
  | 'modern-rap'
  | 'airy-pop'
  | 'smooth-rnb'
  | 'rock-grit'
  | 'lofi-telephone'
  | 'broadcast'
  | 'clean-studio'
  | 'custom';

export type MasterPresetId =
  | 'streaming-punch'
  | 'analog-tape'
  | 'punchy-club'
  | 'bright-pop'
  | 'wide-cinematic'
  | 'acoustic-transparent';

export interface EffectChain {
  lowCut: {
    enabled: boolean;
    freq: number; // Hz (20 - 300)
  };
  eq: {
    enabled: boolean;
    lowGain: number; // dB (-12 to +12)
    lowFreq: number; // Hz
    midGain: number; // dB (-12 to +12)
    midFreq: number; // Hz
    midQ: number; // 0.5 to 5
    highGain: number; // dB (-12 to +12)
    highFreq: number; // Hz
    highAirGain: number; // dB (-12 to +12)
    highAirFreq: number; // Hz
  };
  compressor: {
    enabled: boolean;
    threshold: number; // dB (-60 to 0)
    ratio: number; // 1 to 20
    attack: number; // seconds (0.001 to 0.2)
    release: number; // seconds (0.05 to 1)
    gain: number; // dB makeup (0 to 18)
  };
  saturation: {
    enabled: boolean;
    drive: number; // 0 to 1
    warmth: number; // 0 to 1
  };
  deEsser: {
    enabled: boolean;
    freq: number; // Hz (4000 to 9000)
    reduction: number; // 0 to 1
  };
  chorus: {
    enabled: boolean;
    rate: number; // Hz (0.2 to 5)
    depth: number; // 0 to 1
    mix: number; // 0 to 1
  };
  delay: {
    enabled: boolean;
    time: number; // seconds (0.05 to 1.0)
    feedback: number; // 0 to 0.85
    mix: number; // 0 to 1
  };
  reverb: {
    enabled: boolean;
    decay: number; // seconds (0.4 to 8.0)
    damping: number; // Hz
    mix: number; // 0 to 1
  };
}

export interface MasterChain {
  lowCut30: boolean;
  tapeWarmth: number; // 0 to 1
  busCompThreshold: number; // dB (-40 to 0)
  busCompRatio: number; // 1 to 10
  highAirBoost: number; // dB (0 to 6)
  stereoWidth: number; // 0.5 to 2.0
  ceiling: number; // dB (-3 to -0.1)
}

export interface TrackState {
  id: string;
  name: string;
  slotIndex: number;
  type: TrackType;
  color: string;
  volume: number; // 0 to 1.5, default 1.0 (0 dB)
  pan: number; // -1 to +1, default 0
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  audioBuffer: AudioBuffer | null;
  fileName?: string;
  duration: number;
  vocalPreset: VocalPresetId;
  fxChain: EffectChain;
  peakLevel?: number; // 0 to 1 for VU meters
}

export interface SerializedTrackState {
  id: string;
  name: string;
  slotIndex: number;
  type: TrackType;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  fileName?: string;
  duration: number;
  vocalPreset: VocalPresetId;
  fxChain: EffectChain;
  // Audio channels serialized as arrays for storage
  channelData?: Float32Array[];
  sampleRate?: number;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  name: string;
  timestamp: number;
  notes: string;
  bpm: number;
  masterPreset: MasterPresetId;
  masterChain: MasterChain;
  masterVolume: number;
  tracks: SerializedTrackState[];
}

export interface ProjectFolder {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  activeVersionId?: string;
}

export interface ExportMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  trackNumber: string;
  comment: string;
  format: 'wav' | 'mp3';
  sampleRate: number;
  bitrate?: number; // for mp3
}

export type MobileTab = 'arranger' | 'lyrics' | 'settings';

export type MusicalKey = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type MusicalScale = 'Major' | 'Minor' | 'Chromatic' | 'Blues' | 'Baritone Depth';

export interface AutoPitchConfig {
  enabled: boolean;
  key: MusicalKey;
  scale: MusicalScale;
  speed: number; // 0 (natural) to 100 (hard robotic)
  depth: number; // 0 to 100
  baritoneWarmth: boolean;
}

export interface SecurityConfig {
  encryptionEnabled: boolean;
  passphraseProtection: boolean;
  passphrase?: string;
  cipher: 'AES-GCM-256';
  lastEncrypted?: number;
}

