import React, { useRef, useMemo } from 'react';
import {
  Mic,
  Music,
  Plus,
  Sliders,
  Volume2,
  VolumeX,
  Headphones,
  FileAudio,
  Sparkles,
  Layers,
  Scissors,
  Upload,
} from 'lucide-react';
import { TrackState, TrackType } from '../types';

interface MobileTimelineProps {
  tracks: TrackState[];
  activeTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onUpdateTrack: (trackId: string, updates: Partial<TrackState>) => void;
  onOpenFxChain: (trackId: string) => void;
  onAddTrack: (type?: TrackType) => void;
  onOpenStemSplitter: () => void;
  onImportAudio: (trackId?: string) => void;
  currentTime: number;
  totalDuration: number;
  zoomLevel: number;
  headerWidth?: number;
  onSeek: (time: number) => void;
  isRecording: boolean;
  recordingTrackId: string | null;
}

/**
 * Extracts normalized peak values from an AudioBuffer for waveform rendering
 */
function extractWaveformPeaks(buffer: AudioBuffer | null, numBars: number = 70): number[] {
  if (
    !buffer ||
    typeof buffer.getChannelData !== 'function' ||
    typeof buffer.length !== 'number' ||
    buffer.length <= 0
  ) {
    return [];
  }
  try {
    const channelData = buffer.getChannelData(0);
    if (!channelData || channelData.length === 0) return [];
    const validBars = Math.min(Math.max(10, Math.floor(isNaN(numBars) ? 70 : numBars)), 250);
    const step = Math.max(1, Math.floor(channelData.length / validBars));
    const peaks: number[] = [];

    for (let i = 0; i < validBars; i++) {
      const start = i * step;
      if (start >= channelData.length) break;
      let max = 0;
      for (let j = 0; j < step; j += 4) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1, Math.max(0.08, max * 1.8)));
    }
    return peaks;
  } catch (_) {
    return [];
  }
}

