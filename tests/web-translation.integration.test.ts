import assert from "node:assert/strict";
import test from "node:test";
import {translateWebText} from "../src/web-news-focus/translate";

// This is intentionally a network integration test. Run it explicitly with:
//   npx tsx --test tests/web-translation.integration.test.ts
test("translates a stable English webpage excerpt into Chinese", async () => {
  // RFC 9110 is a versioned, publicly available English document. The text is
  // copied from its opening paragraph so the test does not depend on page DOM
  // extraction or a particular news site layout.
  const source = "This document describes the overall architecture of HTTP, and introduces the terminology used throughout the specification.";
  const [translated] = await translateWebText([{id: 0, text: source}]);

  assert.equal(typeof translated, "string");
  assert.ok(translated.trim().length > 0, "translation must not be empty");
  assert.notEqual(translated.trim(), source, "translation must not be the original English text");

  const chineseCharacters = (translated.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinCharacters = (translated.match(/[A-Za-z]/g) ?? []).length;
  assert.ok(chineseCharacters >= 8, `expected a Chinese translation, got: ${translated}`);
  assert.ok(
    chineseCharacters > latinCharacters,
    `translated text should be predominantly Chinese, got: ${translated}`,
  );
});
