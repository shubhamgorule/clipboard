/** @typedef {{ id: string, text: string, category: string }} ClipItem */
/** @typedef {{ version: number, items: ClipItem[], labels: string[] }} ClipboardPayload */

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "clipboard:v1";
export const EXPORT_FORMAT = "clipboard-extension-export";
export const EXPORT_FORMAT_VERSION = 1;

/** chrome.storage.local total quota (10 MB). See Chrome storage API docs. */
export const QUOTA_BYTES = 10_485_760;
export const QUOTA_WARN_BYTES = 9_000_000;

export const MAX_ITEMS = 10_000;
export const MAX_TEXT_LENGTH = 50_000;
export const MAX_LABEL_LENGTH = 24;
export const MAX_LABELS = 100;
/** User-initiated import file size cap (policy: validate untrusted uploads). */
export const MAX_IMPORT_BYTES = 5_000_000;

export class StorageError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "StorageError";
  }
}

export function newClipId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** @param {unknown} items */
export function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.id === "string" && typeof item.text === "string")
    .slice(0, MAX_ITEMS)
    .map((item) => ({
      id: item.id.trim() || newClipId(),
      text: String(item.text).slice(0, MAX_TEXT_LENGTH),
      category: typeof item.category === "string" ? item.category.trim() || "Uncategorized" : "Uncategorized"
    }));
}

/** @param {unknown} labels */
export function normalizeLabels(labels) {
  if (!Array.isArray(labels)) return [];
  return labels
    .filter((label) => typeof label === "string" && label.trim())
    .map((label) => label.trim().slice(0, MAX_LABEL_LENGTH))
    .slice(0, MAX_LABELS);
}

/** @param {unknown} stored */
export function migrateStoredPayload(stored) {
  if (!stored || typeof stored !== "object") {
    return { version: SCHEMA_VERSION, items: [], labels: [] };
  }

  const record = /** @type {Record<string, unknown>} */ (stored);

  if (Array.isArray(record.items) || Array.isArray(record.labels)) {
    return {
      version: SCHEMA_VERSION,
      items: normalizeItems(record.items),
      labels: normalizeLabels(record.labels)
    };
  }

  if (record.data && typeof record.data === "object") {
    return migrateStoredPayload(record.data);
  }

  return { version: SCHEMA_VERSION, items: [], labels: [] };
}

/** @param {ClipboardPayload} payload */
export function toClipboardData(payload) {
  return {
    items: normalizeItems(payload.items),
    labels: normalizeLabels(payload.labels)
  };
}

/** @param {{ items: ClipItem[], labels: string[] }} data */
export function createStoredPayload(data) {
  return {
    version: SCHEMA_VERSION,
    items: normalizeItems(data.items),
    labels: normalizeLabels(data.labels)
  };
}

/** @param {{ items: ClipItem[], labels: string[] }} data */
export function createExportDocument(data) {
  const payload = createStoredPayload(data);
  return {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: payload
  };
}

/** @param {unknown} parsed */
export function parseImportDocument(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new StorageError("Invalid backup file");
  }

  const record = /** @type {Record<string, unknown>} */ (parsed);

  if (record.format === EXPORT_FORMAT) {
    if (record.formatVersion !== EXPORT_FORMAT_VERSION) {
      throw new StorageError("Unsupported backup version");
    }
    return toClipboardData(migrateStoredPayload(record.data));
  }

  return toClipboardData(migrateStoredPayload(parsed));
}

/** @param {string} text */
export function parseImportText(text) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) throw new StorageError("Backup file is empty");
  if (trimmed.length > MAX_IMPORT_BYTES) {
    throw new StorageError("Backup file is too large");
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new StorageError("Backup file is not valid JSON");
  }

  return parseImportDocument(parsed);
}

/** @param {unknown} value */
export function estimatePayloadBytes(value) {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length + STORAGE_KEY.length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/** @param {{ items: ClipItem[], labels: string[] }} data */
export function assertWithinQuota(data) {
  const payload = createStoredPayload(data);
  const bytes = estimatePayloadBytes({ [STORAGE_KEY]: payload });
  if (bytes > QUOTA_BYTES) {
    throw new StorageError("Storage is full. Export a backup, then remove items.");
  }
  return payload;
}
