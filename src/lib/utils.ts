import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

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
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  const chars = Array.from(arr, (byte) => ALPHABET[byte % ALPHABET.length]);
  return [
    chars.slice(0, 5).join(""),
    chars.slice(5, 10).join(""),
    chars.slice(10, 15).join(""),
    chars.slice(15, 20).join(""),
  ].join("-");
}
