// src/lib/utils.ts
// Pure, framework-agnostic utility functions shared across the entire codebase.

/**
 * Capitalises the first character of a string, leaving the rest unchanged.
 * Used to ensure user-typed input always begins with an uppercase letter.
 */
export function capitalizeFirst(value: string): string {
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Capitalises the first character of every whitespace-separated word.
 * Applied to name, category, and group inputs so each word is always titled.
 */
export function capitalizeWords(value: string): string {
  return value.replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}

/**
 * Generates a cryptographically random 20-character sync code formatted
 * as XXXXX-XXXXX-XXXXX-XXXXX for readability.
 */
export function generateSyncCode(): string {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getRandomBytes } = require("expo-crypto") as { getRandomBytes: (count: number) => Uint8Array };
  const bytes = getRandomBytes(20);
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]);
  return [
    chars.slice(0, 5).join(""),
    chars.slice(5, 10).join(""),
    chars.slice(10, 15).join(""),
    chars.slice(15, 20).join(""),
  ].join("-");
}
