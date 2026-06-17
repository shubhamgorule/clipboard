import { createIconButton } from "./iconButton.js";

/**
 * Settings screen — manage clip categories.
 */
export function createSettingsView({
  labels = [],
  labelDraft = "",
  showSystemCategories = false,
  onBack,
  onClose,
  onLabelDraftChange,
  onAddLabel,
  onRemoveLabel
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

  const section = document.createElement("section");
  section.className = "cb-settingsSection";

  const sectionTitle = document.createElement("p");
  sectionTitle.className = "cb-settingsSectionTitle";
  sectionTitle.textContent = "Categories";

  const sectionHint = document.createElement("p");
  sectionHint.className = "cb-settingsSectionHint";
  sectionHint.textContent = showSystemCategories
    ? "Add categories to organize text. All and Uncategorized are always available."
    : "Add categories to organize text.";

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

  section.appendChild(sectionTitle);
  section.appendChild(sectionHint);
  section.appendChild(list);
  section.appendChild(addRow);
  content.appendChild(section);
  wrap.appendChild(content);

  queueMicrotask(() => input.focus());

  return wrap;
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
