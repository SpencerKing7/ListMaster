# Plan: Bottom Scroll Fade + Row Density Scaling

**Goal:** Two independent UI improvements for the `CategoryPanel` item list.

1. **Bottom fade** — mirror the existing top CSS mask fade so list content also fades into the `PageIndicator` / `BottomBar` at the bottom, using the same CSS mask technique (no color-mismatch).
2. **Row density scaling** — when the user changes the text size setting, the vertical padding of each `<li>` row should scale proportionally so the row itself shrinks/grows, not just the label text inside it.

---

## Part 1 — Bottom Scroll Fade

### Background

The top fade already exists in `CategoryPanel`'s scroll container:

```ts
// src/components/CategoryPanel.tsx  (line ~242)
style={{
  maskImage: "linear-gradient(to bottom, transparent, black 24px, black)",
  WebkitMaskImage: "linear-gradient(to bottom, transparent, black 24px, black)",
}}
```

This is a CSS mask that fades the top 24 px of the list. Because it operates on **transparency** (not paint), it works correctly over the composite background (solid color + diagonal brand gradient) — unlike a gradient overlay `<div>` which only approximates the solid color and produces a visible mismatch band (see Known Issue #2 in the snapshot).

The `PageIndicator` row sits immediately below the scroll container inside the `MainScreen` flex shell. The `BottomBar` sits below that. Both use a gradient background, but the mask approach in `CategoryPanel` is cleaner and already proven.

### Approach

Extend the existing `maskImage` value to also fade the **bottom** of the scroll container. CSS mask gradients can be composed with a comma (each gradient applies to a separate mask layer), but for a single `linear-gradient` property we use a multi-stop single gradient instead.

Current:

```
linear-gradient(to bottom, transparent, black 24px, black)
```

New (adds a fade-out zone in the last 32 px):

```
linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)
```

This single gradient:

- Fades **in** the top 24 px (same as today).
- Holds fully opaque black from 24 px to `calc(100% - 32 px)` (the full visible body of the list).
- Fades **out** the bottom 32 px so content dissolves before it reaches the page dots.

32 px is chosen to match the visual footprint of the `PageIndicator` row (`py-2` ≈ 8 px top + 6 px dot + 8 px bottom = ~22 px) with a comfortable bleed margin. This can be tuned without touching layout.

> **Why not add a mask on the `PageIndicator` wrapper?** The mask needs to apply to the _scrollable content_, not the indicator itself. Masking the indicator wrapper would fade the dots, not the list. The scroll container in `CategoryPanel` is the correct place — it is already the element that owns the top fade.

### File to change

**`src/components/CategoryPanel.tsx`**

In the `<div className="flex-1 overflow-y-auto overscroll-contain">` element's `style` prop, update both `maskImage` and `WebkitMaskImage`:

```diff
- maskImage: "linear-gradient(to bottom, transparent, black 24px, black)",
- WebkitMaskImage: "linear-gradient(to bottom, transparent, black 24px, black)",
+ maskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)",
+ WebkitMaskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)",
```

Also increase `pb-4` on the `<ul>` to `pb-10` so the last item is not permanently hidden under the fade-out zone. At `pb-10` (40 px), the list can always scroll its last item up into the fully-opaque zone above the fade.

```diff
- <ul className="flex flex-col gap-2 pt-3 pb-4">
+ <ul className="flex flex-col gap-2 pt-3 pb-10">
```

That is the **only** change for Part 1. No changes to `MainScreen`, `PageIndicator`, `BottomBar`, or `tokens.css`.

---

## Part 2 — Row Density Scaling (Padding Follows Text Size)

### Background

Each list item row is a `<li>` with hardcoded `py-3.5` (`padding-top/bottom: 0.875rem = 14 px`):

```tsx
// CategoryPanel.tsx line ~252
<li className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] ...`}>
```

The item label inside uses `fontSize: "var(--text-size-base)"`. When the user chooses `xs` (0.6875 rem ≈ 11 px) vs. `xl` (1.3125 rem ≈ 21 px), the text changes size but the row padding stays fixed at 14 px on both sides. This makes the row feel oversized at small text sizes and undersized at large.

### Approach

Introduce a `--row-padding-y` CSS custom property on `:root` that is set alongside `--text-size-base` by `applyTextSizeToDOM`. Each text size maps to a vertical padding value that shrinks/grows with the text:

| TextSize | `--text-size-base` | `--row-padding-y`  | Row feel            |
| -------- | ------------------ | ------------------ | ------------------- |
| `xs`     | 0.6875 rem         | `0.45rem` (≈7 px)  | Dense, compact      |
| `s`      | 0.8125 rem         | `0.6rem` (≈10 px)  | Slightly compact    |
| `m`      | 1rem               | `0.875rem` (14 px) | Default — unchanged |
| `l`      | 1.125 rem          | `1.0rem` (16 px)   | Comfortable         |
| `xl`     | 1.3125 rem         | `1.25rem` (20 px)  | Spacious            |

The `<li>` then uses an inline style for vertical padding instead of the Tailwind class:

```tsx
style={{
  paddingTop: "var(--row-padding-y)",
  paddingBottom: "var(--row-padding-y)",
  // ...other existing style props
}}
```

The horizontal padding `px-4` and border radius `rounded-[14px]` are **unchanged** — only `py-3.5` is replaced.

### Files to change

#### 1. `src/store/useTheme.ts`

Add a `ROW_PADDING_VALUES` map alongside `TEXT_SIZE_VALUES`, then set the new property inside `applyTextSizeToDOM`:

```ts
const ROW_PADDING_VALUES: Record<TextSize, string> = {
  xs: "0.45rem",
  s: "0.6rem",
  m: "0.875rem",
  l: "1.0rem",
  xl: "1.25rem",
};

