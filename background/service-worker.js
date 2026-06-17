import { ensureSeedData } from "../shared/storage.js";

chrome.runtime.onInstalled.addListener(async () => {
  await ensureSeedData();
});

