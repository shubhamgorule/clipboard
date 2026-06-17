import { createIconButton, preloadIcons } from "../ui/components/iconButton.js";
import { createClipRow } from "../ui/components/clipRow.js";
import { createDeleteDialog } from "../ui/components/deleteDialog.js";

const state = {
  mode: "default", // 'default' | 'search' | 'settings'
  activeTab: "All",
  query: "",
  items: [],
  editingId: null,
  editDraft: "",
  confirmDeleteId: null
};

function $(id) {
  return document.getElementById(id);
}

function render() {
  const app = $("app");
  app.replaceChildren(build());

  if (state.mode === "search") {
    document.querySelector(".cb-searchInput")?.focus();
  }
}

function getFilteredItems() {
  if (state.mode === "search") {
    const q = (state.query ?? "").trim().toLowerCase();
    return q ? state.items.filter((i) => i.text.toLowerCase().includes(q)) : [];
  }

  return state.activeTab === "All"
    ? state.items.filter((i) => i.category === "All")
    : state.items.filter((i) => i.category === state.activeTab);
}

function addItem() {
  const qTrimmed = (state.query ?? "").trim();
  if (!qTrimmed) return;
  state.items.unshift({ id: String(Date.now()), category: "All", text: qTrimmed });
  state.mode = "default";
  state.query = "";
  state.editingId = null;
  state.editDraft = "";
  render();
}

function cancelSearch() {
  state.mode = "default";
  state.query = "";
  render();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
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
  }
}

function startEdit(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  state.confirmDeleteId = null;
  state.editingId = id;
  state.editDraft = item.text;
  render();
}

function refreshEdit(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  state.editDraft = item.text;
  const input = document.querySelector(`[data-item-id="${id}"] .cb-clipRowEditInput`);
  if (input) {
    input.value = state.editDraft;
    input.focus();
  } else {
    render();
  }
}

function cancelEdit(id) {
  if (state.editingId !== id) return;
  state.editingId = null;
  state.editDraft = "";
  render();
}

function confirmEdit(id) {
  const draft = (state.editDraft ?? "").trim();
  if (!draft) return;
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  if (draft === item.text.trim()) return;
  item.text = draft;
  state.editingId = null;
  state.editDraft = "";
  render();
}

function deleteItem(id) {
  state.items = state.items.filter((i) => i.id !== id);
  if (state.editingId === id) {
    state.editingId = null;
    state.editDraft = "";
  }
  if (state.confirmDeleteId === id) state.confirmDeleteId = null;
  render();
}

function requestDelete(id) {
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

function moveItem(fromId, toId) {
  const fromIdx = state.items.findIndex((i) => i.id === fromId);
  const toIdx = state.items.findIndex((i) => i.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
  const [moved] = state.items.splice(fromIdx, 1);
  state.items.splice(toIdx, 0, moved);
  render();
}

function fillContainer(container) {
  container.replaceChildren();
  const searchQuery = state.mode === "search" ? state.query : "";
  for (const it of getFilteredItems()) {
    const isEditing = state.editingId === it.id;
    container.appendChild(
      createClipRow({
        id: it.id,
        text: it.text,
        state: isEditing ? "edit" : "default",
        searchQuery,
        editValue: isEditing ? state.editDraft : it.text,
        onCopy: (e) => {
          e?.stopPropagation();
          copyText(it.text);
        },
        onEdit: (e) => {
          e?.stopPropagation();
          state.confirmDeleteId = null;
          startEdit(it.id);
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
        onMove: moveItem
      })
    );
  }
}

function syncSearchUI() {
  const container = document.querySelector(".cb-searchContainer");
  const addBtn = document.querySelector(".cb-pillBtnAdd");
  if (container) fillContainer(container);
  if (addBtn) addBtn.disabled = !(state.query ?? "").trim();
}

function build() {
  const outer = document.createElement("div");
  outer.className = "cb-surfaceOuter";

  const inner = document.createElement("div");
  inner.className = "cb-surfaceInner";
  outer.appendChild(inner);

  if (state.mode === "settings") {
    inner.appendChild(buildSettingsView());
    return outer;
  }

  inner.appendChild(buildHeader());

  if (state.mode === "default") {
    inner.appendChild(buildAddSearchRow());
    inner.appendChild(buildTabs());
    inner.appendChild(buildListContainer("cb-container"));
  } else {
    inner.appendChild(buildSearchEnabledRow());
    inner.appendChild(buildListContainer("cb-container cb-searchContainer"));
  }

  if (state.confirmDeleteId) {
    inner.appendChild(
      createDeleteDialog({
        onDelete: () => confirmDelete(state.confirmDeleteId),
        onKeep: () => cancelDelete(state.confirmDeleteId)
      })
    );
  }

  return outer;
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
        state.mode = "settings";
        render();
      }
    })
  );

  header.appendChild(titleWrap);
  header.appendChild(actions);
  return header;
}

