import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Play,
  Pause,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Type,
} from 'lucide-react';

interface LyricsViewProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
}

const DEFAULT_LYRICS = `[Verse 1]
Walking through the city late at night
Hear the echoes of the neon light
Frequencies alive in stereo sound
Got my headphones on and leaving the ground

[Chorus]
Feel the baseline hit the chest
Studio vibes, forget the rest
Baritone warmth in the vocal lead
This is the only rhythm that I need

[Verse 2]
Layering the harmony so tight
Split the stems until the groove feels right
Focus on the music, turn it loud
Standing tall above the wandering crowd

[Chorus]
Feel the baseline hit the chest
Studio vibes, forget the rest
Baritone warmth in the vocal lead
This is the only rhythm that I need`;

export const LyricsView: React.FC<LyricsViewProps> = ({
  isPlaying,
  isRecording,
  currentTime,
}) => {
  const [lyricsText, setLyricsText] = useState(() => {
    return localStorage.getItem('studio_daw_lyrics_draft') || DEFAULT_LYRICS;
  });
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [teleprompterActive, setTeleprompterActive] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('studio_daw_lyrics_draft', lyricsText);
  }, [lyricsText]);

  // Auto-scroll teleprompter while playing/recording
  useEffect(() => {
    if ((isPlaying || isRecording) && teleprompterActive && containerRef.current) {
      // Scroll proportionally to song duration (approx 6-8 pixels per second)
      containerRef.current.scrollTop = currentTime * 8;
    }
  }, [currentTime, isPlaying, isRecording, teleprompterActive]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lyricsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const insertSection = (tag: string) => {
    setLyricsText((prev) => `${prev}\n\n[${tag}]\n`);
  };

  return (
    <div
      id="bandlab-lyrics-view"
      className="flex-1 w-full bg-black flex flex-col overflow-hidden select-none pb-28"
    >
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold text-white">Lyrics & Vocal Notebook</span>
          {(isPlaying || isRecording) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse">
              Teleprompter Sync Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Section Quick Tags */}
          <button
            onClick={() => insertSection('Verse')}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-300 border border-zinc-800"
          >
            +Verse
          </button>
          <button
            onClick={() => insertSection('Chorus')}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-amber-300 border border-zinc-800"
          >
            +Chorus
          </button>
          <button
            onClick={() => insertSection('Bridge')}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-cyan-300 border border-zinc-800"
          >
            +Bridge
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Copy Lyrics"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor & Teleprompter Canvas */}
      <div
        ref={containerRef}
        className="flex-1 p-5 overflow-y-auto max-w-2xl mx-auto w-full flex flex-col scroll-smooth"
      >
        <textarea
          value={lyricsText}
          onChange={(e) => setLyricsText(e.target.value)}
          placeholder="Write or paste your song lyrics here... Read them live as you record your vocals!"
          className={`w-full flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed font-sans ${
            fontSize === 'lg' ? 'text-lg' : fontSize === 'sm' ? 'text-sm' : 'text-base'
          }`}
          rows={22}
        />
      </div>
    </div>
  );
};
