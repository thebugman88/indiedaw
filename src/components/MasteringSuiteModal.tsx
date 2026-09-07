import React from 'react';
import { X, Sliders, Disc, Sparkles, Shield, Maximize2 } from 'lucide-react';
import { MasterChain, MasterPresetId } from '../types';
import { MASTERING_PRESETS } from '../audio/vocalPresets';

interface MasteringSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterPreset: MasterPresetId;
  onSelectPreset: (preset: MasterPresetId) => void;
  masterChain: MasterChain;
  onChangeMasterChain: (chain: MasterChain) => void;
}

export const MasteringSuiteModal: React.FC<MasteringSuiteModalProps> = ({
  isOpen,
  onClose,
  masterPreset,
  onSelectPreset,
  masterChain,
  onChangeMasterChain,
}) => {
  if (!isOpen) return null;

  const currentPresetInfo = MASTERING_PRESETS[masterPreset];

  const updateChain = <K extends keyof MasterChain>(key: K, value: MasterChain[K]) => {
    onChangeMasterChain({
      ...masterChain,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <span>Mastering Suite & Bus Limiter</span>
                <span className="text-xs font-mono text-amber-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  Master Output Stage
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Final polish stage: glue compression, harmonic tape warmth, and brickwall limiting.
              </p>
            </div>
          </div>

          <button
            id="close-mastering-modal"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector Banner */}
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Mastering Target Profile
              </div>
              <select
                id="master-preset-dropdown-modal"
                value={masterPreset}
                onChange={(e) => onSelectPreset(e.target.value as MasterPresetId)}
                className="mt-1 bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer font-medium w-full sm:w-72"
              >
                {Object.entries(MASTERING_PRESETS).map(([id, info]) => (
                  <option key={id} value={id}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentPresetInfo && (
            <div className="flex-1 bg-neutral-800/60 border border-neutral-700/60 rounded-lg p-2.5 text-xs text-neutral-300 leading-relaxed">
              <span className="font-semibold text-amber-300 block mb-0.5">
                Target Profile Characteristics:
              </span>
              {currentPresetInfo.description}
            </div>
          )}
        </div>

        {/* Controls Grid */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Sub-Bass 30Hz Cut */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-neutral-200 font-medium">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>30Hz Infrasonic Rumble Cut</span>
                </span>
                <input
                  type="checkbox"
                  checked={masterChain.lowCut30}
                  onChange={(e) => updateChain('lowCut30', e.target.checked)}
                  className="accent-emerald-500 cursor-pointer w-4 h-4"
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Removes inaudible DC offset and sub-rumble below 32Hz, giving cleaner headroom for
                the master limiter.
              </p>
            </div>

            {/* 2. Analog Tape Warmth */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-neutral-200 font-medium">
                <span>Analog Tape Saturation Glue</span>
                <span className="font-mono text-amber-400">
                  {Math.round(masterChain.tapeWarmth * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterChain.tapeWarmth}
                onChange={(e) => updateChain('tapeWarmth', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-neutral-400">
                Generates even/odd harmonic warmth to cohesively glue vocals and instruments.
              </p>
            </div>

            {/* 3. Bus Glue Compressor */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3">
              <div className="flex justify-between items-center text-neutral-200 font-medium border-b border-neutral-800 pb-1.5">
                <span>Master Bus Glue Compressor</span>
                <span className="font-mono text-cyan-400">
                  {masterChain.busCompThreshold} dB @ {masterChain.busCompRatio}:1
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Threshold</span>
                  <span>{masterChain.busCompThreshold} dB</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="-5"
                  step="0.5"
                  value={masterChain.busCompThreshold}
                  onChange={(e) => updateChain('busCompThreshold', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Compression Ratio</span>
                  <span>{masterChain.busCompRatio}:1</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="6"
                  step="0.2"
                  value={masterChain.busCompRatio}
                  onChange={(e) => updateChain('busCompRatio', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 4. High Air Lift & Stereo Width */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3">
              <div className="flex justify-between items-center text-neutral-200 font-medium border-b border-neutral-800 pb-1.5">
                <span>High Air & Soundstage Width</span>
                <span className="font-mono text-purple-400">
                  +{masterChain.highAirBoost} dB / {masterChain.stereoWidth}x
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>11kHz Air Shimmer</span>
                  <span>+{masterChain.highAirBoost} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.2"
                  value={masterChain.highAirBoost}
                  onChange={(e) => updateChain('highAirBoost', parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Stereo Width Multiplier</span>
                  <span>{masterChain.stereoWidth}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.05"
                  value={masterChain.stereoWidth}
                  onChange={(e) => updateChain('stereoWidth', parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 5. True-Peak Brickwall Limiter Ceiling */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2 sm:col-span-2">
              <div className="flex justify-between items-center text-neutral-200 font-medium">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span>Brickwall Peak Limiter Output Ceiling</span>
                </span>
                <span className="font-mono text-red-400 font-bold">
                  {masterChain.ceiling} dBTP
                </span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="-0.1"
                step="0.1"
                value={masterChain.ceiling}
                onChange={(e) => updateChain('ceiling', parseFloat(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <p className="text-[11px] text-neutral-400">
                Industry standard ceiling prevents inter-sample clipping on streaming services
                (Spotify, Apple Music, YouTube).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <span className="text-[11px] text-neutral-500">
            Real-time master DSP bus actively drives speaker output
          </span>
          <button
            id="done-mastering-modal"
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
