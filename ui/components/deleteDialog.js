import { createIconButton } from "./iconButton.js";

/**
 * Figma source: 3025:7929 (Delete confirmation dialog)
 */
export function createDeleteDialog({
  title: titleText = "Are you sure you want to delete?",
  deleteLabel = "Delete",
  onDelete,
  onKeep
} = {}) {
  const overlay = document.createElement("div");
  overlay.className = "cb-deleteDialogOverlay";
  overlay.setAttribute("role", "presentation");
  overlay.tabIndex = -1;

  const dialog = document.createElement("div");
  dialog.className = "cb-deleteDialog";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "cb-deleteDialogTitle");

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

  const titleEl = document.createElement("p");
  titleEl.id = "cb-deleteDialogTitle";
  titleEl.className = "cb-deleteDialogTitle";
  titleEl.textContent = titleText;

  body.appendChild(iconWrap);
  body.appendChild(titleEl);

  const actions = document.createElement("div");
  actions.className = "cb-deleteDialogActions";

  const keep = document.createElement("button");
  keep.type = "button";
  keep.className = "cb-pillBtn cb-pillBtnCancel cb-deleteDialogBtn";
  keep.textContent = "Keep";
  keep.addEventListener("click", (e) => {
    e.stopPropagation();
    onKeep?.();
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className = "cb-pillBtn cb-pillBtnDelete cb-deleteDialogBtn";
  del.textContent = deleteLabel;
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    onDelete?.();
  });

  actions.appendChild(keep);
  actions.appendChild(del);
  dialog.appendChild(body);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) onKeep?.();
  });

  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onKeep?.();
    }
  });

  queueMicrotask(() => {
    overlay.focus();
    keep.focus();
  });

  return overlay;
}
