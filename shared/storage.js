import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  StorageError,
  QUOTA_WARN_BYTES,
  assertWithinQuota,
  createExportDocument,
  createStoredPayload,
  migrateStoredPayload,
  parseImportText,
  toClipboardData
} from "./storageSchema.js";

export { StorageError, newClipId, QUOTA_BYTES, QUOTA_WARN_BYTES, SCHEMA_VERSION, STORAGE_KEY } from "./storageSchema.js";

/**
 * @typedef {{ id: string, text: string, category: string }} ClipItem
 * @typedef {{ items: ClipItem[], labels: string[] }} ClipboardData
 */

function getLastErrorMessage() {
  const message = chrome.runtime?.lastError?.message;
  return message ? `Storage error: ${message}` : "Could not save clipboard data";
}

function wrapChromeError(err) {
  if (err instanceof StorageError) return err;
  if (chrome.runtime?.lastError) return new StorageError(getLastErrorMessage());
  return new StorageError(err?.message || "Storage operation failed");
}

/** Restrict storage to extension pages (not content scripts). Chrome privacy best practice. */
export async function restrictStorageAccess() {
  if (!chrome.storage?.local?.setAccessLevel) return;
  try {
    await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  } catch (err) {
    console.warn("Could not restrict storage access level:", err);
  }
}

/** @returns {Promise<ClipboardData>} */
export async function loadData() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY];
    return toClipboardData(migrateStoredPayload(stored));
  } catch (err) {
    throw wrapChromeError(err);
  }
}

/** @param {ClipboardData} data */
export async function saveData({ items, labels }) {
  const payload = assertWithinQuota({ items, labels });

  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: payload });
    if (chrome.runtime?.lastError) {
      throw new StorageError(getLastErrorMessage());
    }
  } catch (err) {
    throw wrapChromeError(err);
  }

  return toClipboardData(payload);
}

/** @returns {Promise<ClipboardData>} */
export async function clearData() {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    if (chrome.runtime?.lastError) {
      throw new StorageError(getLastErrorMessage());
    }
  } catch (err) {
    throw wrapChromeError(err);
  }

  return { items: [], labels: [] };
}

/** @param {ClipboardData} data @returns {string} */
export function serializeExport(data) {
  return JSON.stringify(createExportDocument(data), null, 2);
}

/** @param {ClipboardData} data */
export async function importData(data) {
  return saveData(data);
}

/** @param {string} text */
export async function importFromText(text) {
  const data = parseImportText(text);
  return importData(data);
}

/** Upgrade legacy blobs and ensure schema version is stored. */
export async function runMigrations() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY];
    if (!stored) return;

    const migrated = createStoredPayload(migrateStoredPayload(stored));
    if (stored.version === SCHEMA_VERSION && Array.isArray(stored.items) && Array.isArray(stored.labels)) {
      return;
    }

    await chrome.storage.local.set({ [STORAGE_KEY]: migrated });
  } catch (err) {
    console.error("Clipboard storage migration failed:", err);
  }
}

/** @param {ClipboardData} data @returns {Promise<{ bytes: number, warn: boolean }>} */
export async function getStorageUsage(data) {
  const payload = createStoredPayload(data);
  const bytes = new TextEncoder().encode(JSON.stringify({ [STORAGE_KEY]: payload })).length;
  return { bytes, warn: bytes >= QUOTA_WARN_BYTES };
}
