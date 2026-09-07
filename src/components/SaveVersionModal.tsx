import React, { useState } from 'react';
import { X, Save, Sparkles, FileText } from 'lucide-react';

interface SaveVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextVersionNumber: number;
  onSaveVersion: (name: string, notes: string) => Promise<void>;
  projectName: string;
}

export const SaveVersionModal: React.FC<SaveVersionModalProps> = ({
  isOpen,
  onClose,
  nextVersionNumber,
  onSaveVersion,
  projectName,
}) => {
  const [name, setName] = useState(`Version ${nextVersionNumber}`);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      await onSaveVersion(name.trim(), notes.trim());
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Failed to save version');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn text-neutral-200">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Save New Version Snapshot
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Project: {projectName} • Snapshot v{nextVersionNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold block">Version Name</label>
            <input
              type="text"
              id="version-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Baritone Vocal Take 2"
              required
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold block">Notes & Settings Description</label>
            <textarea
              id="version-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Muted original vocals, added warm baritone preset with tape warmth on lead..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Non-Destructive Snapshot
            </span>
            <p>
              Saves full audio sample data, track mix levels, vocal chains, and master preset. You can
              revert back to this snapshot at any time in Version History.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-save-version-btn"
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Snapshot...' : `Save v${nextVersionNumber}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
