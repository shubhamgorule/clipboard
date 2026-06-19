# Clipboard Extension — Project Retrospective

A honest post-mortem of how this Chrome extension was built, where we drifted from Figma and from good engineering practice, and what to do differently on the next project.

**Audience:** You (or an agent) starting a similar Figma → MV3 extension rebuild.

**Figma file:** `xtG35dXXwmC7W328JdTwfi`  
**Key nodes:** `3008:7919` (default popup), `3008:7920` (add/search focused), `3008:7462` (row states), `3008:7002` (icon button), `3008:7039` (icon set)

---

## 1. What we actually did (timeline)

### Phase A — “Ship the product” (then thrown away)

We built a **full MV3 extension** in one pass:

- `chrome.storage.local` persistence
- Snippet detector (email / link / text)
- Popup: tabs, add flow, settings, export/import
- Drag-and-drop reorder
- Hover-only row actions

**Problems surfaced in use:**

- Full-row hover highlight (user wanted icons only)
- Cursor jumping in inputs
- Auto-generated labels on paste (user did not want this)
- Runtime error (`svgIcon is not defined`)
- UI did not match Figma

**Outcome:** User asked to **delete almost everything** and rebuild from Figma only, keeping planning intent.

### Phase B — Reset + design system

1. Exported icons from Figma MCP → `popup/assets/*.svg` (names like `solar__settings-linear.svg`)
2. Created `ui/components/` (`iconButton`, `clipRow`) + `ui/styles/tokens.css`
3. Mapped **Asta Sans** (SemiBold 600, Bold 700)
4. Rebuilt popup shell: header, Add/Search, tabs, list, search mode toggle

### Phase C — Fit & polish (most of the pain)

| Area | Work |
|------|------|
| Layout | Fixed 400×600, tab padding vs height, row width, viewport meta |
| Icons | Wrong settings SVG, `preserveAspectRatio="none"`, re-export from Figma, inline SVG + `currentColor` |
| Spacing | Tokenized Figma values; dock gap 0 → user asked 4px |
| Data | Removed seed text / `shubhamgorule` placeholder |
| Input | Stopped full `render()` on every keystroke (cursor fix) |
| Row actions | Copy, edit, delete confirm, reorder, edit mode (reset / close / confirm) |
| Tooltips | Custom labels centered below icons |
| Delete | Inline dock confirm (separate `deleteDialog` component exists but unused) |

### Phase D — Where we stopped (updated)

- **`chrome.storage.local` wired** — items and labels persist via `shared/storage.js` (since commit `106b8fc`)
- **Service worker** runs migrations and restricts storage to trusted extension contexts
- **Settings** — category management plus export / import / clear-all data controls
- **Categories** — user-defined labels; detector suggests Mail/General/Socials when those labels exist
- **No toolbar icons** in `manifest.json` (16/48/128)
- **No README** for load/test workflow in repo

---

## 2. Misalignments (root causes)

### 2.1 Process misalignments

| Mistake | What happened | Cost |
|---------|----------------|------|
| **Build before design lock** | Full app → delete → rebuild | Weeks of logic thrown away (storage, detector, settings) |
| **Figma as reference, not source of truth** | Guessed CSS from memory/Tailwind dumps | Multiple “font/width/icons wrong” rounds |
| **Seed/demo data in production UI** | Figma sample strings + `shubhamgorule` in state | User thought app was “broken” or unfinished |
| **Components built but not integrated** | `deleteDialog.js` exists; popup uses inline confirm | Duplicate patterns, wasted file |
| **Plan outside repo** | `~/.cursor/plans/...` | Context lost when chat resets |

### 2.2 Figma → code misalignments

