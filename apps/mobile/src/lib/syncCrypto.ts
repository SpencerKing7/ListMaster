// src/lib/syncCrypto.ts
// Client-side field encryption for sensitive Firestore fields.
// Derives a deterministic AES-GCM key from the sync code so all devices
// sharing the same code can encrypt/decrypt without any key exchange.
// Uses the WebCrypto API (crypto.subtle) available in Hermes (RN 0.71+).

const PBKDF2_ITERATIONS = 200_000;
const SALT = new TextEncoder().encode("listmaster-sync-v1");

/** Derives a 256-bit AES-GCM key from the given sync code via PBKDF2. */
async function deriveKey(syncCode: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(syncCode),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts a UTF-8 string using AES-GCM with a key derived from the sync code.
 * Returns a base64 string containing the 12-byte IV prepended to the ciphertext.
 */
export async function encryptField(syncCode: string, plaintext: string): Promise<string> {
  const key = await deriveKey(syncCode);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64-encoded AES-GCM blob produced by `encryptField`.
 * Returns the plaintext string on success.
 * Returns the original blob unchanged for legacy plaintext values (not valid base64).
 * Returns undefined if the blob is valid base64 but decryption fails — callers must
 * not store or display the raw encrypted blob as a name.
 */
export async function decryptField(syncCode: string, blob: string): Promise<string | undefined> {
  let combined: Uint8Array;
  try {
    combined = Uint8Array.from(atob(blob), (c) => c.charCodeAt(0));
  } catch {
    // Not valid base64 — this is a legacy plaintext value; return as-is.
    return blob;
  }
  try {
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await deriveKey(syncCode);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    // Valid base64 but decryption failed — return undefined rather than the
    // raw encrypted blob so callers never store or display it as a name.
    return undefined;
  }
}
