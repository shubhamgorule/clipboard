const STORAGE_KEY = "clipboard:v1";

/**
 * @typedef {{ id: string, text: string, category: string }} ClipItem
 * @typedef {{ items: ClipItem[], labels: string[] }} ClipboardData
 */

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.id === "string" && typeof item.text === "string")
    .map((item) => ({
      id: item.id,
      text: item.text,
      category: typeof item.category === "string" ? item.category : "Uncategorized"
    }));
}

function normalizeLabels(labels) {
  if (!Array.isArray(labels)) return [];
  return labels.filter((label) => typeof label === "string" && label.trim()).map((label) => label.trim());
}

/** @returns {Promise<ClipboardData>} */
export async function loadData() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];
  if (!stored || typeof stored !== "object") {
    return { items: [], labels: [] };
  }
  return {
    items: normalizeItems(stored.items),
    labels: normalizeLabels(stored.labels)
  };
}

/** @param {ClipboardData} data */
export async function saveData({ items, labels }) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      items: normalizeItems(items),
      labels: normalizeLabels(labels)
    }
  });
}