function buildSettingsView() {
  const wrap = document.createElement("div");
  wrap.className = "cb-settings";

  const header = document.createElement("div");
  header.className = "cb-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "cb-titleWrap";
  const title = document.createElement("p");
  title.className = "cb-title";
  title.textContent = "Settings";
  titleWrap.appendChild(title);

  const actions = document.createElement("div");
  actions.className = "cb-headerActions";
  actions.appendChild(
    createIconButton({
      icon: "material-symbols:close-rounded",
      title: "Close",
      tooltip: "Close",
      onClick: () => {
        state.mode = "default";
        render();
      }
    })
  );

  header.appendChild(titleWrap);
  header.appendChild(actions);
  wrap.appendChild(header);

  const body = document.createElement("p");
  body.className = "cb-settingsBody";
  body.textContent = "Settings coming soon.";
  wrap.appendChild(body);

  return wrap;
}

function buildAddSearchRow() {
  const row = document.createElement("div");
  row.className = "cb-subRow";

  const btn = document.createElement("button");
  btn.className = "cb-subRowButton";
  btn.addEventListener("click", () => {
    state.mode = "search";
    render();
  });

  const text = document.createElement("p");
  text.className = "cb-subRowText";
  text.textContent = "Add / Search";
  btn.appendChild(text);
  row.appendChild(btn);

  return row;
}

function buildTabs() {
  const tabs = document.createElement("div");
  tabs.className = "cb-tabs";
  for (const t of ["All", "Mail", "General", "Socials"]) {
    const b = document.createElement("button");
    b.className = `cb-tab ${state.activeTab === t ? "cb-tabActive" : ""}`;
    b.addEventListener("click", () => {
      state.activeTab = t;
      render();
    });
    const p = document.createElement("p");
    p.className = "cb-tabText";
    p.textContent = t;
    b.appendChild(p);
    tabs.appendChild(b);
  }
  return tabs;
}

function buildListContainer(className) {
  const container = document.createElement("div");
  container.className = className;
  fillContainer(container);
  return container;
}

function buildSearchEnabledRow() {
  const wrap = document.createElement("div");
  wrap.className = "cb-searchEnabled";

  const input = document.createElement("input");
  input.className = "cb-searchInput";
  input.type = "text";
  input.value = state.query;
  input.placeholder = "Add / Search";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.addEventListener("input", (e) => {
    state.query = e.target.value;
    syncSearchUI();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelSearch();
    }
  });

  const actions = document.createElement("div");
  actions.className = "cb-actionsRow";

  const cancel = document.createElement("button");
  cancel.className = "cb-pillBtn cb-pillBtnCancel";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", cancelSearch);

  const add = document.createElement("button");
  add.className = "cb-pillBtn cb-pillBtnAdd";
  add.textContent = "Add";
  add.disabled = !(state.query ?? "").trim();
  add.addEventListener("click", addItem);

  actions.appendChild(cancel);
  actions.appendChild(add);

  wrap.appendChild(input);
  wrap.appendChild(actions);
  return wrap;
}

render();
preloadIcons();
