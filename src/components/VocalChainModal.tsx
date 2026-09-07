import React from 'react';
import {
  X,
  Sparkles,
  Sliders,
  Activity,
  Zap,
  Volume2,
  Waves,
  Clock,
  Radio,
  HelpCircle,
} from 'lucide-react';
import { EffectChain, VocalPresetId } from '../types';
import { VOCAL_PRESETS } from '../audio/vocalPresets';

interface VocalChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackName: string;
  slotIndex: number;
  currentPreset: VocalPresetId;
  onSelectPreset: (preset: VocalPresetId) => void;
  fxChain: EffectChain;
  onChangeFXChain: (chain: EffectChain) => void;
}

export const VocalChainModal: React.FC<VocalChainModalProps> = ({
  isOpen,
  onClose,
  trackName,
  slotIndex,
  currentPreset,
  onSelectPreset,
  fxChain,
  onChangeFXChain,
}) => {
  if (!isOpen) return null;

  const presetInfo = VOCAL_PRESETS[currentPreset];

  const updateLowCut = (freq: number) => {
    onChangeFXChain({
      ...fxChain,
      lowCut: { ...fxChain.lowCut, freq },
    });
  };

  const toggleLowCut = () => {
    onChangeFXChain({
      ...fxChain,
      lowCut: { ...fxChain.lowCut, enabled: !fxChain.lowCut.enabled },
    });
  };

  const updateEq = (key: keyof EffectChain['eq'], value: number | boolean) => {
    onChangeFXChain({
      ...fxChain,
      eq: { ...fxChain.eq, [key]: value },
    });
  };

  const updateComp = (key: keyof EffectChain['compressor'], value: number | boolean) => {
    onChangeFXChain({
      ...fxChain,
      compressor: { ...fxChain.compressor, [key]: value },
    });
  };

  const updateSaturation = (key: keyof EffectChain['saturation'], value: number | boolean) => {
    onChangeFXChain({
      ...fxChain,
      saturation: { ...fxChain.saturation, [key]: value },
    });
  };

  const updateDeEsser = (key: keyof EffectChain['deEsser'], value: number | boolean) => {
    onChangeFXChain({
      ...fxChain,
      deEsser: { ...fxChain.deEsser, [key]: value },
    });
  };

  const updateChorus = (key: keyof EffectChain['chorus'], value: number | boolean) => {
    onChangeFXChain({
      ...fxChain,
      chorus: { ...fxChain.chorus, [key]: value },
    });
  };

  const updateDelay = (key: keyof EffectChain['delay'], value: number | boolean) => {
    onChangeFXChain({
      ...fxChain,
      delay: { ...fxChain.delay, [key]: value },
    });
  };

  const updateReverb = (key: keyof EffectChain['reverb'], value: number | boolean) => {
    onChangeFXChain({
      ...fxChain,
      reverb: { ...fxChain.reverb, [key]: value },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <span>Vocal Chain & Effect Processor</span>
                <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                  Slot {slotIndex}: {trackName}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Live Web Audio DSP: changes apply instantly during playback.
              </p>
            </div>
          </div>

          <button
            id="close-fx-chain-modal"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector Banner */}
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Select Vocal Preset
              </div>
              <select
                id="modal-vocal-preset-select"
                value={currentPreset}
                onChange={(e) => onSelectPreset(e.target.value as VocalPresetId)}
                className="mt-1 bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer font-medium w-full sm:w-64"
              >
                {Object.entries(VOCAL_PRESETS).map(([id, info]) => (
                  <option key={id} value={id}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {presetInfo && (
            <div className="flex-1 bg-neutral-800/60 border border-neutral-700/60 rounded-lg p-2.5 text-xs text-neutral-300 leading-relaxed">
              <span className="font-semibold text-amber-300 block mb-0.5">
                {presetInfo.name} Tuning Profile:
              </span>
              {presetInfo.description}
            </div>
          )}
        </div>

        {/* Scrollable Chain Modules */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Module 1: Low Cut & 4-Band Parametric EQ */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Activity className="w-4 h-4" />
                <span>1. Parametric Vocal EQ & Clean High-Pass</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] text-neutral-400">EQ Active</span>
                <input
                  type="checkbox"
                  checked={fxChain.eq.enabled}
                  onChange={(e) => updateEq('enabled', e.target.checked)}
                  className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Low-Cut Filter */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center text-neutral-300 font-medium">
                  <span>Low-Cut (Rumble)</span>
                  <input
                    type="checkbox"
                    checked={fxChain.lowCut.enabled}
                    onChange={toggleLowCut}
                    className="accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="text-[10px] text-neutral-400">
                  Cut: <span className="text-neutral-200 font-mono">{fxChain.lowCut.freq} Hz</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="250"
                  step="5"
                  value={fxChain.lowCut.freq}
                  onChange={(e) => updateLowCut(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Low Shelf (Baritone Warmth / Chest) */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col justify-between gap-2">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Low Body / Warmth</span>
                  <span className="font-mono text-emerald-400">
                    {fxChain.eq.lowGain > 0 ? `+${fxChain.eq.lowGain}` : fxChain.eq.lowGain} dB
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Freq: <span className="text-neutral-200 font-mono">{fxChain.eq.lowFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={fxChain.eq.lowGain}
                  onChange={(e) => updateEq('lowGain', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Mid Band (Presence / Boxiness scoop) */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col justify-between gap-2">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Mid Clarity Scoop/Boost</span>
                  <span className="font-mono text-emerald-400">
                    {fxChain.eq.midGain > 0 ? `+${fxChain.eq.midGain}` : fxChain.eq.midGain} dB
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Freq: <span className="text-neutral-200 font-mono">{fxChain.eq.midFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={fxChain.eq.midGain}
                  onChange={(e) => updateEq('midGain', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* High Air Shelf */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col justify-between gap-2">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Air / Shimmer</span>
                  <span className="font-mono text-emerald-400">
                    {fxChain.eq.highAirGain > 0
                      ? `+${fxChain.eq.highAirGain}`
                      : fxChain.eq.highAirGain}{' '}
                    dB
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Freq:{' '}
                  <span className="text-neutral-200 font-mono">
                    {fxChain.eq.highAirFreq / 1000} kHz
                  </span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="10"
                  step="0.5"
                  value={fxChain.eq.highAirGain}
                  onChange={(e) => updateEq('highAirGain', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Module 2: Dynamics Compressor & De-Esser */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <Volume2 className="w-4 h-4" />
                <span>2. Studio Compressor & De-Esser Sibilance Tamer</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] text-neutral-400">Comp Active</span>
                <input
                  type="checkbox"
                  checked={fxChain.compressor.enabled}
                  onChange={(e) => updateComp('enabled', e.target.checked)}
                  className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Threshold */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col gap-1.5">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Threshold</span>
                  <span className="font-mono text-cyan-400">
                    {fxChain.compressor.threshold} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="-5"
                  step="1"
                  value={fxChain.compressor.threshold}
                  onChange={(e) => updateComp('threshold', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Ratio */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col gap-1.5">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Ratio</span>
                  <span className="font-mono text-cyan-400">{fxChain.compressor.ratio}:1</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="10"
                  step="0.5"
                  value={fxChain.compressor.ratio}
                  onChange={(e) => updateComp('ratio', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Makeup Gain */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col gap-1.5">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Makeup Gain</span>
                  <span className="font-mono text-cyan-400">+{fxChain.compressor.gain} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={fxChain.compressor.gain}
                  onChange={(e) => updateComp('gain', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* De-Esser */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 flex flex-col gap-1.5">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>De-Esser (Sibilance)</span>
                  <input
                    type="checkbox"
                    checked={fxChain.deEsser.enabled}
                    onChange={(e) => updateDeEsser('enabled', e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>Freq: {fxChain.deEsser.freq} Hz</span>
                  <span>{Math.round(fxChain.deEsser.reduction * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={fxChain.deEsser.reduction}
                  onChange={(e) => updateDeEsser('reduction', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Module 3: Tube Saturation & Stereo Doubler Chorus */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Zap className="w-4 h-4" />
                <span>3. Analog Warmth Saturation & Stereo Doubler</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tape / Tube Warmth */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 space-y-2">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Analog Tube Saturation</span>
                  <input
                    type="checkbox"
                    checked={fxChain.saturation.enabled}
                    onChange={(e) => updateSaturation('enabled', e.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>Drive Amount</span>
                  <span className="font-mono text-amber-400">
                    {Math.round(fxChain.saturation.drive * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={fxChain.saturation.drive}
                  onChange={(e) => updateSaturation('drive', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Stereo Chorus / Doubler */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 space-y-2">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Stereo Vocal Doubler / Chorus</span>
                  <input
                    type="checkbox"
                    checked={fxChain.chorus.enabled}
                    onChange={(e) => updateChorus('enabled', e.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>Stereo Mix</span>
                  <span className="font-mono text-amber-400">
                    {Math.round(fxChain.chorus.mix * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={fxChain.chorus.mix}
                  onChange={(e) => updateChorus('mix', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Module 4: Delay & Reverb Spatial Room */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                <Waves className="w-4 h-4" />
                <span>4. Spatial Echo Delay & Plate Reverb</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Delay */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 space-y-2">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Tempo Delay</span>
                  <input
                    type="checkbox"
                    checked={fxChain.delay.enabled}
                    onChange={(e) => updateDelay('enabled', e.target.checked)}
                    className="accent-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>Time: {Math.round(fxChain.delay.time * 1000)}ms</span>
                  <span>Mix: {Math.round(fxChain.delay.mix * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.7"
                  step="0.05"
                  value={fxChain.delay.mix}
                  onChange={(e) => updateDelay('mix', parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Reverb */}
              <div className="bg-neutral-900 p-3 rounded border border-neutral-800 space-y-2">
                <div className="flex justify-between text-neutral-300 font-medium">
                  <span>Plate / Hall Reverb</span>
                  <input
                    type="checkbox"
                    checked={fxChain.reverb.enabled}
                    onChange={(e) => updateReverb('enabled', e.target.checked)}
                    className="accent-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>Decay: {fxChain.reverb.decay}s</span>
                  <span>Wet Mix: {Math.round(fxChain.reverb.mix * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={fxChain.reverb.mix}
                  onChange={(e) => updateReverb('mix', parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <span className="text-[11px] text-neutral-500">
            Real-time DSP engine actively processes slot {slotIndex}
          </span>
          <button
            id="done-fx-chain-modal"
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
