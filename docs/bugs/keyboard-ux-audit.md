# Keyboard UX Audit — ListMaster PWA

Date: 2026-04-19  
Scope: All `<input>` and shadcn `<Input>` usages across `src/`

---

## Summary

There are **9 distinct input surfaces** in the app. Keyboard behaviour is inconsistent across them — some have explicit `autoCapitalize`, `autoCorrect`, `enterKeyHint`, and `spellCheck` attributes; most do not. The result is that iOS Safari applies its own defaults unpredictably (sentence-case caps, red squiggles, wrong return-key label, etc.).

---

## Input Inventory & Current State

| #   | File                          | Purpose                           | `autoCapitalize` | `autoCorrect` | `spellCheck` | `enterKeyHint` | `inputMode` | Notes                                                                                  |
| --- | ----------------------------- | --------------------------------- | ---------------- | ------------- | ------------ | -------------- | ----------- | -------------------------------------------------------------------------------------- |
| 1   | `AddItemInput.tsx`            | Add checklist item                | `sentences`      | `off`         | —            | `send`         | —           | ✅ Best-configured input in the app                                                    |
| 2   | `OnboardingCategoryInput.tsx` | Create category (onboarding)      | `words`          | —             | —            | `send`         | —           | Missing `autoCorrect="off"`                                                            |
| 3   | `OnboardingSyncCodeInput.tsx` | Enter sync code (onboarding)      | `characters`     | —             | `false`      | —              | —           | Missing `enterKeyHint="done"`, missing `autoCorrect="off"`, missing `inputMode="text"` |
| 4   | `NameSection.tsx`             | User name (Settings)              | —                | —             | —            | —              | —           | No keyboard attributes at all                                                          |
| 5   | `AddCategoryDialog.tsx`       | Add category (Settings dialog)    | `words`          | —             | —            | —              | —           | Missing `autoCorrect="off"`, `enterKeyHint`, `spellCheck`                              |
| 6   | `AddGroupDialog.tsx`          | Add group (Settings dialog)       | `words`          | —             | —            | —              | —           | Same gaps as #5                                                                        |
| 7   | `RenameCategoryDialog.tsx`    | Rename category (Settings dialog) | —                | —             | —            | —              | —           | No keyboard attributes; pre-filled with existing name so iOS may autocorrect it        |
| 8   | `RenameGroupDialog.tsx`       | Rename group (Settings dialog)    | —                | —             | —            | —              | —           | No keyboard attributes                                                                 |
| 9   | `RenameItemDialog.tsx`        | Rename checklist item             | —                | —             | —            | —              | —           | No keyboard attributes; `autoFocus` only                                               |
| 10  | `AdoptSyncCodeDialog.tsx`     | Enter sync code (Settings dialog) | —                | —             | —            | —              | —           | No keyboard attributes at all; sync codes should be `characters` + `off`               |

---

## Issues by Category

### 1. Auto-Capitalisation — inconsistent across similar inputs

**Affected:** #4 (Name), #7 (Rename Category), #8 (Rename Group), #9 (Rename Item)

`autoCapitalize` defaults to `"sentences"` in iOS Safari on `<input type="text">`. That means:

- Renaming a category like "milk" → iOS forces "Milk" after submission and re-focus.
- Renaming an item mid-sentence (e.g. "almond milk") → iOS capitalises "Almond" on re-entry.
- The Name field in Settings has no `autoCapitalize`, so it also sentence-capitalises mid-typing.

**Recommendation:**

