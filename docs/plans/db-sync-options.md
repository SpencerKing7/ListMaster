# DB Sync Options — Feasibility Research & Plan

**Branch:** `db-storage-research`  
**Goal:** Add free (or near-free) cloud database sync so users can share data across devices and so data survives browser-cache clears.  
**Date:** 2026-04-02

---

## Context

Today, all ListMaster data lives in `localStorage` via `PersistenceService` (key: `"grocery-lists-state"`). The full state is a single JSON blob — an array of `Category` objects, each containing `ChecklistItem[]`. This is tiny: even a power user with 10 categories × 50 items × ~100 bytes per item is only ~50 KB. The sync problem is therefore a **lightweight document sync** problem, not a heavy relational data problem.

Key constraints for any solution:

- **PWA on GitHub Pages** — static host, no server of our own. Any backend must be external.
- **No existing auth system** — users have no accounts today. Any DB solution requires adding auth.
- **Offline-first** — the app must still work without connectivity (current `localStorage` behavior preserved).
- **Tiny data shape** — the whole state fits in one JSON document per user, easily under 100 KB.
- **Zero budget** — must work entirely on a free tier, or be close enough to free that tiny usage never bills.
- **Low complexity** — we have no dedicated backend team. Self-hosting ops burden must be minimal.

---

## Data Shape Reminder

```ts
// What needs to persist per user:
{
  lists: Category[];       // categories with items nested inside
  selectedListID: string | null;
}
```

One document per user. No joins, no complex queries, no aggregate functions needed. This maps naturally to any document or key-value store.

---

## Options Evaluated

### Option 1 — Firebase Firestore (Free Spark Plan)

**What it is:** Google's managed NoSQL document database with real-time sync and offline support via SDK.

**Free tier (as of 2026-04-02):**

- 1 GiB stored data
- 50,000 document reads / day
- 20,000 document writes / day
- 20,000 document deletes / day
- 10 GiB outbound data / month

**Fit for ListMaster:**
A user syncing their list might write ~10–30 times a day (each item add/toggle/delete). 20,000 free writes/day handles ~660–2,000 daily active users without spending a cent.

✅ **Pros**

- Generous permanent free tier — no automatic pausing (unlike Supabase free projects).
- Official JS SDK with built-in offline persistence (IndexedDB cache) — true offline-first out of the box.
- Real-time `onSnapshot` listener gives instant multi-device sync.
- Authentication via Firebase Auth (anonymous auth is free, plus Google/Apple sign-in).
- Zero infrastructure to manage.
- Huge community, excellent React integration, stable since 2017.

⚠️ **Cons / Risks**

- Google vendor lock-in — no open-source escape hatch.
- Firebase SDK adds ~100–150 KB to the bundle (can be mitigated with tree-shaking via modular SDK v9+).
- Anonymous auth means data is tied to a device; user must explicitly link to a Google account to enable cross-device sync. Adds a deliberate auth UX step.
- If the app ever becomes popular, writes are the first quota to hit (20k/day). At $0.06 per 100k writes on Blaze plan, the cost is still trivial.

🔬 **Verdict:** ✅ **Recommended.** Best balance of free tier generosity, offline SDK, and zero-ops overhead for a static PWA.

---

### Option 2 — Supabase (Free Plan)

**What it is:** Open-source Firebase alternative — Postgres + PostgREST + Realtime + Auth.

**Free tier (as of 2026-04-02):**

- 500 MB database per project
- 5 GB egress / month
- 50,000 Monthly Active Users
- 2 million Realtime messages / month
- 200 Realtime peak connections
- **⚠️ Projects are paused after 1 week of inactivity on the free plan.**

**Fit for ListMaster:**
Data storage and auth limits are more than enough. The realtime channel can push list updates across devices.

✅ **Pros**

- Postgres under the hood — SQL queries, joins, full flexibility.
- Open-source: can self-host if ever needed.
- `supabase-js` client is small (~30 KB gzipped).
- Row-level security (RLS) policies make per-user data isolation easy.
- Great DX — dashboard, CLI, migrations.

⚠️ **Cons / Risks**

- **Automatic project pausing after 7 days of inactivity** is a major UX risk. A user who hasn't opened the app in a week will hit a cold-start delay of 20–60 seconds while the Postgres instance resumes. This breaks the "instant open" feel of a PWA.
- No native offline SDK — you'd need to combine Supabase Realtime with your own IndexedDB caching layer (Dexie.js or similar). Significantly more implementation work.
- Postgres is far more powerful than needed for a single-document-per-user sync problem.

🔬 **Verdict:** ⚠️ **Viable fallback, but not recommended.** The project-pausing behavior is a deal-breaker for occasional users, and the lack of an offline SDK means substantially more code.

---

### Option 3 — Dexie Cloud (Offline-First Sync-as-a-Service)

