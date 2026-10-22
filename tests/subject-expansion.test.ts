import test from "node:test";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {getMgTemplateProvider} from "../src/provider";
import {resolveSubjectExpansionFunctionArgs, subjectExpansionParametersSchema} from "../src/subject-expansion/schema";
import {prepareSubjectExpansionAssets as prepareAssets} from "../src/subject-expansion/assets";
import {evaluateSubjectExpansion} from "../src/subject-expansion/evaluate";
import {assertSubjectExpansionSpec} from "../src/subject-expansion/validate";
import {subjectExpansionPositions} from "../src/subject-expansion/SubjectExpansionTemplate";
import {SUBJECT_EXPANSION_COMPOSITION_LAYOUT, resolveSubjectExpansionCompositionSlots} from "../src/subject-expansion/composition-layout";
import {findInheritedCompositionBounds} from "../src/composition-layout";
import {evaluateExpansionImpactCard, evaluateExpansionImpactCamera, expansionImpactAudioWindow} from "../src/subject-expansion/impact-evaluate";
import {expansionImpactPositions} from "../src/subject-expansion/SubjectExpansionImpactTemplate";
import {subjectExpansionGrowthArgs, subjectExpansionOverseasArgs} from "../examples/subject-expansion";

const args = () => structuredClone(subjectExpansionGrowthArgs);
const timing = {start: 0, end: 16};
const resolve = (value: unknown) => resolveSubjectExpansionFunctionArgs(value, timing);
const provider = getMgTemplateProvider();
const prepareSubjectExpansionAssets = (value: unknown, resolveImage: (source: string) => Promise<string>) =>
  prepareAssets(value, resolveImage, fileURLToPath(new URL("../public/", import.meta.url)));

test("subject expansion exposes a closed content-only schema at every object level", () => {
  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "object") {
      assert.equal(node.additionalProperties, false);
      assert.deepEqual([...node.required].sort(), Object.keys(node.properties).sort());
    }
    Object.values(node).forEach(visit);
  };
  visit(subjectExpansionParametersSchema);
  assert.deepEqual(Object.keys(subjectExpansionParametersSchema.properties), ["group", "order", "subject", "items", "highlights"]);
});

test("provider owns identity, absolute event times, full canvas and fixed child bounds", () => {
  const absolute = args();
  absolute.items.forEach((item) => item.at += 100);
  absolute.highlights.forEach((item) => item.at += 100);
  const call = provider.resolveCall({name: "create_subject_expansion", arguments: absolute, timing: {start: 100, end: 116}});
  assert.equal(call.instanceKey, "subject-expansion::progressive::one");
  assert.deepEqual(call.elementAts, [100, 102, 108, 105, 112]);
  assert.equal(call.render.canvas, "full");
  assert.equal(call.render.layerRole, "scene");
  assert.deepEqual(call.render.spec, resolve(args()).spec);
  assert.deepEqual(provider.templates.find((entry) => entry.htmlTag === "subject-expansion")?.compositionLayout, SUBJECT_EXPANSION_COMPOSITION_LAYOUT);
  assert.match(provider.getTemplatePlanningInstructions(["subject-expansion"]), /子结束后|子素材只显示/);
  assert.throws(() => provider.validateAnnotatedInstance({htmlTag: "subject-expansion", tagCount: 2}), /只能出现一次/);
});

test("rejects unknown root/child fields, missing nulls and host timing overrides", () => {
  for (const key of ["at", "startTime", "endTime", "duration", "children", "camera"]) assert.throws(() => resolve({...args(), [key]: 5}));
  assert.throws(() => resolve({...args(), subject: {...args().subject, color: "red"}}), /extra fields/);
  const missing: any = args(); delete missing.order;
  assert.throws(() => resolve(missing), /missing required/);
  assert.throws(() => resolve({...args(), group: "split-panel"}), /group/);
});

test("event times stay inside the host interval and retain narrative order", () => {
  for (const at of [-1, 16, NaN, Infinity]) {
    const value = args(); value.items[0].at = at;
    assert.throws(() => resolve(value));
  }
  const value = args(); value.items.reverse();
  assert.throws(() => resolve(value), /non-decreasing/);
  const highlight = args(); highlight.highlights[1].at = highlight.highlights[0].at;
  assert.throws(() => resolve(highlight), /strictly increasing/);
});

