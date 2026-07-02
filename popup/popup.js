import { createIconButton, preloadIcons } from "../ui/components/iconButton.js";
import { createCategoryBar } from "../ui/components/categoryBar.js";
import { closeAllCategoryPickers, createCategoryPicker } from "../ui/components/categoryPicker.js";
import { createClipRow, setupListReorder, resizeClipRowEditInput } from "../ui/components/clipRow.js";
import { createAddCategoryDialog } from "../ui/components/addCategoryDialog.js";
import { createDeleteDialog } from "../ui/components/deleteDialog.js";
import { createRemoveLabelDialog } from "../ui/components/removeLabelDialog.js";
import { createEmptyState } from "../ui/components/emptyState.js";
import { createSettingsView } from "../ui/components/settingsView.js";
import { showToast } from "../ui/components/toast.js";
import { detectCategory } from "../shared/categoryDetector.js";
import { loadData, saveData, serializeExport, clearData, importFromText } from "../shared/storage.js";
import { loadPreferences, savePreferences, clearPreferences } from "../shared/preferences.js";
import { applyAppearance, COLOR_MODES, THEMES } from "../shared/themes.js";
import { newClipId, MAX_IMPORT_BYTES, StorageError } from "../shared/storageSchema.js";

const UNCATEGORIZED = "Uncategorized";
const ALL_CATEGORY = "All";
const RESERVED_LABELS = new Set([ALL_CATEGORY.toLowerCase(), UNCATEGORIZED.toLowerCase()]);

const state = {
  mode: "default", // 'default' | 'search' | 'settings'
  activeCategory: ALL_CATEGORY,
  labels: [],
  labelDraft: "",
  query: "",
  addCategory: UNCATEGORIZED,
  addCategoryLocked: false,
  items: [],
  editingId: null,
  editDraft: "",
  editCategory: UNCATEGORIZED,
  confirmDeleteId: null,
  confirmRemoveLabel: null,
  showAddCategoryDialog: false,
  confirmClearAll: false,
  colorMode: "light",
  theme: "default",
  motionEnabled: true
};

function $(id) {
  return document.getElementById(id);
}

async function persist() {
  try {
    await saveData({ items: state.items, labels: state.labels });
  } catch (err) {
    console.error("Failed to save clipboard data:", err);
    showToast({
      message: err?.message || "Could not save. Storage may be full.",
      tone: "danger"
    });
  }
}

function isMotionEnabled() {
  return state.motionEnabled;
}

function syncMotionClass() {
  document.documentElement.classList.toggle("cb-motion", isMotionEnabled());
}

async function setMotionEnabled(enabled) {
  const previous = state.motionEnabled;
  state.motionEnabled = enabled;
  syncMotionClass();

  try {
    await savePreferences({ motionEnabled: enabled });
  } catch (err) {
    state.motionEnabled = previous;
    syncMotionClass();
    console.error("Failed to save motion preference:", err);
    showToast({
      message: err?.message || "Could not save animation preference.",
      tone: "danger"
    });
  }
}

function render({
  screenTransition = false,
  listEnter = false,
  settingsEnter = false,
  focusRowId = null
} = {}) {
  closeAllCategoryPickers();
  const app = $("app");
  app.replaceChildren(build());
  applyMotionIntent({ screenTransition, listEnter, settingsEnter, focusRowId });

  if (state.showAddCategoryDialog && state.mode !== "settings") {
    document.querySelector(".cb-addCategoryDialogInput")?.focus();
  } else if (state.mode === "search") {
    const input = document.querySelector(".cb-searchInput");
    autoResizeSearchInput(input);
    input?.focus();
  }
}

function applyMotionIntent({
  screenTransition = false,
  listEnter = false,
  settingsEnter = false,
  focusRowId = null
} = {}) {
  if (!isMotionEnabled()) return;

  if (screenTransition) {
    document.querySelector(".cb-surfaceInner")?.classList.add("cb-motion-screen");
  }

  if (listEnter && state.mode !== "settings") {
    document.querySelector(".cb-surfaceInner")?.classList.add("cb-motion-shell-enter");
    scheduleClassCleanup("cb-motion-shell-enter", 400);

    for (const container of document.querySelectorAll(".cb-container")) {
      container.classList.add("cb-motion-list-enter");
      if (container.classList.contains("cb-searchContainer")) {
        container.classList.add("cb-motion-list-enter--soft");
      }
    }
    scheduleListEnterCleanup();

    const catBar = document.querySelector(".cb-categoriesWrap");
    if (catBar) {
      catBar.classList.add("cb-motion-bar-enter");
      scheduleClassCleanup("cb-motion-bar-enter", 400);
    }
  }

  if (settingsEnter || (listEnter && state.mode === "settings")) {
    document.querySelector(".cb-settings")?.classList.add("cb-motion-settings-enter");
    scheduleClassCleanup("cb-motion-settings-enter", 550);
  }

  if (focusRowId) {
    const row = document.querySelector(`[data-item-id="${CSS.escape(focusRowId)}"]`);
    row?.classList.add("cb-motion-row-enter");
    scheduleClassCleanup("cb-motion-row-enter", 350);
  }

  if (state.confirmDeleteId || state.confirmRemoveLabel || state.showAddCategoryDialog || state.confirmClearAll) {
    for (const overlay of document.querySelectorAll(".cb-deleteDialogOverlay")) {
      overlay.classList.add("cb-motion-dialog-enter");
    }
    scheduleClassCleanup("cb-motion-dialog-enter", 400);
  }
}

