export const PREFERENCES_KEY = "clipboard:preferences";
export const DEFAULT_COLOR_MODE = "light";
export const DEFAULT_THEME = "default";
export const DEFAULT_MOTION_ENABLED = true;

/** @typedef {{ colorMode: string, theme: string, motionEnabled: boolean }} ClipboardPreferences */

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
    return {
      colorMode: DEFAULT_COLOR_MODE,
      theme: DEFAULT_THEME,
      motionEnabled: DEFAULT_MOTION_ENABLED
    };
  }

  const record = /** @type {Record<string, unknown>} */ (stored);
  const motionEnabled =
    typeof record.motionEnabled === "boolean"
      ? record.motionEnabled
      : DEFAULT_MOTION_ENABLED;

  if (typeof record.colorMode === "string") {
    const colorMode = pickValid(record.colorMode, VALID_COLOR_MODES, DEFAULT_COLOR_MODE);
    const theme = pickValid(record.theme, VALID_THEMES, "");
    if (theme) {
      return { colorMode, theme, motionEnabled };
    }

    const accent = typeof record.accent === "string" ? record.accent.trim() : "";
    if (VALID_THEMES.has(accent)) {
      return { colorMode, theme: accent, motionEnabled };
    }

    return { colorMode, theme: DEFAULT_THEME, motionEnabled };
  }

  return { ...migrateLegacyPreferences(record), motionEnabled };
}

/** @returns {Promise<ClipboardPreferences>} */
export async function loadPreferences() {
  try {
    const result = await chrome.storage.local.get(PREFERENCES_KEY);
    return normalizePreferences(result[PREFERENCES_KEY]);
  } catch (err) {
    console.warn("Failed to load preferences:", err);
    return { colorMode: DEFAULT_COLOR_MODE, theme: DEFAULT_THEME, motionEnabled: DEFAULT_MOTION_ENABLED };
  }
}

function getPreferencesErrorMessage(err) {
  const message = chrome.runtime?.lastError?.message;
  if (message) return message;
  return err?.message || "Could not save appearance preference.";
}

/** @param {Partial<ClipboardPreferences>} patch */
export async function savePreferences(patch) {
  const current = await loadPreferences();
  const next = normalizePreferences({ ...current, ...patch });

  try {
    await chrome.storage.local.set({ [PREFERENCES_KEY]: next });
    if (chrome.runtime?.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
  } catch (err) {
    throw new Error(getPreferencesErrorMessage(err));
  }

  return next;
}

/** Remove saved appearance preferences (used by Clear all data). */
export async function clearPreferences() {
  try {
    await chrome.storage.local.remove(PREFERENCES_KEY);
    if (chrome.runtime?.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
  } catch (err) {
    throw new Error(getPreferencesErrorMessage(err));
  }

  return normalizePreferences(null);
}
