import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AutoPitchConfig,
  EffectChain,
  MasterChain,
  MasterPresetId,
  MobileTab,
  ProjectFolder,
  ProjectVersion,
  SecurityConfig,
  TrackState,
  TrackType,
  VocalPresetId,
} from './types';
import { MASTERING_PRESETS, VOCAL_PRESETS } from './audio/vocalPresets';
import { audioEngine } from './audio/audioEngine';
import { deviceManager } from './audio/deviceManager';
import { generateStudioDemoTrack } from './audio/stemSplitter';
import {
  audioBufferToDataArray,
  dataArrayToAudioBuffer,
  deleteProjectVersion,
  getProjects,
  getProjectVersions,
  saveProject,
  saveProjectVersion,
} from './db/projectStorage';

// BandLab-style Components
import { MobileTopBar } from './components/MobileTopBar';
import { MobileRuler } from './components/MobileRuler';
import { MobileTimeline } from './components/MobileTimeline';
import { MobileBottomBar } from './components/MobileBottomBar';
import { MobileMixerDrawer } from './components/MobileMixerDrawer';
import { LyricsView } from './components/LyricsView';
import { SettingsView } from './components/SettingsView';

// Modals
import { AudioDeviceModal } from './components/AudioDeviceModal';
import { AutoPitchModal } from './components/AutoPitchModal';
import { SecurityModal } from './components/SecurityModal';
import { VocalChainModal } from './components/VocalChainModal';
import { MasteringSuiteModal } from './components/MasteringSuiteModal';
import { StemSplitterModal } from './components/StemSplitterModal';
import { SaveVersionModal } from './components/SaveVersionModal';
import { VersionHistoryDrawer } from './components/VersionHistoryDrawer';
import { ExportModal } from './components/ExportModal';

const INITIAL_TRACKS: TrackState[] = [
  {
    id: 'slot-1',
    name: 'Split Instrumental / Beat',
    slotIndex: 1,
    type: 'backing',
    color: '#2563eb', // Vibrant Blue
    volume: 1.0,
    pan: 0,
    muted: false,
    soloed: false,
    armed: false,
    audioBuffer: null,
    duration: 0,
    vocalPreset: 'clean-studio',
    fxChain: JSON.parse(JSON.stringify(VOCAL_PRESETS['clean-studio'].chain)),
  },
  {
    id: 'slot-2',
    name: 'Split Original Vocals',
    slotIndex: 2,
    type: 'split-vocals',
    color: '#dc2626', // Brick Red
    volume: 1.0,
    pan: 0,
    muted: false,
    soloed: false,
    armed: false,
    audioBuffer: null,
    duration: 0,
    vocalPreset: 'clean-studio',
    fxChain: JSON.parse(JSON.stringify(VOCAL_PRESETS['clean-studio'].chain)),
  },
  {
    id: 'slot-3',
    name: 'Lead Vocals (New Layer)',
    slotIndex: 3,
    type: 'lead-vocals',
    color: '#b91c1c', // Deep Brick Red
    volume: 1.0,
    pan: 0,
    muted: false,
    soloed: false,
    armed: true, // Armed for instant recording
    audioBuffer: null,
    duration: 0,
    vocalPreset: 'baritone', // Warm Baritone Vocal preset by default!
    fxChain: JSON.parse(JSON.stringify(VOCAL_PRESETS['baritone'].chain)),
  },
  {
    id: 'slot-4',
    name: 'Vocal Doubles / Harmony',
    slotIndex: 4,
    type: 'harmony',
    color: '#9333ea', // Purple
    volume: 0.85,
    pan: -0.2,
    muted: false,
    soloed: false,
    armed: false,
    audioBuffer: null,
    duration: 0,
    vocalPreset: 'airy-pop',
    fxChain: JSON.parse(JSON.stringify(VOCAL_PRESETS['airy-pop'].chain)),
  },
  {
    id: 'slot-5',
    name: 'Extra Instruments / Synth',
    slotIndex: 5,
    type: 'instrument',
    color: '#059669', // Emerald
    volume: 0.95,
    pan: 0.2,
    muted: false,
    soloed: false,
    armed: false,
    audioBuffer: null,
    duration: 0,
    vocalPreset: 'clean-studio',
    fxChain: JSON.parse(JSON.stringify(VOCAL_PRESETS['clean-studio'].chain)),
  },
];

