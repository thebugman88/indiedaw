import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Mic,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  ArrowLeftRight,
} from 'lucide-react';
import { MasterChain, MasterPresetId } from '../types';
import { MASTERING_PRESETS } from '../audio/vocalPresets';
import { formatTime, gainToDb } from '../utils/waveform';

interface TransportBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  isRecording: boolean;
  recordingCountdown: number | null;
  hasArmedTrack: boolean;
  armedTrackName?: string;
  onStartRecord: () => void;
  onStopRecord: () => void;
  // Vocal A/B Comparison
  activeVocalAudition: 'split' | 'new' | 'both' | 'custom';
  onToggleVocalAB: () => void;
  // Master Chain
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  masterPreset: MasterPresetId;
  onMasterPresetChange: (preset: MasterPresetId) => void;
  onOpenMasteringSuite: () => void;
  masterLevel: { left: number; right: number };
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  isRecording,
  recordingCountdown,
  hasArmedTrack,
  armedTrackName,
  onStartRecord,
  onStopRecord,
  activeVocalAudition,
  onToggleVocalAB,
  masterVolume,
  onMasterVolumeChange,
  masterPreset,
  onMasterPresetChange,
  onOpenMasteringSuite,
  masterLevel,
}) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const displayTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
    if (!isScrubbing) setIsScrubbing(true);
  };

  const handleSliderRelease = () => {
    if (isScrubbing) {
      onSeek(scrubValue);
      setIsScrubbing(false);
    }
  };

  return (
    <div className="bg-neutral-950 border-b border-neutral-800 text-neutral-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Playback Controls & Time Display */}
      <div className="flex items-center gap-3">
        {/* Rewind */}
        <button
          id="rewind-button"
          onClick={() => onSeek(0)}
          title="Rewind to start"
          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Play / Pause */}
        <button
          id="play-pause-button"
          onClick={isPlaying ? onPause : onPlay}
          className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-white transition-all shadow-md ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
          }`}
          title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Stop */}
        <button
          id="stop-button"
          onClick={onStop}
          title="Stop & Reset"
          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        {/* Record Arm Button */}
        <button
          id="record-button"
          onClick={isRecording ? onStopRecord : onStartRecord}
          disabled={!hasArmedTrack && !isRecording}
          title={
            isRecording
              ? 'Stop Recording'
              : hasArmedTrack
              ? `Record into armed: ${armedTrackName}`
              : 'Arm a track (click R on track) to record vocals'
          }
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
            isRecording
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 animate-pulse'
              : hasArmedTrack
              ? 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border-red-700/60'
              : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
          }`}
        >
          <Mic className={`w-4 h-4 ${isRecording ? 'animate-bounce' : ''}`} />
          {recordingCountdown !== null ? (
            <span className="font-bold text-yellow-300 animate-pulse text-sm">
              COUNTDOWN: {recordingCountdown}
            </span>
          ) : isRecording ? (
            <span>REC IN PROGRESS</span>
          ) : (
            <span>Record {hasArmedTrack ? `(${armedTrackName})` : ''}</span>
          )}
        </button>

        {/* Time Display */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 flex items-baseline gap-1.5 font-mono">
          <span className="text-emerald-400 font-bold text-sm tracking-wider">
            {formatTime(displayTime)}
          </span>
          <span className="text-neutral-500 text-xs">/</span>
          <span className="text-neutral-400 text-xs">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Interactive Timeline Scrubber */}
      <div className="flex-1 min-w-[200px] max-w-xl mx-2 flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
          <span>TIMELINE SCRUB</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="relative flex items-center">
          <input
            id="timeline-scrubber"
            type="range"
            min="0"
            max={duration > 0 ? duration : 100}
            step="0.05"
            value={displayTime}
            onChange={handleSliderChange}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
          />
        </div>
      </div>

      {/* Vocal A/B Comparison Toggle (Requested Feature) */}
      <div className="flex items-center gap-2">
        <button
          id="vocal-ab-toggle"
          onClick={onToggleVocalAB}
          title="Instantly audition: Toggle between Split Original Vocals and New Lead Vocals to hear which sounds better!"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            activeVocalAudition === 'new'
              ? 'bg-purple-950/80 text-purple-200 border-purple-600 shadow-sm shadow-purple-900/40'
              : activeVocalAudition === 'split'
              ? 'bg-blue-950/80 text-blue-200 border-blue-600 shadow-sm shadow-blue-900/40'
              : 'bg-neutral-900 text-neutral-300 border-neutral-700'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400">
              Vocal A/B Audition
            </div>
            <div className="font-bold">
              {activeVocalAudition === 'split' && 'Auditioning: Split Vocals'}
              {activeVocalAudition === 'new' && 'Auditioning: New Vocals'}
              {activeVocalAudition === 'both' && 'Both Vocals Active'}
              {activeVocalAudition === 'custom' && 'Manual Vocal Mix'}
            </div>
          </div>
        </button>
      </div>

      {/* Master Bus Controls & Preset Selector */}
      <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 rounded-lg px-3 py-1.5">
        {/* Master Preset Selector */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Master Preset
          </span>
          <div className="flex items-center gap-1">
            <select
              id="master-preset-select"
              value={masterPreset}
              onChange={(e) => onMasterPresetChange(e.target.value as MasterPresetId)}
              className="bg-neutral-950 border border-neutral-700 text-neutral-200 text-xs rounded px-2 py-1 focus:outline-none cursor-pointer font-medium max-w-[170px] truncate"
            >
              {Object.entries(MASTERING_PRESETS).map(([id, info]) => (
                <option key={id} value={id} className="bg-neutral-900 text-neutral-100">
                  {info.name}
                </option>
              ))}
            </select>
            <button
              id="mastering-rack-button"
              onClick={onOpenMasteringSuite}
              title="Open Full Mastering Rack"
              className="p-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 rounded border border-neutral-700"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Master Volume & Meter */}
        <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
          <Volume2 className="w-4 h-4 text-neutral-400" />
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
              <span>MASTER</span>
              <span>{gainToDb(masterVolume)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="master-volume-slider"
                type="range"
                min="0"
                max="1.5"
                step="0.01"
                value={masterVolume}
                onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-500"
              />

              {/* Stereo VU Meter */}
              <div className="flex flex-col gap-0.5 w-12">
                {/* Left */}
                <div className="w-full h-1.5 bg-neutral-950 rounded-sm overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full transition-all duration-75 ${
                      masterLevel.left > 0.95
                        ? 'bg-red-500'
                        : masterLevel.left > 0.75
                        ? 'bg-yellow-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${masterLevel.left * 100}%` }}
                  />
                </div>
                {/* Right */}
                <div className="w-full h-1.5 bg-neutral-950 rounded-sm overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full transition-all duration-75 ${
                      masterLevel.right > 0.95
                        ? 'bg-red-500'
                        : masterLevel.right > 0.75
                        ? 'bg-yellow-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${masterLevel.right * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
