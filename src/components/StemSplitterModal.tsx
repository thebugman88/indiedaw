import React, { useRef, useState } from 'react';
import {
  X,
  Scissors,
  Upload,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  CheckCircle,
  FileAudio,
  Layers,
  Music,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Activity,
  Volume2,
  GitCompare,
} from 'lucide-react';
import {
  splitAudioStems,
  generateStudioDemoTrack,
  StemSplitResult,
  StemSplitProgress,
  StemSplitOptions,
} from '../audio/stemSplitter';
import { audioEngine } from '../audio/audioEngine';
import { formatTime } from '../utils/waveform';
import { TrackState } from '../types';
import { IndieBrotherhoodBranding } from './IndieBrotherhoodBranding';

interface StemSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks?: TrackState[];
  onApplyStemsToSlots: (vocalBuffer: AudioBuffer, instrumentalBuffer: AudioBuffer, fileName: string) => void;
}

type SourceType = 'file' | 'project-track' | 'demo';

interface SelectedSource {
  type: SourceType;
  name: string;
  buffer: AudioBuffer | null;
  file?: File;
  duration: number;
}

export const StemSplitterModal: React.FC<StemSplitterModalProps> = ({
  isOpen,
  onClose,
  tracks = [],
  onApplyStemsToSlots,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'upload'>('project');
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState<StemSplitProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [splitResult, setSplitResult] = useState<StemSplitResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Quality & multi-pass settings
  const [passMode, setPassMode] = useState<3 | 1>(3);
  const [vocalSensitivity, setVocalSensitivity] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [bleedRejection, setBleedRejection] = useState<'moderate' | 'high' | 'maximum'>('high');
  const [gateThreshold, setGateThreshold] = useState<'off' | 'gentle' | 'medium' | 'aggressive'>('medium');
  const [showAdvancedTuning, setShowAdvancedTuning] = useState(false);

  // Audio preview playback
  const [previewingStem, setPreviewingStem] = useState<'vocals' | 'inst' | 'both' | 'original' | null>(null);
  const previewSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Stop any active preview sound
  const stopPreview = () => {
    if (previewSourcesRef.current.length > 0) {
      previewSourcesRef.current.forEach((src) => {
        try {
          src.stop();
          src.disconnect();
        } catch (_) {}
      });
      previewSourcesRef.current = [];
    }
    setPreviewingStem(null);
  };

  const handleModalClose = () => {
    stopPreview();
    setErrorMessage(null);
    onClose();
  };

  // Select a track from the active DAW project
  const handleSelectProjectTrack = (track: TrackState) => {
    if (!track.audioBuffer) return;
    stopPreview();
    setErrorMessage(null);
    setSplitResult(null);
    setProgressInfo(null);
    setSelectedSource({
      type: 'project-track',
      name: track.fileName || track.name,
      buffer: track.audioBuffer,
      duration: track.duration || track.audioBuffer.duration,
    });
  };

  // Generate and select built-in demo track
  const handleUseDemoTrack = () => {
    try {
      stopPreview();
      setErrorMessage(null);
      setSplitResult(null);
      setProgressInfo(null);
      const ctx = audioEngine.getAudioContext();
      const demo = generateStudioDemoTrack(ctx, 16);

      // Combine vocal & backing to make a full stereo mix buffer to split
      const sampleRate = ctx.sampleRate;
      const length = demo.backingBuffer.length;
      const combined = ctx.createBuffer(2, length, sampleRate);
      const cL = combined.getChannelData(0);
      const cR = combined.getChannelData(1);
      const bL = demo.backingBuffer.getChannelData(0);
      const bR = demo.backingBuffer.getChannelData(1);
      const vL = demo.vocalBuffer.getChannelData(0);
      const vR = demo.vocalBuffer.getChannelData(1);

      for (let i = 0; i < length; i++) {
        cL[i] = (bL[i] || 0) * 0.7 + (vL[i] || 0) * 0.85;
        cR[i] = (bR[i] || 0) * 0.7 + (vR[i] || 0) * 0.85;
      }

      setSelectedSource({
        type: 'demo',
        name: 'Studio Pop R&B Demo (120 BPM)',
        buffer: combined,
        duration: combined.duration,
      });
    } catch (err: any) {
      setErrorMessage(`Could not load demo track: ${err.message || 'Unknown error'}`);
    }
  };

  // Handle uploaded file safely
  const handleFileSelect = (file: File) => {
    if (!file) return;
    stopPreview();
    setErrorMessage(null);
    setSplitResult(null);
    setProgressInfo(null);

    setSelectedSource({
      type: 'file',
      name: file.name,
      file,
      buffer: null,
      duration: 0,
    });
  };

  // Start the 3-pass stem separation process
  const handleStartSeparation = async () => {
    if (!selectedSource) return;
    stopPreview();
    setErrorMessage(null);
    setIsProcessing(true);
    setProgressInfo({
      pass: 1,
      totalPasses: passMode,
      passName: 'Pass 1 of 3: Harmonic & Stereophonic Scan',
      passProgress: 0,
      totalProgress: 0,
      stageDescription: 'Initializing multi-pass audio buffer...',
    });

    try {
      let bufferToProcess: AudioBuffer;

      if (selectedSource.buffer) {
        bufferToProcess = selectedSource.buffer;
      } else if (selectedSource.file) {
        setProgressInfo({
          pass: 1,
          totalPasses: passMode,
          passName: 'Pass 1 of 3: Decoding Audio File',
          passProgress: 10,
          totalProgress: 5,
          stageDescription: 'Decompressing audio stream at native sample rate...',
        });
        bufferToProcess = await audioEngine.decodeAudioFile(selectedSource.file);
      } else {
        throw new Error('No audio buffer or file selected.');
      }

      const splitOptions: StemSplitOptions = {
        passes: passMode,
        vocalSensitivity,
        bleedRejection,
        gateThreshold,
      };

      const result = await splitAudioStems(
        bufferToProcess,
        (progress) => {
          setProgressInfo(progress);
        },
        splitOptions
      );

      setSplitResult(result);
    } catch (err: any) {
      console.error('Stem split error:', err);
      setErrorMessage(err.message || 'Failed to separate stems. Please try another audio track.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Audition playback of individual stems, sum, or original
  const playPreview = (stem: 'vocals' | 'inst' | 'both' | 'original') => {
    if (!splitResult) return;
    stopPreview();

    try {
      const ctx = audioEngine.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const sources: AudioBufferSourceNode[] = [];

      if (stem === 'original') {
        const oSrc = ctx.createBufferSource();
        oSrc.buffer = splitResult.originalBuffer;
        oSrc.connect(ctx.destination);
        sources.push(oSrc);
      } else {
        if (stem === 'vocals' || stem === 'both') {
          const vSrc = ctx.createBufferSource();
          vSrc.buffer = splitResult.vocalBuffer;
          vSrc.connect(ctx.destination);
          sources.push(vSrc);
        }

        if (stem === 'inst' || stem === 'both') {
          const iSrc = ctx.createBufferSource();
          iSrc.buffer = splitResult.instrumentalBuffer;
          iSrc.connect(ctx.destination);
          sources.push(iSrc);
        }
      }

      sources.forEach((s) => {
        s.onended = () => {
          stopPreview();
        };
        s.start(0);
      });

      previewSourcesRef.current = sources;
      setPreviewingStem(stem);
    } catch (err: any) {
      setErrorMessage(`Audio preview playback failed: ${err.message || 'Playback error'}`);
      stopPreview();
    }
  };

  const handleApplyToDAW = () => {
    if (!splitResult || !selectedSource) return;
    stopPreview();
    onApplyStemsToSlots(splitResult.vocalBuffer, splitResult.instrumentalBuffer, selectedSource.name);
    handleModalClose();
  };

  // Filter project tracks that have recorded or imported audio
  const tracksWithAudio = tracks.filter((t) => Boolean(t.audioBuffer));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 flex items-center justify-center shrink-0">
              <img
                src="/ibh-emblem.svg"
                alt="IBH"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">3-Pass Precision Stem Splitter</h2>
                <span className="text-[10px] uppercase font-mono bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-700/60 hidden xs:inline font-bold">
                  Indie Brotherhood DSP
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Multi-pass phase isolation, vocal formant tuning, and comparison to original mix.
              </p>
            </div>
          </div>

          <button
            id="close-splitter-modal-btn"
            onClick={handleModalClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-xs text-red-300">Splitting issue</p>
                <p className="text-[11px] text-red-200/90">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200 p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                id="splitter-tab-project"
                onClick={() => {
                  setActiveTab('project');
                  setErrorMessage(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'project'
                    ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Project Tracks ({tracksWithAudio.length})</span>
              </button>

              <button
                id="splitter-tab-upload"
                onClick={() => {
                  setActiveTab('upload');
                  setErrorMessage(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Audio File</span>
              </button>
            </div>

            <button
              id="splitter-demo-track-btn"
              onClick={handleUseDemoTrack}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 text-amber-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
              title="Test with built-in Pop/R&B track"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Use Demo Song</span>
            </button>
          </div>

          {/* Tab 1: Project Tracks */}
          {activeTab === 'project' && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-neutral-400 font-medium">
                Choose an audio track from your active arrangement to split:
              </div>

              {tracksWithAudio.length === 0 ? (
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 text-center space-y-3">
                  <Music className="w-8 h-8 text-neutral-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-semibold text-neutral-300">No audio tracks recorded yet</p>
                    <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                      Load an audio file from your device, or test the 3-pass stem splitter immediately with our built-in studio demo song.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      onClick={handleUseDemoTrack}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Studio Demo Song</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Computer File</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                  {tracksWithAudio.map((track) => {
                    const isSelected = selectedSource?.name === (track.fileName || track.name);
                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectProjectTrack(track)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/30'
                            : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              track.type.includes('vocal')
                                ? 'bg-red-950 text-red-400 border border-red-800/60'
                                : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                            }`}
                          >
                            <Music className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-200 truncate">
                              {track.fileName || track.name}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              Duration: {formatTime(track.duration || track.audioBuffer?.duration || 0)} • {track.type}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProjectTrack(track);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select Track'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                id="stem-splitter-file-input"
                type="file"
                ref={fileInputRef}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                  e.target.value = '';
                }}
                accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-950/40'
                    : selectedSource?.type === 'file'
                    ? 'border-emerald-500/70 bg-emerald-950/20'
                    : 'border-neutral-700 hover:border-neutral-500 bg-neutral-950/40'
                }`}
              >
                {selectedSource?.type === 'file' ? (
                  <>
                    <FileAudio className="w-9 h-9 text-emerald-400" />
                    <div>
                      <div className="text-sm font-semibold text-neutral-100">{selectedSource.name}</div>
                      {selectedSource.file && (
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {(selectedSource.file.size / (1024 * 1024)).toFixed(2)} MB • Ready for 3-Pass Analysis
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">Click to choose another audio file</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-9 h-9 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-200">
                        Drop your audio file here or click to browse
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Supports MP3, WAV, FLAC, M4A, AAC, OGG
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Selected Track Status Bar */}
          {selectedSource && (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-mono text-neutral-500 block">Selected Source</span>
                  <span className="text-xs font-bold text-neutral-200 truncate block max-w-xs sm:max-w-md">
                    {selectedSource.name}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60 uppercase">
                {selectedSource.type}
              </span>
            </div>
          )}

          {/* Quality & Pass Mode Selector */}
          {selectedSource && !splitResult && (
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-neutral-200">Separation Quality & Passes</span>
                </div>
                <button
                  onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{showAdvancedTuning ? 'Hide Tuning' : 'Fine-Tune Settings'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPassMode(3)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    passMode === 3
                      ? 'border-emerald-500 bg-emerald-950/30 text-white'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-neutral-200">Studio 3-Pass Deep Analysis</span>
                    {passMode === 3 && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                    Analyzes slower in 3 passes: Phase profiling, vocal gating/bleed reduction, and master residual error comparison to original mix.
                  </p>
                </button>

                <button
                  onClick={() => setPassMode(1)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    passMode === 1
                      ? 'border-indigo-500 bg-indigo-950/30 text-white'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-neutral-200">Fast Draft (1-Pass)</span>
                    {passMode === 1 && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                    Quick single-pass mid-side extraction. Fast processing for instant rough previews.
                  </p>
                </button>
              </div>

              {/* Collapsible Fine-Tuning Drawer */}
              {showAdvancedTuning && (
                <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div>
                    <label className="text-neutral-400 block mb-1">Vocal Formant Focus:</label>
                    <select
                      value={vocalSensitivity}
                      onChange={(e) => setVocalSensitivity(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="balanced">Balanced (Standard)</option>
                      <option value="high">High (Isolate Lead Vowel)</option>
                      <option value="low">Gentle (Avoid Clipping)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Drum Bleed Rejection:</label>
                    <select
                      value={bleedRejection}
                      onChange={(e) => setBleedRejection(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="high">High Rejection (Snare/Kick)</option>
                      <option value="maximum">Maximum (Aggressive Transient Cut)</option>
                      <option value="moderate">Moderate (Smoother Body)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Vocal Silence Gate:</label>
                    <select
                      value={gateThreshold}
                      onChange={(e) => setGateThreshold(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="medium">Medium (-40 dB Expander)</option>
                      <option value="aggressive">Aggressive (Dead Silent Pauses)</option>
                      <option value="gentle">Gentle (-30 dB Soft Fade)</option>
                      <option value="off">Off (Un-gated)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Separation Trigger Button & Live Multi-Pass Progress */}
          {selectedSource && !splitResult && (
            <div className="space-y-3 pt-1">
              <button
                id="start-stem-separation-btn"
                onClick={handleStartSeparation}
                disabled={isProcessing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 text-xs sm:text-sm"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {progressInfo ? progressInfo.passName : 'Processing Multi-Pass Separation...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    <span>
                      Start {passMode === 3 ? 'Deep 3-Pass' : 'Single-Pass'} Vocal & Instrument Separation
                    </span>
                  </>
                )}
              </button>

              {isProcessing && progressInfo && (
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                  {/* 3-Pass Step Indicators */}
                  {passMode === 3 && (
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        className={`p-2 rounded-lg border text-center transition-all ${
                          progressInfo.pass > 1
                            ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-400'
                            : progressInfo.pass === 1
                            ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 animate-pulse'
                            : 'border-neutral-800 bg-neutral-900/40 text-neutral-600'
                        }`}
                      >
                        <div className="text-[10px] font-mono uppercase font-bold">Pass 1</div>
                        <div className="text-[11px] font-medium truncate mt-0.5">Stereo & Transients</div>
                      </div>

                      <div
                        className={`p-2 rounded-lg border text-center transition-all ${
                          progressInfo.pass > 2
                            ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-400'
                            : progressInfo.pass === 2
                            ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 animate-pulse'
                            : 'border-neutral-800 bg-neutral-900/40 text-neutral-600'
                        }`}
                      >
                        <div className="text-[10px] font-mono uppercase font-bold">Pass 2</div>
                        <div className="text-[11px] font-medium truncate mt-0.5">Formants & Bleed Gate</div>
                      </div>

                      <div
                        className={`p-2 rounded-lg border text-center transition-all ${
                          progressInfo.pass === 3 && progressInfo.totalProgress === 100
                            ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-400'
                            : progressInfo.pass === 3
                            ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 animate-pulse'
                            : 'border-neutral-800 bg-neutral-900/40 text-neutral-600'
                        }`}
                      >
                        <div className="text-[10px] font-mono uppercase font-bold">Pass 3</div>
                        <div className="text-[11px] font-medium truncate mt-0.5">Original Comparison</div>
                      </div>
                    </div>
                  )}

                  {/* Active description & total progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-neutral-300 font-mono">
                      <span className="truncate pr-2">{progressInfo.stageDescription}</span>
                      <span className="font-bold text-indigo-400">{progressInfo.totalProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-150"
                        style={{ width: `${progressInfo.totalProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results: Vocal, Instrumental, Comparison with Original, and Audition */}
          {splitResult && (
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>3-Pass Separation & Original Comparison Verified!</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Duration: {formatTime(splitResult.duration)}
                </span>
              </div>

              {/* Original Mix Comparison Card */}
              <div className="bg-neutral-900 border border-emerald-900/50 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-neutral-200">Comparison with Original Mix</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
                    {splitResult.metrics.passesExecuted} Passes Evaluated
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Master Fidelity</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {splitResult.metrics.originalFidelity}%
                    </div>
                    <div className="text-[9px] text-neutral-500">vs original waveform</div>
                  </div>

                  <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Vocal Isolation</div>
                    <div className="text-sm font-bold text-indigo-400 mt-0.5">
                      +{splitResult.metrics.vocalPurityDb} dB
                    </div>
                    <div className="text-[9px] text-neutral-500">center purity ratio</div>
                  </div>

                  <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Residual Floor</div>
                    <div className="text-sm font-bold text-purple-400 mt-0.5">
                      {splitResult.metrics.residualLeakageDb} dB
                    </div>
                    <div className="text-[9px] text-neutral-500">imperceptible error</div>
                  </div>
                </div>

                {/* Instant A/B Comparison Toggle between Original Master and Split Sum */}
                <div className="pt-1 flex items-center justify-between gap-2 border-t border-neutral-800/80">
                  <span className="text-[11px] text-neutral-400">Direct A/B Master Comparison:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      id="audition-original-mix-btn"
                      onClick={() => {
                        if (previewingStem === 'original') stopPreview();
                        else playPreview('original');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors border ${
                        previewingStem === 'original'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {previewingStem === 'original' ? (
                        <Pause className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Original Mix</span>
                    </button>

                    <button
                      id="audition-recombined-btn"
                      onClick={() => {
                        if (previewingStem === 'both') stopPreview();
                        else playPreview('both');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors border ${
                        previewingStem === 'both'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {previewingStem === 'both' ? (
                        <Pause className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Split Sum (Vocal + Beat)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stems Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stem 1: Isolated Vocals */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>Isolated Vocals</span>
                    </span>
                    <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
                      Stem 1
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Formants refined, drum kick/snare bleed suppressed, and silent spaces gated clean.
                  </p>
                  <button
                    id="preview-vocals-btn"
                    onClick={() => {
                      if (previewingStem === 'vocals') stopPreview();
                      else playPreview('vocals');
                    }}
                    className={`w-full py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold border transition-colors ${
                      previewingStem === 'vocals'
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                    }`}
                  >
                    {previewingStem === 'vocals' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Vocal Audition</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Audition Vocals</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Stem 2: Isolated Instruments */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Isolated Beat / Instruments</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                      Stem 2
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    100% low-end bass locked in, punchy drum transients, and wide stereo spatial synths.
                  </p>
                  <button
                    id="preview-inst-btn"
                    onClick={() => {
                      if (previewingStem === 'inst') stopPreview();
                      else playPreview('inst');
                    }}
                    className={`w-full py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold border transition-colors ${
                      previewingStem === 'inst'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                    }`}
                  >
                    {previewingStem === 'inst' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Beat Audition</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Audition Instruments</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Button: Route stems into timeline */}
              <button
                id="apply-stems-daw-btn"
                onClick={handleApplyToDAW}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 text-xs sm:text-sm"
              >
                <Layers className="w-4 h-4" />
                <span>Send Clean Stems to Timeline (Beat to Slot 1, Vocals to Slot 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-500">
          <span>
            Sends Instrumental to <strong>Slot 1</strong> and Vocals to <strong>Slot 2</strong>.
          </span>
          <button
            id="close-splitter-footer-btn"
            onClick={handleModalClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