export default function App() {
  // Mobile Top Tab: Arranger | Lyrics | Settings
  const [activeTab, setActiveTab] = useState<MobileTab>('arranger');

  // Project state
  const [projects, setProjects] = useState<ProjectFolder[]>([
    {
      id: 'default-project',
      name: 'Studio Session 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);
  const [currentProject, setCurrentProject] = useState<ProjectFolder>({
    id: 'default-project',
    name: 'Studio Session 1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const [versions, setVersions] = useState<ProjectVersion[]>([]);

  // DAW Tracks
  const [tracks, setTracks] = useState<TrackState[]>(INITIAL_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('slot-3');

  // Undo / Redo history stack
  const [undoStack, setUndoStack] = useState<TrackState[][]>([]);
  const [redoStack, setRedoStack] = useState<TrackState[][]>([]);

  // Master bus settings
  const [masterVolume, setMasterVolume] = useState<number>(1.0);
  const [masterPreset, setMasterPreset] = useState<MasterPresetId>('streaming-punch');
  const [masterChain, setMasterChain] = useState<MasterChain>(
    JSON.parse(JSON.stringify(MASTERING_PRESETS['streaming-punch'].chain))
  );

  // Playback transport state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(65); // pixels per second

  // Microphone recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState<number | null>(null);

  // Hardware & Direct Monitoring
  const [isDirectMonitoring, setIsDirectMonitoring] = useState(false);

  // AutoPitch Vocal Tuning
  const [autoPitchConfig, setAutoPitchConfig] = useState<AutoPitchConfig>({
    enabled: true,
    key: 'C',
    scale: 'Minor',
    speed: 70,
    depth: 85,
    baritoneWarmth: true,
  });

  // Data Security & AES-256 Encryption
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    encryptionEnabled: true,
    passphraseProtection: false,
    cipher: 'AES-GCM-256',
    lastEncrypted: Date.now(),
  });

  // Modals & Drawers
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isAutoPitchModalOpen, setIsAutoPitchModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isMixerDrawerOpen, setIsMixerDrawerOpen] = useState(false);
  const [isFXModalOpen, setIsFXModalOpen] = useState(false);
  const [isMasteringModalOpen, setIsMasteringModalOpen] = useState(false);
  const [isSplitterModalOpen, setIsSplitterModalOpen] = useState(false);
  const [isSaveVersionModalOpen, setIsSaveVersionModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Hidden audio file input ref
  const importTargetTrackIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to push history
  const pushHistory = useCallback((current: TrackState[]) => {
    const cloned: TrackState[] = current.map((t) => ({
      ...t,
      audioBuffer: t.audioBuffer,
      fxChain: JSON.parse(JSON.stringify(t.fxChain)),
    }));
    setUndoStack((prev) => [...prev.slice(-25), cloned]);
    setRedoStack([]);
  }, []);

  // Initialize DB and audio hardware on first render
  useEffect(() => {
    async function initDB() {
      try {
        const storedProjects = await getProjects();
        if (storedProjects.length > 0) {
          setProjects(storedProjects);
          setCurrentProject(storedProjects[0]);
          const vers = await getProjectVersions(storedProjects[0].id, securityConfig.passphrase);
          setVersions(vers);
        } else {
          const initialProj: ProjectFolder = {
            id: 'proj-' + Date.now(),
            name: 'Studio Session 1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await saveProject(initialProj);
          setProjects([initialProj]);
          setCurrentProject(initialProj);
        }
      } catch (err) {
        console.error('Error loading projects from DB:', err);
      }
    }
    initDB();

    // Auto-detect audio hardware (Focusrite Scarlett, Corsair Headsets, etc.)
    deviceManager.refreshDevices();

    // Register tracks with Web Audio engine
    tracks.forEach((t) => {
      audioEngine.registerTrack(t.id);
      audioEngine.setTrackVolume(t.id, t.volume);
      audioEngine.setTrackPan(t.id, t.pan);
      audioEngine.setTrackMute(t.id, t.muted);
      audioEngine.setTrackFX(t.id, t.fxChain);
    });

    audioEngine.setMasterChain(masterChain);
    audioEngine.setMasterVolume(masterVolume);

    audioEngine.onTimeUpdate = (time) => {
      setCurrentTime(time);
      setDuration(audioEngine.getMaxDuration());
    };

    audioEngine.onPlayStateChange = (playing) => {
      setIsPlaying(playing);
    };
  }, []);

  // Load versions when currentProject changes
  useEffect(() => {
    async function loadVers() {
      try {
        const vers = await getProjectVersions(currentProject.id, securityConfig.passphrase);
        setVersions(vers);
      } catch (err) {
        console.error(err);
      }
    }
    loadVers();
  }, [currentProject.id, securityConfig.passphrase]);

  // Metronome click loop
  useEffect(() => {
    if (!isPlaying || !metronomeActive) return;
    const intervalMs = (60 / bpm) * 1000;
    let beat = 0;

    const interval = setInterval(() => {
      try {
        const ctx = audioEngine.getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = beat % 4 === 0 ? 1200 : 850;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
        beat++;
      } catch (e) {}
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, metronomeActive, bpm]);

  // Keyboard shortcut for Spacebar play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          audioEngine.pause();
        } else {
          audioEngine.play();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Track state updates
  const handleUpdateTrack = (trackId: string, updates: Partial<TrackState>) => {
    pushHistory(tracks);
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const updated = { ...t, ...updates };
          if (updates.volume !== undefined) audioEngine.setTrackVolume(trackId, updates.volume);
          if (updates.pan !== undefined) audioEngine.setTrackPan(trackId, updates.pan);
          if (updates.muted !== undefined) audioEngine.setTrackMute(trackId, updates.muted);
          if (updates.fxChain !== undefined) audioEngine.setTrackFX(trackId, updates.fxChain);
          return updated;
        }
        return t;
      })
    );
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(tracks))]);
    setUndoStack((prev) => prev.slice(0, -1));

    setTracks(previous);
    previous.forEach((t) => {
      audioEngine.setTrackVolume(t.id, t.volume);
      audioEngine.setTrackPan(t.id, t.pan);
      audioEngine.setTrackMute(t.id, t.muted);
      audioEngine.setTrackFX(t.id, t.fxChain);
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const clonedTracks: TrackState[] = tracks.map((t) => ({
      ...t,
      audioBuffer: t.audioBuffer,
      fxChain: JSON.parse(JSON.stringify(t.fxChain)),
    }));
    setUndoStack((prev) => [...prev, clonedTracks]);
    setRedoStack((prev) => prev.slice(0, -1));

    setTracks(next);
    next.forEach((t) => {
      audioEngine.setTrackVolume(t.id, t.volume);
      audioEngine.setTrackPan(t.id, t.pan);
      audioEngine.setTrackMute(t.id, t.muted);
      audioEngine.setTrackFX(t.id, t.fxChain);
    });
  };

  // Add a new track
  const handleAddTrack = (type: TrackType = 'lead-vocals') => {
    const slotIdx = tracks.length + 1;
    const newId = `slot-${Date.now()}`;
    const newTrack: TrackState = {
      id: newId,
      name: `Track ${slotIdx} (${type === 'lead-vocals' ? 'Vocals' : 'Instrument'})`,
      slotIndex: slotIdx,
      type,
      color: type === 'lead-vocals' ? '#b91c1c' : '#2563eb',
      volume: 1.0,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      audioBuffer: null,
      duration: 0,
      vocalPreset: 'baritone',
      fxChain: JSON.parse(JSON.stringify(VOCAL_PRESETS['baritone'].chain)),
    };

    audioEngine.registerTrack(newId);
    audioEngine.setTrackVolume(newId, 1.0);
    audioEngine.setTrackFX(newId, newTrack.fxChain);

    pushHistory(tracks);
    setTracks((prev) => [...prev, newTrack]);
    setSelectedTrackId(newId);
  };

  // Trigger audio file import
  const triggerAudioImport = (trackId?: string) => {
    importTargetTrackIdRef.current = trackId || selectedTrackId || null;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await audioEngine.decodeAudioFile(file);
      const targetId = importTargetTrackIdRef.current || selectedTrackId;

      pushHistory(tracks);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === targetId
            ? {
                ...t,
                audioBuffer: buffer,
                fileName: file.name,
                duration: buffer.duration,
              }
            : t
        )
      );

      audioEngine.setTrackBuffer(targetId, buffer);
      setDuration(audioEngine.getMaxDuration());
    } catch (err: any) {
      alert(`Could not decode audio: ${err.message || 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
  };

  // Apply Stems from Stem Splitter Modal
  const handleApplyStemsToSlots = (
    vocalBuffer: AudioBuffer,
    instrumentalBuffer: AudioBuffer,
    fileName: string
  ) => {
    pushHistory(tracks);
    setTracks((prev) => {
      const hasSlot1 = prev.some((t) => t.id === 'slot-1');
      const hasSlot2 = prev.some((t) => t.id === 'slot-2');

      return prev.map((t, idx) => {
        if (t.id === 'slot-1' || (!hasSlot1 && idx === 0)) {
          audioEngine.setTrackBuffer(t.id, instrumentalBuffer);
          return {
            ...t,
            audioBuffer: instrumentalBuffer,
            fileName: `${fileName} (Instruments)`,
            duration: instrumentalBuffer.duration,
            muted: false,
          };
        }
        if (t.id === 'slot-2' || (!hasSlot2 && idx === 1)) {
          audioEngine.setTrackBuffer(t.id, vocalBuffer);
          return {
            ...t,
            audioBuffer: vocalBuffer,
            fileName: `${fileName} (Original Vocals)`,
            duration: vocalBuffer.duration,
            muted: false,
          };
        }
        return t;
      });
    });
    setDuration(Math.max(instrumentalBuffer.duration, vocalBuffer.duration, audioEngine.getMaxDuration()));
    audioEngine.seek(0);
    setCurrentTime(0);
  };

  // Direct Hardware Monitoring Toggle
  const handleToggleDirectMonitoring = () => {
    const ctx = audioEngine.getAudioContext();
    if (isDirectMonitoring) {
      deviceManager.stopDirectMonitoring();
      setIsDirectMonitoring(false);
    } else {
      deviceManager.startDirectMonitoring(ctx, 0.8);
      setIsDirectMonitoring(true);
    }
  };

  // Recording
  const armedTrack = tracks.find((t) => t.armed) || tracks.find((t) => t.id === selectedTrackId);

  const handleToggleRecord = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      audioEngine.pause();

      try {
        const buffer = await audioEngine.stopMicrophoneRecording();
        if (armedTrack) {
          pushHistory(tracks);
          setTracks((prev) =>
            prev.map((t) =>
              t.id === armedTrack.id
                ? {
                    ...t,
                    audioBuffer: buffer,
                    fileName: `Vocal_Take_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    duration: buffer.duration,
                  }
                : t
            )
          );
          audioEngine.setTrackBuffer(armedTrack.id, buffer);
          setDuration(audioEngine.getMaxDuration());
        }
      } catch (err) {
        console.error('Recording error:', err);
      }
    } else {
      // Start recording with 3s count-in
      if (!armedTrack) {
        alert('Please arm or select a track to record onto.');
        return;
      }

      setRecordingCountdown(3);
      let count = 3;
      const interval = setInterval(async () => {
        count--;
        if (count > 0) {
          setRecordingCountdown(count);
        } else {
          clearInterval(interval);
          setRecordingCountdown(null);
          try {
            const inputId = deviceManager.getSelectedInputId();
            await audioEngine.startMicrophoneRecording(inputId);
            setIsRecording(true);
            audioEngine.play();
          } catch (err: any) {
            alert(`Microphone error: ${err.message || 'Permission denied'}`);
          }
        }
      }, 1000);
    }
  };

  // Save Version snapshot (AES-256 Encrypted)
  const handleSaveVersion = async (name: string, notes: string) => {
    const nextVerNum = versions.length + 1;
    const serializedTracks = tracks.map((t) => ({
      id: t.id,
      name: t.name,
      slotIndex: t.slotIndex,
      type: t.type,
      color: t.color,
      volume: t.volume,
      pan: t.pan,
      muted: t.muted,
      soloed: t.soloed,
      fileName: t.fileName,
      duration: t.duration,
      vocalPreset: t.vocalPreset,
      fxChain: t.fxChain,
      channelData: audioBufferToDataArray(t.audioBuffer),
      sampleRate: t.audioBuffer?.sampleRate,
    }));

    const newVersion: ProjectVersion = {
      id: 'ver-' + Date.now(),
      projectId: currentProject.id,
      versionNumber: nextVerNum,
      name,
      timestamp: Date.now(),
      notes,
      bpm,
      masterPreset,
      masterChain,
      masterVolume,
      tracks: serializedTracks,
    };

    // Encrypt and persist to IndexedDB
    await saveProjectVersion(newVersion, securityConfig.passphrase);
    const updated = await getProjectVersions(currentProject.id, securityConfig.passphrase);
    setVersions(updated);
  };

  // Restore Version snapshot
  const handleRestoreVersion = (version: ProjectVersion) => {
    const ctx = audioEngine.getAudioContext();

    setMasterVolume(version.masterVolume);
    audioEngine.setMasterVolume(version.masterVolume);

    setMasterPreset(version.masterPreset);
    setMasterChain(version.masterChain);
    audioEngine.setMasterChain(version.masterChain);

    if (version.bpm) setBpm(version.bpm);

    const restoredTracks = tracks.map((currentTrack) => {
      const saved = version.tracks.find((st) => st.id === currentTrack.id);
      if (!saved) return currentTrack;

      const restoredBuffer = dataArrayToAudioBuffer(
        ctx,
        saved.channelData,
        saved.sampleRate
      );

      audioEngine.setTrackBuffer(saved.id, restoredBuffer);
      audioEngine.setTrackVolume(saved.id, saved.volume);
      audioEngine.setTrackPan(saved.id, saved.pan);
      audioEngine.setTrackMute(saved.id, saved.muted);
      audioEngine.setTrackFX(saved.id, saved.fxChain);

      return {
        ...currentTrack,
        name: saved.name,
        volume: saved.volume,
        pan: saved.pan,
        muted: saved.muted,
        soloed: saved.soloed,
        vocalPreset: saved.vocalPreset,
        fxChain: saved.fxChain,
        audioBuffer: restoredBuffer,
        fileName: saved.fileName,
        duration: restoredBuffer ? restoredBuffer.duration : 0,
      };
    });

    pushHistory(tracks);
    setTracks(restoredTracks);
    setDuration(audioEngine.getMaxDuration());
    audioEngine.seek(0);
  };

  const handleDeleteVersion = async (versionId: string) => {
    await deleteProjectVersion(versionId);
    const updated = await getProjectVersions(currentProject.id, securityConfig.passphrase);
    setVersions(updated);
  };

  // Demo Track Loader
  const handleLoadDemo = () => {
    const ctx = audioEngine.getAudioContext();
    const demo = generateStudioDemoTrack(ctx, 16);

    pushHistory(tracks);
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === 'slot-1') {
          audioEngine.setTrackBuffer('slot-1', demo.backingBuffer);
          return {
            ...t,
            audioBuffer: demo.backingBuffer,
            fileName: 'Demo_Instrumental_Groove.wav',
            duration: demo.backingBuffer.duration,
            muted: false,
          };
        }
        if (t.id === 'slot-2') {
          audioEngine.setTrackBuffer('slot-2', demo.vocalBuffer);
          return {
            ...t,
            audioBuffer: demo.vocalBuffer,
            fileName: 'Demo_Original_Vocals.wav',
            duration: demo.vocalBuffer.duration,
            muted: false,
          };
        }
        return t;
      })
    );

    setDuration(16);
    audioEngine.seek(0);
  };

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[2];

  return (
    <div
      id="bandlab-studio-root"
      className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-hidden"
    >
      {/* Hidden File Input for Audio Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 3-Second Recording Countdown Overlay */}
      {recordingCountdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="text-center space-y-3">
            <div className="text-8xl font-black text-red-500 font-mono animate-ping">
              {recordingCountdown}
            </div>
            <p className="text-sm font-semibold text-zinc-300">
              Get ready to sing... Recording starting on Track: {armedTrack?.name}
            </p>
          </div>
        </div>
      )}

      {/* 1. BandLab Top Bar */}
      <MobileTopBar
        currentProject={currentProject}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenProjects={() => setIsHistoryDrawerOpen(true)}
        onOpenVersions={() => setIsHistoryDrawerOpen(true)}
        onOpenSave={() => setIsSaveVersionModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onOpenHardware={() => setIsHardwareModalOpen(true)}
        onOpenMastering={() => setIsMasteringModalOpen(true)}
        encryptionActive={securityConfig.encryptionEnabled}
      />

      {/* 2. Main Center View: Arranger | Lyrics | Settings */}
      {activeTab === 'arranger' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Time Ruler & Playhead Handle */}
          <MobileRuler
            currentTime={currentTime}
            totalDuration={duration}
            bpm={bpm}
            onSeek={(t) => audioEngine.seek(t)}
            snapToGrid={snapToGrid}
            onToggleSnap={() => setSnapToGrid(!snapToGrid)}
            zoomLevel={zoomLevel}
            onChangeZoom={setZoomLevel}
            headerWidth={115}
          />

          {/* Multitrack Audio Waveform Timeline */}
          <MobileTimeline
            tracks={tracks}
            activeTrackId={selectedTrackId}
            onSelectTrack={setSelectedTrackId}
            onUpdateTrack={handleUpdateTrack}
            onOpenFxChain={(tId) => {
              setSelectedTrackId(tId);
              setIsFXModalOpen(true);
            }}
            onAddTrack={handleAddTrack}
            onOpenStemSplitter={() => setIsSplitterModalOpen(true)}
            onImportAudio={triggerAudioImport}
            currentTime={currentTime}
            totalDuration={duration}
            zoomLevel={zoomLevel}
            headerWidth={115}
            onSeek={(t) => audioEngine.seek(t)}
            isRecording={isRecording}
            recordingTrackId={armedTrack ? armedTrack.id : null}
          />
        </div>
      )}

      {activeTab === 'lyrics' && (
        <LyricsView
          isPlaying={isPlaying}
          isRecording={isRecording}
          currentTime={currentTime}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          project={currentProject}
          onUpdateProjectName={(name) => setCurrentProject((p) => ({ ...p, name }))}
          bpm={bpm}
          onChangeBpm={setBpm}
          masterPreset={masterPreset}
          onSelectMasterPreset={(id) => {
            setMasterPreset(id);
            const newChain = JSON.parse(JSON.stringify(MASTERING_PRESETS[id].chain));
            setMasterChain(newChain);
            audioEngine.setMasterChain(newChain);
          }}
          onOpenMasteringSuite={() => setIsMasteringModalOpen(true)}
          onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          securityConfig={securityConfig}
          onResetProject={() => {
            if (confirm('Clear all recorded audio from this session?')) {
              tracks.forEach((t) => audioEngine.setTrackBuffer(t.id, null));
              setTracks(INITIAL_TRACKS);
              setDuration(0);
            }
          }}
        />
      )}

      {/* 3. BandLab Bottom Quick Action Strip & Transport Bar */}
      <MobileBottomBar
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        isRecording={isRecording}
        onTogglePlay={() => (isPlaying ? audioEngine.pause() : audioEngine.play())}
        onToggleRecord={handleToggleRecord}
        onRewind={() => audioEngine.seek(0)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        bpm={bpm}
        metronomeActive={metronomeActive}
        onToggleMetronome={() => setMetronomeActive(!metronomeActive)}
        onOpenMixer={() => setIsMixerDrawerOpen(true)}
        onOpenFxChain={() => setIsFXModalOpen(true)}
        onOpenAutoPitch={() => setIsAutoPitchModalOpen(true)}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        autoPitchConfig={autoPitchConfig}
        isDirectMonitoring={isDirectMonitoring}
        onToggleDirectMonitoring={handleToggleDirectMonitoring}
      />

      {/* 4. Modals & Drawers */}

      {/* Audio Hardware & Interface Recognition Modal */}
      <AudioDeviceModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

      {/* AutoPitch™ Vocal Tuner Modal */}
      <AutoPitchModal
        isOpen={isAutoPitchModalOpen}
        onClose={() => setIsAutoPitchModalOpen(false)}
        config={autoPitchConfig}
        onChangeConfig={setAutoPitchConfig}
      />

      {/* AES-256 Storage & Project Encryption Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        securityConfig={securityConfig}
        onUpdateSecurity={setSecurityConfig}
        currentProject={currentProject}
        versions={versions}
        onImportVault={(p, vers) => {
          setCurrentProject(p);
          setVersions(vers);
          if (vers.length > 0) handleRestoreVersion(vers[0]);
        }}
      />

      {/* Mobile Channel Strips & Faders Mixer Drawer */}
      <MobileMixerDrawer
        isOpen={isMixerDrawerOpen}
        onClose={() => setIsMixerDrawerOpen(false)}
        tracks={tracks}
        onUpdateTrack={handleUpdateTrack}
        masterVolume={masterVolume}
        onChangeMasterVolume={(v) => {
          setMasterVolume(v);
          audioEngine.setMasterVolume(v);
        }}
        onOpenFxChain={(tId) => {
          setSelectedTrackId(tId);
          setIsFXModalOpen(true);
        }}
        onOpenMasteringSuite={() => setIsMasteringModalOpen(true)}
      />

      {/* Vocal FX Chain Modal */}
      <VocalChainModal
        isOpen={isFXModalOpen}
        onClose={() => setIsFXModalOpen(false)}
        trackName={activeTrack.name}
        slotIndex={activeTrack.slotIndex}
        currentPreset={activeTrack.vocalPreset}
        onSelectPreset={(p) => {
          const presetConfig = VOCAL_PRESETS[p];
          if (presetConfig) {
            handleUpdateTrack(activeTrack.id, {
              vocalPreset: p,
              fxChain: JSON.parse(JSON.stringify(presetConfig.chain)),
            });
          }
        }}
        fxChain={activeTrack.fxChain}
        onChangeFXChain={(chain) => {
          handleUpdateTrack(activeTrack.id, {
            vocalPreset: 'custom',
            fxChain: chain,
          });
        }}
      />

      {/* Mastering Suite Modal */}
      <MasteringSuiteModal
        isOpen={isMasteringModalOpen}
        onClose={() => setIsMasteringModalOpen(false)}
        masterPreset={masterPreset}
        onSelectPreset={(p) => {
          setMasterPreset(p);
          const newChain = JSON.parse(JSON.stringify(MASTERING_PRESETS[p].chain));
          setMasterChain(newChain);
          audioEngine.setMasterChain(newChain);
        }}
        masterChain={masterChain}
        onChangeMasterChain={(c) => {
          setMasterChain(c);
          audioEngine.setMasterChain(c);
        }}
      />

      {/* Stem Splitter Modal */}
      <StemSplitterModal
        isOpen={isSplitterModalOpen}
        onClose={() => setIsSplitterModalOpen(false)}
        tracks={tracks}
        onApplyStemsToSlots={handleApplyStemsToSlots}
      />

      {/* Save Version Snapshot Modal (Encrypted) */}
      <SaveVersionModal
        isOpen={isSaveVersionModalOpen}
        onClose={() => setIsSaveVersionModalOpen(false)}
        nextVersionNumber={versions.length + 1}
        onSaveVersion={handleSaveVersion}
        projectName={currentProject.name}
      />

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        versions={versions}
        projectName={currentProject.name}
        onRestoreVersion={handleRestoreVersion}
        onDeleteVersion={handleDeleteVersion}
      />

      {/* Audio Mixdown & Metadata Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tracks={tracks}
        masterChain={masterChain}
        masterVolume={masterVolume}
        projectName={currentProject.name}
      />
    </div>
  );
}
