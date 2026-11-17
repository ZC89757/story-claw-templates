import assert from "node:assert/strict";
import test from "node:test";
import {resolvePortraitFunctionArgs,portraitBindings} from "../src/portrait-mg/schema";
import {getPortraitDemo} from "../src/portrait-mg";
import {getReferenceProfile} from "../src/portrait-mg/reference-profiles";
import {referenceVideoWindow} from "../src/portrait-mg/content-timing";
function argsFor(id:string,start=0){
 const demo=getPortraitDemo(id),binding=portraitBindings.find(b=>b.template===getReferenceProfile(id)?.tag)!;
 const args:any={group:"portrait",order:null};
 for(const key of Object.keys(binding.definition.parameters.properties)){if(key==="group"||key==="order")continue;const v=structuredClone(demo.spec[key]);args[key]=v&&v.at!==undefined?{...v,at:v.at+start}:v;}
 return {args,end:start+demo.durationInFrames/30};
}
test("five footage strips use one entrance cue and exact independent source ranges",()=>{
 const {args,end}=argsFor("V10_008",20);
 for(const key of ["middle","lower","fourth","fifth"])delete args[key].at;
 const result=resolvePortraitFunctionArgs("V10_008",args,{start:20,end});
 assert.equal(result.spec.upper.at,1.4);
 assert.equal(result.spec.fourth.at,undefined);
 assert.ok(Math.abs(result.spec.fourth.sourceEnd-result.spec.fourth.sourceStart-5.6)<.001);
 const invalid=structuredClone(args);invalid.fourth.sourceEnd=1;
 assert.throws(()=>resolvePortraitFunctionArgs("V10_008",invalid,{start:20,end}),/source range/);
});
test("source range contracts count overlapping transition frames",()=>{
 const {args,end}=argsFor("V20_003",10);
 assert.ok(Math.abs(referenceVideoWindow("V20_003","upper",args,10,end).duration-8.6)<1e-6);
 assert.ok(Math.abs(referenceVideoWindow("V20_003","lower",args,10,end).duration-2.2)<1e-6);
 const result=resolvePortraitFunctionArgs("V20_003",args,{start:10,end});
 assert.ok(Math.abs(result.spec.upper.sourceEnd-8.6)<1e-6);
 const bad=structuredClone(args);bad.upper.sourceEnd=8.1;
 assert.throws(()=>resolvePortraitFunctionArgs("V20_003",bad,{start:10,end}),/source range/);
});
test("fixed multi-line quotes validate each line without shrinking the text",()=>{
 const {args,end}=argsFor("V18_002");
 assert.doesNotThrow(()=>resolvePortraitFunctionArgs("V18_002",args,{start:0,end}));
 const wide=structuredClone(args);wide.firstQuote.text="长".repeat(16);
 assert.throws(()=>resolvePortraitFunctionArgs("V18_002",wide,{start:0,end}),/shorten the wording/);
 const tall=structuredClone(args);tall.firstQuote.text=Array(19).fill("行").join("\n");
 assert.throws(()=>resolvePortraitFunctionArgs("V18_002",tall,{start:0,end}),/too many lines/);
});
test("new text slots are public content while missing legacy fields remain accepted",()=>{
 for(const [id,key]of [["V28_001","subtitle"],["V10_001","openingTitle"]]){
  const {args,end}=argsFor(id);assert.ok(args[key].text);
  assert.doesNotThrow(()=>resolvePortraitFunctionArgs(id,args,{start:0,end}));
  delete args[key];assert.doesNotThrow(()=>resolvePortraitFunctionArgs(id,args,{start:0,end}));
 }
});
test("a legacy video playlist keeps exact source ranges under nonzero scene timing",()=>{
 const args={group:"portrait",order:null,upper:[{at:30,media:{source:"a.mp4",sourceStart:2,sourceEnd:3}},{at:31,media:{source:"b.mp4",sourceStart:4,sourceEnd:6}}],lower:{source:"c.mp4",sourceStart:8,sourceEnd:11},title:"背景"};
 const result=resolvePortraitFunctionArgs("V01_001",args,{start:30,end:33});
 assert.equal(result.spec.upper[1].at,1);assert.equal(result.spec.upper[1].media.sourceStart,4);
 const bad=structuredClone(args);bad.upper[0].media.sourceEnd=2.5;
 assert.throws(()=>resolvePortraitFunctionArgs("V01_001",bad,{start:30,end:33}),/source range/);
});

test("document templates accept a local snapshot path while keeping URL compatibility",()=>{
 for(const id of ["V04_002","V07_003"]){
  const demo=getPortraitDemo(id);const {_duration,_prepared,capture,group,order,...content}=demo.spec;
  assert.ok(content.snapshotPath);
  assert.doesNotThrow(()=>resolvePortraitFunctionArgs(id,{group:"portrait",order:null,...content},{start:0,end:demo.durationInFrames/30}));
  const legacy={...content,url:"https://example.invalid/saved-page"};delete legacy.snapshotPath;
  assert.doesNotThrow(()=>resolvePortraitFunctionArgs(id,{group:"portrait",order:null,...legacy},{start:0,end:demo.durationInFrames/30}));
 }
});

test("the original three-slot strip call still resolves its independent cues",()=>{
 const args={group:"portrait",order:null,lead:{source:"lead.mp4",sourceStart:0},upper:{source:"a.mp4",sourceStart:0,at:21.4},middle:{source:"b.mp4",sourceStart:0,at:22},lower:{source:"c.mp4",sourceStart:0,at:23},upperText:{text:"第一"},middleText:{text:"第二"},lowerText:{text:"第三"}};
 const result=resolvePortraitFunctionArgs("V10_008",args,{start:20,end:25});
 assert.equal(result.spec.middle.at,2);assert.equal(result.spec.lower.at,3);
 assert.equal(result.spec.middle.sourceEnd,3);assert.equal(result.spec.fourth,undefined);
});
test("fixed background videos do not expose an independent entrance control",()=>{
 const {args,end}=argsFor("V19_006",10);
 args.firstClip.at=10;
 assert.equal(resolvePortraitFunctionArgs("V19_006",args,{start:10,end}).spec.firstClip.at,undefined);
 args.firstClip.at=10.5;
 assert.throws(()=>resolvePortraitFunctionArgs("V19_006",args,{start:10,end}),/no independent cue/);
});
