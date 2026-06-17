const ICON_PATH = {
  "ic:round-add": "assets/ic__round-add.svg",
  "solar:settings-linear": "assets/solar__settings-linear.svg",
  "mynaui:search": "assets/mynaui__search.svg",
  "fluent:re-order-dots-vertical-16-filled": "assets/fluent__re-order-dots-vertical-16-filled.svg",
  "solar:copy-linear": "assets/solar__copy-linear.svg",
  "solar:trash-bin-trash-linear": "assets/solar__trash-bin-trash-linear.svg",
  "solar:pen-2-linear": "assets/solar__pen-2-linear.svg",
  "material-symbols:check-rounded": "assets/material-symbols__check-rounded.svg",
  "material-symbols:close-rounded": "assets/material-symbols__close-rounded.svg",
  "material-symbols:arrow-back-rounded": "assets/material-symbols__arrow-back-rounded.svg",
  "material-symbols:chevron-right-rounded": "assets/material-symbols__chevron-right-rounded.svg",
  "material-symbols:refresh-rounded": "assets/material-symbols__refresh-rounded.svg"
};

const svgTemplateCache = new Map();
const svgLoadCache = new Map();

function cloneIconSvg(template) {
  return template.cloneNode(true);
}

function parseSvgMarkup(svgText) {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.querySelector("parsererror")) {
    throw new Error("Invalid SVG markup");
  }
  svg.classList.add("cb-iconButtonIcon");
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("focusable", "false");
  return svg;
}

async function loadIconTemplate(icon) {
  if (svgTemplateCache.has(icon)) return svgTemplateCache.get(icon);

  let pending = svgLoadCache.get(icon);
  if (!pending) {
    const path = ICON_PATH[icon];
    if (!path) return null;
    pending = fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load icon: ${icon}`);
        return res.text();
      })
      .then(parseSvgMarkup)
      .then((template) => {
        svgTemplateCache.set(icon, template);
        svgLoadCache.delete(icon);
        return template;
      })
      .catch((err) => {
        svgLoadCache.delete(icon);
        throw err;
      });
    svgLoadCache.set(icon, pending);
  }

  return pending;
}

export function preloadIcons(icons = Object.keys(ICON_PATH)) {
  return Promise.all(icons.map((icon) => loadIconTemplate(icon).catch(() => null)));
}

/**
 * Figma source: 3008:7002 (Icon container states Default/Hover/Pressed)
 */
export function createIconButton({
  icon,
  title = "",
  tooltip = "",
  onClick,
  size = "md",
  variant,
  disabled = false
} = {}) {
  const root = document.createElement("span");
  root.className = "cb-iconButtonRoot";

  const button = document.createElement("button");
  button.type = "button";
  const sizeClass = size === "sm" ? "cb-iconButton--sm" : "";
  const variantClass = variant === "danger" ? "cb-iconButton--danger" : "";
  button.className = `cb-iconButton ${sizeClass} ${variantClass}`.trim();
  button.disabled = Boolean(disabled);

  const label = title || icon;
  if (label) button.setAttribute("aria-label", label);
  if (typeof onClick === "function") {
    button.addEventListener("click", (e) => {
      if (button.disabled) return;
      onClick(e);
    });
  }

  const wrap = document.createElement("span");
  wrap.className = "cb-iconButtonIconWrap";
  button.appendChild(wrap);

  const tipText = tooltip || title;
  if (tipText) {
    const tip = document.createElement("span");
    tip.className = "cb-iconButtonTooltip";
    tip.textContent = tipText;
    tip.setAttribute("role", "tooltip");
    root.appendChild(button);
    root.appendChild(tip);
  } else {
    root.appendChild(button);
  }

  loadIconTemplate(icon)
    .then((template) => {
      if (!template) return;
      wrap.replaceChildren(cloneIconSvg(template));
    })
    .catch(() => {});

  return root;
}

export function getIconPath(iconName) {
  return ICON_PATH[iconName] ?? "";
}
