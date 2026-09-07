import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SecurityConfig, ProjectFolder, ProjectVersion } from '../types';
import { exportEncryptedProjectVault, importEncryptedProjectVault } from '../db/projectStorage';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityConfig: SecurityConfig;
  onUpdateSecurity: (config: SecurityConfig) => void;
  currentProject: ProjectFolder | null;
  versions: ProjectVersion[];
  onImportVault: (project: ProjectFolder, versions: ProjectVersion[]) => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  securityConfig,
  onUpdateSecurity,
  currentProject,
  versions,
  onImportVault,
}) => {
  const [passphraseInput, setPassphraseInput] = useState(securityConfig.passphrase || '');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSavePassphrase = () => {
    onUpdateSecurity({
      ...securityConfig,
      passphrase: passphraseInput.trim() || undefined,
      passphraseProtection: Boolean(passphraseInput.trim()),
    });
    setStatusMsg({ text: 'Security & encryption keys updated successfully!' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleExportVault = async () => {
    if (!currentProject) return;
    setIsExporting(true);
    try {
      const blob = await exportEncryptedProjectVault(
        currentProject,
        versions,
        securityConfig.passphrase
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '_')}_encrypted_vault.dawvault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ text: 'Project exported as AES-256 encrypted vault!' });
    } catch (e: any) {
      setStatusMsg({ text: e.message || 'Export failed', isError: true });
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importEncryptedProjectVault(text, securityConfig.passphrase);
      onImportVault(result.project, result.versions);
      setStatusMsg({ text: `Imported vault: "${result.project.name}" with ${result.versions.length} versions!` });
    } catch (err: any) {
      setStatusMsg({
        text: err.message || 'Failed to decrypt vault. Incorrect passphrase?',
        isError: true,
      });
    } finally {
      e.target.value = '';
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  return (
    <div
      id="security-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Project Data Security & Encryption
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  AES-GCM 256
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                End-to-end cryptographic protection for audio stems & project files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMsg.isError
                  ? 'bg-red-950/60 border-red-800 text-red-300'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              }`}
            >
              {statusMsg.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Encryption Status Card */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    Storage Encryption Active
                  </div>
                  <div className="text-xs text-zinc-400">
                    All saves, stems, and audio buffers are encrypted at rest
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
                AES-256
              </span>
            </div>

            <div className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2.5">
              Utilizes Web Crypto API with 100,000 PBKDF2 iterations and 12-byte initialization vectors.
              Zero plain-text audio data is ever written to local storage or IndexedDB.
            </div>
          </div>

          {/* Custom Master Passphrase */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" /> Master Password / Passphrase (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                {showPassphrase ? 'Hide' : 'Show'}
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Set a master passphrase to enable zero-knowledge cross-device transfers. If empty, the device's
              secure hardware key is used automatically.
            </p>

            <div className="flex items-center gap-2">
              <input
                type={showPassphrase ? 'text' : 'password'}
                placeholder="Enter custom encryption password..."
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleSavePassphrase}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Encrypted Vault Backup & Restore */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
              Encrypted Project Vault (.dawvault)
            </div>
            <p className="text-xs text-zinc-400">
              Export and import encrypted single-file backups containing all tracks, versions, and vocal chains.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleExportVault}
                disabled={isExporting || !currentProject}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                {isExporting ? 'Exporting...' : 'Export Vault'}
              </button>

              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Import Vault</span>
                <input
                  type="file"
                  accept=".dawvault,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Current Cipher: <span className="text-zinc-200 font-mono">AES-GCM-256</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
