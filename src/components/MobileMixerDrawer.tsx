import React from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Mic,
  Music,
  Headphones,
  Radio,
  ChevronDown,
} from 'lucide-react';
import { TrackState, MasterChain } from '../types';

interface MobileMixerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: TrackState[];
  onUpdateTrack: (trackId: string, updates: Partial<TrackState>) => void;
  masterVolume: number;
  onChangeMasterVolume: (vol: number) => void;
  onOpenFxChain: (trackId: string) => void;
  onOpenMasteringSuite: () => void;
}

export const MobileMixerDrawer: React.FC<MobileMixerDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  onUpdateTrack,
  masterVolume,
  onChangeMasterVolume,
  onOpenFxChain,
  onOpenMasteringSuite,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="mobile-mixer-drawer"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-4xl bg-zinc-950 border-t border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-100">
        {/* Drawer Drag Handle & Header */}
        <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Multitrack Console & Channel Strips</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMasteringSuite}
              className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 border border-zinc-700 transition-colors"
            >
              Mastering Suite
            </button>
            <button
              id="close-mixer-drawer-btn"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Strips Horizontal Scroll Container */}
        <div className="p-4 overflow-x-auto overflow-y-hidden flex items-stretch gap-3">
          {/* Individual Track Strips */}
          {tracks.map((track) => {
            const isVocal = track.type.includes('vocal');
            const volPercent = Math.min(100, Math.round((track.volume / 1.5) * 100));

            return (
              <div
                key={track.id}
                className="w-28 sm:w-32 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 flex flex-col justify-between shrink-0 select-none space-y-3"
              >
                {/* Track Top Label */}
                <div className="flex flex-col items-center text-center space-y-1">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
                      isVocal ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isVocal ? <Mic className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-bold text-white truncate w-full">
                    {track.name}
                  </span>
                  <button
                    onClick={() => onOpenFxChain(track.id)}
                    className="text-[10px] text-amber-400 hover:underline font-mono"
                  >
                    +Fx {track.vocalPreset}
                  </button>
                </div>

                {/* Mute & Solo Buttons */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-colors ${
                      track.muted
                        ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => onUpdateTrack(track.id, { soloed: !track.soloed })}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-colors ${
                      track.soloed
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-900/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    S
                  </button>
                </div>

                {/* Pan Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>L</span>
                    <span>{track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}` : `R${Math.round(track.pan * 100)}`}</span>
                    <span>R</span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={track.pan}
                    onChange={(e) => onUpdateTrack(track.id, { pan: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Vertical Decibel Fader & VU Meter */}
                <div className="h-44 flex items-center justify-center gap-3 py-1">
                  {/* Vertical Fader Slider */}
                  <div className="h-full flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.02"
                      value={track.volume}
                      onChange={(e) =>
                        onUpdateTrack(track.id, { volume: parseFloat(e.target.value) })
                      }
                      className="accent-white h-36 -rotate-90 w-36 cursor-pointer"
                    />
                  </div>

                  {/* Dual-color LED Meter Bar */}
                  <div className="w-2.5 h-36 bg-zinc-950 rounded-full overflow-hidden flex flex-col justify-end p-[1px] border border-zinc-800">
                    <div
                      className="w-full rounded-full transition-all duration-75"
                      style={{
                        height: `${track.muted ? 0 : volPercent}%`,
                        backgroundColor:
                          volPercent > 85 ? '#ef4444' : volPercent > 65 ? '#eab308' : '#22c55e',
                      }}
                    />
                  </div>
                </div>

                {/* Volume Readout */}
                <div className="text-center font-mono text-[11px] text-zinc-300 font-medium">
                  {track.muted ? 'MUTED' : `${(track.volume * 100).toFixed(0)}%`}
                </div>
              </div>
            );
          })}

          {/* Master Channel Strip */}
          <div className="w-28 sm:w-32 p-3 rounded-2xl bg-zinc-900 border-2 border-zinc-700/80 flex flex-col justify-between shrink-0 select-none space-y-3">
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md">
                M
              </div>
              <span className="text-xs font-bold text-white truncate w-full">Master Bus</span>
              <button
                onClick={onOpenMasteringSuite}
                className="text-[10px] text-cyan-400 hover:underline font-mono"
              >
                Limiter/Tape
              </button>
            </div>

            <div className="h-6 flex items-center justify-center text-[10px] text-zinc-400 font-mono">
              STEREO OUT
            </div>

            <div className="space-y-1 opacity-0 pointer-events-none">
              <div className="h-4" />
            </div>

            {/* Master Vertical Fader */}
            <div className="h-44 flex items-center justify-center gap-3 py-1">
              <div className="h-full flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.02"
                  value={masterVolume}
                  onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
                  className="accent-amber-400 h-36 -rotate-90 w-36 cursor-pointer"
                />
              </div>

              {/* Dual LED Meter */}
              <div className="w-2.5 h-36 bg-zinc-950 rounded-full overflow-hidden flex flex-col justify-end p-[1px] border border-zinc-800">
                <div
                  className="w-full rounded-full bg-amber-400 transition-all duration-75"
                  style={{ height: `${Math.min(100, Math.round(masterVolume * 70))}%` }}
                />
              </div>
            </div>

            {/* Master Volume Readout */}
            <div className="text-center font-mono text-[11px] text-amber-400 font-bold">
              {Math.round(masterVolume * 100)}%
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