export const MobileTimeline: React.FC<MobileTimelineProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  onUpdateTrack,
  onOpenFxChain,
  onAddTrack,
  onOpenStemSplitter,
  onImportAudio,
  currentTime,
  totalDuration,
  zoomLevel,
  headerWidth = 110,
  onSeek,
  isRecording,
  recordingTrackId,
}) => {
  const timelineLanesRef = useRef<HTMLDivElement>(null);

  const effectiveDuration = Math.max(totalDuration + 16, 64);
  const playheadX = currentTime * zoomLevel;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineLanesRef.current) return;
    const rect = timelineLanesRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = Math.max(0, clickX / zoomLevel);
    onSeek(seekTime);
  };

  return (
    <div
      id="bandlab-mobile-timeline"
      className="flex-1 w-full bg-black overflow-y-auto overflow-x-hidden relative select-none"
    >
      {/* Container holding track headers and lanes */}
      <div className="flex min-h-full pb-28">
        {/* Left: Fixed Track Headers Column */}
        <div
          className="shrink-0 bg-zinc-950 border-r border-zinc-900 flex flex-col z-20"
          style={{ width: `${headerWidth}px` }}
        >
          {tracks.map((track, idx) => {
            const isSelected = track.id === activeTrackId;
            const isArmedForRec = isRecording && recordingTrackId === track.id;

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`h-24 px-2 py-2 border-b border-zinc-900/90 flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected ? 'bg-zinc-900/90' : 'bg-zinc-950 hover:bg-zinc-900/40'
                }`}
              >
                {/* Top: Icon + Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                      track.type.includes('vocal')
                        ? 'bg-red-600 text-white'
                        : track.type === 'backing'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {track.type.includes('vocal') ? (
                      <Mic className="w-3.5 h-3.5" />
                    ) : (
                      <Music className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-white truncate leading-tight">
                    {track.name}
                  </span>
                </div>

                {/* Middle: Vocal preset / +Fx pill button */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrack(track.id);
                      onOpenFxChain(track.id);
                    }}
                    className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono font-medium border border-zinc-700/80 truncate max-w-full flex items-center gap-1"
                    title="Edit Vocal FX Chain"
                  >
                    <span className="text-amber-400 font-bold">Fx</span>
                    <span className="truncate">
                      {track.vocalPreset === 'custom' ? 'Custom' : track.vocalPreset}
                    </span>
                  </button>
                </div>

                {/* Bottom: Mute & Solo fast buttons for instant A/B comparison */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1">
                    {/* Mute button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack(track.id, { muted: !track.muted });
                      }}
                      className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${
                        track.muted
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                      }`}
                      title={track.muted ? 'Unmute track' : 'Mute track'}
                    >
                      M
                    </button>

                    {/* Solo button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack(track.id, { soloed: !track.soloed });
                      }}
                      className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${
                        track.soloed
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                      }`}
                      title="Solo track"
                    >
                      S
                    </button>
                  </div>

                  {/* Level meter indicator dot */}
                  <div className="flex items-center gap-1">
                    {isArmedForRec && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    )}
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        track.audioBuffer ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Track Button on left footer */}
          <div className="p-2 border-b border-zinc-900 flex justify-center">
            <button
              id="timeline-add-track-btn"
              onClick={() => onAddTrack()}
              className="w-full py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
              title="Add New Audio Track"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Track</span>
            </button>
          </div>
        </div>

        {/* Right: Audio Clip Waveform Lanes */}
        <div
          ref={timelineLanesRef}
          onClick={handleTimelineClick}
          className="flex-1 relative bg-black cursor-pointer overflow-x-auto min-h-full"
        >
          {/* Vertical Playhead Needle slicing through all track lanes */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none transition-none"
            style={{ left: `${playheadX}px`, transform: 'translateX(-50%)' }}
          >
            <div className="w-[2px] h-full bg-white shadow-md shadow-white/20" />
          </div>

          {/* Track Lanes */}
          <div style={{ width: `${effectiveDuration * zoomLevel}px` }}>
            {tracks.map((track) => {
              const isSelected = track.id === activeTrackId;
              const hasAudio = Boolean(track.audioBuffer && typeof track.audioBuffer.getChannelData === 'function');
              const duration = typeof track.duration === 'number' && !isNaN(track.duration) ? Math.max(0, track.duration) : 0;
              const clipWidth = hasAudio ? duration * zoomLevel : 0;
              const safeBars = Math.max(20, Math.floor((isNaN(clipWidth) ? 0 : clipWidth) / 4));
              const peaks = extractWaveformPeaks(track.audioBuffer, safeBars);

              // BandLab-authentic colors:
              // Vocals: Rich Brick Red (#b91c1c / #991b1b)
              // Backing/Others: Electric Blue (#1d4ed8 / #2563eb)
              // Custom: Amber/Purple
              const isVocal = track.type.includes('vocal');
              const clipColorClasses = isVocal
                ? 'bg-red-800/90 border-red-600/90 text-red-100 shadow-lg shadow-red-950/40'
                : track.type === 'backing'
                ? 'bg-blue-800/90 border-blue-600/90 text-blue-100 shadow-lg shadow-blue-950/40'
                : 'bg-emerald-800/90 border-emerald-600/90 text-emerald-100 shadow-lg shadow-emerald-950/40';

              const barColor = isVocal ? '#fca5a5' : track.type === 'backing' ? '#93c5fd' : '#86efac';

              return (
                <div
                  key={track.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTrack(track.id);
                  }}
                  className={`h-24 border-b border-zinc-900 relative p-1 flex items-center transition-colors ${
                    isSelected ? 'bg-zinc-950' : 'bg-black'
                  }`}
                >
                  {/* Subtle Grid Guidelines */}
                  <div className="absolute inset-0 pointer-events-none opacity-10 flex">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="flex-1 border-r border-zinc-500" />
                    ))}
                  </div>

                  {hasAudio ? (
                    /* BandLab-Style Rounded Audio Clip Block with Waveforms */
                    <div
                      className={`h-[78px] rounded-2xl border px-3 py-2 flex flex-col justify-between relative overflow-hidden transition-all select-none ${clipColorClasses}`}
                      style={{ width: `${Math.max(120, clipWidth)}px` }}
                    >
                      {/* Clip Header */}
                      <div className="flex items-center justify-between z-10">
                        <span className="text-[11px] font-bold truncate max-w-[150px]">
                          {track.fileName || track.name}
                        </span>
                        <span className="text-[10px] font-mono opacity-80">
                          {track.duration.toFixed(1)}s
                        </span>
                      </div>

                      {/* Waveform Peaks Canvas/Bars */}
                      <div className="h-9 flex items-center gap-[2px] w-full z-10">
                        {peaks.length > 0 ? (
                          peaks.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="rounded-full flex-1 min-w-[2px]"
                              style={{
                                height: `${Math.round(p * 100)}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          ))
                        ) : (
                          <div className="w-full h-[2px] bg-white/40" />
                        )}
                      </div>

                      {/* Bottom Track Type Tag */}
                      <div className="flex items-center justify-between text-[9px] font-medium opacity-75">
                        <span className="uppercase tracking-wider">{track.type}</span>
                        {track.muted && (
                          <span className="bg-red-950 text-red-300 px-1 rounded">MUTED</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Empty Track Slot placeholder */
                    <div className="h-[76px] w-64 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-3 py-2 flex items-center justify-between text-zinc-500 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-zinc-600" />
                        <span className="text-xs">No audio recorded</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onImportAudio(track.id);
                        }}
                        className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 font-medium border border-zinc-800"
                      >
                        Import
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Button (+🎵) on Bottom-Right (BandLab signature) */}
      <div className="fixed bottom-28 right-4 z-40 flex flex-col gap-2 items-end">
        {/* Stem Splitter Quick Launcher */}
        <button
          id="fab-stem-splitter-btn"
          onClick={onOpenStemSplitter}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-xl shadow-red-900/30 border border-red-400/40 transition-all transform hover:scale-105"
        >
          <Scissors className="w-4 h-4" />
          <span>Split Vocal & Beat</span>
        </button>

        {/* Floating Add Audio Button */}
        <button
          id="fab-add-audio-btn"
          onClick={() => onImportAudio()}
          className="w-13 h-13 rounded-full bg-white hover:bg-zinc-200 text-black shadow-2xl flex items-center justify-center font-bold text-lg transition-transform hover:scale-105"
          title="Import Audio / Add New Track"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