| Mistake | Symptom | Fix that finally worked |
|---------|---------|-------------------------|
| Raw Figma SVG exports used as-is | Dark `#2B2B2B` rects, purple guide borders, wrong colors | Strip artifacts; `stroke/fill="currentColor"` |
| “Fixing” SVGs with tight `viewBox` | Icons stretched / wrong scale | Keep **24×24** Figma frame; scale wrapper only |
| `preserveAspectRatio="none"` + `width/height="100%"` | Distorted icons in square buttons | Remove; use `object-fit` or inline SVG |
| Tab CSS: `height: 28px` + `padding: 16px 12px` | Tabs bloated or text crushed | `padding: 0 12px` only |
| Row `width: 400px` inside padded parent | Horizontal overflow | `width: 100%` |
| `viewport: width=device-width` in extension popup | Odd scaling | `width=400` |
| Icon button padding ignored | Hover dock icons felt wrong | Match Figma: 36×36 + 8px pad (md), 28×28 + 6.222px (sm), icon layer 24 / 18.667 |
| Assumed dock `gap: 8px` from generic flex | Spacing didn’t match design | Figma hover dock had **no** gap; user later requested **4px** |

### 2.3 Architecture misalignments

| Mistake | Symptom | Better approach |
|---------|---------|-----------------|
| **Full `render()` on every input** | Cursor disappears; must click again to type | Update only list + Add button state; keep input mounted |
| **Monolithic `popup.js`** | Hard to test; state scattered | Split: `storage.js`, `state.js`, `views/`, `actions/` |
| **In-memory state after storage existed** | Reload loses all snippets | Storage adapter first; UI reads/writes through it |
| **Category filter `category === "All"`** | Items only show on All tab | Detector assigns category on add; “All” = union |

### 2.4 UX misalignments (user feedback vs implementation)

| User said | We did wrong first | Correct behavior |
|-----------|-------------------|------------------|
| “Font size and width messed up” | Patched individual rules | Audit all Figma typography + box model together |
| “Icons distorted” | CSS-only fixes on broken assets | Fix SVG source, then CSS |
| “Settings icon wrong” | Corrupt/truncated SVG (circle only) | Re-export node `3008:6978` |
| “Don’t add reference text” | Left Figma copy in `state.items` | Empty `items: []`, empty `query` |
| “Placeholder shouldn’t say Search” | `placeholder="Search"` | `placeholder="Add / Search"` |
| “Delete should ask confirmation” | Immediate delete | Confirm step (dialog or dock) |
| “Tooltip below icon center” | `title` attribute | Custom `.cb-iconButtonTooltip` |

---

## 3. What needs to be improved (prioritized)

### P0 — Must have before calling it “v1”

1. **`chrome.storage.local`** — load on popup open, save on add/edit/delete/reorder — **done**
2. **Category detector** on add (email → Mail, URL → Socials or General, else General) — **done** (when matching labels exist)
3. **Persist edit/delete/reorder** through storage — **done**
4. **Export / import / clear** in settings — **done**
5. **Toolbar icons** in manifest
6. **One delete UX** — either wire `createDeleteDialog` or remove it; don’t maintain both
7. **Commit + README** — how to load unpacked, Figma node map, font license note

### P1 — Design fidelity

1. **Screenshot diff checklist** per Figma node (default, search, row hover, row edit)
2. **Spacing tokens only** — no magic numbers in component CSS unless tokenized
3. **Icon pipeline script** — download from Figma → strip rects → `currentColor` → validate 24×24 viewBox
4. **Settings screen** from Figma (export/import/clear) — **done**

### P2 — Engineering quality

1. **Partial renders** — `renderHeader()`, `renderList()`, `renderSearchBar()` instead of `replaceChildren(build())`
2. **TypeScript or JSDoc** for item shape `{ id, text, category, order }`
3. **Migrations** in service worker (`onInstalled` version bumps) — **done**
4. **Minimal tests** for detector + storage round-trip — **storage schema tests done**; detector tests pending

---

## 4. Playbook for the next project

### Before writing feature code

```
□ Export Figma spacing/type table → tokens.css (one :root block)
□ Export icons once per node (3008:7039 children) → clean SVG script
□ List all states as a matrix (component × default/hover/edit/error)
□ Agree: no seed data in repo, ever
□ Storage schema + detector spec in repo (docs/DATA.md or types.ts)
□ Screenshot or Figma link in README per screen
```

### Figma → CSS rules that saved us (when followed)

