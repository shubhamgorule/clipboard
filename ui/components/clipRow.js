import { createIconButton } from "./iconButton.js";

/**
 * Figma source: 3008:7462 (Text row states: Frame99 default, Frame100 hover, Variant3 edit)
 */
function isEditConfirmEnabled(value, originalText) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 && trimmed !== (originalText ?? "").trim();
}

function buildHighlightedText(text, query) {
  const frag = document.createDocumentFragment();
  const fullText = text ?? "";
  const q = (query ?? "").trim();

  if (!q) {
    frag.appendChild(document.createTextNode(fullText));
    return frag;
  }

  const lowerText = fullText.toLowerCase();
  const lowerQ = q.toLowerCase();
  let i = 0;

  while (i < fullText.length) {
    const idx = lowerText.indexOf(lowerQ, i);
    if (idx === -1) {
      const muted = document.createElement("span");
      muted.className = "cb-clipRowTextMuted";
      muted.textContent = fullText.slice(i);
      frag.appendChild(muted);
      break;
    }

    if (idx > i) {
      const muted = document.createElement("span");
      muted.className = "cb-clipRowTextMuted";
      muted.textContent = fullText.slice(i, idx);
      frag.appendChild(muted);
    }

    const match = document.createElement("span");
    match.className = "cb-clipRowTextMatch";
    match.textContent = fullText.slice(idx, idx + q.length);
    frag.appendChild(match);
    i = idx + q.length;
  }

  return frag;
}

export function createClipRow({
  id,
  text,
  state = "default", // 'default' | 'edit'
  searchQuery = "",
  editValue = "",
  onCopy,
  onEdit,
  onDelete,
  onReorder,
  onRefresh,
  onCancel,
  onConfirm,
  onEditInput,
  onMove
} = {}) {
  const row = document.createElement("div");
  row.className = "cb-clipRow";
  if (id) row.dataset.itemId = id;

  if (state === "edit") row.classList.add("cb-clipRow--edit");

  const originalText = text ?? "";

  if (state === "edit") {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "cb-clipRowEditInput";
    input.value = editValue ?? originalText;
    input.autocomplete = "off";
    input.spellcheck = false;

    const confirmRoot = createIconButton({
      icon: "material-symbols:check-rounded",
      title: "Confirm",
      tooltip: "Confirm",
      onClick: onConfirm,
      size: "sm",
      disabled: !isEditConfirmEnabled(input.value, originalText)
    });
    const confirmButton = confirmRoot.querySelector("button");

    input.addEventListener("input", (e) => {
      const value = e.target.value;
      onEditInput?.(value);
      if (confirmButton) {
        confirmButton.disabled = !isEditConfirmEnabled(value, originalText);
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (confirmButton && !confirmButton.disabled) onConfirm?.();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel?.();
      }
    });

    row.appendChild(input);
    queueMicrotask(() => {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });

    const fade = document.createElement("div");
    fade.className = "cb-clipRowActionsFade";

    const dock = document.createElement("div");
    dock.className = "cb-clipRowActionsDock";

    dock.appendChild(
      createIconButton({
        icon: "material-symbols:refresh-rounded",
        title: "Reset",
        tooltip: "Reset",
        onClick: () => {
          onRefresh?.();
          input.value = originalText;
          onEditInput?.(originalText);
          if (confirmButton) {
            confirmButton.disabled = !isEditConfirmEnabled(originalText, originalText);
          }
          input.focus();
        },
        size: "sm"
      })
    );
    dock.appendChild(
      createIconButton({
        icon: "material-symbols:close-rounded",
        title: "Cancel",
        tooltip: "Cancel",
        onClick: onCancel,
        size: "sm"
      })
    );
    dock.appendChild(confirmRoot);

    row.appendChild(fade);
    row.appendChild(dock);
    attachDragHandlers(row, id, onMove);
    return row;
  }

  const p = document.createElement("p");
  p.className = "cb-clipRowText";
  if ((searchQuery ?? "").trim()) {
    p.classList.add("cb-clipRowText--search");
    p.appendChild(buildHighlightedText(originalText, searchQuery));
  } else {
    p.textContent = originalText;
  }
  row.appendChild(p);

  const fade = document.createElement("div");
  fade.className = "cb-clipRowActionsFade";

  const dock = document.createElement("div");
  dock.className = "cb-clipRowActionsDock";

  dock.appendChild(
    createIconButton({ icon: "solar:copy-linear", title: "Copy", tooltip: "Copy", onClick: onCopy, size: "sm" })
  );
  dock.appendChild(
    createIconButton({ icon: "solar:pen-2-linear", title: "Edit", tooltip: "Edit", onClick: onEdit, size: "sm" })
  );
  dock.appendChild(
    createIconButton({
      icon: "solar:trash-bin-trash-linear",
      title: "Delete",
      tooltip: "Delete",
      onClick: onDelete,
      size: "sm",
      variant: "danger"
    })
  );

  const reorderRoot = createIconButton({
    icon: "fluent:re-order-dots-vertical-16-filled",
    title: "Reorder",
    tooltip: "Reorder",
    onClick: onReorder,
    size: "sm"
  });
  reorderRoot.draggable = true;
  reorderRoot.addEventListener("dragstart", (e) => {
    if (!id) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    row.classList.add("cb-clipRow--dragging");
  });
  reorderRoot.addEventListener("dragend", () => {
    row.classList.remove("cb-clipRow--dragging");
  });
  dock.appendChild(reorderRoot);

  row.appendChild(fade);
  row.appendChild(dock);
  attachDragHandlers(row, id, onMove);

  return row;
}

function attachDragHandlers(row, id, onMove) {
  row.addEventListener("dragover", (e) => {
    if (!id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    row.classList.add("cb-clipRow--dropTarget");
  });
  row.addEventListener("dragleave", () => {
    row.classList.remove("cb-clipRow--dropTarget");
  });
  row.addEventListener("drop", (e) => {
    e.preventDefault();
    row.classList.remove("cb-clipRow--dropTarget");
    const fromId = e.dataTransfer.getData("text/plain");
    if (fromId && id && fromId !== id) onMove?.(fromId, id);
  });
}
