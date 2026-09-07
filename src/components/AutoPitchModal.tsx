import React from 'react';
import { X, Sliders, Music, Zap, Sparkles, Check } from 'lucide-react';
import { AutoPitchConfig, MusicalKey, MusicalScale } from '../types';

interface AutoPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoPitchConfig;
  onChangeConfig: (config: AutoPitchConfig) => void;
}

const KEYS: MusicalKey[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES: MusicalScale[] = ['Major', 'Minor', 'Chromatic', 'Blues', 'Baritone Depth'];

export const AutoPitchModal: React.FC<AutoPitchModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="autopitch-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              ≋
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                AutoPitch™ Vocal Tuner
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Real-Time
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Pitch correction & harmonic formant alignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Main Power Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <div>
              <div className="text-sm font-medium text-white">Enable AutoPitch™</div>
              <div className="text-xs text-zinc-400">Locks vocal audio to the key of your track</div>
            </div>
            <button
              id="autopitch-power-toggle"
              onClick={() => onChangeConfig({ ...config, enabled: !config.enabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                config.enabled
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/25'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {config.enabled ? 'ACTIVE' : 'BYPASS'}
            </button>
          </div>

          {/* Key Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" /> Musical Key
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => onChangeConfig({ ...config, key: k })}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    config.key === k
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Scale Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SCALES.map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeConfig({ ...config, scale: s })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all text-left truncate ${
                    config.scale === s
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800/80'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Retune Speed (Hard Robotic vs Smooth Natural) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Retune Speed / Snap</span>
              <span className="text-cyan-400 font-mono font-semibold">
                {config.speed < 25 ? 'Natural' : config.speed > 75 ? 'Hard Robot (T-Pain)' : 'Modern'} ({config.speed}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.speed}
              onChange={(e) => onChangeConfig({ ...config, speed: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>Natural Acoustic</span>
              <span>Subtle Pop</span>
              <span>Hard AutoTune</span>
            </div>
          </div>

          {/* Baritone Warmth & Formant Alignment */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Baritone Formant Depth
              </div>
              <p className="text-[11px] text-zinc-400">
                Preserves vocal chest resonance and low-end throat fundamentals
              </p>
            </div>
            <button
              onClick={() =>
                onChangeConfig({ ...config, baritoneWarmth: !config.baritoneWarmth })
              }
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                config.baritoneWarmth
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {config.baritoneWarmth ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Current: <span className="text-white font-medium">{config.key} {config.scale}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
