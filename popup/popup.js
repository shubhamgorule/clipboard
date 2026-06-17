import { createIconButton } from "../ui/components/iconButton.js";
import { createClipRow } from "../ui/components/clipRow.js";

const state = {
  mode: "default", // 'default' | 'search'
  activeTab: "All",
  query: "shubhamgorule",
  items: [
    { id: "1", category: "All", text: "One thing is amazing is that the links pasted here are" },
    { id: "2", category: "All", text: "One thing is amazing is that the links pasted here are" },
    { id: "3", category: "All", text: "One thing is amazing is that the links pasted here are" },
    { id: "4", category: "All", text: "One thing is amazing is that the links pasted here are" },
    { id: "5", category: "All", text: "One thing is amazing is that the links pasted here are" },
    { id: "6", category: "All", text: "One thing is amazing is that the links pasted here are" },
    { id: "7", category: "Mail", text: "shubhamgorule.design@gmail.com" },
    { id: "8", category: "Socials", text: "https://www.linkedin.com/in/shubhamgorule" }
  ]
};

function $(id) {
  return document.getElementById(id);
}

function render() {
  const app = $("app");
  app.replaceChildren(build());
}

function build() {
  const outer = document.createElement("div");
  outer.className = "cb-surfaceOuter";

  const inner = document.createElement("div");
  inner.className = "cb-surfaceInner";
  outer.appendChild(inner);

  inner.appendChild(buildHeader());

  if (state.mode === "default") {
    inner.appendChild(buildAddSearchRow());
    inner.appendChild(buildTabs());
    inner.appendChild(buildDefaultContainer());
  } else {
    inner.appendChild(buildSearchEnabledRow());
    inner.appendChild(buildSearchContainer());
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
  actions.appendChild(
    createIconButton({
      icon: "solar:settings-linear",
      title: "Settings",
      onClick: () => {}
    })
  );

  header.appendChild(titleWrap);
  header.appendChild(actions);
  return header;
}

function buildAddSearchRow() {
  const row = document.createElement("div");
  row.className = "cb-subRow";

  const btn = document.createElement("button");
  btn.className = "cb-subRowButton";
  btn.addEventListener("click", () => {
    state.mode = "search";
    render();
    queueMicrotask(() => {
      document.querySelector(".cb-searchInput")?.focus();
    });
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

function buildDefaultContainer() {
  const container = document.createElement("div");
  container.className = "cb-container";
  const items =
    state.activeTab === "All" ? state.items.filter((i) => i.category === "All") : state.items.filter((i) => i.category === state.activeTab);

  for (const it of items) {
    container.appendChild(
      createClipRow({
        text: it.text,
        state: "default"
      })
    );
  }

  return container;
}

function buildSearchEnabledRow() {
  const wrap = document.createElement("div");
  wrap.className = "cb-searchEnabled";

  const input = document.createElement("input");
  input.className = "cb-searchInput";
  input.value = state.query;
  input.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
    queueMicrotask(() => document.querySelector(".cb-searchInput")?.setSelectionRange(state.query.length, state.query.length));
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      state.mode = "default";
      render();
    }
  });

  const actions = document.createElement("div");
  actions.className = "cb-actionsRow";

  const cancel = document.createElement("button");
  cancel.className = "cb-pillBtn cb-pillBtnCancel";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => {
    state.mode = "default";
    render();
  });

  const add = document.createElement("button");
  add.className = "cb-pillBtn cb-pillBtnAdd";
  add.textContent = "Add";
  add.addEventListener("click", () => {
    // Placeholder: in real app, add query into storage.
    state.items.unshift({ id: String(Date.now()), category: "All", text: state.query });
    state.mode = "default";
    render();
  });

  actions.appendChild(cancel);
  actions.appendChild(add);

  wrap.appendChild(input);
  wrap.appendChild(actions);
  return wrap;
}

function buildSearchContainer() {
  const container = document.createElement("div");
  container.className = "cb-container";

  const q = (state.query ?? "").trim().toLowerCase();
  const items = q ? state.items.filter((i) => i.text.toLowerCase().includes(q)) : [];

  for (const it of items) {
    container.appendChild(
      createClipRow({
        text: it.text,
        state: "default"
      })
    );
  }
  return container;
}

render();

