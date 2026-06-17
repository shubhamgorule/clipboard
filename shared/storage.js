import { BUILTIN_CATEGORIES, DEFAULT_SETTINGS } from "./constants.js";
import { newId } from "./id.js";

const STORAGE_KEY = "clipboard:data";
const SCHEMA_VERSION = 1;

function now() {
  return Date.now();
}

function stableSortByOrder(arr) {
  return [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function readAll() {
  const res = await chrome.storage.local.get(STORAGE_KEY);
  return res[STORAGE_KEY] ?? null;
}

export async function writeAll(data) {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

export async function ensureSeedData() {
  const existing = await readAll();
  if (existing?.schemaVersion === SCHEMA_VERSION) return existing;

  const seeded = {
    schemaVersion: SCHEMA_VERSION,
    categories: BUILTIN_CATEGORIES,
    items: [],
    settings: DEFAULT_SETTINGS
  };
  await writeAll(seeded);
  return seeded;
}

export async function getData() {
  return (await readAll()) ?? (await ensureSeedData());
}

export async function updateData(updater) {
  const current = await getData();
  const next = await updater(structuredClone(current));
  await writeAll(next);
  return next;
}

export async function listCategories() {
  const data = await getData();
  return stableSortByOrder(data.categories);
}

export async function addCategory(name) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) throw new Error("Category name required");

  return await updateData((data) => {
    const maxOrder = Math.max(-1, ...data.categories.map((c) => c.order ?? 0));
    data.categories.push({ id: newId(), name: trimmed, builtin: false, order: maxOrder + 1 });
    return data;
  });
}

export async function renameCategory(id, name) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) throw new Error("Category name required");

  return await updateData((data) => {
    const cat = data.categories.find((c) => c.id === id);
    if (!cat) return data;
    if (cat.builtin) return data;
    cat.name = trimmed;
    return data;
  });
}

export async function deleteCategory(id) {
  return await updateData((data) => {
    const cat = data.categories.find((c) => c.id === id);
    if (!cat || cat.builtin) return data;
    data.categories = data.categories.filter((c) => c.id !== id);
    data.items = data.items.filter((it) => it.categoryId !== id);
    return data;
  });
}

export function listItemsForCategory(data, categoryId) {
  const items = categoryId ? data.items.filter((i) => i.categoryId === categoryId) : data.items;
  return stableSortByOrder(items);
}

export async function addItem({ categoryId, label, content, contentType }) {
  const cleanContent = (content ?? "").toString().trim();
  if (!cleanContent) throw new Error("Content required");

  return await updateData((data) => {
    const itemsInCat = data.items.filter((i) => i.categoryId === categoryId);
    const maxOrder = Math.max(-1, ...itemsInCat.map((i) => i.order ?? 0));

    data.items.unshift({
      id: newId(),
      categoryId,
      label: (label ?? "").toString().trim(),
      content: cleanContent,
      contentType,
      createdAt: now(),
      updatedAt: now(),
      usageCount: 0,
      pinned: false,
      order: maxOrder + 1
    });
    return data;
  });
}

export async function deleteItem(id) {
  return await updateData((data) => {
    data.items = data.items.filter((i) => i.id !== id);
    return data;
  });
}

export async function incrementUsage(id) {
  return await updateData((data) => {
    const it = data.items.find((i) => i.id === id);
    if (!it) return data;
    it.usageCount = (it.usageCount ?? 0) + 1;
    it.updatedAt = now();
    return data;
  });
}

export async function reorderItems(categoryId, orderedIds) {
  return await updateData((data) => {
    const pos = new Map(orderedIds.map((id, idx) => [id, idx]));
    for (const it of data.items) {
      if (it.categoryId !== categoryId) continue;
      const p = pos.get(it.id);
      if (p == null) continue;
      it.order = p;
      it.updatedAt = now();
    }
    return data;
  });
}

export async function getSettings() {
  const data = await getData();
  return data.settings ?? DEFAULT_SETTINGS;
}

export async function updateSettings(partial) {
  return await updateData((data) => {
    data.settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}), ...(partial ?? {}) };
    return data;
  });
}

export async function exportJson() {
  const data = await getData();
  return JSON.stringify(data, null, 2);
}

export async function importJson(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
  if (parsed.schemaVersion !== SCHEMA_VERSION) throw new Error("Unsupported schemaVersion");
  if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.items)) throw new Error("Invalid data shape");
  if (!parsed.settings || typeof parsed.settings !== "object") throw new Error("Invalid settings");
  await writeAll(parsed);
  return parsed;
}

export async function clearAll() {
  await writeAll({
    schemaVersion: SCHEMA_VERSION,
    categories: BUILTIN_CATEGORIES,
    items: [],
    settings: DEFAULT_SETTINGS
  });
}