let motionCleanupTimers = new Map();

function scheduleClassCleanup(className, delayMs) {
  const existing = motionCleanupTimers.get(className);
  if (existing) clearTimeout(existing);

  motionCleanupTimers.set(
    className,
    setTimeout(() => {
      for (const el of document.querySelectorAll(`.${className}`)) {
        el.classList.remove(className);
      }
      motionCleanupTimers.delete(className);
    }, delayMs)
  );
}

function applyContainerEnter(container, { soft = false } = {}) {
  if (!isMotionEnabled() || !container) return;
  container.classList.add("cb-motion-list-enter");
  if (soft) container.classList.add("cb-motion-list-enter--soft");
  scheduleListEnterCleanup();
}

let listEnterCleanupTimer = null;
let searchFillTimer = null;

function cancelSearchFill() {
  if (searchFillTimer) {
    clearTimeout(searchFillTimer);
    searchFillTimer = null;
  }
}

function scheduleSearchFill(container) {
  cancelSearchFill();
  searchFillTimer = setTimeout(() => {
    searchFillTimer = null;
    fillContainer(container);
  }, 120);
}

function scheduleListEnterCleanup() {
  if (listEnterCleanupTimer) clearTimeout(listEnterCleanupTimer);
  listEnterCleanupTimer = setTimeout(() => {
    for (const container of document.querySelectorAll(".cb-motion-list-enter")) {
      container.classList.remove("cb-motion-list-enter", "cb-motion-list-enter--soft");
    }
    for (const container of document.querySelectorAll(".cb-container")) {
      syncContainerScroll(container);
    }
    listEnterCleanupTimer = null;
  }, 400);
}

function hasCategories() {
  return state.labels.length > 0;
}

function getCategories() {
  return hasCategories() ? [ALL_CATEGORY, UNCATEGORIZED, ...state.labels] : [];
}

function isSearchActive() {
  return state.mode === "search";
}

function isSearchFiltering() {
  return isSearchActive() && Boolean((state.query ?? "").trim());
}

function getFilteredItems() {
  if (isSearchFiltering()) {
    const q = (state.query ?? "").trim().toLowerCase();
    return state.items.filter((i) => i.text.toLowerCase().includes(q));
  }

  if (state.activeCategory === ALL_CATEGORY) {
    return state.items;
  }

  if (state.activeCategory === UNCATEGORIZED) {
    return state.items.filter(
      (i) => i.category === UNCATEGORIZED || !state.labels.includes(i.category)
    );
  }

  return state.items.filter((i) => i.category === state.activeCategory);
}

function getEmptyStateContent() {
  if (isSearchFiltering()) {
    const q = (state.query ?? "").trim();
    return {
      title: `No results for "${q}"`,
      subtitle: "Try a different search term"
    };
  }

  if (state.items.length === 0) {
    return {
      variant: "primary",
      title: "Nothing saved yet",
      subtitle: "Save text you copy often and find it here",
      buttonLabel: "Add text",
      onAction: enterSearchMode
    };
  }

  if (state.activeCategory !== ALL_CATEGORY) {
    return {
      title: `No text in ${state.activeCategory}`,
      subtitle: "Try another category or add something new"
    };
  }

  return null;
}

function resolveDetectedCategory(text) {
  const detected = detectCategory(text);
  if (state.labels.includes(detected)) return detected;
  return UNCATEGORIZED;
}

function defaultAddCategory() {
  if (state.labels.includes(state.activeCategory)) return state.activeCategory;
  if (state.activeCategory === UNCATEGORIZED) return UNCATEGORIZED;
  return UNCATEGORIZED;
}