**What it is:** A sync layer built on top of Dexie.js (the most popular IndexedDB wrapper). Your data lives in IndexedDB locally and syncs to a hosted server.

**Free tier (as of 2026-04-02):**

- 3 production users (real accounts)
- Unlimited evaluation users (demo/testing)
- 100 MB storage
- 10 simultaneous connections
- 20 sync requests / 5 minutes per user

**Fit for ListMaster:**
The 3-production-user free limit is a hard wall. It's fine for a personal project you use alone, but not viable for distributing to others without paying €0.12/user/month.

✅ **Pros**

- Genuinely offline-first by design — IndexedDB is the source of truth, cloud is secondary.
- No auth system to build — Dexie Cloud handles identity.
- Sync conflict resolution built in.
- TypeScript-native, small client bundle.

⚠️ **Cons / Risks**

- **3 free production users** — completely unscalable for distribution.
- Replacing `localStorage` with Dexie would require rewriting the entire `PersistenceService` and store reducer architecture (since the reducer currently calls `PersistenceService.save()` synchronously — Dexie's IndexedDB calls are async).
- Paid tier is per-user pricing, which is expensive for a free app.
- Relatively small vendor compared to Google/Supabase.

🔬 **Verdict:** ❌ **Ruled out for public distribution** due to the 3-user free tier cap. Fine for solo use only.

---

### Option 4 — PocketBase (Self-Hosted)

**What it is:** An open-source Go binary that is a complete backend — SQLite database, REST API, real-time subscriptions, and auth — in a single ~11 MB executable.

**Cost:** $0 software license. But you must host it yourself.

**Cheapest realistic hosting:**

- Fly.io: ~$1.94/month for a `shared-cpu-1x 256MB` machine + ~$0.15/month for 1 GB volume = **~$2.10/month**
- Railway: `$5/month` Hobby plan (includes $5 of credits — could cover it entirely)
- Oracle Cloud Free Tier: 1 AMD VM with 1 GB RAM + 50 GB storage — **permanently free** (if you can get an account)

✅ **Pros**

- Zero SaaS lock-in — you own the data and can move it anywhere.
- Incredibly simple to run — single binary, no config files, no migrations for basic use.
- Built-in auth, REST API, real-time subscriptions, admin UI.
- SQLite storage is essentially unlimited for this use case.
- Open-source — can inspect/modify everything.

⚠️ **Cons / Risks**

- Requires managing a server (even a small one) — deploys, restarts, backups, TLS, uptime.
- Not truly free unless you use Oracle Cloud Free Tier (which has limited availability and a notoriously painful sign-up process).
- PocketBase is pre-v1.0 — "not recommended for production critical applications" per their own docs.
- Fly.io no longer has a free compute tier (legacy only); you'd pay ~$2/month minimum.
- Ops overhead is real: if the machine goes down, sync breaks for all users.

🔬 **Verdict:** ⚠️ **Viable for a technical user who wants full data ownership,** but not "free" in practice unless you use Oracle Cloud. Not the lightest path.

---

### Option 5 — Turso (LibSQL — Cloud SQLite)

**What it is:** Managed SQLite-compatible cloud database with embedded sync (local SQLite file + cloud replica).

**Free tier (as of 2026-04-02):**

- 100 databases
- 500 MB total storage
- 500M rows read / month
- 10M rows written / month
- 3 GB monthly syncs

✅ **Pros**

- SQLite locally + cloud replica = true offline-first.
- Generous free tier with no auto-pausing.
- Good for TypeScript/edge projects.

⚠️ **Cons / Risks**

- No built-in auth — you'd need a separate auth provider.
- No real-time push updates — sync is pull-based (you poll or trigger manually).
- "Embedded Replicas" work in Node.js/edge runtimes, but browser support requires a different approach (WebAssembly SQLite + custom sync via the platform REST API). Adds complexity.
- Less mature PWA/browser integration story compared to Firestore or Supabase.

🔬 **Verdict:** ⚠️ **Interesting but immature for browser-side offline-first sync.** Better suited to server-side or edge runtime use cases. More plumbing required than Firestore.

---

## Recommendation

> **Use Firebase Firestore + Firebase Auth (Anonymous → Google/Apple link).**

It is the only option that provides all four of:

1. A **permanent free tier** that won't pause inactive projects.
2. A **native offline SDK** that keeps the app working without connectivity — no extra IndexedDB layer to build.
3. **Real-time cross-device sync** via `onSnapshot` with no server required.
4. **Zero infrastructure** — works perfectly from a GitHub Pages static host.

The implementation approach is a **soft account model**: users get an anonymous Firebase account automatically on first load (no sign-in required), with an optional "Link account" flow to attach a Google or Apple ID, enabling cross-device sync. Anonymous data is preserved when the user links their account.

---

## Implementation Plan

### Phase 0 — Prerequisites

- [ ] Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) (Spark / free plan).
- [ ] Enable **Cloud Firestore** (Native mode) and **Firebase Authentication** (Anonymous provider + Google provider).
- [ ] Install the modular Firebase v9+ SDK (tree-shakable):
  ```
  npm install firebase
  ```
  Estimated bundle addition: ~35 KB gzipped (modular `firestore`, `auth`).

