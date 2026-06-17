import { detect } from "../shared/detector.js";
import {
  addCategory,
  addItem,
  clearAll,
  deleteItem,
  ensureSeedData,
  exportJson,
  getData,
  getSettings,
  importJson,
  incrementUsage,
  listItemsForCategory,
  reorderItems,
  updateSettings
} from "../shared/storage.js";

const app = document.getElementById("app");

const state = {
  data: null,
  settings: null,
  activeCategoryId: "general",
  view: "main", // 'main' | 'settings'
  query: "",
  ghost: "",
  addOpen: false,
  addDraft: {
    content: "",
    label: "",
    categoryId: "general",
    categoryTouched: false,
    labelTouched: false
  }
};

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v != null) n.setAttribute(k, v);
  }
  for (const c of children) n.append(c);
  return n;
}

function svgIcon(pathD) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("width", "16");
  s.setAttribute("height", "16");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor");
  s.setAttribute("stroke-width", "2");
  s.setAttribute("stroke-linecap", "round");
  s.setAttribute("stroke-linejoin", "round");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", pathD);
  s.appendChild(p);
  return s;
}

function toast(msg) {
  const t = document.querySelector(".toast") ?? el("div", { class: "toast" });
  t.textContent = msg;
  if (!t.isConnected) document.body.appendChild(t);
  t.classList.add("toastShow");
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => t.classList.remove("toastShow"), 1200);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function computeGhostHint(items, query) {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return "";

  const best = items.find((it) => {
    const label = (it.label || "").toLowerCase();
    const content = (it.content || "").toLowerCase();
    return label.startsWith(q) || content.startsWith(q);
  });
  if (!best) return "";

  const target = ((best.label || best.content) ?? "").toString();
  if (!target.toLowerCase().startsWith(q)) return "";
  return target.slice(q.length);
}

function filterItems(items, query) {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return items;
  return items.filter((it) => {
    const label = (it.label || "").toLowerCase();
    const content = (it.content || "").toLowerCase();
    return label.includes(q) || content.includes(q);
  });
}

function currentItems() {
  const data = state.data;
  if (!data) return [];

  const scope = state.settings?.searchScope ?? "category";
  const items = scope === "all" ? listItemsForCategory(data, null) : listItemsForCategory(data, state.activeCategoryId);
  const filtered = filterItems(items, state.query);
  state.ghost = computeGhostHint(filtered, state.query);
  return filtered;
}

