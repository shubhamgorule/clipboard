import { createIconButton } from "./iconButton.js";

/**
 * Settings screen — appearance, categories, and local data controls.
 */
export function createSettingsView({
  colorMode = "light",
  theme = "default",
  colorModes = [],
  themes = [],
  onColorModeChange,
  onThemeChange,
  labels = [],
  labelDraft = "",
  showSystemCategories = false,
  motionEnabled = true,
  onBack,
  onClose,
  onLabelDraftChange,
  onMotionChange,
  onAddLabel,
  onRemoveLabel,
  onExport,
  onImport,
  onClearAll
} = {}) {
  const wrap = document.createElement("div");
  wrap.className = "cb-settings";

  const header = document.createElement("div");
  header.className = "cb-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "cb-titleWrap";
  const title = document.createElement("p");
  title.className = "cb-title";
  title.textContent = "Settings";
  titleWrap.appendChild(title);

  const actions = document.createElement("div");
  actions.className = "cb-headerActions";
  actions.appendChild(
    createIconButton({
      icon: "material-symbols:arrow-back-rounded",
      title: "Back",
      tooltip: "Back",
      onClick: onBack
    })
  );
  actions.appendChild(
    createIconButton({
      icon: "material-symbols:close-rounded",
      title: "Close",
      tooltip: "Close",
      onClick: onClose
    })
  );

  header.appendChild(titleWrap);
  header.appendChild(actions);
  wrap.appendChild(header);

  const content = document.createElement("div");
  content.className = "cb-settingsContent";

  content.appendChild(
    buildCategoriesSection({
      labels,
      labelDraft,
      showSystemCategories,
      onLabelDraftChange,
      onAddLabel,
      onRemoveLabel
    })
  );

  content.appendChild(
    buildAppearanceSection({
      colorMode,
      theme,
      colorModes,
      themes,
      motionEnabled,
      onColorModeChange,
      onThemeChange,
      onMotionChange
    })
  );

  content.appendChild(
    buildDataSection({ onExport, onImport, onClearAll })
  );

  wrap.appendChild(content);

  return wrap;
}

const CHECK_SVG = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function buildSectionHead(title, hint) {
  const head = document.createElement("div");
  head.className = "cb-settingsSectionHead";

  const titleEl = document.createElement("p");
  titleEl.className = "cb-settingsSectionTitle";
  titleEl.textContent = title;

  const hintEl = document.createElement("p");
  hintEl.className = "cb-settingsSectionHint";
  hintEl.textContent = hint;

  head.appendChild(titleEl);
  head.appendChild(hintEl);
  return head;
}

function buildAppearanceSection({
  colorMode,
  theme,
  colorModes,
  themes,
  motionEnabled,
  onColorModeChange,
  onThemeChange,
  onMotionChange
}) {
  const section = document.createElement("section");
  section.className = "cb-settingsSection";

  const motionRow = document.createElement("div");
  motionRow.className = "cb-settingsToggleRow";

  const motionText = document.createElement("span");
  motionText.className = "cb-settingsToggleText";
  motionText.textContent = "Animations";

  const motionLabel = document.createElement("label");
  motionLabel.className = "cb-settingsToggleLabel";

  const motionInput = document.createElement("input");
  motionInput.type = "checkbox";
  motionInput.className = "cb-settingsToggleInput";
  motionInput.checked = motionEnabled;
  motionInput.setAttribute("role", "switch");
  motionInput.setAttribute("aria-checked", motionEnabled ? "true" : "false");
  motionInput.addEventListener("change", (e) => {
    const enabled = e.target.checked;
    motionInput.setAttribute("aria-checked", enabled ? "true" : "false");
    onMotionChange?.(enabled);
  });

  const motionTrack = document.createElement("span");
  motionTrack.className = "cb-settingsToggleTrack";
  motionTrack.setAttribute("aria-hidden", "true");

  motionLabel.appendChild(motionInput);
  motionLabel.appendChild(motionTrack);
  motionRow.appendChild(motionText);
  motionRow.appendChild(motionLabel);

  const modeGroup = document.createElement("div");
  modeGroup.className = "cb-settingsThemeGroup";

  const modeLabel = document.createElement("p");
  modeLabel.className = "cb-settingsSubsectionTitle";
  modeLabel.textContent = "Mode";
  modeGroup.appendChild(modeLabel);
  modeGroup.appendChild(
    buildThemeList({
      options: colorModes,
      selectedId: colorMode,
      ariaLabel: "Color mode",
      onSelect: onColorModeChange
    })
  );

  const themeGroup = document.createElement("div");
  themeGroup.className = "cb-settingsThemeGroup";

  const themeLabel = document.createElement("p");
  themeLabel.className = "cb-settingsSubsectionTitle";
  themeLabel.textContent = "Theme";
  themeGroup.appendChild(themeLabel);
  themeGroup.appendChild(
    buildThemeList({
      options: themes,
      selectedId: theme,
      ariaLabel: "Theme",
      onSelect: onThemeChange
    })
  );

  const body = document.createElement("div");
  body.className = "cb-settingsSectionBody cb-settingsSectionBody--themes";
  body.appendChild(motionRow);
  body.appendChild(modeGroup);
  body.appendChild(themeGroup);

  section.appendChild(
    buildSectionHead("Appearance", "Color mode, theme, and motion.")
  );
  section.appendChild(body);

  return section;
}

