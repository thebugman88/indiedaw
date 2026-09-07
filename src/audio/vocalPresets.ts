import { EffectChain, MasterChain, MasterPresetId, VocalPresetId } from '../types';

export const DEFAULT_FX_CHAIN: EffectChain = {
  lowCut: {
    enabled: true,
    freq: 80,
  },
  eq: {
    enabled: true,
    lowGain: 0,
    lowFreq: 200,
    midGain: 0,
    midFreq: 1200,
    midQ: 1.2,
    highGain: 0,
    highFreq: 4500,
    highAirGain: 0,
    highAirFreq: 10500,
  },
  compressor: {
    enabled: true,
    threshold: -16,
    ratio: 3.5,
    attack: 0.015,
    release: 0.12,
    gain: 3,
  },
  saturation: {
    enabled: false,
    drive: 0.2,
    warmth: 0.3,
  },
  deEsser: {
    enabled: true,
    freq: 6800,
    reduction: 0.35,
  },
  chorus: {
    enabled: false,
    rate: 1.2,
    depth: 0.3,
    mix: 0.2,
  },
  delay: {
    enabled: false,
    time: 0.28,
    feedback: 0.25,
    mix: 0.15,
  },
  reverb: {
    enabled: false,
    decay: 1.8,
    damping: 4500,
    mix: 0.18,
  },
};

export const VOCAL_PRESETS: Record<
  VocalPresetId,
  {
    name: string;
    description: string;
    chain: EffectChain;
  }
