import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {getMgTemplateProvider} from "../src/provider";
import {PORTRAIT_CATALOG} from "../src/portrait-mg/catalog.js";
import {getPortraitDemo, portraitRenderers} from "../src/portrait-mg";
import {referenceProfiles} from "../src/portrait-mg/reference-profiles";

const provider = getMgTemplateProvider();

test("all 38 portrait reference effects have a Provider binding, renderer and preview", () => {
  assert.equal(PORTRAIT_CATALOG.length, 38);
  assert.equal(new Set(PORTRAIT_CATALOG.map(entry => entry.id)).size, 38);
  for (const entry of PORTRAIT_CATALOG) {
    assert.equal(provider.supportsGroup(entry.htmlTag, "portrait"), true, entry.id);
    assert.equal(provider.getPlanningTools([entry.htmlTag]).length, 1, entry.id);
    assert.equal(typeof portraitRenderers[entry.id], "function", entry.id);
    assert.ok(getPortraitDemo(entry.previewKind).durationInFrames > 0, entry.id);
    assert.equal(provider.templates.find(item => item.htmlTag === entry.htmlTag)?.layerRole,
      entry.renderMode === "overlay" ? "overlay" : "scene", entry.id);
  }
});

test("each new reference resolves its own slots and projects actual word times to local seconds", async () => {
  for (const [id, profile] of Object.entries(referenceProfiles)) {
    const [tool] = provider.getPlanningTools([profile.tag]);
    const demo = getPortraitDemo(id);
    const start = 15;
    const argumentsForTool: Record<string, unknown> = {group: "portrait", order: null};
    const expectedAts: number[] = [];
    for (const key of Object.keys(profile.slots)) {
      const value = demo.spec[key];
      const {at, ...sourceOrText} = value;
      if (sourceOrText.source) {
        await fs.access(new URL("../public/" + sourceOrText.source, import.meta.url));
      }
      if (at !== undefined) expectedAts.push(at);
      argumentsForTool[key] = at === undefined ? value : {...sourceOrText, at: start + at};
    }
    const call = provider.resolveCall({name: tool.name, arguments: argumentsForTool, timing: {start, end: start + profile.duration}});
    assert.equal(call.render.kind, profile.tag, id);
    assert.equal(call.render.layerRole, "scene", id);
    assert.equal(call.render.canvas, "full", id);
    const spec = call.render.spec as Record<string, {at?: number}>;
    for (const key of Object.keys(profile.slots)) assert.equal(spec[key].at, demo.spec[key].at, id + "." + key);
    assert.deepEqual([...new Set(call.elementAts)].sort((a,b) => a-b),
      [...new Set([start, ...expectedAts.map(at => start + at)])].sort((a,b) => a-b), id);
  }
});

test("image and video slots cannot be swapped and fixed visuals cannot be injected", () => {
  const [question] = provider.getPlanningTools(["mg-v-question-reveal"]);
  const timing = {start: 4, end: 9};
  const clip = {source: "sample.mp4", sourceStart: 0};
  const args = {group: "portrait", order: null, background: clip, clip, answer: {text: "答案", at: 7}};
  assert.throws(() => provider.resolveCall({name: question.name, timing,
    arguments: {...args, clip: {source: "still.png", sourceStart: null}}}), /clip\.sourceStart/);
  assert.throws(() => provider.resolveCall({name: question.name, timing,
    arguments: {...args, fakeCaption: "说明文字"}}), /unexpected field/);
  assert.throws(() => provider.resolveCall({name: question.name, timing,
    arguments: {...args, answer: {text: "答案", at: 10}}}), /outside host/);

  const [fold] = provider.getPlanningTools(["mg-v-folded-three-photos"]);
  const photo = {source: "sample.png", sourceStart: null};
  const photos = {group: "portrait", order: null, background: clip, top: {...photo, at: 5},
    middle: {...photo, at: 6}, bottom: {...photo, at: 7}};
  assert.throws(() => provider.resolveCall({name: fold.name, timing,
    arguments: {...photos, top: {...clip, at: 5}}}), /top\.sourceStart/);
  assert.throws(() => provider.resolveCall({name: fold.name, timing,
    arguments: {...photos, middle: {...photo, at: 4.5}}}), /time must follow/);
});