---

### Phase 1 — Add Firebase Config & Service

**Files to create:**

- `src/services/firebaseConfig.ts` — exports the initialized `FirebaseApp`, `Firestore`, and `Auth` instances. API keys are public (protected by Firestore security rules, not secrecy). Add them to a `.env` file as `VITE_FIREBASE_*` variables and gitignore the `.env`.

**Files to create:**

- `src/services/syncService.ts` — a stateless service that wraps Firestore read/write for the user's list document. API:
  ```ts
  SyncService.saveState(uid, categories, selectedCategoryID): Promise<void>
  SyncService.loadState(uid): Promise<{ categories, selectedCategoryID } | null>
  SyncService.subscribeToState(uid, callback): () => void  // returns unsubscribe fn
  ```
  Document path: `users/{uid}/data/lists` — single document per user.

---

### Phase 2 — Add Auth Store

**Files to create:**

- `src/store/useAuthStore.ts` — a new React Context + `useState` provider that:
  - On mount, calls `onAuthStateChanged`. If no user, calls `signInAnonymously()`.
  - Exposes `{ user, isAnonymous, linkWithGoogle, signOut }`.
  - The `user` object gives us the `uid` to use as the Firestore document path key.

**Files to modify:**

- `src/main.tsx` — wrap the provider tree with `<AuthProvider>` (outermost layer, before `SettingsProvider`).

---

### Phase 3 — Wire Sync into the Categories Store

**Files to modify:**

- `src/store/useCategoriesStore.ts`:
  - After every state mutation that currently calls `PersistenceService.save()`, also call `SyncService.saveState(uid, ...)` (debounced — 1.5 s debounce so rapid item toggles don't fire a write per keystroke).
  - Add a `SYNC_LOAD` action that accepts a `{ categories, selectedCategoryID }` payload and replaces state (similar to `RELOAD`, but from cloud).
  - On store initialization, after loading from `localStorage`, call `SyncService.subscribeToState(uid, ...)` so that when another device writes an update, the listener fires `dispatch({ type: "SYNC_LOAD", ... })`.
  - **Conflict strategy:** last-write-wins (Firestore `setDoc` with `merge: false`). Simple and appropriate for a single-user list app.

---

### Phase 4 — Add Firestore Security Rules

In the Firebase console (or `firestore.rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/data/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures each user can only read/write their own data.

---

### Phase 5 — Optional: Account Linking UI

Add a "Sync across devices" row to `SettingsSheet.tsx`:

- If `isAnonymous === true`: show a **"Sign in with Google"** button. On tap, call `authStore.linkWithGoogle()`. This merges the anonymous account into the Google account and preserves all existing data.
- If signed in with Google: show their profile picture/name and a **"Sign out"** option.
- No new screens required — this lives entirely within `SettingsSheet`.

---

### Phase 6 — Graceful Degradation

- If Firestore is unreachable (no connectivity), the Firebase SDK automatically falls back to its local IndexedDB cache and queues writes for when connectivity is restored. No special code needed.
- `localStorage` via `PersistenceService` is kept as-is — it remains the fast synchronous read source on app launch. Cloud sync is additive, not a replacement.

---

## File Summary

| File                              | Action | Notes                                                         |
| --------------------------------- | ------ | ------------------------------------------------------------- |
| `.env`                            | Create | `VITE_FIREBASE_API_KEY`, etc.                                 |
| `.env.example`                    | Create | Template for other contributors                               |
| `src/services/firebaseConfig.ts`  | Create | Firebase app init                                             |
| `src/services/syncService.ts`     | Create | Firestore read/write/subscribe                                |
| `src/store/useAuthStore.ts`       | Create | Auth context + anonymous sign-in                              |
| `src/main.tsx`                    | Modify | Add `<AuthProvider>`                                          |
| `src/store/useCategoriesStore.ts` | Modify | Debounced cloud save + `SYNC_LOAD` action + subscribe on init |
| `src/screens/SettingsSheet.tsx`   | Modify | Add account-linking UI row                                    |
| `firestore.rules`                 | Create | Security rules                                                |

---

## Cost Estimate

For a small personal app with ~50 daily active users making ~30 writes/day each:

- **Writes:** 50 × 30 = 1,500/day → well under the 20,000/day free limit.
- **Reads:** `onSnapshot` counts as 1 read on subscribe + 1 per update. ~100 reads/day → trivial.
- **Storage:** 50 users × ~50 KB each = 2.5 MB → trivial against the 1 GiB free limit.

**Realistic cost: $0/month indefinitely** unless the app grows to thousands of daily active users.
