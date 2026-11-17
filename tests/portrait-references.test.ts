import {portraitContentParameters} from "../src/portrait-mg/content-parameters";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {getMgTemplateProvider} from "../src/provider";
import {PORTRAIT_CATALOG} from "../src/portrait-mg/catalog.js";
import {getPortraitDemo, portraitRenderers} from "../src/portrait-mg";
import {referenceProfiles} from "../src/portrait-mg/reference-profiles";

const provider = getMgTemplateProvider();

test("all registered portrait effects have a Provider binding, renderer and preview", () => {
  assert.equal(PORTRAIT_CATALOG.length, Object.keys(portraitRenderers).length);
  assert.equal(new Set(PORTRAIT_CATALOG.map(entry => entry.id)).size, PORTRAIT_CATALOG.length);
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
    if (id === "V28_004") argumentsForTool.target = demo.spec.target;
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
    for (const key of Object.keys(profile.slots)) {
      const actual = spec[key].at, expected = demo.spec[key].at;
      if (expected === undefined) assert.equal(actual, undefined, id + "." + key);
      else assert.ok(Math.abs(actual! - expected) <= .000001, id + "." + key + " preserves sub-frame word time");
    }
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
    arguments: {...photos, middle: {...photo, at: 8}}}), /complete entrance/);
});


test("strict replicas reject overflowing text instead of changing its font size", () => {
  const [tool] = provider.getPlanningTools(["mg-v-question-reveal"]);
  const media = {source: "sample.mp4", sourceStart: 0};
  const args = {group: "portrait", order: null, background: media, clip: media, answer: {text: "这五个汉字", at: 1.7}};
  assert.throws(() => provider.resolveCall({name: tool.name, arguments: args, timing: {start: 0, end: 3.8}}), /shorten the wording/);
  assert.throws(() => provider.resolveCall({name: tool.name, arguments: {...args, answer: {text: "WWWW", at: 1.7}}, timing: {start: 0, end: 3.8}}), /shorten the wording/);
  assert.doesNotThrow(() => provider.resolveCall({name: tool.name, arguments: {...args, answer: {text: "答案", at: 1.7}}, timing: {start: 0, end: 3.8}}));
});

test("original card subtitles stay editable while legacy missing rows remain compatible", () => {
  for (const id of ["V21_008"]) {
    const profile = referenceProfiles[id as keyof typeof referenceProfiles];
    const [tool] = provider.getPlanningTools([profile.tag]);
    const {_duration, ...slots} = getPortraitDemo(id).spec;
    const input: Record<string, any> = {group: "portrait", order: null, ...slots};
    const optional = id === "V21_008" ? ["titleSubtitle", "leftSubtitle", "rightSubtitle"] : ["signature"];
    const modern = provider.resolveCall({name: tool.name, arguments: input, timing: {start: 0, end: profile.duration}});
    for (const key of optional) assert.equal((modern.render.spec as any)[key].text, input[key].text);
    for (const key of optional) delete input[key];
    const legacy = provider.resolveCall({name: tool.name, arguments: input, timing: {start: 0, end: profile.duration}});
    for (const key of optional) assert.equal((legacy.render.spec as any)[key], null);
  }
});


test("folded photos accept independent speech cues and an explicit source range", () => {
  const [tool] = provider.getPlanningTools(["mg-v-folded-three-photos"]);
  const picture = {source: "sample.png"};
  const args = {group: "portrait", order: null, background: {source: "clip.mp4", sourceStart: 20, sourceEnd: 28}, top: {...picture, at: 11}, middle: {...picture, at: 14}, bottom: {...picture, at: 12}};
  const call = provider.resolveCall({name: tool.name, arguments: args, timing: {start: 10, end: 18}});
  const spec = call.render.spec as any;
  assert.equal(spec.top.at, 1); assert.equal(spec.middle.at, 4); assert.equal(spec.bottom.at, 2);
  assert.equal(spec.background.sourceStart, 20); assert.equal(spec.background.sourceEnd, 28);
  assert.equal(spec.top.sourceStart, null);
  const properties = (tool as any).parameters.properties;
  assert.deepEqual(Object.keys(properties).sort(), ["background","bottom","footerText","group","middle","order","signature","top"]);
  assert.deepEqual(Object.keys(properties.top.properties).sort(), ["at","source"]);
  assert.throws(() => provider.resolveCall({name: tool.name, arguments: {...args, background: {...args.background, sourceEnd: 27}}, timing: {start: 10, end: 18}}), /source range/);
  assert.throws(() => provider.resolveCall({name: tool.name, arguments: {...args, middle: {...picture, at: 17}}, timing: {start: 10, end: 18}}), /complete entrance/);
  const {_duration, ...legacy} = getPortraitDemo("V16_002").spec;
  assert.doesNotThrow(() => provider.resolveCall({name: tool.name, arguments: {group:"portrait",order:null,...legacy,signature:null}, timing:{start:0,end:2.3}}));
});


test("optimized references expose only content paths, text, and required timing", () => {
  for (const id of ["V07_004","V21_008","V27_006","V11_003","V16_001","V26_001","V20_006","V20_009","V13_003","V24_001"]) {
    const profile = referenceProfiles[id as keyof typeof referenceProfiles];
    const [tool] = provider.getPlanningTools([profile.tag]);
    const properties = (tool as any).parameters.properties;
    assert.deepEqual(Object.keys(properties).sort(), ["group","order",...Object.keys(profile.slots),...Object.keys(portraitContentParameters[id] ?? {})].sort());
    for (const [key, slot] of Object.entries(profile.slots)) {
      const shape = properties[key].anyOf?.find((s:any)=>s.type === "object") ?? properties[key];
      const allowed = slot.type === "video" ? ["source","sourceStart","sourceEnd"] : slot.type === "image" || slot.type === "cutout" ? ["source"] : slot.type === "text" ? ["text"] : [];
      if(slot.at !== undefined || slot.type === "cue") allowed.push("at");
      assert.deepEqual(Object.keys(shape.properties).sort(), allowed.sort(), id+"."+key);
    }
  }
});

