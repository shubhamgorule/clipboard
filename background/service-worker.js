import { restrictStorageAccess, runMigrations } from "../shared/storage.js";

const POPUP_PATH = "popup/index.html";

function ensureToolbarPopup() {
  void chrome.action.setPopup({ popup: POPUP_PATH });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureToolbarPopup();
  void runMigrations();
  void restrictStorageAccess();
});

chrome.runtime.onStartup.addListener(() => {
  ensureToolbarPopup();
});
