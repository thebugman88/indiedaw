import { ProjectFolder, ProjectVersion, SerializedTrackState } from '../types';
import { encryptData, decryptData, EncryptedPayload, isEncryptedPayload } from '../utils/crypto';

const DB_NAME = 'StudioDawDB';
const DB_VERSION = 2; // Incremented for encryption
const STORE_PROJECTS = 'projects';
const STORE_VERSIONS = 'versions';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VERSIONS)) {
        const versionStore = db.createObjectStore(STORE_VERSIONS, { keyPath: 'id' });
        versionStore.createIndex('projectId', 'projectId', { unique: false });
        versionStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function float32ArrayToBase64(arr: Float32Array): string {
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Float32Array(bytes.buffer);
}

export interface StoredRecord {
  id: string;
  projectId: string;
  versionNumber: number;
  name: string;
  timestamp: number;
  isEncrypted: boolean;
  encryptedPayload?: EncryptedPayload;
  rawVersion?: any;
}

export async function getProjects(): Promise<ProjectFolder[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: ProjectFolder): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.put(project);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROJECTS, STORE_VERSIONS], 'readwrite');
    const pStore = tx.objectStore(STORE_PROJECTS);
    pStore.delete(projectId);

    const vStore = tx.objectStore(STORE_VERSIONS);
    const index = vStore.index('projectId');
    const range = IDBKeyRange.only(projectId);
    const req = index.openCursor(range);
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieves and decrypts all project versions for a project.
 */
export async function getProjectVersions(
  projectId: string,
  passphrase?: string
): Promise<ProjectVersion[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readonly');
    const store = tx.objectStore(STORE_VERSIONS);
    const index = store.index('projectId');
    const range = IDBKeyRange.only(projectId);
    const req = index.getAll(range);

    req.onsuccess = async () => {
      const rawRecords: (StoredRecord | ProjectVersion)[] = req.result || [];
      const versions: ProjectVersion[] = [];

      for (const rec of rawRecords) {
        try {
          if ((rec as StoredRecord).isEncrypted && (rec as StoredRecord).encryptedPayload) {
            // Decrypt AES-256 payload
            const decrypted = await decryptData<any>(
              (rec as StoredRecord).encryptedPayload!,
              passphrase
            );

            // Rehydrate Float32Array channel data
            if (decrypted.tracks) {
              for (const tr of decrypted.tracks) {
                if (tr.channelDataB64 && Array.isArray(tr.channelDataB64)) {
                  tr.channelData = tr.channelDataB64.map((b64: string) => base64ToFloat32Array(b64));
                  delete tr.channelDataB64;
                }
              }
            }
            versions.push(decrypted as ProjectVersion);
          } else if ((rec as StoredRecord).rawVersion) {
            versions.push((rec as StoredRecord).rawVersion as ProjectVersion);
          } else {
            // Legacy unencrypted format
            versions.push(rec as ProjectVersion);
          }
        } catch (err) {
          console.error(`Failed to decrypt version ${(rec as any).name || (rec as any).id}:`, err);
        }
      }

      // Sort newest first
      versions.sort((a, b) => b.timestamp - a.timestamp);
      resolve(versions);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Encrypts and saves a ProjectVersion into IndexedDB using AES-GCM 256.
 */
export async function saveProjectVersion(
  version: ProjectVersion,
  passphrase?: string
): Promise<void> {
  const db = await openDatabase();

  // Prepare tracks for JSON encryption: serialize Float32Array into base64 strings
  const serializableTracks = version.tracks.map((t) => {
    const copy: any = { ...t };
    if (t.channelData && t.channelData.length > 0) {
      copy.channelDataB64 = t.channelData.map((arr) => float32ArrayToBase64(arr));
      delete copy.channelData;
    }
    return copy;
  });

  const serializableVersion = {
    ...version,
    tracks: serializableTracks,
  };

  // Encrypt with AES-GCM 256
  const encryptedPayload = await encryptData(serializableVersion, passphrase);

  const record: StoredRecord = {
    id: version.id,
    projectId: version.projectId,
    versionNumber: version.versionNumber,
    name: version.name,
    timestamp: version.timestamp,
    isEncrypted: true,
    encryptedPayload,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readwrite');
    const store = tx.objectStore(STORE_VERSIONS);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProjectVersion(versionId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readwrite');
    const store = tx.objectStore(STORE_VERSIONS);
    const req = store.delete(versionId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Export full project as an encrypted vault file (`.dawvault`)
 */
export async function exportEncryptedProjectVault(
  project: ProjectFolder,
  versions: ProjectVersion[],
  passphrase?: string
): Promise<Blob> {
  const serializableVersions = versions.map((v) => {
    const serializableTracks = v.tracks.map((t) => {
      const copy: any = { ...t };
      if (t.channelData && t.channelData.length > 0) {
        copy.channelDataB64 = t.channelData.map((arr) => float32ArrayToBase64(arr));
        delete copy.channelData;
      }
      return copy;
    });
    return { ...v, tracks: serializableTracks };
  });

  const vaultData = {
    app: 'Studio DAW & Stem Splitter',
    format: 'DAWVAULT-AES256',
    exportedAt: Date.now(),
    project,
    versions: serializableVersions,
  };

  const encrypted = await encryptData(vaultData, passphrase);
  return new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/json' });
}

/**
 * Import a project from an encrypted vault file
 */
export async function importEncryptedProjectVault(
  jsonText: string,
  passphrase?: string
): Promise<{ project: ProjectFolder; versions: ProjectVersion[] }> {
  const parsed = JSON.parse(jsonText);
  if (!isEncryptedPayload(parsed)) {
    throw new Error('Invalid vault file: Missing AES-256 encryption header');
  }

  const decrypted = await decryptData<any>(parsed, passphrase);
  if (!decrypted.project || !decrypted.versions) {
    throw new Error('Corrupted or invalid vault payload');
  }

  // Restore Float32Array channel data
  for (const ver of decrypted.versions) {
    if (ver.tracks) {
      for (const tr of ver.tracks) {
        if (tr.channelDataB64 && Array.isArray(tr.channelDataB64)) {
          tr.channelData = tr.channelDataB64.map((b64: string) => base64ToFloat32Array(b64));
          delete tr.channelDataB64;
        }
      }
    }
  }

  return {
    project: decrypted.project,
    versions: decrypted.versions,
  };
}

/**
 * Converts an AudioBuffer into an array of Float32Arrays for persistence.
 */
export function audioBufferToDataArray(buffer: AudioBuffer | null): Float32Array[] | undefined {
  if (!buffer) return undefined;
  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(new Float32Array(buffer.getChannelData(c)));
  }
  return channels;
}

/**
 * Reconstructs an AudioBuffer from stored channel data arrays.
 */
export function dataArrayToAudioBuffer(
  audioCtx: AudioContext,
  channelData?: Float32Array[],
  sampleRate?: number
): AudioBuffer | null {
  if (!channelData || channelData.length === 0) return null;
  const numChannels = channelData.length;
  const length = channelData[0].length;
  const sr = sampleRate || audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(numChannels, length, sr);
  for (let c = 0; c < numChannels; c++) {
    buffer.copyToChannel(channelData[c], c);
  }
  return buffer;
}
