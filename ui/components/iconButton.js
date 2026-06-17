const ICON_PATH = {
  "ic:round-add": "../../popup/assets/ic__round-add.svg",
  "solar:settings-linear": "../../popup/assets/solar__settings-linear.svg",
  "mynaui:search": "../../popup/assets/mynaui__search.svg",
  "fluent:re-order-dots-vertical-16-filled": "../../popup/assets/fluent__re-order-dots-vertical-16-filled.svg",
  "solar:copy-linear": "../../popup/assets/solar__copy-linear.svg",
  "solar:trash-bin-trash-linear": "../../popup/assets/solar__trash-bin-trash-linear.svg",
  "solar:pen-2-linear": "../../popup/assets/solar__pen-2-linear.svg",
  "material-symbols:check-rounded": "../../popup/assets/material-symbols__check-rounded.svg",
  "material-symbols:close-rounded": "../../popup/assets/material-symbols__close-rounded.svg",
  "material-symbols:refresh-rounded": "../../popup/assets/material-symbols__refresh-rounded.svg"
};

/**
 * Figma source: 3008:7002 (Icon container states Default/Hover/Pressed)
 * Usage:
 *   const btn = createIconButton({ icon: "solar:settings-linear", title: "Settings", onClick: () => {} })
 */
export function createIconButton({ icon, title = "", onClick } = {}) {
  const button = document.createElement("button");
  button.className = "cb-iconButton";
  if (title) button.title = title;
  if (typeof onClick === "function") button.addEventListener("click", onClick);

  const img = document.createElement("img");
  img.className = "cb-iconButtonIcon";
  img.alt = title || "";
  img.src = ICON_PATH[icon] ?? "";
  button.appendChild(img);

  return button;
}

export function getIconPath(iconName) {
  return ICON_PATH[iconName] ?? "";
}