function getCategories() {
  const cats = (state.data?.categories ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return cats;
}

function setActiveCategory(id) {
  state.activeCategoryId = id;
  state.query = "";
  state.ghost = "";
  render();
}

function header() {
  const addBtn = el(
    "button",
    {
      class: "iconBtn",
      title: "Add",
      onClick: () => openAdd()
    },
    [svgIcon("M12 5v14M5 12h14")]
  );
  const settingsBtn = el(
    "button",
    {
      class: "iconBtn",
      title: "Settings",
      onClick: () => {
        state.view = state.view === "settings" ? "main" : "settings";
        render();
      }
    },
    [svgIcon("M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 3.4 17l.06-.06A1.65 1.65 0 0 0 3.79 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8.99a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.04 4.3l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 20.6 7l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51.3.12.63.18.97.18H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z")]
  );

  return el("div", { class: "header" }, [
    el("div", { class: "title", text: "Clipboard" }),
    el("div", { class: "headerActions" }, [addBtn, settingsBtn])
  ]);
}

function tabs() {
  const cats = getCategories();

  const nodes = cats.map((c) =>
    el(
      "button",
      {
        class: `tab ${state.activeCategoryId === c.id ? "tabActive" : ""}`,
        title: c.name,
        onClick: () => setActiveCategory(c.id)
      },
      [document.createTextNode(c.name)]
    )
  );

  const addCatBtn = el(
    "button",
    {
      class: "tab",
      title: "Add category",
      onClick: async () => {
        const name = window.prompt("Category name");
        if (!name) return;
        await addCategory(name);
        await refresh();
      }
    },
    [document.createTextNode("+")]
  );

  nodes.push(addCatBtn);
  return el("div", { class: "tabs" }, nodes);
}

function toolbar() {
  const search = el("input", {
    id: "search",
    class: "search",
    placeholder: "Search…",
    value: state.query,
    onInput: (e) => {
      state.query = e.target.value;
      render();
    },
    onKeydown: (e) => {
      if (e.key === "Tab" && state.settings?.tabAssist !== false && state.ghost) {
        e.preventDefault();
        state.query = state.query + state.ghost;
        render();
      }
    }
  });

  const ghost = el("div", { class: "ghost" }, [
    el("span", { text: state.query }),
    el("span", { text: state.ghost })
  ]);

  const add = el(
    "button",
    { class: "primaryBtn", onClick: () => openAdd() },
    [document.createTextNode("Add")]
  );

  return el("div", { class: "toolbar" }, [el("div", { class: "searchWrap" }, [search, ghost]), add]);
}

function row(it, allIdsInOrder) {
  const label = it.label?.trim() || (it.contentType === "email" ? "Email" : it.contentType === "link" ? "Link" : "Text");

  const copyBtn = el(
    "button",
    {
      class: "miniBtn",
      title: "Copy",
      onClick: async (e) => {
        e.stopPropagation();
        const ok = await copyToClipboard(it.content);
        if (ok) {
          toast("Copied");
          await incrementUsage(it.id);
          await refresh();
        } else {
          toast("Copy failed");
        }
      }
    },
    [svgIcon("M8 7h11v14H8zM5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1")]
  );

  const delBtn = el(
    "button",
    {
      class: "miniBtn miniBtnDanger",
      title: "Delete",
      onClick: async (e) => {
        e.stopPropagation();
        await deleteItem(it.id);
        toast("Deleted");
        await refresh();
      }
    },
    [svgIcon("M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6")]
  );

  const dragBtn = el(
    "button",
    {
      class: "miniBtn drag",
      title: "Reorder",
      draggable: "true",
      onDragstart: (e) => {
        e.dataTransfer.setData("text/plain", it.id);
        e.dataTransfer.effectAllowed = "move";
      },
      onClick: (e) => e.stopPropagation()
    },
    [svgIcon("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01")]
  );

  const actions = el("div", { class: "rowActions" }, [copyBtn, dragBtn, delBtn]);

  const n = el(
    "div",
    {
      class: "row",
      tabindex: "0",
      onClick: async () => {
        const ok = await copyToClipboard(it.content);
        if (ok) {
          toast("Copied");
          await incrementUsage(it.id);
          await refresh();
        } else {
          toast("Copy failed");
        }
      },
      onDragover: (e) => e.preventDefault(),
      onDrop: async (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain");
        if (!draggedId || draggedId === it.id) return;

        const ids = [...allIdsInOrder];
        const from = ids.indexOf(draggedId);
        const to = ids.indexOf(it.id);
        if (from < 0 || to < 0) return;
        ids.splice(from, 1);
        ids.splice(to, 0, draggedId);
        await reorderItems(state.activeCategoryId, ids);
        await refresh();
      }
    },
    [
      el("div", { class: "rowMain" }, [
        el("div", { class: "rowLabel", text: label }),
        el("div", { class: "rowContent", text: it.content })
      ]),
      actions
    ]
  );

  return n;
}

function listView() {
  const items = currentItems();
  const ids = items.map((i) => i.id);

  if (!items.length) {
    return el("div", { class: "empty" }, [
      el("div", { text: state.query ? "No results." : "Nothing here yet." }),
      el("div", { text: "Click Add to save something you copy often." })
    ]);
  }

  const list = el("div", { class: "list" }, items.map((it) => row(it, ids)));
  return list;
}

function toggle({ on, onChange }) {
  return el(
    "button",
    {
      class: `toggle ${on ? "toggleOn" : ""}`,
      onClick: () => onChange(!on),
      title: on ? "On" : "Off"
    },
    [el("span", { class: "toggleKnob" })]
  );
}

function settingsView() {
  const s = state.settings ?? { smartRouting: true, tabAssist: true, searchScope: "category" };

  const smartRow = el("div", { class: "settingRow" }, [
    el("div", { class: "settingText" }, [
      el("div", { class: "settingName", text: "Smart routing" }),
      el("div", { class: "settingDesc", text: "Suggest and auto-select categories while adding." })
    ]),
    toggle({
      on: s.smartRouting !== false,
      onChange: async (v) => {
        await updateSettings({ smartRouting: v });
        await refresh();
      }
    })
  ]);

  const tabRow = el("div", { class: "settingRow" }, [
    el("div", { class: "settingText" }, [
      el("div", { class: "settingName", text: "Tab assist" }),
      el("div", { class: "settingDesc", text: "Tab accepts smart suggestions in Add and Search." })
    ]),
    toggle({
      on: s.tabAssist !== false,
      onChange: async (v) => {
        await updateSettings({ tabAssist: v });
        await refresh();
      }
    })
  ]);

  const scopeRow = el("div", { class: "settingRow" }, [
    el("div", { class: "settingText" }, [
      el("div", { class: "settingName", text: "Search scope" }),
      el("div", { class: "settingDesc", text: "Search only active tab or across all categories." })
    ]),
    el(
      "select",
      {
        class: "select",
        onChange: async (e) => {
          await updateSettings({ searchScope: e.target.value });
          await refresh();
        }
      },
      [
        el("option", { value: "category", text: "This tab", selected: s.searchScope === "category" ? "true" : null }),
        el("option", { value: "all", text: "All", selected: s.searchScope === "all" ? "true" : null })
      ]
    )
  ]);

  const exportBtn = el(
    "button",
    {
      class: "secondaryBtn",
      onClick: async () => {
        const json = await exportJson();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "clipboard-export.json";
        a.click();
        URL.revokeObjectURL(url);
        toast("Exported");
      }
    },
    [document.createTextNode("Export JSON")]
  );

  const importInput = el("input", {
    type: "file",
    accept: "application/json",
    style: "display:none",
    onChange: async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        await importJson(text);
        toast("Imported");
        await refresh();
      } catch {
        toast("Import failed");
      } finally {
        e.target.value = "";
      }
    }
  });

  const importBtn = el(
    "button",
    {
      class: "secondaryBtn",
      onClick: () => importInput.click()
    },
    [document.createTextNode("Import JSON")]
  );

  const clearBtn = el(
    "button",
    {
      class: "dangerBtn",
      onClick: async () => {
        const ok = window.confirm("Clear all saved items and custom categories?");
        if (!ok) return;
        await clearAll();
        toast("Cleared");
        await refresh();
      }
    },
    [document.createTextNode("Clear all data")]
  );

  return el("div", { class: "settingsSection" }, [
    smartRow,
    tabRow,
    scopeRow,
    el("div", { style: "height:10px" }),
    el("div", { class: "modalFooter" }, [exportBtn, importBtn, importInput]),
    el("div", { style: "height:10px" }),
    clearBtn
  ]);
}