function syncAddCategoryFromQuery() {
  if (state.addCategoryLocked) return;

  const trimmed = (state.query ?? "").trim();
  if (!trimmed) {
    state.addCategory = defaultAddCategory();
    return;
  }

  const detected = resolveDetectedCategory(trimmed);
  if (detected !== UNCATEGORIZED) {
    state.addCategory = detected;
  }
  // Inconclusive detection (plain text, or Mail/General/Socials not in user labels):
  // keep the current category from the tab default or manual picker selection.
}

function getCategoryPickerOptions() {
  return hasCategories() ? [UNCATEGORIZED, ...state.labels] : [];
}

function getSearchCategoryPickerOptions() {
  return [UNCATEGORIZED, ...state.labels];
}

function resolveEditCategory(category) {
  const options = getCategoryPickerOptions();
  if (options.includes(category)) return category;
  return UNCATEGORIZED;
}

function isEditActive() {
  return state.editingId !== null;
}

function notifyEditBlocked() {
  showToast({ message: "Finish or cancel your edit first" });
}

function enterSearchMode() {
  if (isEditActive()) {
    notifyEditBlocked();
    return;
  }
  cancelSearchFill();
  state.mode = "search";
  state.addCategory = defaultAddCategory();
  state.addCategoryLocked = state.labels.includes(state.activeCategory);

  const composer = document.querySelector(".cb-composer");
  if (composer) {
    if (!composer.querySelector(".cb-categoryPicker")) {
      render();
      return;
    }
    syncComposerMode();
    syncHomeChrome();
    syncSearchUI();
    requestAnimationFrame(() => {
      const input = document.querySelector(".cb-searchInput");
      autoResizeSearchInput(input);
      input?.focus();
    });
    return;
  }
  render();
}

function syncComposerMode() {
  const composer = document.querySelector(".cb-composer");
  if (!composer) return;

  composer.classList.toggle("cb-composer--search", isSearchActive());
  composer.classList.toggle("cb-composer--default", !isSearchActive());

  const input = composer.querySelector(".cb-searchInput");
  if (input && input.value !== state.query) {
    input.value = state.query ?? "";
  }
  if (isSearchActive()) {
    autoResizeSearchInput(input);
  } else if (input) {
    input.style.height = "";
  }
}

function autoResizeSearchInput(input) {
  if (!input) return;
  input.style.height = "0px";
  input.style.height = `${input.scrollHeight}px`;
}

function bindSearchInput(input) {
  input.addEventListener("input", (e) => {
    state.query = e.target.value;
    if (!(state.query ?? "").trim()) {
      state.addCategoryLocked = state.labels.includes(state.activeCategory);
      state.addCategory = defaultAddCategory();
    }
    autoResizeSearchInput(input);
    syncSearchUI();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addItem();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelSearch();
    }
  });
}

function syncHomeChrome() {
  const inner = document.querySelector(".cb-surfaceInner");
  if (inner) {
    inner.classList.toggle("cb-home--search", isSearchActive());
    inner.classList.toggle("cb-home--default", !isSearchActive());
  }
  const catBar = document.querySelector(".cb-categoriesWrap");
  if (catBar) catBar.hidden = isSearchActive() && isSearchFiltering();
}

function itemTextExists(text) {
  const normalized = (text ?? "").trim();
  if (!normalized) return false;
  return state.items.some((item) => item.text.trim() === normalized);
}

function addItem() {
  const qTrimmed = (state.query ?? "").trim();
  if (!qTrimmed) return;
  if (itemTextExists(qTrimmed)) {
    showToast({ message: "This text already exists" });
    return;
  }
  state.items.unshift({
    id: newClipId(),
    category: hasCategories() ? state.addCategory : UNCATEGORIZED,
    text: qTrimmed
  });
  state.mode = "default";
  state.query = "";
  state.addCategoryLocked = false;
  state.addCategory = defaultAddCategory();
  state.editingId = null;
  state.editDraft = "";
  void persist();
  render({ listEnter: true });
  showToast({ message: "Added to clipboard" });
}

function cancelSearch() {
  cancelSearchFill();
  state.mode = "default";
  state.query = "";
  state.addCategoryLocked = false;

  const composer = document.querySelector(".cb-composer");
  if (composer) {
    syncComposerMode();
    syncHomeChrome();
    const container = document.querySelector(".cb-container");
    if (container) {
      container.classList.remove("cb-searchContainer");
      fillContainer(container);
      if (isMotionEnabled()) {
        applyContainerEnter(container);
      }
      syncContainerScroll(container);
    }
    return;
  }
  render({ listEnter: true });
}

function isOutsideComposerDismissTarget(target) {
  if (!(target instanceof Node)) return false;
  if (document.querySelector(".cb-composer")?.contains(target)) return false;

  const pickerMenu = document.querySelector(".cb-categoryPickerMenu.cb-categoryPickerMenu--open");
  if (pickerMenu?.contains(target)) return false;

  if (target.closest?.(".cb-deleteDialogOverlay")) return false;

  return true;
}

