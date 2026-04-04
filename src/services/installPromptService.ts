// src/services/installPromptService.ts

const DISMISSED_AT_KEY = "installToastDismissedAt";
const SHOW_COUNT_KEY = "installToastShowCount";
const PERMANENTLY_DISMISSED_KEY = "installToastPermanentlyDismissed";

/** Stateless I/O singleton for install-toast persistence. */
export const InstallPromptService = {
  // ── Dismissed At ──
  getDismissedAt(): string {
    return localStorage.getItem(DISMISSED_AT_KEY) ?? "";
  },
  setDismissedAt(timestamp: string): void {
    localStorage.setItem(DISMISSED_AT_KEY, timestamp);
  },

  // ── Show Count ──
  getShowCount(): number {
    return parseInt(localStorage.getItem(SHOW_COUNT_KEY) ?? "0", 10) || 0;
  },
  setShowCount(count: number): void {
    localStorage.setItem(SHOW_COUNT_KEY, String(count));
  },

  // ── Permanently Dismissed ──
  getPermanentlyDismissed(): boolean {
    return localStorage.getItem(PERMANENTLY_DISMISSED_KEY) === "true";
  },
  setPermanentlyDismissed(value: boolean): void {
    localStorage.setItem(PERMANENTLY_DISMISSED_KEY, String(value));
  },

  // ── Convenience ──
  /** Returns true if all persistence checks pass (not permanently dismissed,
   *  show count < 3, 7-day cooldown elapsed). Does NOT check standalone mode
   *  or keyboard state — those are component-level concerns. */
  shouldShow(): boolean {
    if (this.getPermanentlyDismissed()) return false;
    if (this.getShowCount() >= 3) return false;

    const raw = this.getDismissedAt();
    if (raw) {
      const ms = Date.now() - new Date(raw).getTime();
      if (Number.isNaN(ms)) return true; // corrupted date → treat as never dismissed
      if (ms < 7 * 24 * 60 * 60 * 1000) return false; // within cooldown
    }
    return true;
  },

  /** Records a dismissal: saves timestamp + increments show count. */
  recordDismissal(): void {
    this.setDismissedAt(new Date().toISOString());
    this.setShowCount(this.getShowCount() + 1);
  },

  /** Clears all three keys. Called from resetToNewUser(). */
  clearAll(): void {
    localStorage.removeItem(DISMISSED_AT_KEY);
    localStorage.removeItem(SHOW_COUNT_KEY);
    localStorage.removeItem(PERMANENTLY_DISMISSED_KEY);
  },
};
