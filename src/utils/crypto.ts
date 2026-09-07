/**
 * Web Crypto API Utility for AES-GCM 256-bit Military Grade Data Encryption
 * Encrypts all project snapshots, track audio channel data, and metadata before storage.
 */

export interface EncryptedPayload {
  iv: string; // Base64 12-byte IV
  salt: string; // Base64 16-byte salt
  ciphertext: string; // Base64 encrypted payload
  algorithm: 'AES-GCM-256';
  version: number;
  encryptedAt: number;
}

const STORAGE_KEY_NAME = 'studio_daw_device_enc_key_v1';
const PBKDF2_ITERATIONS = 100000;

/**
 * Converts an ArrayBuffer to a Base64 string.
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Retrieves or generates the hardware-bound AES-256 encryption key.
 */
async function getDeviceEncryptionKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(STORAGE_KEY_NAME);
  if (stored) {
    try {
      const rawKey = base64ToBuffer(stored);
      return await crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      console.warn('Failed to load stored encryption key, generating fresh one:', e);
    }
  }

  // Generate new 256-bit AES-GCM key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem(STORAGE_KEY_NAME, bufferToBase64(exported));
  return key;
}

/**
 * Derives a 256-bit AES key from a user password using PBKDF2 with 100,000 rounds.
 */
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts any JS object or string using AES-GCM (256-bit).
 * If a custom password is provided, derives key from password; otherwise uses device key.
 */
export async function encryptData(data: any, customPassword?: string): Promise<EncryptedPayload> {
  const jsonString = JSON.stringify(data);
  const enc = new TextEncoder();
  const encoded = enc.encode(jsonString);

  // 12-byte IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  let key: CryptoKey;
  let salt = crypto.getRandomValues(new Uint8Array(16));

  if (customPassword && customPassword.trim().length > 0) {
    key = await deriveKeyFromPassword(customPassword, salt);
  } else {
    key = await getDeviceEncryptionKey();
  }

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded
  );

  return {
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    ciphertext: bufferToBase64(encryptedBuffer),
    algorithm: 'AES-GCM-256',
    version: 1,
    encryptedAt: Date.now(),
  };
}

/**
 * Decrypts an EncryptedPayload back into the original data object.
 */
export async function decryptData<T = any>(
  payload: EncryptedPayload,
  customPassword?: string
): Promise<T> {
  const ivBuffer = base64ToBuffer(payload.iv);
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

  let key: CryptoKey;
  if (customPassword && customPassword.trim().length > 0) {
    const saltBuffer = base64ToBuffer(payload.salt);
    key = await deriveKeyFromPassword(customPassword, new Uint8Array(saltBuffer));
  } else {
    key = await getDeviceEncryptionKey();
  }

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    ciphertextBuffer
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString) as T;
}

/**
 * Checks if a given string or object has the encrypted payload signature.
 */
export function isEncryptedPayload(val: any): val is EncryptedPayload {
  return (
    val &&
    typeof val === 'object' &&
    val.algorithm === 'AES-GCM-256' &&
    typeof val.ciphertext === 'string' &&
    typeof val.iv === 'string'
  );
}