function onDocumentPointerDown(event) {
  if (!isSearchActive()) return;
  if (!isOutsideComposerDismissTarget(event.target)) return;
  cancelSearch();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast({ message: "Copied!" });
    return;
  } catch {
    // Fallback for environments where clipboard API is unavailable.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast({ message: "Copied!" });
  }
}

function startEdit(id) {
  if (isEditActive() && state.editingId !== id) {
    notifyEditBlocked();
    return;
  }
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  state.confirmDeleteId = null;
  state.editingId = id;
  state.editDraft = item.text;
  state.editCategory = resolveEditCategory(item.category);
  render({ focusRowId: id });
}

function refreshEdit(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  state.editDraft = item.text;
  state.editCategory = resolveEditCategory(item.category);
  const row = document.querySelector(`[data-item-id="${id}"]`);
  const input = row?.querySelector(".cb-clipRowEditInput");
  if (input) {
    input.value = state.editDraft;
    resizeClipRowEditInput(input);
    row.cbEditCategoryPicker?.cbSetValue?.(state.editCategory);
    input.focus();
  } else {
    render();
  }
}

function cancelEdit(id) {
  if (state.editingId !== id) return;
  state.editingId = null;
  state.editDraft = "";
  state.editCategory = UNCATEGORIZED;
  render({ focusRowId: id });
}

function confirmEdit(id) {
  const draft = (state.editDraft ?? "").trim();
  if (!draft) return;
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const textChanged = draft !== item.text.trim();
  const categoryChanged = hasCategories() && state.editCategory !== item.category;
  if (!textChanged && !categoryChanged) return;
  item.text = draft;
  if (hasCategories()) item.category = state.editCategory;
  state.editingId = null;
  state.editDraft = "";
  state.editCategory = UNCATEGORIZED;
  void persist();
  render({ focusRowId: id });
  showToast({ message: "Changes saved" });
}

function deleteItem(id) {
  state.items = state.items.filter((i) => i.id !== id);
  if (state.editingId === id) {
    state.editingId = null;
    state.editDraft = "";
    state.editCategory = UNCATEGORIZED;
  }
  if (state.confirmDeleteId === id) state.confirmDeleteId = null;
  void persist();
  render({ listEnter: true });
  showToast({ message: "Item deleted", tone: "danger" });
}

function requestDelete(id) {
  if (isEditActive() && state.editingId !== id) {
    notifyEditBlocked();
    return;
  }
  state.confirmDeleteId = id;
  render();
}

function cancelDelete(id) {
  if (state.confirmDeleteId === id) {
    state.confirmDeleteId = null;
    render();
  }
}

function confirmDelete(id) {
  if (state.confirmDeleteId !== id) return;
  deleteItem(id);
}

function captureRowPositions(container) {
  const map = new Map();
  if (!container) return map;
  for (const row of container.querySelectorAll(".cb-clipRow[data-item-id]")) {
    map.set(row.dataset.itemId, row.getBoundingClientRect());
  }
  return map;
}

function animateRowReorder(container, beforePositions) {
  if (!container || !isMotionEnabled()) return;

  for (const row of container.querySelectorAll(".cb-clipRow[data-item-id]")) {
    const before = beforePositions.get(row.dataset.itemId);
    if (!before) continue;

    const after = row.getBoundingClientRect();
    const dy = before.top - after.top;
    if (Math.abs(dy) < 0.5) continue;

    row.style.transform = `translateY(${dy}px)`;
    row.style.transition = "transform 0ms";

    requestAnimationFrame(() => {
      row.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
      row.style.transform = "";

      const cleanup = () => {
        row.style.transition = "";
        row.removeEventListener("transitionend", cleanup);
      };
      row.addEventListener("transitionend", cleanup);
    });
  }
}

