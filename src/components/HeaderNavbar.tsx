import React, { useState } from 'react';
import {
  Folder,
  History,
  Save,
  Scissors,
  Sliders,
  Download,
  Music,
  Plus,
  Sparkles,
} from 'lucide-react';
import { ProjectFolder } from '../types';
import { IndieBrotherhoodBranding } from './IndieBrotherhoodBranding';

interface HeaderNavbarProps {
  currentProject: ProjectFolder;
  projects: ProjectFolder[];
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  versionCount: number;
  onOpenSaveVersionModal: () => void;
  onOpenHistoryDrawer: () => void;
  onOpenStemSplitter: () => void;
  onOpenMasteringSuite: () => void;
  onOpenExportModal: () => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  versionCount,
  onOpenSaveVersionModal,
  onOpenHistoryDrawer,
  onOpenStemSplitter,
  onOpenMasteringSuite,
  onOpenExportModal,
  onLoadDemo,
  isLoadingDemo,
}) => {
  const [showNewProjInput, setShowNewProjInput] = useState(false);
  const [newProjName, setNewProjName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjName.trim()) {
      onCreateProject(newProjName.trim());
      setNewProjName('');
      setShowNewProjInput(false);
    }
  };

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 text-neutral-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-4">
        <IndieBrotherhoodBranding variant="badge" />

        {/* Project Selector */}
        <div className="flex items-center gap-1.5 bg-neutral-800/80 border border-neutral-700/60 rounded-md px-2.5 py-1 text-xs">
          <Folder className="w-3.5 h-3.5 text-amber-400" />
          <select
            id="project-select"
            value={currentProject.id}
            onChange={(e) => onSelectProject(e.target.value)}
            className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer pr-2 font-medium"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-neutral-800 text-neutral-100">
                {p.name}
              </option>
            ))}
          </select>

          {showNewProjInput ? (
            <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 ml-1">
              <input
                type="text"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className="bg-neutral-900 text-neutral-100 text-xs px-1.5 py-0.5 rounded border border-neutral-600 focus:outline-none w-28"
              />
              <button
                type="submit"
                className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-1.5 py-0.5 rounded"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowNewProjInput(false)}
                className="text-[11px] text-neutral-400 hover:text-neutral-200 px-1"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              id="new-project-button"
              onClick={() => setShowNewProjInput(true)}
              title="Create new project folder"
              className="text-neutral-400 hover:text-neutral-100 p-0.5 rounded hover:bg-neutral-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        {/* Load Demo Track */}
        <button
          id="load-demo-button"
          onClick={onLoadDemo}
          disabled={isLoadingDemo}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-2.5 py-1.5 rounded-md transition-colors font-medium"
          title="Load instant multi-track demo song"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          {isLoadingDemo ? 'Generating Demo...' : 'Load Demo Song'}
        </button>

        {/* Stem Splitter Tool */}
        <button
          id="open-splitter-button"
          onClick={onOpenStemSplitter}
          className="flex items-center gap-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 px-2.5 py-1.5 rounded-md transition-colors font-medium"
        >
          <Scissors className="w-3.5 h-3.5 text-indigo-400" />
          <span>Stem Splitter</span>
        </button>

        {/* Mastering Suite */}
        <button
          id="open-mastering-button"
          onClick={onOpenMasteringSuite}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-2.5 py-1.5 rounded-md transition-colors font-medium"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mastering Suite</span>
        </button>

        {/* Save Version */}
        <button
          id="save-version-button"
          onClick={onOpenSaveVersionModal}
          className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 px-2.5 py-1.5 rounded-md transition-colors font-medium shadow-sm"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span>Save New Version</span>
        </button>

        {/* History Drawer */}
        <button
          id="open-history-button"
          onClick={onOpenHistoryDrawer}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 px-2.5 py-1.5 rounded-md transition-colors font-medium"
        >
          <History className="w-3.5 h-3.5 text-neutral-400" />
          <span>History ({versionCount})</span>
        </button>

        {/* Export / Download */}
        <button
          id="open-export-button"
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition-colors font-medium shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Master</span>
        </button>
      </div>
    </header>
  );
};