- Name field → `autoCapitalize="words"` (names are proper nouns).
- All rename dialogs (#7, #8, #9) → `autoCapitalize="words"` to match the add-flow convention.
- Review whether `"sentences"` is actually desired anywhere (currently it only lands on #1 and is arguably wrong there too — "add milk to the list" is all lowercase in most checklist apps).

---

### 2. Auto-Correct — on by default where it shouldn't be

**Affected:** #2, #4, #5, #6, #7, #8, #9

iOS autocorrect is on by default. For user-defined proper nouns (category names like "Costco Run", group names like "Spencer's Lists", item names like "LaraBar") autocorrect will:

- Change "LaraBar" → "Lamar" mid-type.
- Change "Costco" → "Costo" or similar.
- Underline and highlight every custom word as a misspelling.

`AddItemInput` already sets `autoCorrect="off"` — all other text inputs should match it.

**Recommendation:** Add `autoCorrect="off"` and `spellCheck={false}` to all 9 inputs. None of them benefit from autocorrect since they all accept user-defined proper nouns or codes.

---

### 3. Return/Enter Key Label — wrong or missing

**Affected:** #3, #4, #5, #6, #7, #8, #9, #10

`enterKeyHint` controls the label shown on the iOS return key (e.g. "Done", "Send", "Next", "Go"). Without it iOS shows the generic "return" key.

Current state:

- `AddItemInput` → `"send"` ✅ (feels fast, like tapping a send button)
- `OnboardingCategoryInput` → `"send"` ✅
- Everything else → no `enterKeyHint` → iOS shows "return" (confusing for a modal confirm action)

**Recommendation:**
| Input | Recommended `enterKeyHint` | Reason |
|-------|--------------------------|--------|
| Name (Settings) | `"done"` | Dismisses the field |
| Add Category dialog | `"done"` | Confirms the dialog action |
| Add Group dialog | `"done"` | Confirms the dialog action |
| Rename Category | `"done"` | Confirms the rename |
| Rename Group | `"done"` | Confirms the rename |
| Rename Item | `"done"` | Confirms the rename |
| Sync code (onboarding) | `"done"` | Final step in flow |
| Sync code (Settings dialog) | `"done"` | Confirms adoption |

---

### 4. Sync Code Inputs — wrong capitalisation and missing attributes

**Affected:** #3 (`OnboardingSyncCodeInput`), #10 (`AdoptSyncCodeDialog`)

Sync codes are uppercase alphanumeric (e.g. `XXXXX-XXXXX-XXXXX-XXXXX`).

- `OnboardingSyncCodeInput` has `autoCapitalize="characters"` — correct — but is missing `autoCorrect="off"`, `spellCheck={false}`, and `enterKeyHint="done"`.
- `AdoptSyncCodeDialog` has **none** of these attributes. iOS will autocorrect the dashes out or change letter sequences. Worse, it won't auto-uppercase the input the user is typing.

**Recommendation:** Both sync code inputs need the full set:

```tsx
autoCapitalize="characters"
autoCorrect="off"
spellCheck={false}
enterKeyHint="done"
inputMode="text"
```

---

### 5. Blur/Refocus Reset Hack — fragile on newer iOS

**Affected:** #1 (`AddItemInput`), #2 (`OnboardingCategoryInput`)

Both components use this pattern to reset iOS shift state after submit:

```ts
inputRef.current?.blur();
requestAnimationFrame(() => inputRef.current?.focus());
```

This works but is fragile — iOS 17+ sometimes drops focus entirely if the `rAF` fires during a transition or scroll. The standard replacement is to programmatically call `setSelectionRange(0, 0)` after clearing the value, which resets the caret without a blur/focus cycle and doesn't fight the keyboard.

**Recommendation:** Replace the blur/rAF pattern with:

```ts
store.addItemToSelectedCategory(trimmedName);
setNewItemName("");
HapticService.light();
// Reset caret position so iOS recalculates shift state without keyboard dismissal
requestAnimationFrame(() => {
  if (!inputRef.current) return;
  inputRef.current.setSelectionRange(0, 0);
});
```

---

### 6. `inputMode` — not set anywhere

None of the inputs set `inputMode`. This is a hint to the browser/OS about which virtual keyboard variant to show. For text-only inputs this defaults to `"text"` which is fine, but it is worth being explicit on sync code inputs (`inputMode="text"` prevents the numeric pad from appearing on some Android keyboards).

---

## Recommended Attribute Matrix (target state)

| Input                | `autoCapitalize` | `autoCorrect` | `spellCheck` | `enterKeyHint` | `inputMode` |
| -------------------- | ---------------- | ------------- | ------------ | -------------- | ----------- |
| Add Item             | `sentences`      | `off`         | `false`      | `send`         | —           |
| Onboarding Category  | `words`          | `off`         | `false`      | `send`         | —           |
| Onboarding Sync Code | `characters`     | `off`         | `false`      | `done`         | `text`      |
| Name (Settings)      | `words`          | `off`         | `false`      | `done`         | —           |
| Add Category         | `words`          | `off`         | `false`      | `done`         | —           |
| Add Group            | `words`          | `off`         | `false`      | `done`         | —           |
| Rename Category      | `words`          | `off`         | `false`      | `done`         | —           |
| Rename Group         | `words`          | `off`         | `false`      | `done`         | —           |
| Rename Item          | `words`          | `off`         | `false`      | `done`         | —           |
| Sync Code (Settings) | `characters`     | `off`         | `false`      | `done`         | `text`      |

---

## Effort Estimate

All fixes are attribute additions — no logic changes required. The blur/rAF refactor in `AddItemInput` and `OnboardingCategoryInput` is optional but worth doing as a resilience improvement.

- Low effort: ~10 attribute additions across 9 files.
- Medium effort: blur/rAF replacement in 2 files.
- Total risk: zero — these are HTML hint attributes, not behaviour changes.
