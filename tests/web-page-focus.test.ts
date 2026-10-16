import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveWebPageFocusFunctionArgs,
  webPageFocusFunctionDefinition,
} from "../src/web-page-focus/schema";
import {webPageFocusPlanningInstructions} from "../src/web-page-focus/prompt";
import {assertWebPageFocusSpec, validateWebPageFocusSpec} from "../src/web-page-focus/validate";
import {isEligibleWebPageSource} from "../src/web-news-focus/source-policy";

test("web-page-focus exposes URL, DOM focus anchors and fixed entrance", () => {
  assert.deepEqual(Object.keys(webPageFocusFunctionDefinition.parameters.properties), [
    "group", "order", "url", "focus", "entrance",
  ]);
  assert.deepEqual(webPageFocusFunctionDefinition.parameters.required, [
    "group", "order", "url", "focus", "entrance",
  ]);
  assert.deepEqual(webPageFocusFunctionDefinition.parameters.properties.entrance.enum, ["fade", "slide-right", "cut"]);
});

test("web-page-focus requires reliable webpage text but does not ask for visual highlights", () => {
  assert.match(webPageFocusPlanningInstructions, /官方公告/);
  assert.match(webPageFocusPlanningInstructions, /Reuters/);
  assert.match(webPageFocusPlanningInstructions, /不显示黄色高亮/);
  const focusSchema = webPageFocusFunctionDefinition.parameters.properties.focus.items.properties;
  assert.match(focusSchema.text.description, /selected webpage content/);
});

test("web-page-focus localizes absolute focus times", () => {
  const resolved = resolveWebPageFocusFunctionArgs({
    group: "focus",
    order: null,
    url: "https://example.com/official",
    entrance: "fade",
    focus: [{text: "Official announcement", at: 20.8}],
  }, {start: 20, end: (20) + 60});
  assert.deepEqual(resolved.spec.focus, [{text: "Official announcement", at: 0.8}]);
});

test("web-page-focus rejects unsorted anchors and highlighted capture data", () => {
  assert.throws(() => resolveWebPageFocusFunctionArgs({
    group: "focus", order: null, url: "https://example.com/official", entrance: "fade",
    focus: [{text: "later", at: 22}, {text: "earlier", at: 21}],
  }, {start: 20, end: (20) + 60}), /must not precede the previous focus anchor/);
  assert.deepEqual(validateWebPageFocusSpec({
    at: 0, url: "file:///not-a-web-page", entrance: "fade", focus: [{text: "focus", at: 0}],
  }), ["url must be a valid http(s) URL"]);
  assert.throws(() => assertWebPageFocusSpec({
    at: 0, url: "https://example.com/official", entrance: "fade", focus: [{text: "focus", at: 0}],
    capture: {
      baseImage: "assets/base.png",
      viewport: {width: 100, height: 100, deviceScaleFactor: 1},
      focus: [],
    },
  }), /capture\.focus must contain 1 items/);
});

test("web-page-focus rejects personal platforms and non-post X pages", () => {
  for (const url of [
    "https://openai.com/index/announcement",
    "https://www.reuters.com/article/report",
    "https://www.mit.edu/research/project",
    "https://x.com/OpenAI/status/123456",
  ]) assert.equal(isEligibleWebPageSource(url), true, url);
  for (const url of [
    "https://weibo.com/user/post",
    "https://author.medium.com/post",
    "https://news.google.com/read/report",
    "https://mp.weixin.qq.com/s/report",
    "https://blog.sina.com.cn/article",
    "https://writer.substack.com/p/report",
    "https://www.bing.com/search?q=report",
    "https://x.com/random_person",
    "https://x.com/random_person/status/not-a-post",
    "http://127.0.0.1:8080/article",
  ]) assert.equal(isEligibleWebPageSource(url), false, url);
});