- Extension popup: `width=400` viewport, `html/body` fixed 400×600
- Rows: `height: 36px`, `padding: 0 16px`, `align-items: center` (ignore contradictory `py` in Tailwind dumps)
- Icon button md: **36px** box, **8px** padding, **24px** icon layer
- Icon button sm (row dock): **28px** box, **6.222px** padding, **18.667px** icon layer
- Hover dock: `right: 16px`, `padding: 4px`, `border-radius: 14px`, `gap: 4px` (after user confirmation)
- Font: Asta Sans 600 (UI), 700 (title only)

### Figma → SVG rules

```bash
# After MCP download, always:
# 1. Remove <rect fill="#2B2B2B">
# 2. Remove dashed purple guide rects
# 3. Replace #1A1A1A with currentColor
# 4. Keep viewBox="0 0 24 24" from component export — do NOT shrink viewBox
```

### Icon implementation rule

**Prefer:** inline SVG via fetch + `currentColor` + sized wrapper  
**Avoid:** `<img src="*.svg">` with Figma-exported `preserveAspectRatio="none"`

### Input / focus rule

**Never** call full DOM rebuild on `input` events. Pattern:

```js
input.addEventListener("input", () => {
  state.query = input.value;
  syncListOnly();
  syncAddButtonDisabled();
});
```

### Agent / AI collaboration rule

When user says “match Figma node X”:

1. Call `get_design_context` for **that exact node**
2. Implement **one component** completely
3. User verifies in Chrome **before** next component
4. Do not batch “fix fonts + icons + spacing” in one opaque pass

---

## 5. Current repo map (as of this doc)

```
clipboard/
├── manifest.json              # MV3; storage permission; no icons yet
├── docs/DATA.md               # storage schema, limits, Chrome policy notes
├── background/service-worker.js # migrations + storage access restriction
├── shared/
│   ├── storage.js             # chrome.storage.local adapter
│   ├── storageSchema.js       # validation, migration, export/import (testable)
│   └── categoryDetector.js
├── popup/
│   ├── index.html
│   ├── popup.js               # all app state + views (monolith)
│   ├── popup.css
│   ├── assets/*.svg           # Figma icons (cleaned)
│   └── fonts/Asta_Sans/
└── ui/
    ├── styles/tokens.css      # colors, spacing, fonts
    └── components/
        ├── iconButton.js/css  # inline SVG, tooltips, danger variant
        ├── clipRow.js/css     # default / hover / edit / delete-confirm
        ├── deleteDialog.js/css # wired for delete + clear-all confirm
        ├── settingsView.js/css # categories + export/import/clear
        └── index.js
```

---

## 6. Wise defaults checklist (print this)

| Question | Wrong answer we took | Right answer |
|----------|----------------------|--------------|
| Start with features or pixels? | Features first | Pixels + tokens first, then wire storage |
| Use Figma sample text? | Yes, in `state` | Never; empty arrays |
| Re-render whole popup on typing? | Yes | No |
| Trust exported SVG? | Yes | Clean pipeline always |
| One big delete of working code? | Yes | Strangler: keep storage, replace UI |
| Match Figma spacing from memory? | Yes | Tokens from `get_design_context` |
| Ship without persistence? | Yes | Storage is day-one |
| Multiple confirm-delete UIs? | Yes | One pattern |

---

## 7. Suggested next session order

1. ~~Add `shared/storage.js` + load/save in `popup.js` `init()`~~ — done
2. Fix “All” tab to show all categories — done
3. ~~Add `detector.js` on add~~ — done (`categoryDetector.js`)
4. ~~Wire settings view (export/import/clear)~~ — done
5. Delete `confirmDeleteId` dock **or** switch to `createDeleteDialog` — not both
6. Add manifest icons + root README
7. Figma screenshot pass for `3008:7919` and `3008:7462` hover
8. Commit with message reflecting each vertical slice

---

## 8. One-line summary

We built a product twice: first too much logic with the wrong UI, then the right UI with too little persistence — and most of the pain was **treating Figma exports as drop-in assets** and **re-rendering the whole popup** instead of respecting the design’s box model and keeping state in storage from day one. Storage, export/import, and migrations are now in place; see `docs/DATA.md`.

---

*Generated from the full Clipboard extension conversation (plan → build → reset → Figma rebuild → icon/spacing/UX iterations). Update this file when storage, settings, or delete UX lands.*
