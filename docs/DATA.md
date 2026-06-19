# Clipboard — Data & Storage (v1)

Local-first persistence for the Clipboard Chrome extension. **v1 uses device storage only** — no accounts, no servers, no internet. Users can optionally **export** a JSON copy of their data.

## v1 scope

| In v1 | Not in v1 |
|-------|-----------|
| `chrome.storage.local` for all snippets | Login / website |
| Auto-save on every change | Cloud sync |
| Export data (Settings) | Import UI (can add later) |
| Categories stored locally | Email-linked accounts |

## Chrome extension alignment

| Policy / guideline | How we comply |
|--------------------|---------------|
| **Local-first** | `chrome.storage.local` only — no `storage.sync`, no remote servers |
| **User control** | Export is an explicit settings action; no data leaves the device unless the user exports |
| **Minimal permissions** | `storage` only (no `unlimitedStorage` unless truly needed) |
| **Quota awareness** | 10 MB `chrome.storage.local` limit enforced before save |
| **Untrusted imports** | JSON validated, size-capped, normalized — never `eval` |
| **Content script isolation** | `setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })` on install |
| **Removal** | Uninstalling the extension clears `chrome.storage.local` data |

References: [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage), [Storage and cookies](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies), [User data privacy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

## Storage key

| Key | Purpose |
|-----|---------|
| `clipboard:v1` | Active clipboard payload |

## Stored schema (version 1)

```json
{
  "version": 1,
  "items": [
    { "id": "uuid", "text": "snippet text", "category": "Mail" }
  ],
  "labels": ["Mail", "General", "Socials"]
}
```

### Fields

| Field | Type | Notes |
|-------|------|-------|
| `version` | `number` | Schema version inside the blob (currently `1`) |
| `items` | `ClipItem[]` | Ordered list; order = display order |
| `labels` | `string[]` | User-defined category names |

### `ClipItem`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | `crypto.randomUUID()` on create |
| `text` | `string` | Max 50,000 chars (normalized on save) |
| `category` | `string` | User label or `"Uncategorized"` |

### System categories (not stored in `labels`)

| Name | Role |
|------|------|
| `All` | Filter tab — shows every item |
| `Uncategorized` | Default bucket when no user label matches |

## Limits

| Limit | Value | Reason |
|-------|-------|--------|
| Total storage | 10 MB | `chrome.storage.local` quota |
| Items | 10,000 | Sanity cap |
| Text per item | 50,000 chars | Prevent single-item quota blow-up |
| Labels | 100 | Sanity cap |
| Label length | 24 chars | Matches settings UI |
| Import file | 5 MB | Untrusted user upload cap |

## Export (v1)

Settings → **Export data** downloads `clipboard-export-YYYY-MM-DD.json` to the user's computer. No upload, no network call.

Import and cloud sync are reserved for a future version. Export format is forward-compatible so imports can be added later.

```json
{
  "format": "clipboard-extension-export",
  "formatVersion": 1,
  "schemaVersion": 1,
  "exportedAt": "2026-06-19T12:00:00.000Z",
  "data": {
    "version": 1,
    "items": [],
    "labels": []
  }
}
```

Import accepts this format or a raw `{ items, labels }` object (legacy).

## API surface

| Module | Role |
|--------|------|
| `shared/storageSchema.js` | Pure validation, normalization, migration, quota math (testable) |
| `shared/storage.js` | `chrome.storage.local` adapter |
| `background/service-worker.js` | Migrations + access-level restriction on install |

### Functions

- `loadData()` — read and normalize
- `saveData({ items, labels })` — validate, quota-check, write
- `clearData()` — remove key
- `serializeExport(data)` — JSON string for download
- `importFromText(text)` — parse, validate, save
- `runMigrations()` — upgrade legacy blobs (service worker)

## Migrations

On `chrome.runtime.onInstalled`:

1. Read `clipboard:v1`
2. If blob lacks `version` or has legacy shape, normalize and rewrite with `version: 1`
3. Restrict storage access to trusted extension contexts

Future schema changes: bump `SCHEMA_VERSION`, add migration steps in `runMigrations()`, keep reading old keys until migrated.

## What is not persisted

Popup UI state: `mode`, `query`, `activeCategory`, `editingId`, dialog flags, etc.

## Testing

```bash
npm test
```

Runs `tests/storageSchema.test.js` against pure schema logic (no Chrome APIs).
