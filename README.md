# Clipboard (Chrome Extension)

Local-first clipboard for snippets (text, links, emails) with smart categories.

## Features (v0.1)

- Tabs: **General**, **Email ID**, **Socials**, plus **custom categories**
- Add flow: paste content, smart detect **email/link/text**, auto-suggest category/label
- Copy-first: click any item to copy, then paste anywhere with Cmd/Ctrl+V
- Hover-only row actions: copy, reorder, delete
- Reorder: drag handle to reorder items (persisted)
- Settings: smart routing, tab assist, search scope, export/import, clear

## Install locally (unpacked)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `clipboard/` (the repo root containing `manifest.json`)

## Privacy / Safety

- No backend, no tracking, no analytics
- Data stored only in `chrome.storage.local` on the user’s machine
- No host permissions, no content scripts in v0.1

