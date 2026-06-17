import { createIconButton } from "./iconButton.js";

/**
 * Confirm removing a category. Clips are moved to Uncategorized.
 * Figma source: 3025:7929 (button layout only)
 */
export function createRemoveLabelDialog({
  label,
  itemCount = 0,
  onCancel,
  onDeleteCategory
} = {}) {
  const overlay = document.createElement("div");
  overlay.className = "cb-deleteDialogOverlay";
  overlay.setAttribute("role", "presentation");
  overlay.tabIndex = -1;

  const dialog = document.createElement("div");
  dialog.className = "cb-deleteDialog";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "cb-removeLabelDialogTitle");

  const body = document.createElement("div");
  body.className = "cb-deleteDialogBody";

  const iconWrap = document.createElement("div");
  iconWrap.className = "cb-deleteDialogIcon";
  const iconRoot = createIconButton({
    icon: "solar:trash-bin-trash-linear",
    title: "Delete",
    size: "md",
    variant: "danger"
  });
  const iconButton = iconRoot.querySelector("button");
  if (iconButton) {
    iconButton.disabled = true;
    iconButton.tabIndex = -1;
  }
  iconWrap.appendChild(iconRoot);

  const title = document.createElement("p");
  title.id = "cb-removeLabelDialogTitle";
  title.className = "cb-deleteDialogTitle";
  title.textContent = `Delete "${label}"?`;

  body.appendChild(iconWrap);
  body.appendChild(title);

  if (itemCount > 0) {
    const subtitle = document.createElement("p");
    subtitle.className = "cb-deleteDialogSubtitle";
    subtitle.textContent =
      itemCount === 1
        ? "1 text item will be moved to Uncategorized."
        : `${itemCount} text items will be moved to Uncategorized.`;
    body.appendChild(subtitle);
  }

  const actions = document.createElement("div");
  actions.className = "cb-deleteDialogActions";

  const keep = document.createElement("button");
  keep.type = "button";
  keep.className = "cb-pillBtn cb-pillBtnCancel cb-deleteDialogBtn";
  keep.textContent = "Keep";
  keep.addEventListener("click", (e) => {
    e.stopPropagation();
    onCancel?.();
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className = "cb-pillBtn cb-pillBtnDelete cb-deleteDialogBtn";
  del.textContent = "Delete";
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    onDeleteCategory?.();
  });

  actions.appendChild(keep);
  actions.appendChild(del);
  dialog.appendChild(body);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) onCancel?.();
  });

  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
    }
  });

  queueMicrotask(() => {
    overlay.focus();
    keep.focus();
  });

  return overlay;
}
