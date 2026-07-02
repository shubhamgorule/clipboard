# Store assets — where to upload media

Everything **you** upload by hand goes in this `store/` folder (or the Chrome Web Store dashboard for screenshots). Everything else (code, privacy policy, manifest) is handled in the repo.

## 1. Extension icons (required) → `store/icons/`

Replace the placeholder PNGs with your final artwork **using these exact filenames**:

| File | Size | Used for |
|------|------|----------|
| `icon16.png` | 16×16 | Toolbar / favicon |
| `icon48.png` | 48×48 | Extension management page |
| `icon128.png` | 128×128 | Chrome Web Store listing & install dialog |

**Optional:** drop a master `icon.svg` or `icon-source.png` (512×512+) here for your own exports. Only the three PNG names above are read by `manifest.json`.

After replacing files, reload the unpacked extension in `chrome://extensions`.

Regenerate placeholders anytime:

```bash
python3 scripts/generate-placeholder-icons.py
```

---

## 2. Store screenshots (required for listing) → `store/screenshots/`

These files are **not bundled inside the extension**. You upload them in the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole) when publishing.

| File (suggested name) | Size | What to capture |
|----------------------|------|-----------------|
| `screenshot-1-home.png` | **1280×800** or **640×400** | Default popup with a few snippets |
| `screenshot-2-search.png` | same | Add / Search mode |
| `screenshot-3-settings.png` | same | Settings (themes + data controls) |
| `screenshot-4-row-hover.png` | same | Row hover actions (optional) |

Tips:
- Use PNG or JPEG (24-bit, no alpha required for store screenshots).
- Keep text readable at thumbnail size.
- Do not include personal/real sensitive data in screenshots.

---

## 3. Promotional images (optional) → `store/promo/`

Upload in the Developer Dashboard only if you create them:

| Asset | Size |
|-------|------|
| Small promo tile | 440×280 |
| Marquee promo tile | 1400×560 |

---

## 4. Privacy policy (hosted URL, not a zip asset)

The policy lives at **`docs/privacy-policy.html`** in this repo.

For the store listing, host it and paste the public URL into the dashboard **Privacy policy** field. Options:

- **GitHub Pages:** enable Pages for this repo →  
  `https://shubhamgorule.github.io/clipboard/docs/privacy-policy.html`
- **Raw GitHub link (works but less polished):**  
  `https://github.com/shubhamgorule/clipboard/blob/main/docs/privacy-policy.html`

Update `manifest.json` → `homepage_url` if your hosted URL differs.

---

## 5. What you do NOT put in the extension zip

- Screenshots (`store/screenshots/`)
- Promo tiles (`store/promo/`)
- Store description text → see `store/LISTING.md` (copy into dashboard)

The published ZIP is the extension code only (exclude `.git`, `store/screenshots`, `store/promo`, and dev docs if you pack manually).

---

## Quick checklist before Submit

- [ ] Final `icon16.png`, `icon48.png`, `icon128.png` in `store/icons/`
- [ ] At least 1 screenshot in dashboard (files saved in `store/screenshots/` for your records)
- [ ] Privacy policy URL live and linked in dashboard
- [ ] Listing text from `store/LISTING.md` pasted into dashboard
- [ ] $5 developer account registered
- [ ] Zip uploaded; permission justification: *"storage — saves snippets locally on device"*