export function applyTextSizeToDOM(size: TextSize): void {
  const textValue = TEXT_SIZE_VALUES[size] ?? TEXT_SIZE_VALUES["m"];
  const paddingValue = ROW_PADDING_VALUES[size] ?? ROW_PADDING_VALUES["m"];
  document.documentElement.style.setProperty("--text-size-base", textValue);
  document.documentElement.style.setProperty("--row-padding-y", paddingValue);
}
```

#### 2. `src/styles/tokens.css`

Add a `--row-padding-y` default to each of the four `:root` rule blocks (light default, dark media, forced light, forced dark). The default value should match the `m` size so it matches the Tailwind class it replaces:

```css
--row-padding-y: 0.875rem;
```

This ensures the correct value is present on initial paint before `applyTextSizeToDOM` fires (though it fires synchronously during `SettingsProvider` init, so there is no visible flash).

#### 3. `src/components/CategoryPanel.tsx`

In the `<li>` element, replace `py-3.5` (Tailwind class) with an inline `paddingTop`/`paddingBottom` via `var(--row-padding-y)`. Merge the new padding into the existing `style` prop object:

```diff
  <li
-   className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] cursor-pointer ${
+   className={`flex items-center gap-3.5 px-4 rounded-[14px] cursor-pointer ${
      tappedId === item.id ? "scale-[0.97] opacity-80" : ""
    }`}
    style={{
+     paddingTop: "var(--row-padding-y)",
+     paddingBottom: "var(--row-padding-y)",
      backgroundColor: item.isChecked
        ? "rgba(var(--color-brand-deep-green-rgb), 0.04)"
        : "var(--color-surface-card)",
      boxShadow: item.isChecked ? "none" : "var(--elevation-card)",
      transition: tappedId === item.id
        ? "transform 80ms ease-out, opacity 80ms ease-out"
        : "background-color 200ms ease-out, box-shadow 200ms ease-out",
    }}
  >
```

No other files change. The `transition` on the `<li>` currently does not animate `padding` — that is intentional, to match the current behavior where text size changes are an immediate setting-apply rather than an animated transition.

---

## Summary of All File Changes

| File                               | Change                                                                                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/CategoryPanel.tsx` | (1) Extend mask gradient to fade bottom 32 px. (2) Change `pb-4` → `pb-10` on `<ul>`. (3) Remove `py-3.5` from `<li>` className, add `paddingTop`/`paddingBottom: "var(--row-padding-y)"` to `<li>` style. |
| `src/store/useTheme.ts`            | Add `ROW_PADDING_VALUES` map. Set `--row-padding-y` inside `applyTextSizeToDOM`.                                                                                                                           |
| `src/styles/tokens.css`            | Add `--row-padding-y: 0.875rem` to all four `:root` blocks.                                                                                                                                                |

**Total: 3 files. No new components. No store actions. No routing changes.**

---

## Snapshot Updates Required

After implementation, `docs/snapshots/main-screen-ui-snapshot.md` should be updated:

- **`CategoryPanel` → Scroll fade mask** section: update the `maskImage` value shown in the code block to the new four-stop gradient.
- **`CategoryPanel` → Full layout structure** section: update `pb-4` to `pb-10` in the `<ul>` line.
- **`CategoryPanel` → Item tap feedback** section: note that `py-3.5` has been replaced by `var(--row-padding-y)`.
- **What Is Confirmed Working** list: add entries for the bottom fade and row density scaling.
