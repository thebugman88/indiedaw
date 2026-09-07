import React, { useState } from 'react';
import { X, Download, FileAudio, Disc, Music, CheckCircle, Loader2 } from 'lucide-react';
import { ExportMetadata, MasterChain, TrackState } from '../types';
import { IndieBrotherhoodBranding } from './IndieBrotherhoodBranding';
import {
  audioBufferToMp3,
  audioBufferToWav,
  downloadBlob,
  renderMasterMixdown,
} from '../audio/audioExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: TrackState[];
  masterChain: MasterChain;
  masterVolume: number;
  projectName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tracks,
  masterChain,
  masterVolume,
  projectName,
}) => {
  const [metadata, setMetadata] = useState<ExportMetadata>({
    title: projectName || 'Untitled Studio Track',
    artist: 'Indie Brotherhood Artist',
    album: 'Indie Brotherhood Sessions',
    genre: 'Indie / Pop / Vocal',
    year: new Date().getFullYear().toString(),
    trackNumber: '1',
    comment: 'Mixed & Mastered with Indie Brotherhood Studio DAW',
    format: 'wav',
    sampleRate: 44100,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const activeTracks = tracks.filter((t) => !t.muted && t.audioBuffer && t.volume > 0);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTracks.length === 0) {
      alert('Cannot export: No active audio tracks with audio loaded.');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgressText('Rendering multi-track mixdown & mastering DSP bus...');

      // Give UI time to update
      await new Promise((r) => setTimeout(r, 60));

      const renderedBuffer = await renderMasterMixdown(
        tracks.map((t) => ({
          audioBuffer: t.audioBuffer!,
          volume: t.volume,
          pan: t.pan,
          muted: t.muted,
          fxChain: t.fxChain,
        })),
        masterChain,
        masterVolume,
        metadata.sampleRate
      );

      setExportProgressText(`Encoding ${metadata.format.toUpperCase()} with embedded metadata...`);
      await new Promise((r) => setTimeout(r, 60));

      let outputBlob: Blob;
      let extension: string;

      if (metadata.format === 'mp3') {
        outputBlob = audioBufferToMp3(renderedBuffer, 256);
        extension = 'mp3';
      } else {
        outputBlob = audioBufferToWav(renderedBuffer, metadata);
        extension = 'wav';
      }

      const cleanTitle = (metadata.title || 'Studio_Track').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanTitle}.${extension}`;

      downloadBlob(outputBlob, filename);
      setExportComplete(true);
    } catch (err: any) {
      console.error(err);
      alert(`Export error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setExportProgressText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn text-neutral-200">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <IndieBrotherhoodBranding variant="compact" />
            <button
              id="close-export-modal"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/60">
            <Download className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Export Studio Master &amp; ID3 Metadata
              </h3>
              <p className="text-[11px] text-neutral-400">
                Lossless mixdown through DSP vocal chains and master limiter bus.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleExport} className="p-6 space-y-4 text-xs">
          {/* Format selection */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold block uppercase tracking-wider text-[10px]">
              Audio Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  metadata.format === 'wav'
                    ? 'bg-emerald-950/50 border-emerald-500/80 text-emerald-200'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="wav"
                  checked={metadata.format === 'wav'}
                  onChange={() => setMetadata({ ...metadata, format: 'wav' })}
                  className="accent-emerald-500"
                />
                <div>
                  <div className="font-bold text-xs">Lossless WAV</div>
                  <div className="text-[10px] text-neutral-400">16-bit PCM • Broadcast Quality</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  metadata.format === 'mp3'
                    ? 'bg-emerald-950/50 border-emerald-500/80 text-emerald-200'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="mp3"
                  checked={metadata.format === 'mp3'}
                  onChange={() => setMetadata({ ...metadata, format: 'mp3' })}
                  className="accent-emerald-500"
                />
                <div>
                  <div className="font-bold text-xs">High-Quality MP3</div>
                  <div className="text-[10px] text-neutral-400">256 kbps • Compact & Streaming</div>
                </div>
              </label>
            </div>
          </div>

          {/* Metadata Fields */}
          <div className="border-t border-neutral-800 pt-3 space-y-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Audio File Metadata (ID3 / RIFF Tagging)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Track Title</label>
                <input
                  type="text"
                  id="metadata-title-input"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Artist / Performer</label>
                <input
                  type="text"
                  id="metadata-artist-input"
                  value={metadata.artist}
                  onChange={(e) => setMetadata({ ...metadata, artist: e.target.value })}
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Album / Project</label>
                <input
                  type="text"
                  id="metadata-album-input"
                  value={metadata.album}
                  onChange={(e) => setMetadata({ ...metadata, album: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Genre</label>
                <input
                  type="text"
                  id="metadata-genre-input"
                  value={metadata.genre}
                  onChange={(e) => setMetadata({ ...metadata, genre: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Release Year</label>
                <input
                  type="text"
                  id="metadata-year-input"
                  value={metadata.year}
                  onChange={(e) => setMetadata({ ...metadata, year: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Track Number</label>
                <input
                  type="text"
                  id="metadata-trackno-input"
                  value={metadata.trackNumber}
                  onChange={(e) => setMetadata({ ...metadata, trackNumber: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px]">ISRC / Copyright / Notes</label>
              <input
                type="text"
                id="metadata-comment-input"
                value={metadata.comment}
                onChange={(e) => setMetadata({ ...metadata, comment: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Active Tracks Summary */}
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>
              Active Tracks to mix: <strong className="text-neutral-200">{activeTracks.length}</strong>
            </span>
            <span className="font-mono text-emerald-400">Master Level: 100%</span>
          </div>

          {/* Progress / Status */}
          {isExporting && (
            <div className="flex items-center gap-2 p-3 bg-neutral-950 rounded-lg border border-emerald-800/60 text-emerald-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{exportProgressText}</span>
            </div>
          )}

          {exportComplete && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 rounded-lg border border-emerald-700 text-emerald-300 text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>Export finished! Check your downloads folder for your mastered audio file.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              id="confirm-export-btn"
              disabled={isExporting || activeTracks.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Render & Download {metadata.format.toUpperCase()}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
