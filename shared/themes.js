const DEFAULT_COLOR_MODE = "light";
const DEFAULT_THEME = "default";

export const COLOR_MODES = [
  { id: "light", label: "Light", swatch: "#f0f0f0" },
  { id: "dark", label: "Dark", swatch: "#1c1c1c" },
  { id: "system", label: "System", swatch: "#999999" }
];

export const THEMES = [
  { id: "default", label: "Default", swatch: "#1a1a1a" },
  { id: "warm", label: "Warm", swatch: "#faf6ef" },
  { id: "ocean", label: "Ocean", swatch: "#e6eaef" },
  { id: "forest", label: "Forest", swatch: "#e4eae6" },
  { id: "rose", label: "Rose", swatch: "#ebe4e6" },
  { id: "lavender", label: "Lavender", swatch: "#e8e6ec" }
];

/** @deprecated Use THEMES */
export const ACCENTS = THEMES;

const COLOR_MODE_IDS = new Set(COLOR_MODES.map((mode) => mode.id));
const THEME_IDS = new Set(THEMES.map((theme) => theme.id));

/** @param {string} colorMode */
export function isValidColorMode(colorMode) {
  return COLOR_MODE_IDS.has(colorMode);
}

/** @param {string} theme */
export function isValidTheme(theme) {
  return THEME_IDS.has(theme);
}

/** @param {{ colorMode?: string, theme?: string }} prefs */
export function applyAppearance({ colorMode = DEFAULT_COLOR_MODE, theme = DEFAULT_THEME } = {}) {
  const mode = isValidColorMode(colorMode) ? colorMode : DEFAULT_COLOR_MODE;
  const palette = isValidTheme(theme) ? theme : DEFAULT_THEME;

  document.documentElement.dataset.cbMode = mode;
  document.documentElement.dataset.cbTheme = palette;
  delete document.documentElement.dataset.cbAccent;

  return { colorMode: mode, theme: palette };
}

/** @deprecated Use applyAppearance */
export function applyTheme(prefs) {
  if (typeof prefs === "string") {
    return applyAppearance({ colorMode: prefs });
  }
  return applyAppearance(prefs ?? {});
}

/** @param {string} colorMode */
export function getResolvedColorMode(colorMode) {
  if (colorMode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return isValidColorMode(colorMode) ? colorMode : DEFAULT_COLOR_MODE;
}