test("video source ranges follow actual window cuts rather than the whole scene", () => {
  const [tool] = provider.getPlanningTools(["mg-v-torn-title-reversal"]);
  const args = {group:"portrait",order:null,background:{source:"bg.mp4",sourceStart:0,sourceEnd:8},clip:{source:"first.mp4",sourceStart:10,sourceEnd:12.5},nextClip:{source:"second.mp4",sourceStart:20,sourceEnd:22.5,at:12.5},opening:{text:"资料",at:13},closing:{text:"结论",at:15}};
  const call = provider.resolveCall({name:tool.name,arguments:args,timing:{start:10,end:18}});
  const spec = call.render.spec as any;
  assert.equal(spec.nextClip.at,2.5);assert.equal(spec.closing.at,5);
  assert.equal(spec.clip.sourceEnd-spec.clip.sourceStart,2.5);
  assert.equal(spec.nextClip.sourceEnd-spec.nextClip.sourceStart,2.5);
  assert.throws(()=>provider.resolveCall({name:tool.name,arguments:{...args,nextClip:{...args.nextClip,sourceEnd:28}},timing:{start:10,end:18}}),/source range/);
});

test("independent cards can follow speech in a different order", () => {
  const [tool] = provider.getPlanningTools(["mg-v-one-large-two-small"]);
  const {_duration,...slots}=getPortraitDemo("V21_008").spec;
  assert.doesNotThrow(()=>provider.resolveCall({name:tool.name,arguments:{group:"portrait",order:null,...slots,title:{...slots.title,at:2},left:{...slots.left,at:0},right:{...slots.right,at:1}},timing:{start:0,end:_duration}}));
});

test("credits can be replaced or omitted in the original wordmark slot", () => {
  for(const id of ["V13_003","V16_002"]) {
    const profile=referenceProfiles[id as keyof typeof referenceProfiles];const [tool]=provider.getPlanningTools([profile.tag]);
    assert.ok((tool as any).parameters.properties.signature);
    const {_duration,...slots}=getPortraitDemo(id).spec;
    const call=provider.resolveCall({name:tool.name,arguments:{group:"portrait",order:null,...slots,signature:{text:"Studio"}},timing:{start:0,end:_duration}});
    assert.equal((call.render.spec as any).signature.text,"Studio");
    const plan = {group:"portrait",order:null,...slots,signature:{source:"custom-logo.png"}};
    const timing={start:0,end:_duration};
    assert.deepEqual((provider.resolveCall({name:tool.name,arguments:plan,timing}).render.spec as any).signature,plan.signature);
    assert.equal((provider.resolveCall({name:tool.name,arguments:{...plan,signature:null},timing}).render.spec as any).signature,null);
  }
});

test("diagonal media keep full duration and ignore retired appearance cues", () => {
  const [tool]=provider.getPlanningTools(["mg-v-three-diagonal-clips"]);const {_duration,...slots}=getPortraitDemo("V26_001").spec;
  const call=provider.resolveCall({name:tool.name,arguments:{group:"portrait",order:null,...slots,middle:{...slots.middle,at:3},lower:{...slots.lower,at:1}},timing:{start:0,end:_duration}});
  const spec=call.render.spec as any;assert.equal(spec.middle.at,undefined);assert.equal(spec.lower.at,undefined);
  assert.ok(Math.abs(spec.middle.sourceEnd-spec.middle.sourceStart-_duration)<.000001);
  assert.ok(Math.abs(spec.lower.sourceEnd-spec.lower.sourceStart-_duration)<.000001);
});


test("finite sampled decorations reject unverified extension instead of freezing or reversing", () => {
  for(const id of ["V07_004","V27_006","V11_003","V20_009"]) {
    const p=referenceProfiles[id as keyof typeof referenceProfiles];const [tool]=provider.getPlanningTools([p.tag]);const {_duration,...slots}=getPortraitDemo(id).spec;
    assert.throws(()=>provider.resolveCall({name:tool.name,arguments:{group:"portrait",order:null,...slots},timing:{start:0,end:_duration+1}}),/at most/);
  }
});


test("new card plans cannot remove the original English text rows", () => {
  const [tool]=provider.getPlanningTools(["mg-v-one-large-two-small"]);
  for(const key of ["titleSubtitle","leftSubtitle","rightSubtitle"]) {
    const slot=(tool as any).parameters.properties[key];
    assert.equal(slot.type,"object");assert.equal(slot.anyOf,undefined);assert.equal(slot.properties.text.minLength,1);
  }
});


test("fixed card subtitle width rejects wide ASCII without shrinking narrow text", () => {
  const [tool]=provider.getPlanningTools(["mg-v-one-large-two-small"]);
  const {_duration,...slots}=getPortraitDemo("V21_008").spec;
  for(const key of ["leftSubtitle","rightSubtitle"]) {
    const call=(text:string)=>provider.resolveCall({name:tool.name,arguments:{group:"portrait",order:null,...slots,[key]:{text}},timing:{start:0,end:_duration}});
    assert.throws(()=>call("W".repeat(18)),/fixed subtitle width/);
    assert.doesNotThrow(()=>call("i".repeat(20)));
    assert.doesNotThrow(()=>call("A clearer choice"));
  }
});