> = {
  baritone: {
    name: 'Warm Baritone Vocal',
    description:
      'Enhanced warmth for low/baritone voices: removes sub-rumble, boosts 200Hz chest resonance, cuts 480Hz boxiness, lifts 3.4kHz presence, and adds tape saturation & lush space.',
    chain: {
      lowCut: {
        enabled: true,
        freq: 75,
      },
      eq: {
        enabled: true,
        lowGain: 2.8, // Boost warm chest fundamental
        lowFreq: 210,
        midGain: -2.5, // Scoop muddy boxiness
        midFreq: 480,
        midQ: 1.4,
        highGain: 3.2, // Enhance intelligibility
        highFreq: 3400,
        highAirGain: 2.0, // Silky air
        highAirFreq: 11000,
      },
      compressor: {
        enabled: true,
        threshold: -18,
        ratio: 3.8,
        attack: 0.02,
        release: 0.14,
        gain: 4.2,
      },
      saturation: {
        enabled: true,
        drive: 0.22,
        warmth: 0.45,
      },
      deEsser: {
        enabled: true,
        freq: 6500,
        reduction: 0.4,
      },
      chorus: {
        enabled: false,
        rate: 0.8,
        depth: 0.2,
        mix: 0.12,
      },
      delay: {
        enabled: true,
        time: 0.26,
        feedback: 0.22,
        mix: 0.14,
      },
      reverb: {
        enabled: true,
        decay: 2.2,
        damping: 4200,
        mix: 0.2,
      },
    },
  },
  'modern-rap': {
    name: 'Crisp Modern Rap Lead',
    description:
      'In-your-face aggressive punch: fast dynamic compression, sharp presence at 4.2kHz, de-essed sibilance control, and slapback delay.',
    chain: {
      lowCut: {
        enabled: true,
        freq: 95,
      },
      eq: {
        enabled: true,
        lowGain: -1.0,
        lowFreq: 250,
        midGain: 1.5,
        midFreq: 1800,
        midQ: 1.5,
        highGain: 4.5,
        highFreq: 4200,
        highAirGain: 3.0,
        highAirFreq: 12000,
      },
      compressor: {
        enabled: true,
        threshold: -22,
        ratio: 5.5,
        attack: 0.005,
        release: 0.08,
        gain: 6.0,
      },
      saturation: {
        enabled: true,
        drive: 0.35,
        warmth: 0.2,
      },
      deEsser: {
        enabled: true,
        freq: 7200,
        reduction: 0.55,
      },
      chorus: {
        enabled: false,
        rate: 1.5,
        depth: 0.2,
        mix: 0.1,
      },
      delay: {
        enabled: true,
        time: 0.14,
        feedback: 0.18,
        mix: 0.12,
      },
      reverb: {
        enabled: true,
        decay: 1.2,
        damping: 6000,
        mix: 0.12,
      },
    },
  },
  'airy-pop': {
    name: 'Airy Pop Vocals',
    description:
      'Bright modern top-40 sheen with high air boost at 12kHz, vocal doubler shimmer, and lush expansive plate reverb.',
    chain: {
      lowCut: {
        enabled: true,
        freq: 110,
      },
      eq: {
        enabled: true,
        lowGain: -1.5,
        lowFreq: 220,
        midGain: 1.0,
        midFreq: 2400,
        midQ: 1.0,
        highGain: 3.5,
        highFreq: 5000,
        highAirGain: 5.5,
        highAirFreq: 12500,
      },
      compressor: {
        enabled: true,
        threshold: -19,
        ratio: 4.0,
        attack: 0.012,
        release: 0.15,
        gain: 4.5,
      },
      saturation: {
        enabled: true,
        drive: 0.15,
        warmth: 0.25,
      },
      deEsser: {
        enabled: true,
        freq: 6900,
        reduction: 0.45,
      },
      chorus: {
        enabled: true,
        rate: 1.2,
        depth: 0.35,
        mix: 0.22,
      },
      delay: {
        enabled: true,
        time: 0.32,
        feedback: 0.3,
        mix: 0.18,
      },
      reverb: {
        enabled: true,
        decay: 3.2,
        damping: 5500,
        mix: 0.28,
      },
    },
  },
  'smooth-rnb': {
    name: 'Smooth Velvet R&B',
    description:
      'Velvety, intimate low-mids with smooth optical compression, rich vocal chorus, and warm spatial ambience.',
    chain: {
      lowCut: {
        enabled: true,
        freq: 85,
      },
      eq: {
        enabled: true,
        lowGain: 1.8,
        lowFreq: 240,
        midGain: -1.2,
        midFreq: 800,
        midQ: 1.1,
        highGain: 2.2,
        highFreq: 3800,
        highAirGain: 3.0,
        highAirFreq: 10500,
      },
      compressor: {
        enabled: true,
        threshold: -16,
        ratio: 3.0,
        attack: 0.025,
        release: 0.2,
        gain: 3.5,
      },
      saturation: {
        enabled: true,
        drive: 0.18,
        warmth: 0.4,
      },
      deEsser: {
        enabled: true,
        freq: 6600,
        reduction: 0.38,
      },
      chorus: {
        enabled: true,
        rate: 0.9,
        depth: 0.3,
        mix: 0.2,
      },
      delay: {
        enabled: true,
        time: 0.25,
        feedback: 0.25,
        mix: 0.15,
      },
      reverb: {
        enabled: true,
        decay: 2.6,
        damping: 4800,
        mix: 0.24,
      },
    },
  },
  'rock-grit': {
    name: 'Aggressive Rock / Grit',
    description:
      'Punchy analog saturation overdrive with focused mid punch and aggressive forward compression.',
    chain: {
      lowCut: {
        enabled: true,
        freq: 90,
      },
      eq: {
        enabled: true,
        lowGain: 1.0,
        lowFreq: 260,
        midGain: 3.8,
        midFreq: 2600,
        midQ: 1.6,
        highGain: 2.0,
        highFreq: 4500,
        highAirGain: 1.0,
        highAirFreq: 9500,
      },
      compressor: {
        enabled: true,
        threshold: -24,
        ratio: 6.0,
        attack: 0.008,
        release: 0.1,
        gain: 6.5,
      },
      saturation: {
        enabled: true,
        drive: 0.55,
        warmth: 0.5,
      },
      deEsser: {
        enabled: true,
        freq: 6200,
        reduction: 0.4,
      },
      chorus: {
        enabled: false,
        rate: 1.4,
        depth: 0.2,
        mix: 0.15,
      },
      delay: {
        enabled: true,
        time: 0.18,
        feedback: 0.25,
        mix: 0.14,
      },
      reverb: {
        enabled: true,
        decay: 1.6,
        damping: 3800,
        mix: 0.16,
      },
    },
  },
  'lofi-telephone': {
    name: 'Lo-Fi / Vintage Telephone FX',
    description:
      'Bandpass filtered frequency curve (400Hz to 3.8kHz) with tube crunch and vintage ambiance.',
    chain: {
      lowCut: {
        enabled: true,
        freq: 420,
      },
      eq: {
        enabled: true,
        lowGain: -6.0,
        lowFreq: 300,
        midGain: 5.0,
        midFreq: 1600,
        midQ: 2.2,
        highGain: 2.0,
        highFreq: 3200,
        highAirGain: -12.0,
        highAirFreq: 6000,
      },
      compressor: {
        enabled: true,
        threshold: -26,
        ratio: 7.0,
        attack: 0.004,
        release: 0.06,
        gain: 8.0,
      },
      saturation: {
        enabled: true,
        drive: 0.65,
        warmth: 0.7,
      },
      deEsser: {
        enabled: false,
        freq: 6000,
        reduction: 0.2,
      },
      chorus: {
        enabled: false,
        rate: 2.0,
        depth: 0.4,
        mix: 0.25,
      },
      delay: {
        enabled: true,
        time: 0.2,
        feedback: 0.35,
        mix: 0.22,
      },
      reverb: {
        enabled: true,
        decay: 1.4,
        damping: 3000,
        mix: 0.2,
      },
    },
  },
  broadcast: {
    name: 'Broadcast & Podcast Pro',
    description:
      'Clean spoken word clarity with strong level-matching compression, vocal de-essing, and minimal reverb.',
    chain: {
      lowCut: {
        enabled: true,
        freq: 85,
      },
      eq: {
        enabled: true,
        lowGain: 1.5,
        lowFreq: 180,
        midGain: -1.5,
        midFreq: 550,
        midQ: 1.3,
        highGain: 2.8,
        highFreq: 3600,
        highAirGain: 2.2,
        highAirFreq: 10000,
      },
      compressor: {
        enabled: true,
        threshold: -20,
        ratio: 4.5,
        attack: 0.01,
        release: 0.12,
        gain: 5.0,
      },
      saturation: {
        enabled: true,
        drive: 0.1,
        warmth: 0.25,
      },
      deEsser: {
        enabled: true,
        freq: 6700,
        reduction: 0.5,
      },
      chorus: {
        enabled: false,
        rate: 1.0,
        depth: 0.1,
        mix: 0.1,
      },
      delay: {
        enabled: false,
        time: 0.15,
        feedback: 0.1,
        mix: 0.05,
      },
      reverb: {
        enabled: true,
        decay: 0.8,
        damping: 5000,
        mix: 0.08,
      },
    },
  },
  'clean-studio': {
    name: 'Clean Studio Natural',
    description:
      'Neutral, transparent studio leveling with gentle 80Hz rumble cut and transparent dynamics.',
    chain: {
      lowCut: {
        enabled: true,
        freq: 80,
      },
      eq: {
        enabled: true,
        lowGain: 0.5,
        lowFreq: 220,
        midGain: 0,
        midFreq: 1200,
        midQ: 1.0,
        highGain: 1.2,
        highFreq: 4000,
        highAirGain: 1.5,
        highAirFreq: 11000,
      },
      compressor: {
        enabled: true,
        threshold: -14,
        ratio: 2.5,
        attack: 0.02,
        release: 0.18,
        gain: 2.5,
      },
      saturation: {
        enabled: false,
        drive: 0.05,
        warmth: 0.1,
      },
      deEsser: {
        enabled: true,
        freq: 6800,
        reduction: 0.25,
      },
      chorus: {
        enabled: false,
        rate: 1.0,
        depth: 0.2,
        mix: 0.1,
      },
      delay: {
        enabled: false,
        time: 0.25,
        feedback: 0.2,
        mix: 0.1,
      },
      reverb: {
        enabled: true,
        decay: 1.5,
        damping: 5000,
        mix: 0.14,
      },
    },
  },
  custom: {
    name: 'Custom Chain',
    description: 'Customized effects chain.',
    chain: { ...DEFAULT_FX_CHAIN },
  },
};

