import React, { useRef, useCallback } from 'react';
import { Magnet, GitBranch, ZoomIn, ZoomOut } from 'lucide-react';

interface MobileRulerProps {
  currentTime: number;
  totalDuration: number;
  bpm: number;
  onSeek: (time: number) => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  zoomLevel: number; // pixels per second (e.g. 50 to 200)
  onChangeZoom?: (zoom: number) => void;
  headerWidth?: number; // left offset for track headers (e.g. 100px or 120px)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds * 10) % 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

export const MobileRuler: React.FC<MobileRulerProps> = ({
  currentTime,
  totalDuration,
  bpm,
  onSeek,
  snapToGrid,
  onToggleSnap,
  zoomLevel,
  headerWidth = 110,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Time in seconds per bar (4/4 time signature)
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * 4;

  // Render bars up to max(totalDuration + 8 bars, 32 bars)
  const effectiveDuration = Math.max(totalDuration + 16, 64);
  const totalBars = Math.ceil(effectiveDuration / secondsPerBar);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!rulerRef.current) return;
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    seekFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    seekFromEvent(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const seekFromEvent = useCallback(
    (e: React.PointerEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      let targetTime = Math.max(0, clickX / zoomLevel);

      if (snapToGrid) {
        // Snap to nearest beat or half beat
        const snapUnit = secondsPerBeat / 2;
        targetTime = Math.round(targetTime / snapUnit) * snapUnit;
      }

      onSeek(Math.max(0, targetTime));
    },
    [zoomLevel, snapToGrid, secondsPerBeat, onSeek]
  );

  const playheadX = currentTime * zoomLevel;

  return (
    <div
      id="bandlab-ruler-bar"
      className="w-full bg-zinc-950 border-b border-zinc-900 select-none flex items-center h-10 shrink-0 relative"
    >
      {/* Left section: Time readout & Tools */}
      <div
        className="flex items-center justify-between px-2.5 bg-black border-r border-zinc-900 shrink-0 h-full z-20"
        style={{ width: `${headerWidth}px` }}
      >
        {/* Monospace time readout (BandLab 00:03.3) */}
        <span className="font-mono text-[13px] font-bold tracking-tight text-white">
          {formatTime(currentTime)}
        </span>

        {/* Snap & Automation tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSnap}
            className={`p-1 rounded transition-colors ${
              snapToGrid ? 'text-cyan-400 bg-cyan-950/50' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Snap to Grid"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right section: Ruler Bar numbers & ticks */}
      <div
        ref={rulerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 h-full relative overflow-hidden cursor-pointer touch-none bg-zinc-950"
      >
        {/* Playhead marker indicator handle in ruler */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none transition-none"
          style={{ left: `${playheadX}px`, transform: 'translateX(-50%)' }}
        >
          {/* White Circular Playhead Bead (BandLab signature) */}
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-lg border border-zinc-400 mx-auto mt-0.5" />
          <div className="w-[2px] h-full bg-white mx-auto" />
        </div>

        {/* Ruler Bar Divisions */}
        <div
          className="h-full relative flex items-end pb-1"
          style={{ width: `${effectiveDuration * zoomLevel}px` }}
        >
          {Array.from({ length: totalBars }).map((_, barIdx) => {
            const barNumber = barIdx + 1;
            const barX = barIdx * secondsPerBar * zoomLevel;

            return (
              <div
                key={barIdx}
                className="absolute top-0 bottom-0 flex flex-col justify-between"
                style={{ left: `${barX}px` }}
              >
                {/* Bar Number label */}
                <span className="text-[10px] font-mono text-zinc-400 font-semibold pl-1 pt-0.5 select-none">
                  {barNumber}
                </span>

                {/* Ticks */}
                <div className="flex items-end h-2 gap-[1px]">
                  <div className="w-[1px] h-3 bg-zinc-600" />
                  {/* Sub ticks */}
                  <div
                    className="w-[1px] h-1.5 bg-zinc-800"
                    style={{ marginLeft: `${(secondsPerBar / 4) * zoomLevel - 2}px` }}
                  />
                  <div
                    className="w-[1px] h-2 bg-zinc-700"
                    style={{ marginLeft: `${(secondsPerBar / 4) * zoomLevel - 2}px` }}
                  />
                  <div
                    className="w-[1px] h-1.5 bg-zinc-800"
                    style={{ marginLeft: `${(secondsPerBar / 4) * zoomLevel - 2}px` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
