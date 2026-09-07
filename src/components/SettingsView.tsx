import React from 'react';
import {
  Settings,
  Sliders,
  Music,
  Lock,
  Mic,
  Headphones,
  Zap,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { MasterPresetId, ProjectFolder, SecurityConfig } from '../types';
import { MASTERING_PRESETS } from '../audio/vocalPresets';
import { IndieBrotherhoodBranding } from './IndieBrotherhoodBranding';

interface SettingsViewProps {
  project: ProjectFolder | null;
  onUpdateProjectName: (name: string) => void;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  masterPreset: MasterPresetId;
  onSelectMasterPreset: (id: MasterPresetId) => void;
  onOpenMasteringSuite: () => void;
  onOpenHardwareModal: () => void;
  onOpenSecurityModal: () => void;
  securityConfig: SecurityConfig;
  onResetProject: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  project,
  onUpdateProjectName,
  bpm,
  onChangeBpm,
  masterPreset,
  onSelectMasterPreset,
  onOpenMasteringSuite,
  onOpenHardwareModal,
  onOpenSecurityModal,
  securityConfig,
  onResetProject,
}) => {
  return (
    <div
      id="bandlab-settings-view"
      className="flex-1 w-full bg-black overflow-y-auto p-4 sm:p-6 select-none pb-28 text-zinc-100"
    >
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-900 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-500" />
            Project &amp; Studio Settings
          </h2>
          <p className="text-xs text-zinc-400">
            Configure tempo, mastering engine, hardware routing, and encrypted storage
          </p>
        </div>

        {/* Indie Brotherhood Official Studio Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-neutral-950 to-neutral-900 border border-neutral-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-bold">
              Official Production Suite
            </span>
            <span className="text-[10px] font-mono text-zinc-500">v2.4 Pro</span>
          </div>

          {/* Full Banner Display */}
          <div className="p-2 sm:p-3 bg-black/80 rounded-xl border border-neutral-800 flex items-center justify-center">
            <IndieBrotherhoodBranding variant="banner" size="md" />
          </div>

          <div className="flex items-center gap-3.5 pt-1">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-700/80 p-1 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/ibh-emblem.svg"
                alt="IBH Emblem"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Indie Brotherhood DAW
                <span className="text-[9px] bg-red-950 text-red-300 font-mono px-1.5 py-0.5 rounded border border-red-800/60 font-semibold">
                  IBH
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Crafted for independent artists, multi-track recording, and 3-pass stem separation.
              </p>
            </div>
          </div>
        </div>

        {/* Project Title */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Song Title
          </label>
          <input
            type="text"
            value={project?.name || ''}
            onChange={(e) => onUpdateProjectName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
            placeholder="Name your song..."
          />
        </div>

        {/* Tempo & Metronome */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" /> Song Tempo (BPM)
            </label>
            <span className="text-sm font-mono font-bold text-cyan-400">{bpm} BPM</span>
          </div>
          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => onChangeBpm(parseInt(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>60 (Ballad)</span>
            <span>90 (Lofi / Hip-hop)</span>
            <span>120 (Pop)</span>
            <span>140 (Trap / Rock)</span>
            <span>180 (Fast)</span>
          </div>
        </div>

        {/* Mastering Engine Preset */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Master Bus Preset
              </div>
              <p className="text-xs text-zinc-400">Automatic analog tape warmth & loudness limiter</p>
            </div>
            <button
              onClick={onOpenMasteringSuite}
              className="text-xs font-semibold text-amber-400 hover:underline"
            >
              Fine Tune →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MASTERING_PRESETS) as MasterPresetId[]).map((key) => {
              const preset = MASTERING_PRESETS[key];
              const isSelected = key === masterPreset;
              return (
                <button
                  key={key}
                  onClick={() => onSelectMasterPreset(key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-md'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{preset.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{preset.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Hardware Quick Action */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Audio Hardware & Interfaces</div>
              <p className="text-xs text-zinc-400">
                Configure Focusrite Scarlett, Corsair Headsets, and zero-latency monitoring
              </p>
            </div>
          </div>
          <button
            onClick={onOpenHardwareModal}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white border border-zinc-700"
          >
            Configure
          </button>
        </div>

        {/* Security & Encryption Quick Action */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                AES-256 Storage Encryption
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Passphrase protection and encrypted .dawvault backups
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSecurityModal}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white border border-zinc-700"
          >
            Manage
          </button>
        </div>

        {/* Reset Project */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-red-950/40 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-red-400">Reset Current Session</div>
            <p className="text-xs text-zinc-500">Clears all audio clips from current session tracks</p>
          </div>
          <button
            onClick={onResetProject}
            className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 text-xs font-semibold border border-red-800/80"
          >
            Reset Tracks
          </button>
        </div>
      </div>
    </div>
  );
};