function openAdd() {
  state.addOpen = true;
  state.addDraft = {
    content: "",
    label: "",
    categoryId: state.activeCategoryId || "general",
    categoryTouched: false,
    labelTouched: false
  };
  render();
}

function closeAdd() {
  state.addOpen = false;
  render();
}

function addModal() {
  const cats = getCategories();
  const s = state.settings ?? { smartRouting: true, tabAssist: true };
  const draft = state.addDraft;

  const suggestion = detect(draft.content);

  function applySmartDefaultsIfAllowed() {
    if (s.smartRouting === false) return;
    if (!draft.categoryTouched) draft.categoryId = suggestion.suggestedCategoryId;
  }

  applySmartDefaultsIfAllowed();

  const content = el("textarea", {
    id: "add-content",
    class: "textarea",
    placeholder: "Paste text, link, or email…",
    onInput: (e) => {
      draft.content = e.target.value;
      render();
    },
    onKeydown: (e) => {
      if (e.key === "Tab" && s.tabAssist !== false) {
        // Tab: accept suggested category if untouched, then allow focus move.
        if (!draft.categoryTouched && s.smartRouting !== false) {
          draft.categoryId = suggestion.suggestedCategoryId;
        }
      }
    }
  });
  content.value = draft.content;

  const label = el("input", {
    id: "add-label",
    class: "input",
    placeholder: "Label (optional)",
    onInput: (e) => {
      draft.labelTouched = true;
      draft.label = e.target.value;
    },
    onKeydown: () => {}
  });
  label.value = draft.label;

  const category = el(
    "select",
    {
      class: "select",
      onChange: (e) => {
        draft.categoryTouched = true;
        draft.categoryId = e.target.value;
      }
    },
    cats.map((c) => el("option", { value: c.id, text: c.name, selected: c.id === draft.categoryId ? "true" : null }))
  );

  const save = el(
    "button",
    {
      class: "ctaBtn",
      onClick: async () => {
        try {
          const d = detect(draft.content);
          const categoryId = draft.categoryId || d.suggestedCategoryId;
          await addItem({
            categoryId,
            label: draft.label,
            content: draft.content,
            contentType: d.contentType
          });
          toast("Saved");
          await refresh();
          closeAdd();
        } catch {
          toast("Nothing to save");
        }
      }
    },
    [document.createTextNode("Save")]
  );

  const cancel = el(
    "button",
    {
      class: "secondaryBtn",
      onClick: () => closeAdd()
    },
    [document.createTextNode("Cancel")]
  );

  const modal = el("div", { class: "modal" }, [
    el("div", { class: "modalHeader" }, [
      el("div", { class: "modalTitle", text: "Add item" }),
      el(
        "button",
        { class: "iconBtn", title: "Close", onClick: () => closeAdd() },
        [svgIcon("M18 6L6 18M6 6l12 12")]
      )
    ]),
    el("div", { class: "modalBody" }, [
      el("div", {}, [el("div", { class: "fieldLabel", text: "Content" }), content]),
      el("div", { class: "row2" }, [
        el("div", {}, [el("div", { class: "fieldLabel", text: "Label" }), label]),
        el("div", {}, [el("div", { class: "fieldLabel", text: "Category" }), category])
      ])
    ]),
    el("div", { class: "modalFooter" }, [cancel, save])
  ]);

  const overlay = el("div", {
    class: "modalOverlay",
    onClick: (e) => {
      if (e.target === overlay) closeAdd();
    }
  });
  overlay.append(modal);
  return overlay;
}

