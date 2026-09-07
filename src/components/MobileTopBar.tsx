import React from 'react';
import {
  ChevronLeft,
  Sliders,
  FileText,
  Settings,
  Cloud,
  CloudUpload,
  ShieldCheck,
  Lock,
  Music2,
  Layers,
  History,
} from 'lucide-react';
import { MobileTab, ProjectFolder } from '../types';
import { IndieBrotherhoodBranding } from './IndieBrotherhoodBranding';

interface MobileTopBarProps {
  currentProject: ProjectFolder | null;
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  onOpenProjects: () => void;
  onOpenVersions: () => void;
  onOpenSave: () => void;
  onOpenExport: () => void;
  onOpenSecurity: () => void;
  onOpenHardware: () => void;
  onOpenMastering: () => void;
  encryptionActive: boolean;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  currentProject,
  activeTab,
  onChangeTab,
  onOpenProjects,
  onOpenVersions,
  onOpenSave,
  onOpenExport,
  onOpenSecurity,
  onOpenHardware,
  onOpenMastering,
  encryptionActive,
}) => {
  return (
    <header
      id="bandlab-mobile-topbar"
      className="w-full bg-black/95 border-b border-zinc-900/80 px-3 py-2 flex items-center justify-between select-none z-30 shrink-0"
    >
      {/* Left: Back / Project Menu */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 p-0.5 flex items-center justify-center shrink-0">
          <img
            src="/ibh-emblem.svg"
            alt="IBH"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <button
          id="project-menu-btn"
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 p-1 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Projects & Versions"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-semibold text-white truncate max-w-[110px] sm:max-w-[160px]">
            {currentProject ? currentProject.name : 'Untitled Song'}
          </span>
        </button>

        <button
          onClick={onOpenVersions}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 text-[10px] flex items-center gap-0.5"
          title="Version History"
        >
          <History className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: BandLab-style 3-icon segmented pill */}
      <div className="flex items-center p-0.5 rounded-full bg-zinc-900 border border-zinc-800/80 shadow-inner">
        {/* Tab 1: Arranger / Multitrack */}
        <button
          id="tab-arranger-btn"
          onClick={() => onChangeTab('arranger')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeTab === 'arranger'
              ? 'bg-zinc-100 text-black shadow-md font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Multitrack Arranger"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Arranger</span>
        </button>

        {/* Tab 2: Lyrics notebook */}
        <button
          id="tab-lyrics-btn"
          onClick={() => onChangeTab('lyrics')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeTab === 'lyrics'
              ? 'bg-zinc-100 text-black shadow-md font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Lyrics & Songwriting Notebook"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lyrics</span>
        </button>

        {/* Tab 3: Project & Mastering Settings */}
        <button
          id="tab-settings-btn"
          onClick={() => onChangeTab('settings')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeTab === 'settings'
              ? 'bg-zinc-100 text-black shadow-md font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Studio & Mastering Settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>

      {/* Right: Cloud Save / Export / Encryption */}
      <div className="flex items-center gap-1">
        {/* Encryption Security Badge Button */}
        <button
          id="security-indicator-btn"
          onClick={onOpenSecurity}
          className="p-1.5 rounded-full hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          title="AES-256 Encryption Settings"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[10px] font-mono text-emerald-400">AES-256</span>
        </button>

        {/* Save Version Button */}
        <button
          id="topbar-save-btn"
          onClick={onOpenSave}
          className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Save New Project Version"
        >
          <CloudUpload className="w-4 h-4" />
        </button>

        {/* Export Song Button */}
        <button
          id="topbar-export-btn"
          onClick={onOpenExport}
          className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700/80 transition-colors"
          title="Export WAV / MP3"
        >
          Export
        </button>
      </div>
    </header>
  );
};
