import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {resolveWebPageFocusFunctionArgs} from "../src/web-page-focus/schema";
import {translateWebText} from "../src/web-news-focus/translate";

const pageUrl = "https://www.rfc-editor.org/rfc/rfc9110";

const stripHtml = (html: string): string => html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, " ")
  .trim();

const escapeHtml = (value: string): string => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

// Explicit integration test. It is intentionally excluded from the default
// test script because it requires network access and the Bing translator.
test("translates an English webpage, persists the snapshot, and feeds its text to web-page-focus", async () => {
  const response = await fetch(pageUrl, {signal: AbortSignal.timeout(30_000)});
  assert.equal(response.ok, true, `page request failed: ${response.status}`);
  const html = await response.text();
  const source = stripHtml(html).slice(0, 260);
  assert.ok(source.length >= 80, "the webpage must provide readable English text");

  const [translated] = await translateWebText([{id: 0, text: source}]);
  assert.ok(translated.trim().length > 0);
  assert.notEqual(translated.trim(), source.trim());
  assert.ok((translated.match(/[\u3400-\u9fff]/g) ?? []).length >= 8, `not translated to Chinese: ${translated}`);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "story-claw-web-snapshot-test-"));
  try {
    const snapshotPath = path.join(directory, "translated-page.html");
    await fs.writeFile(snapshotPath, `<!doctype html><meta charset="utf-8"><main>${escapeHtml(translated)}</main>`, "utf8");
    const snapshot = await fs.readFile(snapshotPath, "utf8");
    assert.match(snapshot, /<main>/);
    assert.ok(snapshot.includes(escapeHtml(translated)), "snapshot must preserve the translated webpage text");

    const resolved = resolveWebPageFocusFunctionArgs({
      group: "focus",
      order: null,
      at: 12,
      url: pageUrl,
      entrance: "fade",
      focus: [{text: translated.slice(0, Math.min(80, translated.length)), at: 12}],
    });
    assert.equal(resolved.spec.url, pageUrl);
    assert.equal(resolved.spec.focus[0].text, translated.slice(0, Math.min(80, translated.length)));
  } finally {
    await fs.rm(directory, {recursive: true, force: true});
  }
});
