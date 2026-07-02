# Clipboard — Chrome Extension

Local-first text snippet manager. Save, search, categorize, and copy text from the toolbar popup — no account, no cloud, no tracking.

## Load unpacked (development)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this repository folder
4. Pin the extension from the toolbar puzzle menu

## Features

- Add / search snippets in one composer
- Custom categories with drag reorder
- Copy, edit, delete with confirmation
- Light / dark / system mode and accent themes
- Optional motion (Settings → Appearance)
- Export, import, and clear all data (Settings → Local storage)

## Permissions

- **`storage`** — saves snippets and preferences in `chrome.storage.local` on your device only

## Privacy

See [docs/privacy-policy.html](docs/privacy-policy.html). Host this file publicly and link it in the Chrome Web Store listing.

## Publishing

- **Your media:** [store/README.md](store/README.md) — icons, screenshots, promo tiles
- **Listing copy:** [store/LISTING.md](store/LISTING.md) — paste into Developer Dashboard
- **Data policy:** [docs/DATA.md](docs/DATA.md)

## Fonts

UI uses [Asta Sans](popup/fonts/Asta_Sans/OFL.txt) (SIL Open Font License).

## Tests

```bash
npm test
```

## Project docs

- [PROJECT_SETUP.md](PROJECT_SETUP.md) — build playbook
- [PROJECT_RETROSPECTIVE.md](PROJECT_RETROSPECTIVE.md) — lessons learned
