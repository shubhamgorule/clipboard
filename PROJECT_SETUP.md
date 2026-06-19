# Project Setup Playbook

**Read this before writing feature code.**  
Companion to [`PROJECT_RETROSPECTIVE.md`](./PROJECT_RETROSPECTIVE.md) (what went wrong). This doc is how to **set up right** so we don’t repeat it.

**Goal:** Figma-faithful Chrome extension, local-first, zero backend cost.  
**Rule:** No “quick prototype” that throws away storage, tokens, or component boundaries.

---

## 0. The mistakes we are explicitly avoiding

| Don’t | Do instead |
|-------|------------|
| Build features before pixels + tokens | **Phase 1 = shell + tokens only** |
| Put Figma sample text in `state` | **Empty data always**; samples only in Storybook/screenshots |
| Re-render entire popup on `input` | **Patch the DOM** (list, buttons) — keep inputs mounted |
| Use raw Figma SVG exports as `<img>` | **Clean script → inline SVG → `currentColor`** |
| Guess spacing from Tailwind dumps | **Copy numbers into `tokens.css` first** |
| Create components and leave them unwired | **One component = one PR = wired in popup** |
| Delete working storage to “start fresh” | **Strangler refactor** — keep `storage.js`, replace UI |
| Keep plans only in `~/.cursor/plans` | **Plans live in repo** (`docs/` or root `.md`) |
| Ship UI without persistence | **Storage works in commit 2**, not “later” |
| Two patterns for the same UX (e.g. two delete confirms) | **Pick one; delete the other** |

---

## 1. Definition of “setup complete”

Do **not** start Add/Search logic, categories, or settings until **all** of these are true:

```
□ Figma file URL + node IDs documented in README
□ tokens.css: colors, spacing, typography, shadows (from Figma, not guessed)
□ Fonts licensed and loading in extension context
□ Icon pipeline: cleaned SVGs in assets/ + inline icon component
□ Empty-state popup loads in Chrome (400×600, no sample rows)
□ chrome.storage.local: read/write one item round-trip works
□ Folder structure matches section 2 below
□ AGENTS.md or README: how to load unpacked + which Figma nodes map to which files
```

**Gate:** User opens popup → sees empty UI that **looks** like Figma default frame. Reload → data still there (even if list is empty). **Then** build interactions.

---

## 2. Repo structure (day one)

Create this skeleton **before** popup logic:

```
clipboard/
├── README.md                 # load extension, Figma links, node map
├── docs/
│   ├── FIGMA.md              # node IDs, states matrix, spacing table
│   └── DATA.md               # item schema, storage keys, migrations
├── manifest.json             # permissions, icons 16/48/128 from start
├── background/
│   └── service-worker.js     # onInstalled + migrations only (thin)
├── shared/
│   ├── storage.js            # getItems, setItems, subscribe pattern
│   ├── detector.js           # email | url | text → category
│   └── types.js              # JSDoc or TS types for Item
├── popup/
│   ├── index.html
│   ├── popup.js              # thin: init storage, mount views
│   ├── popup.css             # layout shell only at first
│   ├── views/                # default.js, search.js, settings.js
│   ├── assets/icons/         # cleaned SVGs only
│   └── fonts/
└── ui/
    ├── styles/tokens.css
    └── components/
        ├── iconButton.js
        ├── clipRow.js
        └── index.js
```

**Anti-pattern we used:** everything in one `popup.js` with in-memory `items: []`.  
**Correct:** `popup.js` calls `storage.getItems()` on open; mutations go through `storage.js`.

---

## 3. Figma workflow (non-negotiable)

### 3.1 Before coding a screen

1. Open exact node in Figma (e.g. `3008:7919` default, `3008:7920` search).
2. Run `get_design_context` for **that node only**.
3. Extract into `docs/FIGMA.md`:

| Token | Value | Figma source |
|-------|-------|--------------|
| `--cb-pad-x` | 16px | header px |
| `--cb-row-h` | 36px | Component 5 |
| … | … | … |

4. User confirms screenshot in Chrome **before** next screen.

### 3.2 Icons (every project)

```text
1. Export each icon from node 3008:7039 (or equivalent) at 24×24
2. Run clean script:
   - remove #2B2B2B background rects
   - remove dashed guide rects
   - stroke/fill → currentColor
   - keep viewBox="0 0 24 24" — never shrink viewBox
3. iconButton: wrapper 24px (md) or 18.667px (sm) inside 36px / 28px button
4. Never ship preserveAspectRatio="none" or width="100%" on root SVG
```

### 3.3 States matrix (fill before implementing rows)

| Component | Default | Hover | Edit | Delete confirm |
|-----------|---------|-------|------|----------------|
| clipRow | ✓ | ✓ | ✓ | ✓ |
| iconButton | ✓ | ✓ | pressed | danger |

One row in code per row in Figma. No “we’ll add edit later.”

---

## 4. Engineering rules

### 4.1 Rendering

```js
// ❌ NEVER on input
input.addEventListener("input", () => render());

// ✅ ALWAYS
input.addEventListener("input", () => {
  state.query = input.value;
  syncList();
  syncAddButton();
});
```

