/**
 * Centered empty state for the clip list container.
 * @param {{ title?: string, subtitle?: string, buttonLabel?: string, onAction?: () => void, variant?: 'primary' | 'message' }} options
 */
export function createEmptyState({
  title,
  subtitle,
  buttonLabel,
  onAction,
  variant = "message"
} = {}) {
  const wrap = document.createElement("div");
  wrap.className = `cb-emptyState${variant === "primary" ? " cb-emptyState--primary" : ""}`;

  const copy = document.createElement("div");
  copy.className = "cb-emptyStateCopy";

  const titleEl = document.createElement("p");
  titleEl.className = "cb-emptyStateTitle";
  titleEl.textContent = title ?? "";
  copy.appendChild(titleEl);

  if (subtitle) {
    const sub = document.createElement("p");
    sub.className = "cb-emptyStateSubtitle";
    sub.textContent = subtitle;
    copy.appendChild(sub);
  }

  wrap.appendChild(copy);

  if (variant === "primary" && buttonLabel && onAction) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cb-pillBtn cb-pillBtnAdd cb-emptyStateAction";
    btn.textContent = buttonLabel;
    btn.addEventListener("click", onAction);
    wrap.appendChild(btn);
  }

  return wrap;
}
