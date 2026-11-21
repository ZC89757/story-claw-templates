import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {getMgTemplateProvider} from "../src/provider";
import {PORTRAIT_CATALOG as ALL_PORTRAIT_CATALOG} from "../src/portrait-mg/catalog.js";
import {PORTRAIT_FUNCTIONS} from "../src/portrait-mg/definitions";
import {portraitElementAts, resolvePortraitFunctionArgs} from "../src/portrait-mg/schema";
import {getPortraitDemo} from "../src/portrait-mg";
import {preparePortraitAssets} from "../src/portrait-mg/assets";

const examples=JSON.parse(fs.readFileSync(new URL("./fixtures/portrait-examples.json",import.meta.url),"utf8"));
const PORTRAIT_CATALOG=ALL_PORTRAIT_CATALOG.filter(entry=>examples.some((example:{id:string})=>example.id===entry.id));
assert.equal(PORTRAIT_CATALOG.length,examples.length);
const provider=getMgTemplateProvider();
for(const [index,entry] of PORTRAIT_CATALOG.entries()){
 test(`${entry.id}: independent portrait registration and non-zero timing`,()=>{
  const example=examples.find((x:any)=>x.id===entry.id);
  const descriptor=provider.templates.find(x=>x.htmlTag===entry.htmlTag)!;
  assert.deepEqual(descriptor.groups,["portrait"]);
  assert.equal(descriptor.layerRole,entry.renderMode==="overlay"?"overlay":"scene");
  const resolved=provider.resolveCall({name:example.function,arguments:example.arguments,timing:example.hostTiming});
  assert.equal(resolved.htmlTag,entry.htmlTag);assert.equal(resolved.render.kind,entry.template);assert.equal(resolved.render.canvas,"full");
  assert.equal(resolved.at,120);const actualAts=portraitElementAts(resolved.render.spec),expectedAts=portraitElementAts(example.arguments).map(at=>at-120);assert.equal(actualAts.length,expectedAts.length);actualAts.forEach((at,i)=>assert.ok(Math.abs(at-expectedAts[i])<=1e-6));
  assert.equal((resolved.render.spec as any)._duration,example.hostTiming.end-example.hostTiming.start);
  assert.equal(provider.getPlanningTools([entry.htmlTag]).length,1);
  assert.equal(provider.getPlanningTools([entry.htmlTag])[0].name,PORTRAIT_FUNCTIONS[index].name);
  assert.throws(()=>provider.validateAnnotatedInstance({htmlTag:entry.htmlTag,tagCount:2}));
 });
 test(`${entry.id}: closed schema and invalid window rejected`,()=>{
  const example=examples.find((x:any)=>x.id===entry.id), args=example.arguments;
  for(const extra of [{color:"red"},{constructor:"unexpected"},{capture:{}},{_prepared:{}},{group:"landscape"},{order:0}])assert.throws(()=>resolvePortraitFunctionArgs(entry.id,{...args,...extra},example.hostTiming));
  assert.throws(()=>resolvePortraitFunctionArgs(entry.id,args,{start:120,end:120.01}));
  const events=portraitElementAts(args);
  if(events.length)assert.throws(()=>resolvePortraitFunctionArgs(entry.id,args,{start:events[0]+.01,end:140}));
 });
}
test("portrait repeat identity remains group/order aware and no whole-instance FC timing",()=>{
 const e=examples[0];
 const resolved=provider.resolveCall({name:e.function,arguments:{...e.arguments,order:2},timing:e.hostTiming});
 assert.equal(resolved.instanceKey,`${PORTRAIT_CATALOG[0].htmlTag}::portrait::02`);
 assert.throws(()=>provider.resolveCall({name:e.function,arguments:{...e.arguments,at:120},timing:e.hostTiming}));
});
test("portrait conditional cardinality and semantic event order",()=>{
 const comment=structuredClone(examples.find((x:any)=>x.id==="V01_006"));
 comment.arguments.panels[0].comments=Array(3).fill(comment.arguments.panels[0].comments[0]);
 assert.throws(()=>resolvePortraitFunctionArgs(comment.id,comment.arguments,comment.hostTiming),/two comments/);
 const process=structuredClone(examples.find((x:any)=>x.id==="V10_005"));process.arguments.replacement.at=121;
 assert.throws(()=>resolvePortraitFunctionArgs(process.id,process.arguments,process.hostTiming),/crossed-out/);
 const clips=structuredClone(examples[0]);clips.arguments.upper[0].at=121;
 assert.throws(()=>resolvePortraitFunctionArgs(clips.id,clips.arguments,clips.hostTiming),/first clip/);
 for(const id of ["V01_005","V11_002"]){const item=structuredClone(examples.find((x:any)=>x.id===id));item.arguments.cards[0].text="长".repeat(20);assert.throws(()=>resolvePortraitFunctionArgs(id,item.arguments,item.hostTiming),/readable area|invalid text/);}
 const dual=structuredClone(examples.find((x:any)=>x.id==="V01_003"));dual.arguments.lower.at=131.9;
 assert.throws(()=>resolvePortraitFunctionArgs(dual.id,dual.arguments,dual.hostTiming),/complete entrance/);
});

for (const {htmlTag} of ALL_PORTRAIT_CATALOG.filter(({id}) => id.startsWith("latepost-"))) {
  test(`${htmlTag} resolves only as portrait with fixed-layout business inputs`, () => {
    const descriptor = provider.templates.find(template => template.htmlTag === htmlTag)!;
    assert.deepEqual(descriptor.groups, ["portrait"]);
    assert.equal(descriptor.layerRole, "scene");
    const tool = provider.getPlanningTools([htmlTag])[0];
    const demo = getPortraitDemo(htmlTag);
    const start = 120;
    const timing = {start, end: start + demo.durationInFrames / demo.fps};
    const args = JSON.parse(JSON.stringify(demo.spec, (key, value) => key === "at" ? value + start : value));
    const call = {name: tool.name, timing, arguments: {group: "portrait", order: null, ...args}};
    const resolved = provider.resolveCall(call);
    assert.equal(resolved.render.kind, htmlTag);
    assert.equal(resolved.render.canvas, "full");
    const actual = portraitElementAts(resolved.render.spec);
    const expected = portraitElementAts(demo.spec);
    assert.equal(actual.length, expected.length);
    actual.forEach((at,index) => assert.ok(Math.abs(at - expected[index]) <= 1e-6));
    assert.throws(() => provider.resolveCall({...call, arguments: {...call.arguments, group: "landscape"}}));
    assert.throws(() => provider.resolveCall({...call, arguments: {...call.arguments, fontSize: 14}}));
    assert.throws(() => provider.resolveCall({...call, arguments: {...call.arguments, title: "长".repeat(24)}}));
  });
}

test("LatePost asset slots require the original media type", async () => {
  const publicRoot = new URL("../public/", import.meta.url);
  const context = {publicRoot: fileURLToPath(publicRoot), resolveImage: async (file: string) => file};
  const kind = "mg-v-side-by-side-amount-bubbles";
  const demo = getPortraitDemo(kind);
  const spec = {...demo.spec, _duration: demo.durationInFrames / demo.fps};
  const actual = await preparePortraitAssets(kind, {...spec}, context);
  assert.equal(actual.watermarkImage, spec.watermarkImage);
  await assert.rejects(preparePortraitAssets(kind, {
    ...spec, watermarkImage: "portrait-mg/batch-b/car-showroom-demo.mp4",
  }, context), /需要静态图片/);
});
