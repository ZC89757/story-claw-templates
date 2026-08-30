import test from "node:test";
import assert from "node:assert/strict";
import imageStackJson from "../examples/image-stack.spec.json";
import imageGridJson from "../examples/image-grid.spec.json";
import {imageGridFunctionDefinition, imageStackFunctionDefinition, resolveImageGridFunctionArgs, resolveImageStackFunctionArgs} from "../src/image-media/schema";
import {classifyImageSource} from "../src/image-media/source";
import {evaluateImageMediaItem} from "../src/image-media/evaluate";
import {assertImageMediaSpec, validateImageMediaSpec} from "../src/image-media/validate";

test("stack and grid share the same validated image contract", () => {
  assert.equal(assertImageMediaSpec(imageStackJson).images.length, 3);
  assert.equal(assertImageMediaSpec(imageGridJson).images.length, 4);
  assert.deepEqual(Object.keys(imageStackFunctionDefinition.parameters.properties), Object.keys(imageGridFunctionDefinition.parameters.properties));
});

test("image reveal begins at its timestamp", () => {
  const item = assertImageMediaSpec(imageStackJson).images[1];
  assert.equal(evaluateImageMediaItem(item, item.at - 0.001).visible, false);
  assert.equal(evaluateImageMediaItem(item, item.at).progress, 0);
  assert.ok(evaluateImageMediaItem(item, item.at + 0.2).progress > 0);
});

test("source classifier distinguishes URLs, local assets, and prompts", () => {
  assert.equal(classifyImageSource("https://example.com/page.png"), "url");
  assert.equal(classifyImageSource("ai-company-logos/openai.svg"), "local");
  assert.equal(classifyImageSource("a documentary photo of a server room"), "prompt");
});

test("resolvers convert absolute image timestamps to scene-local timestamps", () => {
  const input = {group: "evidence", at: 10, title: "证据", images: [
    {at: 10, image: "a.png"},
    {at: 12.5, image: "b.png", label: "第二张"},
  ]};
  assert.deepEqual(resolveImageStackFunctionArgs(input).spec.images.map((item) => item.at), [0, 2.5]);
  assert.deepEqual(resolveImageGridFunctionArgs(input).spec.images.map((item) => item.at), [0, 2.5]);
});

test("validator rejects too few images and empty image values", () => {
  assert.ok(validateImageMediaSpec({title: "x", images: [{at: 0, image: "a"}]}).some((error) => error.includes("2-8")));
  assert.ok(validateImageMediaSpec({images: [{at: 0, image: ""}, {at: 1, image: "b"}]}).some((error) => error.includes("image")));
});
