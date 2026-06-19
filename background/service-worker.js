import { restrictStorageAccess, runMigrations } from "../shared/storage.js";

chrome.runtime.onInstalled.addListener(() => {
  void runMigrations();
  void restrictStorageAccess();
});
