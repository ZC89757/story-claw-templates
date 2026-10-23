import assert from "node:assert/strict";
import test from "node:test";
import {getMgTemplateProvider} from "../src/provider";
import {genericDemos, countDemo} from "../src/documentary-generic/demos";
import {resolveProduction, resolveNumeric, comparisonFractions, numericLabel, type ProductionSpec, type NumericSpec} from "../src/documentary-generic/schema";

const provider = getMgTemplateProvider();
const timing = {start: 0, end: 10};
for (const demo of genericDemos) {
  test(`${demo.id}: same Provider functions resolve supplied subjects and ownership`, () => {
    const call = provider.resolveCall({name:"create_production_chain",arguments:structuredClone(demo.production),timing});
    assert.equal(call.htmlTag,"production-chain"); assert.equal(call.render.canvas,"full");
    const spec=call.render.spec as ProductionSpec;
    assert.deepEqual(spec.stages.map(s=>s.label),demo.production.stages.map(s=>s.label));
    assert.deepEqual(spec.stages.map(s=>s.source),demo.production.stages.map(s=>s.source));
    assert.deepEqual(spec.actors,demo.production.actors);
    assert.deepEqual([...new Set(call.elementAts)].sort((a,b)=>a-b),[...demo.production.stages.flatMap(s=>[s.at,...s.parts.flatMap(p=>[p.appearAt,p.mergeAt])]),...demo.production.links.map(s=>s.at)].sort((a,b)=>a-b));
    const c=provider.resolveCall({name:"create_numeric_comparison",arguments:structuredClone(demo.numeric),timing});
    assert.equal(c.htmlTag,"numeric-comparison");assert.equal(c.render.canvas,"full");
    const n=c.render.spec as NumericSpec;
    assert.equal(n.right.value,demo.numeric.right.value);
    assert.equal(n.unit,demo.numeric.unit);
  });
}
test("absolute time is converted once, without changing input",()=>{
  const args=structuredClone(genericDemos[0].production);
  args.stages.forEach(s=>{s.at+=100;s.parts.forEach(p=>{p.appearAt+=100;p.mergeAt+=100})});args.links.forEach(s=>s.at+=100);
  const before=JSON.stringify(args),resolved=resolveProduction(args,{start:100,end:110});
  assert.deepEqual(resolved.spec.stages.map(s=>Number(s.at.toFixed(2))),[0,3.2,6.4]);
  assert.equal(JSON.stringify(args),before);
});
test("reject unknown actors, duplicate stage ids, missing image, premature link and cycles",()=>{
  for(const mutate of [
    (a:any)=>a.stages[1].actorId="unknown",
    (a:any)=>a.stages[1].id=a.stages[0].id,
    (a:any)=>a.stages[0].source=null,
    (a:any)=>a.links[0].at=0,
    (a:any)=>{a.links[0].from="assembly";a.links[0].to="site"},
    (a:any)=>a.stages[1].at=11,
  ]){const a=structuredClone(genericDemos[0].production);mutate(a);assert.throws(()=>resolveProduction(a,timing));}
});
test("relative comparison retains approximate multiplier and does not invent a price",()=>{
  const spec=resolveNumeric(genericDemos[0].numeric,timing).spec;
  assert.equal(numericLabel(spec.right),"约2.6");assert.equal(spec.right.value,2.6);
  assert.deepEqual(comparisonFractions(spec),[1/2.6,1]);
  const absolute=resolveNumeric(genericDemos[2].numeric,timing).spec;
  assert.deepEqual(comparisonFractions(absolute),[.6,1]);
});
test("bounds do not become exact ratio bars or silently truncated count arrays",()=>{
  const spec=resolveNumeric(countDemo,timing).spec;
  assert.equal(comparisonFractions(spec),null);assert.equal(numericLabel(spec.left),">1,500");assert.equal(numericLabel(spec.right),"≤100");
  assert.throws(()=>resolveNumeric({...countDemo,unitsPerMark:1},timing),/150/);
  const partial={...countDemo,left:{...countDemo.left,value:15,qualifier:"exact"},right:{...countDemo.right,value:25,qualifier:"exact"}};
  assert.equal(resolveNumeric(partial,timing).spec.right.value/10,2.5);
});
test("reject inconsistent source types, root timing, zero relative baseline and nonfinite data",()=>{
  for(const mutate of [
    (a:any)=>a.left.source=null,
    (a:any)=>a.right.unit="kg",
    (a:any)=>a.at=0,
    (a:any)=>a.left.value=0,
    (a:any)=>a.right.value=NaN,
    (a:any)=>a.left.qualifier="at-most",
    (a:any)=>a.right.at=10,
  ]){const a=structuredClone(genericDemos[0].numeric);mutate(a);assert.throws(()=>resolveNumeric(a,timing));}
});
test("project assets are prepared through existing Provider callbacks, including parts",async()=>{
  const c=provider.resolveCall({name:"create_production_chain",arguments:structuredClone(genericDemos[1].production),timing});
  const seen:string[]=[];
  await provider.prepareRuntimeAssets({layers:[{render:c.render,id:"production",startFrame:0,endFrame:240,timelineOffsetFrames:0} as never],resolveImage:async image=>{seen.push(image);return `prepared/${seen.length}.png`;}});
  const spec=c.render.spec as ProductionSpec;
  // The public preparation path must replace every asset, including assembly parts.
  assert.equal(seen.length,4); assert.equal(spec.prepared,true); assert.equal(spec.stages[2].parts[0].image,"prepared/4.png");
});