function render() {
  if (!state.data) return;

  const focus = captureFocus();

  app.replaceChildren(
    el("div", { class: "card" }, [
      header(),
      state.view === "settings" ? settingsView() : el("div", {}, [tabs(), toolbar(), listView()])
    ])
  );

  const existingOverlay = document.querySelector(".modalOverlay");
  if (existingOverlay) existingOverlay.remove();
  if (state.addOpen) document.body.append(addModal());

  restoreFocus(focus);
}

function captureFocus() {
  const ae = document.activeElement;
  if (!ae) return null;
  const id = ae.id || null;
  if (!id) return null;
  const canSelect = typeof ae.selectionStart === "number" && typeof ae.selectionEnd === "number";
  return {
    id,
    selectionStart: canSelect ? ae.selectionStart : null,
    selectionEnd: canSelect ? ae.selectionEnd : null
  };
}

function restoreFocus(focus) {
  if (!focus?.id) return;
  const node = document.getElementById(focus.id);
  if (!node) return;
  node.focus?.();
  if (typeof focus.selectionStart === "number" && typeof focus.selectionEnd === "number") {
    node.setSelectionRange?.(focus.selectionStart, focus.selectionEnd);
  }
}

async function refresh() {
  state.data = await getData();
  state.settings = await getSettings();
  const cats = getCategories();
  if (!cats.find((c) => c.id === state.activeCategoryId)) {
    state.activeCategoryId = cats[0]?.id ?? "general";
  }
  render();
}

(async function main() {
  await ensureSeedData();
  await refresh();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (!changes["clipboard:data"]) return;
    refresh();
  });
})();

