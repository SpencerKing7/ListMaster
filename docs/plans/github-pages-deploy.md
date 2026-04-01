# GitHub Pages Deployment Plan

**Goal:** Make `npm run deploy` perform a full production cycle — TypeScript check → Vite build → git stage → git commit (automated message) → git push to `main` → deploy built output to the `gh-pages` branch on GitHub Pages. `npm run build` remains a standalone build-only command.

---

## Overview

The approach uses two well-known tools:

| Tool                                               | Purpose                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| [`gh-pages`](https://github.com/tschaub/gh-pages)  | Pushes the `dist/` folder to a `gh-pages` branch on origin               |
| A shell `deploy` script (inline in `package.json`) | Chains: stage all → commit with timestamp → push `main` → run `gh-pages` |

`vite.config.ts` already has `base: "/ListMaster/"` and the PWA manifest already references `/ListMaster/` paths, so **no Vite config changes are needed**.

---

## Step 1 — Install `gh-pages`

Install `gh-pages` as a dev dependency:

```bash
npm install --save-dev gh-pages
```

This adds the `gh-pages` CLI binary, which is called by the deploy script.

---

## Step 2 — Update `package.json` scripts

Replace the current `"scripts"` block in `package.json` with the following:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "deploy": "npm run build && npm run deploy:commit && gh-pages -d dist -b gh-pages",
  "deploy:commit": "git add -A && git diff --cached --quiet || git commit -m \"build: deploy $(date +'%Y-%m-%d %H:%M:%S')\" && git push origin main"
}
```

### What each script does

| Script          | What it does                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `build`         | TypeScript type-check + Vite build only — no git side-effects                                                          |
| `deploy`        | Runs `build`, then `deploy:commit`, then pushes `dist/` to the `gh-pages` branch                                       |
| `deploy:commit` | Stages everything (`git add -A`), commits only if there are staged changes (avoids empty-commit errors), pushes `main` |

> **Note on the empty-commit guard:** `git diff --cached --quiet` exits 0 (success) when there is _nothing_ staged. The `||` means "if that succeeds (nothing to commit), skip the commit command". Without this guard, `git commit` would error when there is nothing new to commit.

---

## Step 3 — Enable GitHub Pages on the repository

1. Go to **github.com/SpencerKing7/ListMaster → Settings → Pages**.
2. Under **"Build and deployment"**, set **Source** to **"Deploy from a branch"**.
3. Set **Branch** to `gh-pages` and folder to `/ (root)`.
4. Save.

After the first `npm run build`, GitHub will serve the app at:
`https://spencerking7.github.io/ListMaster/`

---

## Step 4 — Add `dist/` to `.gitignore` (important!)

The `gh-pages` package handles pushing `dist/` to the `gh-pages` branch itself. The `dist/` directory **must remain in `.gitignore`** (or be added if not already present) so it is never committed to `main`. This is already the Vite default, but verify the `.gitignore` contains:

```
dist/
```

If `.gitignore` does not exist at the repo root, create it with at minimum:

```
# Build output — deployed via gh-pages branch, not committed to main
dist/
node_modules/
```

---

## Step 5 — One-time: create `gh-pages` branch (optional)

`gh-pages` creates the branch automatically on first run, so this step is **optional**. However, if you want to pre-create it cleanly:

```bash
git checkout --orphan gh-pages
git rm -rf .
git commit --allow-empty -m "init gh-pages"
git push origin gh-pages
git checkout main
```

---

## Complete File Changes Summary

| File                 | Change                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `package.json`       | Add `gh-pages` to `devDependencies`; add `deploy` and `deploy:commit` scripts; update `build` script |
| `.gitignore`         | Verify `dist/` is listed (no change needed if already present)                                       |
| `vite.config.ts`     | **No changes needed** — `base: "/ListMaster/"` is already correct                                    |
| GitHub repo Settings | Enable Pages on `gh-pages` branch (one-time manual step)                                             |

---

## Resulting Workflow

```
npm run deploy
  └── npm run build
        └── tsc --noEmit               # TypeScript type-check
        └── vite build                 # Produce dist/
  └── npm run deploy:commit
        └── git add -A
        └── git commit -m "build: deploy 2026-04-01 12:00:00"  (skipped if nothing changed)
        └── git push origin main
  └── gh-pages -d dist -b gh-pages     # Pushes dist/ to gh-pages branch → GitHub Pages
```
