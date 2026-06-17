import { createIconButton } from "./iconButton.js";
import { createCategoryPicker } from "./categoryPicker.js";

/**
 * Figma source: 3008:7462 (Text row states: Frame99 default, Frame100 hover, Variant3 edit)
 */
function isEditConfirmEnabled(value, originalText, category, originalCategory, hasCategoryPicker) {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return false;
  const textChanged = trimmed !== (originalText ?? "").trim();
  const categoryChanged = hasCategoryPicker && category !== originalCategory;
  return textChanged || categoryChanged;
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

export function resizeClipRowEditInput(input) {
  if (!input) return;
  input.style.height = "0px";
  input.style.height = `${input.scrollHeight}px`;
}

export function createClipRow({
  id,
  text,
  state = "default", // 'default' | 'edit'
  searchQuery = "",
  editValue = "",
  category,
  categoryOptions = [],
  actionsLocked = false,
  onActionBlocked,
  onCopy,
  onEdit,
  onDelete,
  onReorder,
  onRefresh,
  onCancel,
  onConfirm,
  onEditInput,
  onCategoryChange,
  onMove
} = {}) {
  const row = document.createElement("div");
  row.className = "cb-clipRow";
  if (id) row.dataset.itemId = id;

  if (state === "edit") row.classList.add("cb-clipRow--edit");
  if (actionsLocked) row.classList.add("cb-clipRow--actionsLocked");

  const originalText = text ?? "";
  const originalCategory = category ?? categoryOptions[0] ?? "";
  const hasCategoryPicker = categoryOptions.length > 0;
  let currentCategory = originalCategory;

  if (state === "edit") {
    const input = document.createElement("textarea");
    input.className = "cb-clipRowEditInput";
    input.rows = 1;
    input.value = editValue ?? originalText;
    input.autocomplete = "off";
    input.spellcheck = false;

    const updateConfirmState = () => {
      if (confirmButton) {
        confirmButton.disabled = !isEditConfirmEnabled(
          input.value,
          originalText,
          currentCategory,
          originalCategory,
          hasCategoryPicker
        );
      }
    };

    const confirmRoot = createIconButton({
      icon: "material-symbols:check-rounded",
      title: "Confirm",
      tooltip: "Confirm",
      onClick: onConfirm,
      size: "sm",
      disabled: !isEditConfirmEnabled(
        input.value,
        originalText,
        currentCategory,
        originalCategory,
        hasCategoryPicker
      )
    });
    const confirmButton = confirmRoot.querySelector("button");

    input.addEventListener("input", (e) => {
      const value = e.target.value;
      onEditInput?.(value);
      resizeClipRowEditInput(input);
      updateConfirmState();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (confirmButton && !confirmButton.disabled) onConfirm?.();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel?.();
      }
    });

    row.appendChild(input);

    const fade = document.createElement("div");
    fade.className = "cb-clipRowActionsFade";

    const dock = document.createElement("div");
    dock.className = "cb-clipRowActionsDock";

    if (hasCategoryPicker) {
      row.classList.add("cb-clipRow--editWithPicker");
      const categoryWrap = document.createElement("div");
      categoryWrap.className = "cb-clipRowDockCategory";
      const categoryPicker = createCategoryPicker({
        value: currentCategory,
        options: categoryOptions,
        onChange: (next) => {
          currentCategory = next;
          onCategoryChange?.(next);
          updateConfirmState();
        }
      });
      categoryWrap.appendChild(categoryPicker);
      dock.appendChild(categoryWrap);
      row.cbEditCategoryPicker = categoryPicker;
    }

    dock.appendChild(
      createIconButton({
        icon: "material-symbols:refresh-rounded",
        title: "Reset",
        tooltip: "Reset",
        onClick: () => {
          onRefresh?.();
          input.value = originalText;
          currentCategory = originalCategory;
          onEditInput?.(originalText);
          onCategoryChange?.(originalCategory);
          row.cbEditCategoryPicker?.cbSetValue?.(originalCategory);
          resizeClipRowEditInput(input);
          updateConfirmState();
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

    queueMicrotask(() => {
      resizeClipRowEditInput(input);
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });

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

  const guardAction = (handler) => (e) => {
    if (actionsLocked) {
      onActionBlocked?.();
      return;
    }
    handler?.(e);
  };

  dock.appendChild(
    createIconButton({ icon: "solar:copy-linear", title: "Copy", tooltip: "Copy", onClick: onCopy, size: "sm" })
  );
  dock.appendChild(
    createIconButton({
      icon: "solar:pen-2-linear",
      title: "Edit",
      tooltip: "Edit",
      onClick: guardAction(onEdit),
      size: "sm"
    })
  );
  dock.appendChild(
    createIconButton({
      icon: "solar:trash-bin-trash-linear",
      title: "Delete",
      tooltip: "Delete",
      onClick: guardAction(onDelete),
      size: "sm",
      variant: "danger"
    })
  );

  const reorderRoot = createIconButton({
    icon: "fluent:re-order-dots-vertical-16-filled",
    title: "Reorder",
    tooltip: "Reorder",
    onClick: guardAction(onReorder),
    size: "sm"
  });
  if (!actionsLocked) {
    attachReorderHandle(reorderRoot, row, id);
  }
  dock.appendChild(reorderRoot);

  row.appendChild(fade);
  row.appendChild(dock);
  if (actionsLocked) {
    row.addEventListener("click", (e) => {
      if (e.target.closest(".cb-clipRowActionsDock")) return;
      onActionBlocked?.();
    });
  }
  if (!actionsLocked) {
    attachDragHandlers(row, id, onMove);
  }

  return row;
}

function getReorderContainer(row) {
  return row?.closest(".cb-container");
}

function clearDropIndicators(container) {
  if (!container) return;
  for (const row of container.querySelectorAll(".cb-clipRow")) {
    row.classList.remove("cb-clipRow--dropBefore", "cb-clipRow--dropAfter");
    delete row.dataset.dropPlacement;
  }
}

function setDropIndicator(row, placement) {
  const container = getReorderContainer(row);
  clearDropIndicators(container);
  if (placement === "before") {
    row.classList.add("cb-clipRow--dropBefore");
  } else {
    row.classList.add("cb-clipRow--dropAfter");
  }
  row.dataset.dropPlacement = placement;
}

function getDropPlacement(row, clientY) {
  const rect = row.getBoundingClientRect();
  return clientY < rect.top + rect.height / 2 ? "before" : "after";
}

export function setupListReorder(container, { onMove } = {}) {
  if (!container || container.dataset.reorderInit === "1") return;
  container.dataset.reorderInit = "1";

  container.addEventListener("dragover", (e) => {
    const fromId = container.dataset.draggingId;
    if (!fromId) return;

    const row = e.target.closest(".cb-clipRow");
    if (row) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rows = container.querySelectorAll(".cb-clipRow");
    const last = rows[rows.length - 1];
    if (!last || last.dataset.itemId === fromId) {
      clearDropIndicators(container);
      return;
    }

    setDropIndicator(last, "after");
  });

  container.addEventListener("drop", (e) => {
    const fromId = container.dataset.draggingId;
    if (!fromId) return;

    const row = e.target.closest(".cb-clipRow");
    if (row) return;

    e.preventDefault();
    const marked = container.querySelector(".cb-clipRow--dropBefore, .cb-clipRow--dropAfter");
    if (!marked) return;

    const toId = marked.dataset.itemId;
    const placement = marked.dataset.dropPlacement || "after";
    clearDropIndicators(container);
    delete container.dataset.draggingId;
    if (toId && toId !== fromId) onMove?.(fromId, toId, placement);
  });
}

function attachDragHandlers(row, id, onMove) {
  row.addEventListener("dragover", (e) => {
    const container = getReorderContainer(row);
    const fromId = container?.dataset.draggingId;
    if (!id || !fromId || fromId === id) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropIndicator(row, getDropPlacement(row, e.clientY));
  });

  row.addEventListener("dragleave", (e) => {
    const container = getReorderContainer(row);
    if (!container) return;
    const related = e.relatedTarget;
    if (related && (row.contains(related) || row === related)) return;
    if (row.classList.contains("cb-clipRow--dropBefore") || row.classList.contains("cb-clipRow--dropAfter")) {
      row.classList.remove("cb-clipRow--dropBefore", "cb-clipRow--dropAfter");
      delete row.dataset.dropPlacement;
    }
  });

  row.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const container = getReorderContainer(row);
    const fromId = e.dataTransfer.getData("text/plain") || container?.dataset.draggingId;
    const placement = row.dataset.dropPlacement || getDropPlacement(row, e.clientY);

    clearDropIndicators(container);
    if (container) delete container.dataset.draggingId;
    row.classList.remove("cb-clipRow--dragging");

    if (fromId && id && fromId !== id) onMove?.(fromId, id, placement);
  });
}

function attachReorderHandle(reorderRoot, row, id) {
  reorderRoot.draggable = true;
  reorderRoot.addEventListener("dragstart", (e) => {
    if (!id) return;
    const container = getReorderContainer(row);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    if (container) container.dataset.draggingId = id;
    row.classList.add("cb-clipRow--dragging");
    if (e.dataTransfer.setDragImage) {
      e.dataTransfer.setDragImage(row, 0, row.offsetHeight / 2);
    }
  });
  reorderRoot.addEventListener("dragend", () => {
    const container = getReorderContainer(row);
    row.classList.remove("cb-clipRow--dragging");
    clearDropIndicators(container);
    if (container) delete container.dataset.draggingId;
  });
}
