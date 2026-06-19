import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  StorageError,
  assertWithinQuota,
  createExportDocument,
  migrateStoredPayload,
  normalizeItems,
  normalizeLabels,
  parseImportText
} from "../shared/storageSchema.js";

describe("normalizeItems", () => {
  it("drops invalid entries and defaults category", () => {
    const items = normalizeItems([
      { id: "a", text: "hello" },
      { id: "b", text: "world", category: "Mail" },
      null,
      { id: 1, text: "bad" }
    ]);

    assert.equal(items.length, 2);
    assert.equal(items[0].category, "Uncategorized");
    assert.equal(items[1].category, "Mail");
  });

  it("truncates long text", () => {
    const long = "x".repeat(60_000);
    const [item] = normalizeItems([{ id: "a", text: long }]);
    assert.equal(item.text.length, 50_000);
  });
});

describe("normalizeLabels", () => {
  it("trims and filters empty labels", () => {
    assert.deepEqual(normalizeLabels([" Mail ", "", "  ", "Socials"]), ["Mail", "Socials"]);
  });
});

describe("migrateStoredPayload", () => {
  it("wraps legacy blobs without version", () => {
    const migrated = migrateStoredPayload({
      items: [{ id: "1", text: "hi", category: "General" }],
      labels: ["General"]
    });

    assert.equal(migrated.version, 1);
    assert.equal(migrated.items[0].text, "hi");
    assert.deepEqual(migrated.labels, ["General"]);
  });
});

describe("parseImportText", () => {
  it("accepts export documents", () => {
    const doc = createExportDocument({
      items: [{ id: "1", text: "saved", category: "Mail" }],
      labels: ["Mail"]
    });

    const data = parseImportText(JSON.stringify(doc));
    assert.equal(data.items[0].text, "saved");
    assert.deepEqual(data.labels, ["Mail"]);
  });

  it("accepts raw legacy payloads", () => {
    const data = parseImportText(
      JSON.stringify({
        items: [{ id: "1", text: "legacy", category: "Uncategorized" }],
        labels: []
      })
    );
    assert.equal(data.items[0].text, "legacy");
  });

  it("rejects invalid json", () => {
    assert.throws(() => parseImportText("{not json"), StorageError);
  });

  it("rejects unsupported export versions", () => {
    const doc = createExportDocument({ items: [], labels: [] });
    doc.formatVersion = 99;
    assert.throws(() => parseImportText(JSON.stringify(doc)), StorageError);
  });
});

describe("assertWithinQuota", () => {
  it("allows normal payloads", () => {
    const payload = assertWithinQuota({
      items: [{ id: "1", text: "small", category: "Uncategorized" }],
      labels: []
    });
    assert.equal(payload.version, 1);
  });
});
