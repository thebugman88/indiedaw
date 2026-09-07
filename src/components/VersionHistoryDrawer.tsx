import React from 'react';
import {
  X,
  History,
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  Music,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { ProjectVersion } from '../types';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ProjectVersion[];
  projectName: string;
  onRestoreVersion: (version: ProjectVersion) => void;
  onDeleteVersion: (versionId: string) => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  versions,
  projectName,
  onRestoreVersion,
  onDeleteVersion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border-l border-neutral-800 w-full max-w-md h-full flex flex-col shadow-2xl text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Project Version History</h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Folder: {projectName} • {versions.length} saves
              </p>
            </div>
          </div>

          <button
            id="close-history-drawer"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of versions */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {versions.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-neutral-500 text-xs text-center p-4">
              <History className="w-8 h-8 mb-2 opacity-50" />
              <p>No saved versions yet.</p>
              <p className="text-[11px] text-neutral-600 mt-1">
                Click "Save New Version" in the top bar to create a snapshot milestone you can revert
                to.
              </p>
            </div>
          ) : (
            versions.map((ver) => {
              const activeTracksCount = ver.tracks.filter(
                (t) => (t.channelData && t.channelData.length > 0) || t.duration > 0
              ).length;
              const dateStr = new Date(ver.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={ver.id}
                  id={`version-card-${ver.id}`}
                  className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3.5 space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded">
                          v{ver.versionNumber}
                        </span>
                        <h4 className="text-xs font-semibold text-neutral-100">{ver.name}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Delete version v${ver.versionNumber} (${ver.name})?`)) {
                          onDeleteVersion(ver.id);
                        }
                      }}
                      className="text-neutral-500 hover:text-red-400 p-1 rounded transition-colors"
                      title="Delete version snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {ver.notes && (
                    <p className="text-[11px] text-neutral-300 bg-neutral-900/90 p-2 rounded border border-neutral-800/80 leading-relaxed">
                      {ver.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Music className="w-3 h-3 text-neutral-500" />
                      {activeTracksCount} audio tracks • Master: {ver.masterPreset}
                    </span>

                    <button
                      id={`restore-ver-${ver.id}`}
                      onClick={() => {
                        if (
                          confirm(
                            `Restore v${ver.versionNumber} (${ver.name})? This will replace current DAW state with this snapshot.`
                          )
                        ) {
                          onRestoreVersion(ver);
                          onClose();
                        }
                      }}
                      className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 px-2.5 py-1 rounded text-xs font-medium border border-neutral-700 transition-colors shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Revert / Restore</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Non-destructive snapshots stored in local database</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