function moveItem(fromId, toId, placement = "before") {
  if (isEditActive()) {
    notifyEditBlocked();
    return;
  }

  const fromIdx = state.items.findIndex((i) => i.id === fromId);
  const toIdx = state.items.findIndex((i) => i.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

  let insertIdx = placement === "after" ? toIdx + 1 : toIdx;
  if (fromIdx < insertIdx) insertIdx -= 1;
  if (insertIdx === fromIdx) return;

  const container = document.querySelector(".cb-container:not(.cb-container--empty)");
  const beforePositions = captureRowPositions(container);

  const [moved] = state.items.splice(fromIdx, 1);
  state.items.splice(insertIdx, 0, moved);
  void persist();
  render();

  const nextContainer = document.querySelector(".cb-container:not(.cb-container--empty)");
  animateRowReorder(nextContainer, beforePositions);
}

function normalizeLabelName(name) {
  return (name ?? "").trim().replace(/\s+/g, " ");
}

function validateLabelName(name) {
  const normalized = normalizeLabelName(name);
  if (!normalized) return { ok: false };
  if (RESERVED_LABELS.has(normalized.toLowerCase())) {
    return { ok: false, message: "That name is reserved" };
  }
  if (state.labels.some((l) => l.toLowerCase() === normalized.toLowerCase())) {
    return { ok: false, message: "Category already exists" };
  }
  return { ok: true, name: normalized };
}

function addLabel() {
  const result = validateLabelName(state.labelDraft);
  if (!result.ok) {
    if (result.message) showToast({ message: result.message });
    return;
  }
  state.labels.push(result.name);
  state.labelDraft = "";
  if (!hasCategories()) {
    state.activeCategory = ALL_CATEGORY;
  }
  void persist();
  render({ settingsEnter: true });
  showToast({ message: "Category added" });
}

function openAddCategoryDialog() {
  state.showAddCategoryDialog = true;
  state.labelDraft = "";
  render();
}

function cancelAddCategoryDialog() {
  state.showAddCategoryDialog = false;
  state.labelDraft = "";
  render();
}

function confirmAddCategoryDialog() {
  const result = validateLabelName(state.labelDraft);
  if (!result.ok) {
    if (result.message) showToast({ message: result.message });
    return;
  }
  state.labels.push(result.name);
  state.addCategory = result.name;
  state.addCategoryLocked = true;
  state.showAddCategoryDialog = false;
  state.labelDraft = "";
  if (!hasCategories()) {
    state.activeCategory = ALL_CATEGORY;
  }
  void persist();
  render();
  showToast({ message: "Category added" });
}

function countItemsInLabel(name) {
  return state.items.filter((item) => item.category === name).length;
}

function requestRemoveLabel(name) {
  state.confirmRemoveLabel = name;
  render();
}

function cancelRemoveLabel() {
  state.confirmRemoveLabel = null;
  render({ settingsEnter: true });
}

function finalizeRemoveLabel(name, { moveTo } = {}) {
  if (moveTo) {
    state.items.forEach((item) => {
      if (item.category === name) item.category = moveTo;
    });
  }

  state.labels = state.labels.filter((l) => l !== name);
  if (state.activeCategory === name) state.activeCategory = ALL_CATEGORY;
  if (!hasCategories()) {
    state.activeCategory = ALL_CATEGORY;
  }
  if (!getCategoryPickerOptions().includes(state.addCategory)) {
    state.addCategory = defaultAddCategory();
    state.addCategoryLocked = false;
  }
  state.confirmRemoveLabel = null;
  void persist();
  render({ settingsEnter: true });
  showToast({ message: "Category removed", tone: "danger" });
}

function confirmRemoveLabel(name) {
  const itemCount = countItemsInLabel(name);
  if (itemCount > 0) {
    finalizeRemoveLabel(name, { moveTo: UNCATEGORIZED });
    return;
  }
  finalizeRemoveLabel(name);
}

function exportClipboardBackup() {
  const json = serializeExport({ items: state.items, labels: state.labels });
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `clipboard-export-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast({ message: "Data exported" });
}

async function importClipboardBackup(file) {
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    showToast({
      message: `Import file is too large (max ${Math.round(MAX_IMPORT_BYTES / 1_000_000)} MB).`,
      tone: "danger"
    });
    return;
  }

  try {
    const text = await file.text();
    const data = await importFromText(text);
    state.items = data.items;
    state.labels = data.labels;
    state.activeCategory = ALL_CATEGORY;
    state.mode = "default";
    state.query = "";
    state.editingId = null;
    state.editDraft = "";
    state.confirmDeleteId = null;
    state.confirmRemoveLabel = null;
    state.showAddCategoryDialog = false;
    state.confirmClearAll = false;
    state.labelDraft = "";
    state.addCategory = defaultAddCategory();
    state.addCategoryLocked = false;
    render({ screenTransition: true, listEnter: true });
    showToast({ message: "Data imported" });
  } catch (err) {
    console.error("Import failed:", err);
    showToast({
      message: err instanceof StorageError ? err.message : "Could not import that file.",
      tone: "danger"
    });
  }
}

function requestClearAllData() {
  state.confirmClearAll = true;
  render({ settingsEnter: true });
}

function cancelClearAllData() {
  state.confirmClearAll = false;
  render({ settingsEnter: true });
}

async function confirmClearAllData() {
  try {
    await clearData();
    await clearPreferences();
  } catch (err) {
    console.error("Clear all failed:", err);
    showToast({
      message: err?.message || "Could not clear stored data.",
      tone: "danger"
    });
    return;
  }

  state.items = [];
  state.labels = [];
  state.activeCategory = ALL_CATEGORY;
  state.mode = "settings";
  state.query = "";
  state.editingId = null;
  state.editDraft = "";
  state.confirmDeleteId = null;
  state.confirmRemoveLabel = null;
  state.confirmClearAll = false;
  state.showAddCategoryDialog = false;
  state.labelDraft = "";
  state.addCategory = UNCATEGORIZED;
  state.addCategoryLocked = false;
  state.motionEnabled = true;

  const applied = applyAppearance({ colorMode: "light", theme: "default" });
  state.colorMode = applied.colorMode;
  state.theme = applied.theme;
  syncMotionClass();

  render({ settingsEnter: true });
  showToast({ message: "All data cleared", tone: "danger" });
}

function fillContainer(container) {
  container.replaceChildren();
  const items = getFilteredItems();
  const emptyContent = items.length === 0 ? getEmptyStateContent() : null;

  if (emptyContent) {
    container.classList.add("cb-container--empty");
    container.appendChild(
      createEmptyState({
        variant: emptyContent.variant,
        title: emptyContent.title,
        subtitle: emptyContent.subtitle,
        buttonLabel: emptyContent.buttonLabel,
        onAction: emptyContent.onAction
      })
    );
    syncContainerScroll(container);
    if (isMotionEnabled() && isSearchFiltering()) {
      applyContainerEnter(container, { soft: true });
    }
    return;
  }

  container.classList.remove("cb-container--empty");
  const searchQuery = isSearchFiltering() ? state.query : "";
  for (const it of items) {
    const isEditing = state.editingId === it.id;
    const actionsLocked = isEditActive() && !isEditing;
    container.appendChild(
      createClipRow({
        id: it.id,
        text: it.text,
        state: isEditing ? "edit" : "default",
        searchQuery,
        editValue: isEditing ? state.editDraft : it.text,
        category: isEditing ? state.editCategory : it.category,
        categoryOptions: isEditing && hasCategories() ? getCategoryPickerOptions() : [],
        actionsLocked,
        onActionBlocked: notifyEditBlocked,
        onCopy: (e) => {
          e?.stopPropagation();
          copyText(it.text);
        },
        onEdit: (e) => {
          e?.stopPropagation();
          state.confirmDeleteId = null;
          queueMicrotask(() => startEdit(it.id));
        },
        onDelete: (e) => {
          e?.stopPropagation();
          requestDelete(it.id);
        },
        onRefresh: (e) => {
          e?.stopPropagation();
          refreshEdit(it.id);
        },
        onCancel: (e) => {
          e?.stopPropagation();
          cancelEdit(it.id);
        },
        onConfirm: (e) => {
          e?.stopPropagation();
          confirmEdit(it.id);
        },
        onEditInput: (value) => {
          state.editDraft = value;
        },
        onCategoryChange: (category) => {
          state.editCategory = category;
        },
        onMove: moveItem
      })
    );
  }

  setupListReorder(container, { onMove: moveItem });
  syncContainerScroll(container);

  if (isMotionEnabled() && isSearchFiltering()) {
    applyContainerEnter(container, { soft: true });
  }
}

function syncContainerScroll(container) {
  if (!container) return;
  requestAnimationFrame(() => {
    const needsScroll = container.scrollHeight > container.clientHeight + 1;
    container.classList.toggle("cb-container--scrollable", needsScroll);
  });
}

function syncSearchUI() {
  const container = document.querySelector(".cb-container");
  const addBtn = document.querySelector(".cb-pillBtnAdd");
  const categoryPicker = document.querySelector(".cb-categoryPicker");
  syncAddCategoryFromQuery();
  syncHomeChrome();
  if (isSearchActive() && container) {
    const filtering = isSearchFiltering();
    container.classList.toggle("cb-searchContainer", filtering);
    cancelSearchFill();
    if (filtering) {
      scheduleSearchFill(container);
    } else {
      fillContainer(container);
      syncContainerScroll(container);
    }
  }
  if (isSearchActive()) {
    categoryPicker?.cbSetOptions?.(getSearchCategoryPickerOptions());
  }
  if (addBtn) addBtn.disabled = !(state.query ?? "").trim();
  categoryPicker?.cbSetValue?.(state.addCategory);
}

function build() {
  const outer = document.createElement("div");
  outer.className = "cb-surfaceOuter";

  const inner = document.createElement("div");
  inner.className = "cb-surfaceInner";
  outer.appendChild(inner);

  if (state.mode === "settings") {
    inner.appendChild(buildSettingsView());
  } else {
    inner.appendChild(buildHeader());
    inner.appendChild(buildComposer());
    if (hasCategories() && (!isSearchActive() || !isSearchFiltering())) {
      inner.appendChild(buildCategoryBar());
    }
    const listClass = isSearchFiltering() ? "cb-container cb-searchContainer" : "cb-container";
    inner.appendChild(buildListContainer(listClass));

    inner.classList.toggle("cb-home--search", isSearchActive());
    inner.classList.toggle("cb-home--default", state.mode === "default");

    if (state.confirmDeleteId) {
      inner.appendChild(
        createDeleteDialog({
          onDelete: () => confirmDelete(state.confirmDeleteId),
          onKeep: () => cancelDelete(state.confirmDeleteId)
        })
      );
    }
  }

  if (state.mode === "settings" && state.confirmRemoveLabel) {
    const label = state.confirmRemoveLabel;
    inner.appendChild(
      createRemoveLabelDialog({
        label,
        itemCount: countItemsInLabel(label),
        onCancel: cancelRemoveLabel,
        onDeleteCategory: () => confirmRemoveLabel(label)
      })
    );
  }

  if (state.mode === "settings" && state.confirmClearAll) {
    inner.appendChild(
      createDeleteDialog({
        title: "Clear all snippets, categories, and preferences?",
        deleteLabel: "Clear all",
        onDelete: () => {
          void confirmClearAllData();
        },
        onKeep: cancelClearAllData
      })
    );
  }

  if (state.showAddCategoryDialog && state.mode !== "settings") {
    inner.appendChild(
      createAddCategoryDialog({
        value: state.labelDraft,
        onDraftChange: (value) => {
          state.labelDraft = value;
        },
        onCancel: cancelAddCategoryDialog,
        onAdd: confirmAddCategoryDialog
      })
    );
  }

  return outer;
}

function closeExtension() {
  window.close();
}

function createHeaderCloseButton() {
  return createIconButton({
    icon: "material-symbols:close-rounded",
    title: "Close",
    tooltip: "Close",
    onClick: closeExtension
  });
}

function buildHeader() {
  const header = document.createElement("div");
  header.className = "cb-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "cb-titleWrap";
  const title = document.createElement("p");
  title.className = "cb-title";
  title.textContent = "Clipboard";
  titleWrap.appendChild(title);

  const actions = document.createElement("div");
  actions.className = "cb-headerActions";
  actions.appendChild(
    createIconButton({
      icon: "solar:settings-linear",
      title: "Settings",
      tooltip: "Settings",
      onClick: () => {
        if (isEditActive()) {
          notifyEditBlocked();
          return;
        }
        state.mode = "settings";
        render({ screenTransition: true, settingsEnter: true });
      }
    })
  );
  actions.appendChild(createHeaderCloseButton());

  header.appendChild(titleWrap);
  header.appendChild(actions);
  return header;
}

function buildSettingsView() {
  return createSettingsView({
    colorMode: state.colorMode,
    theme: state.theme,
    colorModes: COLOR_MODES,
    themes: THEMES,
    motionEnabled: state.motionEnabled,
    onColorModeChange: (colorMode) => setAppearance({ colorMode }),
    onThemeChange: (theme) => setAppearance({ theme }),
    onMotionChange: (enabled) => {
      void setMotionEnabled(enabled);
      if (enabled) {
        applyMotionIntent({ settingsEnter: true });
      }
    },
    labels: state.labels,
    labelDraft: state.labelDraft,
    showSystemCategories: hasCategories(),
    onBack: () => {
      state.mode = "default";
      state.labelDraft = "";
      render({ screenTransition: true, listEnter: true });
    },
    onClose: closeExtension,
    onLabelDraftChange: (value) => {
      state.labelDraft = value;
    },
    onAddLabel: addLabel,
    onRemoveLabel: requestRemoveLabel,
    onExport: exportClipboardBackup,
    onImport: (file) => {
      void importClipboardBackup(file);
    },
    onClearAll: requestClearAllData
  });
}

function buildComposer() {
  const wrap = document.createElement("div");
  wrap.className = `cb-composer cb-composer--${state.mode === "search" ? "search" : "default"}`;

  const top = document.createElement("div");
  top.className = "cb-composerTop";

  const prompt = document.createElement("div");
  prompt.className = "cb-composerPrompt";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cb-subRowButton";
  btn.addEventListener("click", enterSearchMode);

  const btnText = document.createElement("p");
  btnText.className = "cb-subRowText";
  btnText.textContent = "Add text / Search";
  btn.appendChild(btnText);

  const input = document.createElement("textarea");
  input.className = "cb-searchInput";
  input.rows = 1;
  input.value = state.query;
  input.placeholder = "Add text / Search";
  input.autocomplete = "off";
  input.spellcheck = false;
  bindSearchInput(input);

  prompt.appendChild(btn);
  prompt.appendChild(input);
  top.appendChild(prompt);

  const categoryPicker = createCategoryPicker({
    value: state.addCategory,
    options: getSearchCategoryPickerOptions(),
    showAddCategoryOption: true,
    onAddCategory: openAddCategoryDialog,
    onChange: (category) => {
      state.addCategory = category;
      state.addCategoryLocked = true;
    }
  });

  const actionBtns = document.createElement("div");
  actionBtns.className = "cb-actionBtns";

  const cancel = document.createElement("button");
  cancel.className = "cb-pillBtn cb-pillBtnCancel";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", cancelSearch);

  const add = document.createElement("button");
  add.className = "cb-pillBtn cb-pillBtnAdd";
  add.textContent = "Add";
  add.disabled = !(state.query ?? "").trim();
  add.addEventListener("click", addItem);

  actionBtns.appendChild(cancel);
  actionBtns.appendChild(add);

  const actions = document.createElement("div");
  actions.className = "cb-actionsRow";
  actions.appendChild(categoryPicker);
  actions.appendChild(actionBtns);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "cb-composerActionsWrap";

  const actionsInner = document.createElement("div");
  actionsInner.className = "cb-composerActionsInner";
  actionsInner.appendChild(actions);
  actionsWrap.appendChild(actionsInner);

  const categoriesSlot = document.createElement("div");
  categoriesSlot.className = "cb-addCategoriesSlot";

  const addCategories = document.createElement("button");
  addCategories.type = "button";
  addCategories.className = "cb-addCategoriesBtn";
  addCategories.addEventListener("click", () => {
    if (isEditActive()) {
      notifyEditBlocked();
      return;
    }
    openAddCategoryDialog();
  });

  const categoriesLabel = document.createElement("p");
  categoriesLabel.className = "cb-addCategoriesBtnText";
  categoriesLabel.textContent = "Add categories";
  addCategories.appendChild(categoriesLabel);
  categoriesSlot.appendChild(addCategories);
  top.appendChild(categoriesSlot);

  wrap.appendChild(top);
  wrap.appendChild(actionsWrap);

  if (isSearchActive()) {
    queueMicrotask(() => autoResizeSearchInput(input));
  }

  return wrap;
}

function buildCategoryBar() {
  return createCategoryBar({
    categories: getCategories(),
    activeCategory: state.activeCategory,
    onSelect: (category) => {
      if (isEditActive()) {
        notifyEditBlocked();
        return;
      }
      state.activeCategory = category;
      if (isSearchActive()) {
        const container = document.querySelector(".cb-container");
        if (container) fillContainer(container);
        return;
      }
      render({ listEnter: true });
    }
  });
}

function buildListContainer(className) {
  const container = document.createElement("div");
  container.className = className;
  fillContainer(container);
  return container;
}

async function setAppearance({ colorMode, theme } = {}) {
  const previous = { colorMode: state.colorMode, theme: state.theme };

  try {
    if (colorMode !== undefined) state.colorMode = colorMode;
    if (theme !== undefined) state.theme = theme;

    const applied = applyAppearance({ colorMode: state.colorMode, theme: state.theme });
    state.colorMode = applied.colorMode;
    state.theme = applied.theme;

    await savePreferences({ colorMode: state.colorMode, theme: state.theme });
  } catch (err) {
    state.colorMode = previous.colorMode;
    state.theme = previous.theme;
    applyAppearance(previous);
    if (state.mode === "settings") render({ screenTransition: false });
    console.error("Failed to save appearance preference:", err);
    showToast({
      message: err?.message || "Could not save appearance preference.",
      tone: "danger"
    });
  }
}

async function init() {
  document.addEventListener("pointerdown", onDocumentPointerDown, true);

  try {
    const prefs = await loadPreferences();
    const applied = applyAppearance({ colorMode: prefs.colorMode, theme: prefs.theme });
    state.colorMode = applied.colorMode;
    state.theme = applied.theme;
    state.motionEnabled = prefs.motionEnabled;
  } catch (err) {
    console.error("Failed to load preferences:", err);
    applyAppearance({ colorMode: "light", theme: "default" });
  }

  syncMotionClass();

  try {
    const data = await loadData();
    state.items = data.items;
    state.labels = data.labels;
  } catch (err) {
    console.error("Failed to load clipboard data:", err);
  }
  render({ listEnter: true });
  preloadIcons();
}

init();
