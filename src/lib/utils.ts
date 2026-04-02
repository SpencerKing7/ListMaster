import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
