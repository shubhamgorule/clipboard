export const PREFERENCES_KEY = "clipboard:preferences";
export const DEFAULT_COLOR_MODE = "light";
export const DEFAULT_THEME = "default";

/** @typedef {{ colorMode: string, theme: string }} ClipboardPreferences */

const VALID_COLOR_MODES = new Set(["light", "dark", "system"]);
const VALID_THEMES = new Set(["default", "warm", "ocean", "forest", "rose", "lavender"]);
const LEGACY_MODE_THEMES = new Set(["light", "dark", "system"]);

/** @param {string} value @param {Set<string>} allowed @param {string} fallback */
function pickValid(value, allowed, fallback) {
  return typeof value === "string" && allowed.has(value.trim()) ? value.trim() : fallback;
}

/** @param {Record<string, unknown>} record */
function migrateLegacyPreferences(record) {
  const legacy = typeof record.theme === "string" ? record.theme.trim() : "";

  if (LEGACY_MODE_THEMES.has(legacy)) {
    return { colorMode: legacy, theme: DEFAULT_THEME };
  }

  if (VALID_THEMES.has(legacy)) {
    return { colorMode: DEFAULT_COLOR_MODE, theme: legacy };
  }

  const colorMode = typeof record.colorMode === "string" ? record.colorMode.trim() : "";
  const accent = typeof record.accent === "string" ? record.accent.trim() : "";

  if (VALID_THEMES.has(accent)) {
    return {
      colorMode: pickValid(colorMode, VALID_COLOR_MODES, DEFAULT_COLOR_MODE),
      theme: accent
    };
  }

  if (VALID_COLOR_MODES.has(colorMode)) {
    return { colorMode, theme: DEFAULT_THEME };
  }

  return { colorMode: DEFAULT_COLOR_MODE, theme: DEFAULT_THEME };
}

/** @returns {ClipboardPreferences} */
export function normalizePreferences(stored) {
  if (!stored || typeof stored !== "object") {
    return { colorMode: DEFAULT_COLOR_MODE, theme: DEFAULT_THEME };
  }

  const record = /** @type {Record<string, unknown>} */ (stored);

  if (typeof record.colorMode === "string") {
    return {
      colorMode: pickValid(record.colorMode, VALID_COLOR_MODES, DEFAULT_COLOR_MODE),
      theme: pickValid(record.theme, VALID_THEMES, DEFAULT_THEME)
    };
  }

  return migrateLegacyPreferences(record);
}

/** @returns {Promise<ClipboardPreferences>} */
export async function loadPreferences() {
  try {
    const result = await chrome.storage.local.get(PREFERENCES_KEY);
    return normalizePreferences(result[PREFERENCES_KEY]);
  } catch (err) {
    console.warn("Failed to load preferences:", err);
    return { colorMode: DEFAULT_COLOR_MODE, theme: DEFAULT_THEME };
  }
}

/** @param {Partial<ClipboardPreferences>} patch */
export async function savePreferences(patch) {
  const current = await loadPreferences();
  const next = normalizePreferences({ ...current, ...patch });
  await chrome.storage.local.set({ [PREFERENCES_KEY]: next });
  return next;
}