test("unique item identity and introduced-only highlight targets", () => {
  for (const id of ["subject", "users"]) {
    const value = args(); value.items[1].id = id;
    assert.throws(() => resolve(value), /duplicate or reserved/);
  }
  for (const targets of [["unknown"], ["business"], ["users", "users"]]) {
    const value = args(); value.highlights[0].targets = targets;
    assert.throws(() => resolve(value), /unknown|not appeared|unique/);
  }
});

test("source modes are exclusive and a transparent source cannot silently trigger generation", () => {
  const value: any = args();
  value.subject.source.prompt = "unexpected prompt";
  assert.throws(() => resolve(value), /must be null/);
  value.subject.source = {mode: "transparent", prompt: null, image: "a generic smartphone"};
  assert.throws(() => resolve(value), /not a prompt/);
  value.subject.source = {mode: "generate", prompt: "a smartphone", image: "photo.png"};
  assert.throws(() => resolve(value), /must be null/);
  assert.doesNotThrow(() => resolve(subjectExpansionOverseasArgs));
});

test("transparent assets resolve once and repeated preparation is idempotent", async () => {
  const spec = resolve(args()).spec;
  spec.items[0].source = spec.subject.source;
  const paths: string[] = [];
  const resolver = async (path: string) => {paths.push(path); return `assets/${paths.length}.png`;};
  const prepared = await prepareSubjectExpansionAssets(spec, resolver);
  assert.equal(paths.length, 2);
  assert.equal(prepared.subject.image, prepared.items[0].image);
  assert.equal(spec.prepared, undefined);
  assert.strictEqual(await prepareSubjectExpansionAssets(prepared, resolver), prepared);
  assert.equal(paths.length, 2);
});

test("unsupported generation fails before resolving any assets; partial failure does not mutate spec", async () => {
  const value = args(); value.items[1].source = {mode: "generate", prompt: "a shop", image: null};
  let calls = 0;
  await assert.rejects(() => prepareSubjectExpansionAssets(resolve(value).spec, async () => {calls++; return "assets/a.png";}), /GENERATION_UNAVAILABLE/);
  assert.equal(calls, 0);
  const spec = resolve(args()).spec;
  const original = structuredClone(spec);
  await assert.rejects(() => prepareSubjectExpansionAssets(spec, async () => {throw new Error("asset unavailable");}), /unavailable/);
  assert.deepEqual(spec, original);
});

test("prepared runtime specs cannot silently omit required images", () => {
  const spec = resolve(args()).spec;
  spec.prepared = true; spec.subject.image = "";
  assert.throws(() => assertSubjectExpansionSpec(spec), /resolved image/);
});

test("missing image files cannot fall through to the host's prompt generation", async () => {
  const spec = resolve(args()).spec;
  spec.subject.source = {mode: "transparent", prompt: null, image: "subject-expansion/missing.png"};
  let called = false;
  await assert.rejects(() => prepareSubjectExpansionAssets(spec, async () => {called = true; return "assets/generated.png";}), /does not exist/);
  assert.equal(called, false);
});

test("items persist during refocus and a later reveal replaces the previous note", () => {
  const spec = resolve(args()).spec;
  assert.equal(evaluateSubjectExpansion(spec, 0).items[0].progress, 0);
  const highlighted = evaluateSubjectExpansion(spec, 6);
  assert.equal(highlighted.note, "形成用户基础");
  assert.equal(highlighted.items[0].progress, 1);
  assert.equal(evaluateSubjectExpansion(spec, 9).note, null);
  const end = evaluateSubjectExpansion(spec, 15);
  assert.ok(end.items.every((item) => item.progress === 1 && item.opacity > 0.7));
  assert.ok(end.subjectOpacity > 0.8);
});

test("child slot is ready immediately and bounds do not cover the subject or bottom note", () => {
  assert.deepEqual(resolveSubjectExpansionCompositionSlots({}, 30, 480), [{slotId: "evidence", openFrame: 0, closeFrame: 480}]);
  const parent = {nodeId: "p", htmlTag: "subject-expansion"};
  const child = {nodeId: "c", parentNodeId: "p", htmlTag: "timed-table"};
  assert.deepEqual(findInheritedCompositionBounds(child, new Map([["p", parent], ["c", child]])), SUBJECT_EXPANSION_COMPOSITION_LAYOUT.bounds);
  assert.throws(() => resolveSubjectExpansionCompositionSlots({}, 0, 480));
  const bounds = SUBJECT_EXPANSION_COMPOSITION_LAYOUT.bounds;
  assert.ok(bounds.x * 1920 > 610);
  assert.ok((bounds.y + bounds.height) * 1080 < 910);
  assert.equal(bounds.width, bounds.height, "a 16:9 child fits a 16:9 parent window without letterboxing");
});

