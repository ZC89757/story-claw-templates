import test from "node:test";
import assert from "node:assert/strict";
import {newsFlashbackFunctionDefinition, resolveNewsFlashbackFunctionArgs} from "../src/news-flashback/schema";
import {validateNewsFlashbackSpec} from "../src/news-flashback/validate";

const pages = [
  {image: "web-news/nvidia-newsroom.png", source: "NVIDIA NEWSROOM", title: "Rubin platform announcement"},
  {image: "web-news/nvidia-arch.png", source: "TECH REPORT", title: "Next-generation GPU architecture"},
];

test("news flashback exposes only its own root fields and requires 2-12 pages", () => {
  assert.deepEqual(Object.keys(newsFlashbackFunctionDefinition.parameters.properties), ["group", "order", "at", "text", "pages"]);
  assert.deepEqual([...newsFlashbackFunctionDefinition.parameters.required], ["group", "order", "at", "text", "pages"]);
  assert.deepEqual(Object.keys(newsFlashbackFunctionDefinition.parameters.properties).includes("impactAt"), false);
  assert.deepEqual(validateNewsFlashbackSpec({text: "NVIDIA Rubin GPU", at: 0, pages}), []);
  assert.ok(validateNewsFlashbackSpec({text: "NVIDIA Rubin GPU", at: 0}).length > 0);
  assert.ok(validateNewsFlashbackSpec({text: "NVIDIA Rubin GPU", at: 0, pages: [pages[0]]}).length > 0);
});

test("news flashback resolver keeps the searched pages and localizes the scene start", () => {
  const resolved = resolveNewsFlashbackFunctionArgs({group: "project", order: null, at: 5.905, text: "NVIDIA Rubin GPU", pages});
  assert.equal(resolved.at, 5.905);
  assert.equal(resolved.spec.at, 0);
  assert.equal(resolved.spec.text, "NVIDIA Rubin GPU");
  assert.deepEqual(resolved.spec.pages, pages);
});

test("news flashback rejects a single page and an over-long center text", () => {
  assert.throws(
    () => resolveNewsFlashbackFunctionArgs({group: "project", order: null, at: 1, text: "NVIDIA Rubin GPU", pages: [pages[0]]}),
    /2-12/,
  );
  assert.ok(validateNewsFlashbackSpec({text: "一二三四五六七八九十一二三四五六七", at: 0, pages}).length > 0);
});
