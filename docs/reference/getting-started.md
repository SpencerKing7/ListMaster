# Getting Started

This guide covers everything needed to run, build, and deploy the ListMaster PWA from a fresh clone.

---

## Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later (bundled with Node.js)
- A modern browser (Chrome, Safari, Firefox, or Edge) for development

---

## Installation

```zsh
git clone https://github.com/SpencerKing7/ListMaster.git
cd ListMaster
npm install
```

---

## Development

```zsh
npm run dev
```

Starts the Vite dev server. Open the URL printed in the terminal (typically `http://localhost:5173`). Hot module replacement is active — most changes appear without a full reload.

---

## Type Checking

TypeScript type checking runs automatically as part of the build, but you can run it standalone:

```zsh
npx tsc --noEmit
```

---

## Production Build

```zsh
npm run build
```

Runs `tsc --noEmit` (type-check) then `vite build`. Output goes to `dist/`. The build includes the compiled service worker and the Web App Manifest.

---

## Preview the Production Build Locally

```zsh
npm run preview
```

Serves the contents of `dist/` locally so you can verify the production build before deploying. Note that the `base: "/ListMaster/"` Vite config means assets are served under `/ListMaster/` — the preview server accounts for this automatically.

---

## Deployment

```zsh
npm run deploy
```

The deploy script does the following in sequence:

1. Runs `npm run build` to produce a fresh `dist/`.
2. Commits and pushes the current `main` branch.
3. Uses the `gh-pages` CLI package to publish the contents of `dist/` to the `gh-pages` branch of the repository.

GitHub Pages is configured to serve from the `gh-pages` branch. The live site is available at:

**https://spencerking7.github.io/ListMaster/**

### Why `base: "/ListMaster/"`

Vite's `base` config option prefixes all generated asset URLs. Because GitHub Pages serves the site at `https://spencerking7.github.io/ListMaster/` (a subpath, not the root), all JS/CSS/image URLs must begin with `/ListMaster/` or the browser will request them from the wrong path and receive 404s. The `base` setting in `vite.config.ts` handles this automatically at build time.

See also: `vite.config.ts`, `docs/plans/github-pages-deploy.md`.
