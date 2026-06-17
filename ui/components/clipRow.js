import { createIconButton } from "./iconButton.js";

/**
 * Figma source: 3008:7462 (Text row states: Frame99 default, Frame100 hover, Variant3 edit)
 *
 * States:
 * - default: fade overlay exists but hidden (opacity 0)
 * - hover: fade visible and dock visible
 * - edit: dock visible with refresh/check icons (match Variant3)
 */
export function createClipRow({
  text,
  state = "default", // 'default' | 'hover' | 'edit'
  onCopy,
  onEdit,
  onDelete,
  onReorder,
  onRefresh,
  onConfirm
} = {}) {
  const row = document.createElement("div");
  row.className = "cb-clipRow";
  row.tabIndex = 0;

  if (state === "hover") row.classList.add("cb-clipRow--hover");
  if (state === "edit") row.classList.add("cb-clipRow--edit");

  const p = document.createElement("p");
  p.className = "cb-clipRowText";
  p.textContent = text ?? "";
  row.appendChild(p);

  const fade = document.createElement("div");
  fade.className = "cb-clipRowActionsFade";

  const dock = document.createElement("div");
  dock.className = "cb-clipRowActionsDock";

  if (state === "edit") {
    dock.appendChild(
      createIconButton({
        icon: "material-symbols:refresh-rounded",
        title: "Refresh",
        onClick: onRefresh
      })
    );
    dock.appendChild(
      createIconButton({
        icon: "material-symbols:check-rounded",
        title: "Confirm",
        onClick: onConfirm
      })
    );
  } else {
    dock.appendChild(createIconButton({ icon: "solar:copy-linear", title: "Copy", onClick: onCopy }));
    dock.appendChild(createIconButton({ icon: "solar:pen-2-linear", title: "Edit", onClick: onEdit }));
    dock.appendChild(createIconButton({ icon: "solar:trash-bin-trash-linear", title: "Delete", onClick: onDelete }));

    const reorderBtn = createIconButton({
      icon: "fluent:re-order-dots-vertical-16-filled",
      title: "Reorder",
      onClick: onReorder
    });
    reorderBtn.draggable = true;
    dock.appendChild(reorderBtn);
  }

  row.appendChild(fade);
  row.appendChild(dock);

  return row;
}

