import React from 'react';
import {
  Mic,
  Headphones,
  Sliders,
  Undo2,
  Redo2,
  SkipBack,
  Play,
  Pause,
  Circle,
  Radio,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { AutoPitchConfig, TrackState } from '../types';
import { deviceManager, RecognizedHardware } from '../audio/deviceManager';

interface MobileBottomBarProps {
  activeTrack: TrackState | null;
  isPlaying: boolean;
  isRecording: boolean;
  onTogglePlay: () => void;
  onToggleRecord: () => void;
  onRewind: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  bpm: number;
  metronomeActive: boolean;
  onToggleMetronome: () => void;
  onOpenMixer: () => void;
  onOpenFxChain: () => void;
  onOpenAutoPitch: () => void;
  onOpenHardwareModal: () => void;
  autoPitchConfig: AutoPitchConfig;
  isDirectMonitoring: boolean;
  onToggleDirectMonitoring: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeTrack,
  isPlaying,
  isRecording,
  onTogglePlay,
  onToggleRecord,
  onRewind,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  bpm,
  metronomeActive,
  onToggleMetronome,
  onOpenMixer,
  onOpenFxChain,
  onOpenAutoPitch,
  onOpenHardwareModal,
  autoPitchConfig,
  isDirectMonitoring,
  onToggleDirectMonitoring,
}) => {
  const activeInputHw = deviceManager.getActiveInputHardware();
  const activeOutputHw = deviceManager.getActiveOutputHardware();

  return (
    <div
      id="bandlab-bottom-container"
      className="fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-black border-t border-zinc-900 select-none shadow-2xl"
    >
      {/* 1. BandLab Quick Action Strip (directly above transport) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/95 border-b border-zinc-900 text-xs overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Audio Input Device / Hardware Recognition Button */}
          <button
            id="quick-audio-device-btn"
            onClick={onOpenHardwareModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
              activeInputHw?.brand === 'Focusrite'
                ? 'bg-red-950/80 text-red-200 border-red-700/80'
                : activeOutputHw?.brand === 'Corsair'
                ? 'bg-amber-950/80 text-amber-200 border-amber-700/80'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
            title="Audio Hardware Interfaces (Focusrite Scarlett, Corsair, etc.)"
          >
            <Mic className="w-3.5 h-3.5 text-red-400" />
            <span className="truncate max-w-[130px]">
              {activeInputHw ? activeInputHw.model : 'Audio Input'}
            </span>
          </button>

          {/* FX Preset Pill Selector */}
          <button
            id="quick-fx-preset-btn"
            onClick={onOpenFxChain}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium transition-colors shrink-0"
            title="Vocal FX Preset & Chain"
          >
            <span className="text-amber-400 font-bold">Fx</span>
            <span className="truncate max-w-[100px]">
              {activeTrack?.vocalPreset === 'custom'
                ? 'Custom FX'
                : activeTrack?.vocalPreset || 'Presets'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* AutoPitch™ Button */}
          <button
            id="quick-autopitch-btn"
            onClick={onOpenAutoPitch}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
              autoPitchConfig.enabled
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-900/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="AutoPitch™ Vocal Tuning"
          >
            <span>≋</span>
            <span>AutoPitch</span>
            {autoPitchConfig.enabled && (
              <span className="text-[9px] px-1 rounded bg-cyan-800 text-white font-mono">
                {autoPitchConfig.key}
              </span>
            )}
          </button>

          {/* Direct Hardware / Headphone Monitoring Toggle */}
          <button
            id="quick-monitoring-toggle-btn"
            onClick={onToggleDirectMonitoring}
            className={`p-1.5 rounded-full transition-all border ${
              isDirectMonitoring
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/25'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title={
              isDirectMonitoring
                ? 'Direct Monitoring ON (Hear yourself)'
                : 'Direct Monitoring OFF'
            }
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. BandLab Bottom Transport Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black h-16">
        {/* Left: Mixer Faders Button */}
        <div className="flex items-center gap-3">
          <button
            id="transport-mixer-drawer-btn"
            onClick={onOpenMixer}
            className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Open Track Mixer & Faders"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Mixer</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-lg hover:bg-zinc-900 disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-lg hover:bg-zinc-900 disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Rewind, Record, Play Transport Controls */}
        <div className="flex items-center gap-3">
          {/* Rewind to start */}
          <button
            id="transport-rewind-btn"
            onClick={onRewind}
            className="p-2.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            title="Rewind to 00:00"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Prominent Red Record Button (BandLab signature) */}
          <button
            id="transport-record-btn"
            onClick={onToggleRecord}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-600 ring-4 ring-red-500/50 animate-pulse text-white shadow-xl shadow-red-600/50'
                : 'bg-zinc-900 border-2 border-red-500/80 hover:bg-red-950 text-red-500'
            }`}
            title={isRecording ? 'Stop Recording' : 'Record Vocals / Instruments'}
          >
            {isRecording ? (
              <div className="w-4 h-4 rounded-sm bg-white" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-red-500" />
            )}
          </button>

          {/* Play / Pause Circular Button */}
          <button
            id="transport-play-btn"
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black stroke-none" />
            ) : (
              <Play className="w-5 h-5 fill-black stroke-none ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Metronome / Tempo */}
        <div className="flex items-center gap-2">
          <button
            id="transport-metronome-btn"
            onClick={onToggleMetronome}
            className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              metronomeActive
                ? 'bg-cyan-950 text-cyan-400 border-cyan-500/80 shadow-md shadow-cyan-900/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Toggle Metronome & Tempo"
          >
            <span>{bpm}</span>
            <span className="text-[10px] text-zinc-500 font-sans">BPM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