function buildThemeList({ options, selectedId, ariaLabel, onSelect }) {
  const list = document.createElement("div");
  list.className = "cb-themeList";
  list.setAttribute("role", "radiogroup");
  list.setAttribute("aria-label", ariaLabel);

  let currentId = selectedId;

  function selectOption(id) {
    if (id === currentId) return;
    currentId = id;
    onSelect?.(id);
    for (const btn of list.querySelectorAll(".cb-themeOption")) {
      const active = btn.dataset.id === id;
      btn.classList.toggle("cb-themeOption--selected", active);
      btn.setAttribute("aria-checked", active ? "true" : "false");
      const check = btn.querySelector(".cb-themeOptionCheck");
      if (check) check.hidden = !active;
    }
  }

  for (const option of options) {
    list.appendChild(
      buildThemeOption({
        option,
        selected: option.id === selectedId,
        onSelect: selectOption
      })
    );
  }

  return list;
}

function buildThemeOption({ option, selected, onSelect }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `cb-themeOption${selected ? " cb-themeOption--selected" : ""}`;
  btn.dataset.id = option.id;
  btn.setAttribute("role", "radio");
  btn.setAttribute("aria-checked", selected ? "true" : "false");

  const start = document.createElement("span");
  start.className = "cb-themeOptionStart";

  const swatch = document.createElement("span");
  swatch.className = "cb-themeSwatch";
  swatch.style.backgroundColor = option.swatch;
  swatch.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "cb-themeOptionLabel";
  label.textContent = option.label;

  start.appendChild(swatch);
  start.appendChild(label);

  const check = document.createElement("span");
  check.className = "cb-themeOptionCheck";
  check.innerHTML = CHECK_SVG;
  check.hidden = !selected;

  btn.appendChild(start);
  btn.appendChild(check);

  btn.addEventListener("click", () => onSelect(option.id));

  return btn;
}

function buildCategoriesSection({
  labels,
  labelDraft,
  showSystemCategories,
  onLabelDraftChange,
  onAddLabel,
  onRemoveLabel
}) {
  const section = document.createElement("section");
  section.className = "cb-settingsSection";

  const list = document.createElement("div");
  list.className = "cb-settingsLabelList";

  if (showSystemCategories) {
    list.appendChild(buildSystemCategoryRow("All"));
    list.appendChild(buildSystemCategoryRow("Uncategorized"));
  }

  for (const label of labels) {
    list.appendChild(buildLabelRow(label, onRemoveLabel));
  }

  const addRow = document.createElement("div");
  addRow.className = "cb-settingsAddRow";

  const input = document.createElement("input");
  input.className = "cb-settingsLabelInput";
  input.type = "text";
  input.placeholder = "New category";
  input.value = labelDraft;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.maxLength = 24;
  input.addEventListener("input", (e) => {
    onLabelDraftChange?.(e.target.value);
    addBtn.disabled = !e.target.value.trim();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!addBtn.disabled) onAddLabel?.();
    }
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "cb-pillBtn cb-pillBtnAdd cb-settingsAddBtn";
  addBtn.textContent = "Add";
  addBtn.disabled = !labelDraft.trim();
  addBtn.addEventListener("click", () => onAddLabel?.());

  addRow.appendChild(input);
  addRow.appendChild(addBtn);

  const body = document.createElement("div");
  body.className = "cb-settingsSectionBody";
  body.appendChild(list);
  body.appendChild(addRow);

  section.appendChild(
    buildSectionHead(
      "Categories",
      showSystemCategories
        ? "Add categories to organize text. All and Uncategorized are always available."
        : "Add categories to organize text."
    )
  );
  section.appendChild(body);

  queueMicrotask(() => input.focus());

  return section;
}

function buildDataSection({ onExport, onImport, onClearAll }) {
  const section = document.createElement("section");
  section.className = "cb-settingsSection";

  const actions = document.createElement("div");
  actions.className = "cb-settingsDataActions";

  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.className = "cb-pillBtn cb-pillBtnCancel cb-settingsDataBtn";
  exportBtn.textContent = "Export data";
  exportBtn.addEventListener("click", () => onExport?.());

  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = "cb-pillBtn cb-pillBtnCancel cb-settingsDataBtn";
  importBtn.textContent = "Import data";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.hidden = true;
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (file) onImport?.(file);
  });
  importBtn.addEventListener("click", () => fileInput.click());

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "cb-pillBtn cb-pillBtnDelete cb-settingsDataBtn cb-settingsDataBtnClear";
  clearBtn.textContent = "Clear all data";
  clearBtn.addEventListener("click", () => onClearAll?.());

  actions.appendChild(exportBtn);
  actions.appendChild(importBtn);
  actions.appendChild(clearBtn);

  const body = document.createElement("div");
  body.className = "cb-settingsSectionBody";
  body.appendChild(actions);
  body.appendChild(fileInput);

  section.appendChild(
    buildSectionHead(
      "Local storage",
      "Snippets stay on this device only. Export a backup, import a previous export, or clear everything."
    )
  );
  section.appendChild(body);

  return section;
}

function buildSystemCategoryRow(name) {
  const row = document.createElement("div");
  row.className = "cb-settingsLabelRow";

  const pill = document.createElement("span");
  pill.className = "cb-settingsLabelPill";
  pill.textContent = name;
  row.appendChild(pill);

  return row;
}

function buildLabelRow(label, onRemoveLabel) {
  const row = document.createElement("div");
  row.className = "cb-settingsLabelRow";

  const pill = document.createElement("span");
  pill.className = "cb-settingsLabelPill";
  pill.textContent = label;
  row.appendChild(pill);

  row.appendChild(
    createIconButton({
      icon: "solar:trash-bin-trash-linear",
      title: `Remove ${label}`,
      tooltip: "Remove",
      size: "sm",
      variant: "danger",
      onClick: () => onRemoveLabel?.(label)
    })
  );

  return row;
}