test("all supported object counts fit the fixed composition region with separated text boxes", () => {
  for (let count = 2; count <= 5; count++) {
    const positions = subjectExpansionPositions(count);
    assert.equal(positions.length, count);
    for (const p of positions) {
      assert.ok(p.x - 155 >= 768 && p.x + 155 <= 1824);
      assert.ok(p.y - 105 >= 180 && p.y + 130 <= 900);
    }
  }
});

test("impact and progressive share one function schema and identical semantic payload", () => {
  const smooth = resolve(args());
  const impactArgs = {...args(), group: "impact"};
  const impact = resolve(impactArgs);
  assert.deepEqual(impact.spec, smooth.spec);
  assert.equal(impact.group, "impact");
  const tools = provider.getPlanningTools(["subject-expansion"]);
  assert.equal(tools.length, 1);
  const schema = tools[0].parameters as typeof subjectExpansionParametersSchema;
  assert.deepEqual(schema.properties.group.enum, ["progressive", "impact"]);
  assert.deepEqual(Object.keys(schema.properties.items.items.properties), ["id", "label", "relation", "source", "at"]);
  assert.equal(provider.supportsGroup("subject-expansion", "impact"), true);
  assert.equal(provider.resolveCall({name: "create_subject_expansion", arguments: impactArgs, timing}).render.group, "impact");
});

test("impact flips before the requested landing, holds old cards and draws links only after landing", () => {
  const airborne = evaluateExpansionImpactCard(1.6, 2);
  assert.equal(airborne.airborne, true);
  assert.equal(airborne.landed, false);
  assert.ok(airborne.translateY < 0 && airborne.translateZ > 0);
  assert.equal(airborne.link, 0);
  const hit = evaluateExpansionImpactCard(2, 2);
  assert.equal(hit.landed, true);
  assert.equal(hit.translateY, 0);
  assert.ok(hit.scaleY < 1 && hit.contact > 0);
  assert.equal(evaluateExpansionImpactCard(2.17, 2).link, 0);
  assert.ok(evaluateExpansionImpactCard(2.4, 2).link > 0);
  const held = evaluateExpansionImpactCard(12, 2);
  assert.equal(held.visible, true);
  assert.equal(held.link, 1);
  assert.equal(held.contact, 0);
  assert.equal(held.scaleY, 1);
});

test("impact at instance start has no delayed hit, and audio stays frame-aligned when its lead is trimmed", () => {
  assert.equal(evaluateExpansionImpactCard(0, 0).landed, true);
  assert.equal(evaluateExpansionImpactCard(0.1, 0).visible, true);
  for (const fps of [24, 25, 30, 60]) {
    for (const at of [0, 0.12, 1.5, 5.123]) {
      const audio = expansionImpactAudioWindow(at, fps);
      assert.equal(audio.from + Math.round(0.72 * fps) - audio.trimBefore, Math.round(at * fps));
      assert.ok(audio.from >= 0 && audio.trimBefore >= 0);
    }
  }
});

test("camera shake is local to impacts and returns exactly to rest", () => {
  const spec = resolve(args()).spec;
  assert.deepEqual(evaluateExpansionImpactCamera(spec, 1), {x: 0, y: 0});
  assert.notDeepEqual(evaluateExpansionImpactCamera(spec, 2), {x: 0, y: 0});
  assert.deepEqual(evaluateExpansionImpactCamera(spec, 3), {x: 0, y: 0});
  assert.deepEqual(evaluateExpansionImpactCamera(spec, 6), {x: 0, y: 0}, "highlight should not cause another impact");
});

test("impact layouts keep the resting cards within the same child window", () => {
  const bounds = SUBJECT_EXPANSION_COMPOSITION_LAYOUT.bounds;
  for (let count = 2; count <= 5; count++) {
    const width = count === 5 ? 278 : 326;
    for (const p of expansionImpactPositions(count)) {
      assert.ok(p.x - width / 2 >= bounds.x * 1920);
      assert.ok(p.x + width / 2 <= (bounds.x + bounds.width) * 1920);
      assert.ok(p.y - 129 >= bounds.y * 1080);
      assert.ok(p.y + 129 <= (bounds.y + bounds.height) * 1080);
    }
  }
});
