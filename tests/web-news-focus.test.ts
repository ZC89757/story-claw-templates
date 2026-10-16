import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveWebNewsFocusFunctionArgs,
  webNewsFocusFunctionDefinition,
} from "../src/web-news-focus/schema";
import {webNewsFocusPlanningInstructions} from "../src/web-news-focus/prompt";
import {assertWebNewsFocusSpec, validateWebNewsFocusSpec} from "../src/web-news-focus/validate";
import {isMajorNewsSource} from "../src/web-news-focus/source-policy";
import {buildTranslationBatches, MAX_TRANSLATION_NODE_HTML_LENGTH, parseBingSession} from "../src/web-news-focus/translate";

const newsUrl = "https://www.reuters.com/technology/article";

test("web-news-focus exposes only URL, exact highlights and fixed entrance", () => {
  assert.deepEqual(Object.keys(webNewsFocusFunctionDefinition.parameters.properties), [
    "group", "order", "url", "highlights", "entrance",
  ]);
  assert.deepEqual(webNewsFocusFunctionDefinition.parameters.required, [
    "group", "order", "url", "highlights", "entrance",
  ]);
  assert.deepEqual(webNewsFocusFunctionDefinition.parameters.properties.entrance.enum, ["fade", "slide-right", "cut"]);
});

test("web-news-focus instructs the planner to read webpage text and time it against narration", () => {
  assert.match(webNewsFocusPlanningInstructions, /search_web\(\{query\}\)/);
  assert.match(webNewsFocusPlanningInstructions, /search_web\(\{url\}\)/);
  assert.match(webNewsFocusPlanningInstructions, /只选主流新闻媒体/);
  assert.match(webNewsFocusPlanningInstructions, /sourceQuality=major-media/);
  assert.match(webNewsFocusPlanningInstructions, /官方公告、研究页面和技术文档请改用 web-page-focus/);
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
    url: newsUrl,
    entrance: "fade",
    highlights: [{text: webpagePhrase, at: 20.8}],
  }, {start: 20, end: (20) + 60});
  assert.deepEqual(resolved.spec.highlights, [{text: webpagePhrase, at: 0.8}]);
});

test("web-news-focus localizes absolute highlight times and keeps DOM coordinates out of the call", () => {
  const resolved = resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    url: newsUrl,
    entrance: "slide-right",
    highlights: [
      {text: "第一处重点", at: 20},
      {text: "第二处重点", at: 22.375},
    ],
  }, {start: 20, end: (20) + 60});
  assert.equal(resolved.group, "focus");
  assert.deepEqual(resolved.spec.highlights.map((item) => item.at), [0, 2.375]);
  assert.equal(resolved.spec.url, newsUrl);
  assert.equal(resolved.spec.entrance, "slide-right");
  assert.deepEqual(resolved.spec.capture, undefined);
  assert.throws(() => resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    url: newsUrl,
    entrance: "fade",
    highlights: [{text: "重点", at: 21}],
    camera: {x: 1, y: 2, z: 3},
  } as never, {start: 20, end: (20) + 60}), /does not accept extra fields/);
});

test("web-news-focus rejects invalid page inputs and unsorted highlights", () => {
  assert.throws(() => resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    url: newsUrl,
    entrance: "fade",
    highlights: [{text: "过早", at: 9}],
  }, {start: 10, end: (10) + 60}), /cannot precede scene at/);
  assert.throws(() => resolveWebNewsFocusFunctionArgs({
    group: "focus",
    order: null,
    url: newsUrl,
    entrance: "fade",
    highlights: [{text: "后面", at: 12}, {text: "前面", at: 11}],
  }, {start: 10, end: (10) + 60}), /must not precede the previous highlight/);
  assert.deepEqual(validateWebNewsFocusSpec({
    at: 0,
    url: "file:///not-a-web-page",
    entrance: "fade",
    highlights: [{text: "重点", at: 0}],
  }), ["url must be a valid http(s) URL"]);
  assert.throws(() => assertWebNewsFocusSpec({
    at: 0,
    url: newsUrl,
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

test("web-news-focus accepts known domestic and international news outlets only", () => {
  for (const url of [
    newsUrl,
    "https://www.apnews.com/article/report",
    "https://www.bbc.co.uk/news/report",
    "https://www.news.cn/tech/report",
    "https://www.caixin.com/2026/report",
  ]) assert.equal(isMajorNewsSource(url), true, url);
  for (const url of [
    "https://openai.com/index/announcement",
    "https://weibo.com/post/123",
    "https://x.com/person/status/123",
    "https://mp.weixin.qq.com/s/report",
    "https://blog.reuters.com/article/report",
    "https://www.reuters.com@random-blog.example/report",
    "https://www.reuters.com.evil.example/report",
    "https://random-blog.example/post",
  ]) assert.equal(isMajorNewsSource(url), false, url);
  assert.match(validateWebNewsFocusSpec({
    at: 0, url: "https://openai.com/index/announcement", entrance: "fade",
    highlights: [{text: "announcement", at: 0}],
  }).join(" "), /mainstream news outlet/);
});

test("web translation batches preserve node identities and escape page text", () => {
  const texts = [
    {id: 0, text: 'AT&T says "AI" <works>'},
    {id: 1, text: "a".repeat(MAX_TRANSLATION_NODE_HTML_LENGTH)},
    {id: 2, text: "Reuters reports the result."},
  ];
  const batches = buildTranslationBatches(texts);
  assert.ok(batches.length >= 2);
  assert.ok(batches.every((batch) => batch.length <= 850));
  assert.match(batches[0], /data-sc-id="0">AT&amp;T says &quot;AI&quot; &lt;works&gt;/);
  assert.deepEqual([...batches.join("").matchAll(/data-sc-id="(\d+)"/g)].map((match) => Number(match[1])), [0, 1, 2]);
  assert.throws(() => buildTranslationBatches([{id: 3, text: '"'.repeat(140)}]), /文本节点过长/);
});

test("web translation rejects invalid translator sessions", () => {
  assert.deepEqual(parseBingSession('IG:"ABCDEF012345"; params_AbusePreventionHelper = [1234567890,"session-token"]'), {
    ig: "ABCDEF012345", key: "1234567890", token: "session-token",
  });
  assert.throws(() => parseBingSession("<html>no translator credentials</html>"), /没有返回有效会话/);
});
