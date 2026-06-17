const TOAST_DURATION_MS = 2400;

let toastRoot = null;
let hideTimer = null;
let leaveTimer = null;
let currentToast = null;

function ensureRoot() {
  if (!toastRoot) {
    toastRoot = document.createElement("div");
    toastRoot.className = "cb-toastRoot";
    toastRoot.setAttribute("aria-live", "polite");
    toastRoot.setAttribute("aria-atomic", "true");
    document.body.appendChild(toastRoot);
  }
  return toastRoot;
}

function clearTimers() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
}

function dismissToast(toast) {
  if (!toast || !toast.isConnected) return;
  toast.classList.remove("cb-toast--visible");
  toast.classList.add("cb-toast--leaving");
  leaveTimer = setTimeout(() => {
    toast.remove();
    if (currentToast === toast) currentToast = null;
  }, 220);
}

/**
 * @param {{ message: string, tone?: 'default' | 'danger' }} options
 */
export function showToast({ message, tone = "default" } = {}) {
  if (!message) return;

  const root = ensureRoot();
  clearTimers();

  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }

  const toast = document.createElement("div");
  toast.className = `cb-toast cb-toast--${tone}`;
  toast.setAttribute("role", "status");

  const text = document.createElement("span");
  text.className = "cb-toastText";
  text.textContent = message;

  toast.appendChild(text);
  root.appendChild(toast);
  currentToast = toast;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("cb-toast--visible"));
  });

  hideTimer = setTimeout(() => dismissToast(toast), TOAST_DURATION_MS);
}