export const MASTERING_PRESETS: Record<
  MasterPresetId,
  {
    name: string;
    description: string;
    chain: MasterChain;
  }
> = {
  'streaming-punch': {
    name: 'Streaming Loudness (-14 LUFS Clean Punch)',
    description:
      'Balanced for Spotify & Apple Music. 30Hz sub-rumble cut, transparent bus compression, air lift, and -0.3 dBTP ceiling.',
    chain: {
      lowCut30: true,
      tapeWarmth: 0.2,
      busCompThreshold: -14,
      busCompRatio: 2.5,
      highAirBoost: 2.0,
      stereoWidth: 1.15,
      ceiling: -0.3,
    },
  },
  'analog-tape': {
    name: 'Warm Analog Tape Glue',
    description:
      'Simulates vintage magnetic tape saturation with low-end glue, gentle high-frequency softening, and cohesive analog warmth.',
    chain: {
      lowCut30: true,
      tapeWarmth: 0.45,
      busCompThreshold: -16,
      busCompRatio: 3.0,
      highAirBoost: 0.8,
      stereoWidth: 1.08,
      ceiling: -0.4,
    },
  },
  'punchy-club': {
    name: 'Punchy Club & Bass Impact',
    description:
      'Maximum impact for electronic, hip-hop, and dance tracks. Tight sub-bass presence, punchy glue transients, and wide stereo image.',
    chain: {
      lowCut30: true,
      tapeWarmth: 0.25,
      busCompThreshold: -18,
      busCompRatio: 3.8,
      highAirBoost: 3.2,
      stereoWidth: 1.3,
      ceiling: -0.2,
    },
  },
  'bright-pop': {
    name: 'Bright & Crisp Modern Pop Master',
    description:
      'High-energy radio clarity with enhanced top-end shimmer, transparent multiband leveling, and wide stereo presence.',
    chain: {
      lowCut30: true,
      tapeWarmth: 0.15,
      busCompThreshold: -15,
      busCompRatio: 3.0,
      highAirBoost: 4.2,
      stereoWidth: 1.25,
      ceiling: -0.2,
    },
  },
  'wide-cinematic': {
    name: 'Wide Cinematic / Ambient',
    description:
      'Expansive spatial soundstage with deep dynamic range, wide stereo sides, and gentle transparent peak limiting.',
    chain: {
      lowCut30: true,
      tapeWarmth: 0.1,
      busCompThreshold: -11,
      busCompRatio: 2.0,
      highAirBoost: 2.5,
      stereoWidth: 1.45,
      ceiling: -0.5,
    },
  },
  'acoustic-transparent': {
    name: 'Acoustic & Transparent Natural',
    description:
      'Preserves organic dynamics with minimal coloring, pristine high-end clarity, and natural acoustic balance.',
    chain: {
      lowCut30: true,
      tapeWarmth: 0.05,
      busCompThreshold: -9,
      busCompRatio: 1.8,
      highAirBoost: 1.2,
      stereoWidth: 1.05,
      ceiling: -0.5,
    },
  },
};