Full `render()` only for: mode change (default ↔ search), tab change, settings open/close.

### 4.2 Data

```js
// Item shape — document in docs/DATA.md
{ id: string, text: string, category: 'All'|'Mail'|'General'|'Socials', order: number }
```

- **Add** → `detector(text)` → category → `storage.save`
- **All tab** → show all items (not `category === 'All'`)
- **No seed data** in repo — `items` loads from storage or `[]`

### 4.3 Components

- One public component per Figma component set.
- Exported from `ui/components/index.js`.
- **If it’s not used in popup within the same PR, don’t merge it.**  
  (We failed this with `deleteDialog`.)

### 4.4 Extension-specific

| Item | Value |
|------|--------|
| Popup size | 400×600 |
| `viewport` | `width=400` |
| `html, body` | fixed width/height, `overflow: hidden` |
| CSP | `'self'` only |
| Permissions | `storage` only until a feature truly needs more |

---

## 5. Phased delivery (do in order)

### Phase 1 — Foundation (no user-facing features)

- [ ] Repo skeleton (section 2)
- [ ] `tokens.css` from Figma
- [ ] Fonts + manifest icons
- [x] `storage.js` + empty list persistence
- [ ] Static popup shell matching `3008:7919` (empty list)

**Exit:** Reload extension → layout correct, storage empty, no console errors.

### Phase 2 — Components

- [ ] `iconButton` (md/sm, tooltip, danger) — node `3008:7002`
- [ ] `clipRow` (default/hover/edit) — node `3008:7462`
- [ ] Story: render components in a test HTML page **or** empty popup with one hardcoded row **then remove**

**Exit:** Hover row matches Figma screenshot pixel-check.

### Phase 3 — Core flows (wired to storage)

- [ ] Add / Search mode (`3008:7920`) — Enter to add, placeholder = “Add / Search”
- [ ] Tabs filter list
- [ ] Copy / edit / delete (one confirm pattern) / reorder
- [ ] Detector on add

**Exit:** Add → reload → item still there. Tabs filter correctly.

### Phase 4 — Settings & polish

- [ ] Settings screen from Figma
- [x] Export / import / clear
- [ ] Edge cases: long text, empty search, escape to cancel

---

## 6. PR / commit discipline

**One vertical slice per commit:**

```text
good:  "Add storage layer and load empty list on popup open"
good:  "Implement clipRow hover dock per Figma 3008:7462"
bad:   "Fix icons + spacing + search + delete + fonts"
```

Before push:

```
□ No placeholder user data (no shubhamgorule, no lorem rows)
□ No dead components (or issue filed to wire them)
□ Loaded unpacked in Chrome once
□ PROJECT_RETROSPECTIVE not required to understand current state
```

---

## 7. Agent / AI instructions (paste into chat)

When starting work on this repo:

```text
1. Read PROJECT_SETUP.md and docs/FIGMA.md first.
2. Do not add features until Phase 1 exit criteria pass.
3. For any UI task, cite the Figma node ID before editing CSS.
4. Do not call full render() on input events.
5. Do not add sample data to state — use storage or empty arrays.
6. One component per task; wire it before starting the next.
7. If exporting SVGs from Figma, run the clean pipeline — never commit raw MCP export.
```

---

## 8. README minimum (create on day one)

```markdown
# Clipboard

Local-first Chrome extension (MV3).

## Load
chrome://extensions → Load unpacked → this folder

## Figma
- File: [link]
- Default popup: 3008:7919
- Search: 3008:7920
- Row: 3008:7462

## Docs
- PROJECT_SETUP.md — how we work
- PROJECT_RETROSPECTIVE.md — what went wrong last time
- docs/FIGMA.md — tokens + states
- docs/DATA.md — storage schema
```

---

## 9. Current project gap list (honest)

Use this as the **ordered backlog** for Clipboard v1 — not new exploration:

1. ~~Add `shared/storage.js` and wire popup (items still work after reload)~~ — done
2. Fix “All” tab to show all categories — done
3. ~~Add `detector.js` on add~~ — done
4. Wire **one** delete confirmation (remove duplicate pattern)
5. Implement settings from Figma (replace stub)
6. Manifest toolbar icons
7. Split `popup.js` into `views/`

Do **not** start a parallel rewrite. Strangler only.

---

## 10. One-page checklist (print this)

```
SETUP
 □ Figma nodes documented
 □ tokens.css complete
 □ Icons cleaned + iconButton works
 □ Storage round-trip works
 □ Empty UI matches Figma default
 □ No seed data anywhere

WHILE BUILDING
 □ No full render on input
 □ Spacing from tokens only
 □ Component wired same PR
 □ User verified screenshot

BEFORE SHIP
 □ Reload persists data
 □ All icon states match Figma
 □ README + docs in repo
 □ Pushed to GitHub
```

---

**Summary:** Setup is not “scaffold folders.” Setup is **tokens + storage + empty Figma-accurate shell** with gates between phases. Features come after the foundation would survive a reload and a design review.

*If you’re about to skip a gate “to move faster,” you’re about to repeat the Clipboard rebuild.*
