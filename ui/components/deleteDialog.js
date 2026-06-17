/**
 * Delete confirmation dialog — asks whether to delete or keep an item.
 */
export function createDeleteDialog({ onDelete, onKeep } = {}) {
  const overlay = document.createElement("div");
  overlay.className = "cb-deleteDialogOverlay";
  overlay.setAttribute("role", "presentation");

  const dialog = document.createElement("div");
  dialog.className = "cb-deleteDialog";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "cb-deleteDialogTitle");

  const title = document.createElement("p");
  title.id = "cb-deleteDialogTitle";
  title.className = "cb-deleteDialogTitle";
  title.textContent = "Delete this item?";

  const actions = document.createElement("div");
  actions.className = "cb-deleteDialogActions";

  const keep = document.createElement("button");
  keep.type = "button";
  keep.className = "cb-pillBtn cb-pillBtnCancel";
  keep.textContent = "Keep";
  keep.addEventListener("click", (e) => {
    e.stopPropagation();
    onKeep?.();
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className = "cb-pillBtn cb-pillBtnDelete";
  del.textContent = "Delete";
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    onDelete?.();
  });

  actions.appendChild(keep);
  actions.appendChild(del);
  dialog.appendChild(title);
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

  queueMicrotask(() => keep.focus());

  return overlay;
}
