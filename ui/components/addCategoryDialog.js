import { createIconButton } from "./iconButton.js";

/**
 * Add category modal — same shell as delete dialog (3025:7929 layout).
 */
export function createAddCategoryDialog({
  value = "",
  onCancel,
  onAdd,
  onDraftChange
} = {}) {
  const overlay = document.createElement("div");
  overlay.className = "cb-deleteDialogOverlay";
  overlay.setAttribute("role", "presentation");
  overlay.tabIndex = -1;

  const dialog = document.createElement("div");
  dialog.className = "cb-deleteDialog cb-addCategoryDialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "cb-addCategoryDialogTitle");

  const body = document.createElement("div");
  body.className = "cb-deleteDialogBody";

  const iconWrap = document.createElement("div");
  iconWrap.className = "cb-deleteDialogIcon cb-addCategoryDialogIcon";
  const iconRoot = createIconButton({
    icon: "ic:round-add",
    title: "Add category",
    size: "md"
  });
  const iconButton = iconRoot.querySelector("button");
  if (iconButton) {
    iconButton.disabled = true;
    iconButton.tabIndex = -1;
  }
  iconWrap.appendChild(iconRoot);

  const title = document.createElement("p");
  title.id = "cb-addCategoryDialogTitle";
  title.className = "cb-deleteDialogTitle";
  title.textContent = "Add category";

  const subtitle = document.createElement("p");
  subtitle.className = "cb-deleteDialogSubtitle";
  subtitle.textContent = "Create a category to organize this text.";

  const input = document.createElement("input");
  input.className = "cb-addCategoryDialogInput";
  input.type = "text";
  input.placeholder = "Category name";
  input.value = value;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.maxLength = 24;

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "cb-pillBtn cb-pillBtnAdd cb-deleteDialogBtn cb-addCategoryDialogSubmit";
  addBtn.textContent = "Add";
  addBtn.disabled = !value.trim();

  input.addEventListener("input", (e) => {
    onDraftChange?.(e.target.value);
    addBtn.disabled = !e.target.value.trim();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!addBtn.disabled) onAdd?.();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
    }
  });

  body.appendChild(iconWrap);
  body.appendChild(title);
  body.appendChild(subtitle);
  body.appendChild(input);

  const actions = document.createElement("div");
  actions.className = "cb-deleteDialogActions";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "cb-pillBtn cb-pillBtnCancel cb-deleteDialogBtn";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", (e) => {
    e.stopPropagation();
    onCancel?.();
  });

  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    onAdd?.();
  });

  actions.appendChild(cancel);
  actions.appendChild(addBtn);
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
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  return overlay;
}
