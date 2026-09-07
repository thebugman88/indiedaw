import React, { useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  Sliders,
  Upload,
  Trash2,
  Music2,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { TrackState, VocalPresetId } from '../types';
import { VOCAL_PRESETS } from '../audio/vocalPresets';
import { extractWaveformData, formatTime, gainToDb } from '../utils/waveform';

interface TrackSlotProps {
  track: TrackState;
  isSelected: boolean;
  onSelect: () => void;
  onVolumeChange: (vol: number) => void;
  onPanChange: (pan: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onToggleArm: () => void;
  onPresetChange: (preset: VocalPresetId) => void;
  onOpenFXChain: () => void;
  onFileUpload: (file: File) => void;
  onClearAudio: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  livePeak: number;
}

export const TrackSlot: React.FC<TrackSlotProps> = ({
  track,
  isSelected,
  onSelect,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onToggleArm,
  onPresetChange,
  onOpenFXChain,
  onFileUpload,
  onClearAudio,
  currentTime,
  duration,
  onSeek,
  livePeak,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Render waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!track.audioBuffer) {
      // Empty track placeholder background
      ctx.fillStyle = '#171717';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#262626';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const peaks = extractWaveformData(track.audioBuffer, 300);

    // Waveform background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);

    // Center baseline
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw waveform bars
    const barWidth = width / peaks.length;
    const halfHeight = height / 2;

    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i];
      const barHeight = Math.max(2, peak * (halfHeight - 4));
      const x = i * barWidth;

      // Color based on track color
      ctx.fillStyle = track.muted ? '#525252' : track.color;
      ctx.fillRect(x, halfHeight - barHeight, Math.max(1, barWidth - 1), barHeight * 2);
    }
  }, [track.audioBuffer, track.color, track.muted]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!track.audioBuffer || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const playheadPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      id={`track-slot-${track.slotIndex}`}
      onClick={onSelect}
      className={`flex flex-col md:flex-row border-b border-neutral-800 transition-colors select-none ${
        isSelected ? 'bg-neutral-900/90' : 'bg-neutral-950/60 hover:bg-neutral-900/40'
      }`}
    >
      {/* Left Control Panel (BandLab style channel strip) */}
      <div className="w-full md:w-80 p-3 flex flex-col justify-between border-r border-neutral-800/80 gap-2.5 bg-neutral-950/90">
        {/* Top Header: Badge, Name, Slot Index */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: track.color }}
            />
            <span className="text-xs font-bold text-neutral-200 uppercase tracking-wide truncate">
              {track.name}
            </span>
          </div>

          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 shrink-0">
            SLOT {track.slotIndex}
          </span>
        </div>

        {/* Buttons: Mute, Solo, Record Arm, FX Chain */}
        <div className="flex items-center gap-1.5">
          {/* Mute Button */}
          <button
            id={`mute-btn-${track.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            title={track.muted ? 'Unmute Track' : 'Mute Track'}
            className={`flex-1 py-1 rounded text-xs font-bold transition-all border ${
              track.muted
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800'
            }`}
          >
            M
          </button>

          {/* Solo Button */}
          <button
            id={`solo-btn-${track.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSolo();
            }}
            title={track.soloed ? 'Unsolo Track' : 'Solo Track'}
            className={`flex-1 py-1 rounded text-xs font-bold transition-all border ${
              track.soloed
                ? 'bg-yellow-500 text-black border-yellow-400 shadow-sm'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800'
            }`}
          >
            S
          </button>

          {/* Record Arm Button */}
          <button
            id={`arm-btn-${track.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleArm();
            }}
            title={track.armed ? 'Disarm Microphone' : 'Arm Track for Vocal Recording'}
            className={`flex-1 py-1 rounded text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
              track.armed
                ? 'bg-red-600 text-white border-red-500 shadow-sm'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800'
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>R</span>
          </button>

          {/* FX Chain Button */}
          <button
            id={`fx-btn-${track.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenFXChain();
            }}
            title="Open Vocal FX Chain"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-cyan-400 border border-neutral-800 transition-colors"
          >
            <Sliders className="w-3 h-3" />
            <span>FX</span>
          </button>
        </div>

        {/* Vocal Presets Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
            <span>Vocal / FX Preset:</span>
          </label>
          <select
            id={`preset-select-${track.id}`}
            value={track.vocalPreset}
            onChange={(e) => {
              e.stopPropagation();
              onPresetChange(e.target.value as VocalPresetId);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 focus:outline-none cursor-pointer truncate font-medium hover:border-neutral-700"
          >
            {Object.entries(VOCAL_PRESETS).map(([id, info]) => (
              <option key={id} value={id} className="bg-neutral-900 text-neutral-100">
                {info.name}
              </option>
            ))}
          </select>
        </div>

        {/* Volume & Pan Controls + Peak Meter */}
        <div className="flex flex-col gap-2 pt-1 border-t border-neutral-900">
          {/* Volume slider with dB readout and VU meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> VOL
              </span>
              <span>{gainToDb(track.volume)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={`vol-slider-${track.id}`}
                type="range"
                min="0"
                max="1.5"
                step="0.01"
                value={track.volume}
                onChange={(e) => {
                  e.stopPropagation();
                  onVolumeChange(parseFloat(e.target.value));
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-emerald-500"
              />

              {/* VU Peak Meter */}
              <div className="w-10 h-2 bg-neutral-900 rounded-sm overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all duration-75 ${
                    livePeak > 0.9
                      ? 'bg-red-500'
                      : livePeak > 0.7
                      ? 'bg-yellow-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${livePeak * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pan slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
              <span>PAN</span>
              <span>
                {track.pan === 0
                  ? 'C'
                  : track.pan < 0
                  ? `L ${Math.round(Math.abs(track.pan) * 100)}`
                  : `R ${Math.round(track.pan * 100)}`}
              </span>
            </div>
            <input
              id={`pan-slider-${track.id}`}
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={track.pan}
              onChange={(e) => {
                e.stopPropagation();
                onPanChange(parseFloat(e.target.value));
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Audio File Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[11px]">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />

          <button
            id={`upload-btn-${track.id}`}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Upload className="w-3 h-3 text-neutral-500" />
            <span>{track.audioBuffer ? 'Replace Audio' : 'Load Audio'}</span>
          </button>

          {track.audioBuffer && (
            <button
              id={`clear-btn-${track.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onClearAudio();
              }}
              title="Clear audio from slot"
              className="text-neutral-500 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Right Timeline Waveform Area */}
      <div
        className="flex-1 min-h-[140px] relative bg-neutral-950 flex flex-col justify-center cursor-pointer overflow-hidden"
        onClick={handleCanvasClick}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={140}
          className="w-full h-full block"
        />

        {/* Real-time Playhead Line */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none shadow-[0_0_8px_rgba(251,191,36,0.8)] z-10"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="w-2.5 h-2.5 -ml-1 bg-amber-400 rotate-45 border border-amber-200 shadow-md" />
          </div>
        )}

        {/* Empty Track Prompt */}
        {!track.audioBuffer && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none text-neutral-500">
            <Music2 className="w-6 h-6 stroke-[1.5] opacity-60" />
            <p className="text-xs font-medium">Empty Slot — Click 'Load Audio' or Arm (R) to Record</p>
          </div>
        )}

        {/* Track Duration / File Tag */}
        {track.audioBuffer && (
          <div className="absolute bottom-2 right-3 pointer-events-none flex items-center gap-2 text-[10px] font-mono text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800">
            <span>{track.fileName || track.name}</span>
            <span>•</span>
            <span>{formatTime(track.audioBuffer.duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
