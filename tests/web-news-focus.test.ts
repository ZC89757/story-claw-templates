import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveWebNewsFocusFunctionArgs,
  webNewsFocusFunctionDefinition,
} from "../src/web-news-focus/schema";
import {webNewsFocusPlanningInstructions} from "../src/web-news-focus/prompt";
import {assertWebNewsFocusSpec, validateWebNewsFocusSpec} from "../src/web-news-focus/validate";

test("web-news-focus exposes only URL, exact highlights and fixed entrance", () => {
  assert.deepEqual(Object.keys(webNewsFocusFunctionDefinition.parameters.properties), [
    "group", "order", "at", "url", "highlights", "entrance",
  ]);
  assert.deepEqual(webNewsFocusFunctionDefinition.parameters.required, [
    "group", "order", "at", "url", "highlights", "entrance",
  ]);
  assert.deepEqual(webNewsFocusFunctionDefinition.parameters.properties.entrance.enum, ["fade", "slide-right", "cut"]);
});

test("web-news-focus instructs the planner to read webpage text and time it against narration", () => {
  assert.match(webNewsFocusPlanningInstructions, /search_web\(\{query\}\)/);
  assert.match(webNewsFocusPlanningInstructions, /search_web\(\{url\}\)/);
  assert.match(webNewsFocusPlanningInstructions, /不要求在清稿或 HTML 标签原文中出现/);
  assert.match(webNewsFocusPlanningInstructions, /以网页文字填写 text，以清稿对应语义的时间填写 at/);
  const highlightSchema = webNewsFocusFunctionDefinition.parameters.properties.highlights.items.properties;
  assert.match(highlightSchema.text.description, /selected webpage content/);
  assert.match(highlightSchema.at.description, /corresponding meaning in the narrated article/);
});

test("web-news-focus accepts a literal webpage phrase absent from the narration", () => {
  const narration = "它不生成聊天文本";
  const webpagePhrase = "Jev 不生成文本";
  assert.equal(narration.includes(webpagePhrase), false);
  const resolved = resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    at: 20,
    url: "https://example.com/article",
    entrance: "fade",
    highlights: [{text: webpagePhrase, at: 20.8}],
  });
  assert.deepEqual(resolved.spec.highlights, [{text: webpagePhrase, at: 0.8}]);
});

test("web-news-focus localizes absolute highlight times and keeps DOM coordinates out of the call", () => {
  const resolved = resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    at: 20,
    url: "https://example.com/article",
    entrance: "slide-right",
    highlights: [
      {text: "第一处重点", at: 20},
      {text: "第二处重点", at: 22.375},
    ],
  });
  assert.equal(resolved.group, "focus");
  assert.deepEqual(resolved.spec.highlights.map((item) => item.at), [0, 2.375]);
  assert.equal(resolved.spec.url, "https://example.com/article");
  assert.equal(resolved.spec.entrance, "slide-right");
  assert.deepEqual(resolved.spec.capture, undefined);
  assert.throws(() => resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    at: 20,
    url: "https://example.com/article",
    entrance: "fade",
    highlights: [{text: "重点", at: 21}],
    camera: {x: 1, y: 2, z: 3},
  } as never), /does not accept extra fields/);
});

test("web-news-focus rejects invalid page inputs and unsorted highlights", () => {
  assert.throws(() => resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    at: 10,
    url: "https://example.com/article",
    entrance: "fade",
    highlights: [{text: "过早", at: 9}],
  }), /cannot precede scene at/);
  assert.throws(() => resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    at: 10,
    url: "https://example.com/article",
    entrance: "fade",
    highlights: [{text: "后面", at: 12}, {text: "前面", at: 11}],
  }), /must not precede the previous highlight/);
  assert.deepEqual(validateWebNewsFocusSpec({
    at: 0,
    url: "file:///not-a-web-page",
    entrance: "fade",
    highlights: [{text: "重点", at: 0}],
  }), ["url must be a valid http(s) URL"]);
  assert.throws(() => assertWebNewsFocusSpec({
    at: 0,
    url: "https://example.com/article",
    entrance: "fade",
    highlights: [{text: "重点", at: 0}],
    capture: {
      baseImage: "assets/base.png",
      highlightedImage: "assets/highlighted.png",
      viewport: {width: 100, height: 100, deviceScaleFactor: 1},
      highlights: [],
    },
  }), /capture\.highlights must contain 1 items/);
});
