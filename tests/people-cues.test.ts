import assert from "node:assert/strict";
import test from "node:test";
import {getMgTemplateProvider} from "../src/provider";
import {evaluateCutoutCue} from "../src/cutout-cue";
import {visibleQuoteCharacters} from "../src/speaker-quote/schema";
const provider=getMgTemplateProvider();
const transparent=(image:string)=>({mode:"transparent",image,subject:null,references:[]});
const args={group:"duo",order:null,items:[{at:12,label:"甲",source:transparent("alpha.png")},{at:14,label:"乙",source:transparent("beta.png")}]};

test("new templates expose separate scene backgrounds and transparent cue overlays",()=>{
  assert.equal(provider.templates.find(t=>t.htmlTag==="image-plate")?.layerRole,"scene");
  assert.equal(provider.templates.find(t=>t.htmlTag==="cutout-cue")?.layerRole,"overlay");
  assert.equal(provider.templates.find(t=>t.htmlTag==="speaker-quote")?.layerRole,"scene");
  assert.deepEqual(provider.templates.find(t=>t.htmlTag==="cutout-cue")?.groups,["duo","pop","duo-landscape","pop-landscape"]);
  const call=provider.resolveCall({name:"create_cutout_cues",arguments:args,timing:{start:10,end:18}});
  assert.deepEqual(call.elementAts,[10,12,14]);
  assert.equal(call.render.background,"transparent");
  assert.deepEqual((call.render.spec as {items:{at:number}[]}).items.map(i=>i.at),[2,4]);
});
test("cue timing never reveals the second person before their own name; pop leaves",()=>{
  assert.equal(evaluateCutoutCue(3.99,4,"duo").opacity,0);
  assert.equal(evaluateCutoutCue(4.5,4,"duo").opacity,1);
  assert.equal(evaluateCutoutCue(10,4,"duo").opacity,1);
  assert.equal(evaluateCutoutCue(6,4,"pop").opacity,0);
  assert.equal(evaluateCutoutCue(4.4,4,"pop",4.4).opacity,0);
});
test("landscape groups reuse the same Function Calls, assets and exact timing payloads",()=>{
  const cases=[
    {name:"create_image_plate",from:"company",to:"company-landscape",args:{order:null,image:"company.jpg",caption:"资料背景"}},
    {name:"create_cutout_cues",from:"duo",to:"duo-landscape",args:{order:null,items:args.items}},
    {name:"create_cutout_cues",from:"pop",to:"pop-landscape",args:{order:null,items:[args.items[0]]}},
    {name:"create_speaker_quote",from:"portrait",to:"landscape",args:{order:null,speaker:"甲",portrait:"portrait.png",quotation:"paraphrase",characters:[{text:"设",at:12},{text:"计",at:12.7}]}},
  ];
  for(const c of cases){
    const resolve=(group:string)=>provider.resolveCall({name:c.name,arguments:{...c.args,group},timing:{start:10,end:18}});
    const portrait=resolve(c.from),landscape=resolve(c.to);
    assert.deepEqual(landscape.render.spec,portrait.render.spec);
    assert.deepEqual(landscape.elementAts,portrait.elementAts);
    assert.equal(landscape.layerRole,portrait.layerRole);
    assert.equal(landscape.group,c.to);
    assert.notEqual(landscape.instanceKey,portrait.instanceKey);
  }
  assert.equal(evaluateCutoutCue(10,4,"duo-landscape").opacity,1);
  assert.equal(evaluateCutoutCue(6,4,"pop-landscape").opacity,0);
  assert.throws(()=>provider.resolveCall({name:"create_cutout_cues",arguments:{...args,group:"duo-landscape",items:[args.items[0]]},timing:{start:10,end:18}}),/exactly two/);
});
test("cutout cues reuse the existing image generation and removal pipeline atomically",async()=>{
  const call=provider.resolveCall({name:"create_cutout_cues",arguments:{...args,items:[args.items[0],{at:14,label:"乙",source:{mode:"generate",image:null,subject:"人物乙",references:["https://example.com/person.png"]}}]},timing:{start:10,end:18}});
  let generated=0,removed=0;
  const layer={id:"cue",instance:"cue",htmlTag:"cutout-cue",group:"duo",layerRole:"overlay" as const,startFrame:0,endFrame:200,durationFrames:200,timelineOffsetFrames:0,sourceText:"",render:call.render};
  const services={layers:[layer],resolveImage:async(s:string)=>"prepared/"+s,generateImageFromReferences:async()=>{generated++;return "C:/generated.png";},removeSolidBackground:async()=>{removed++;return "C:/cutout.png";}};
  await provider.prepareRuntimeAssets(services);
  await provider.prepareRuntimeAssets(services);
  assert.equal(generated,1);assert.equal(removed,1);
  assert.equal((call.render.spec as {prepared:boolean}).prepared,true);
});
test("quote characters use irregular real timestamps and preserve paraphrase status",()=>{
  const call=provider.resolveCall({name:"create_speaker_quote",arguments:{group:"portrait",order:null,speaker:"甲",portrait:"portrait.png",quotation:"paraphrase",characters:[{text:"设",at:12},{text:"计",at:12.7},{text:"难",at:14.3}]},timing:{start:10,end:16}});
  const spec=call.render.spec as {characters:{text:string;at:number}[];quotation:string};
  assert.equal(visibleQuoteCharacters(spec.characters,2.69),"设");
  assert.equal(visibleQuoteCharacters(spec.characters,4.3),"设计难");
  assert.equal(spec.quotation,"paraphrase");
  assert.throws(()=>provider.resolveCall({name:"create_speaker_quote",arguments:{group:"portrait",order:null,speaker:"甲",portrait:"a.png",quotation:"direct",characters:[{text:"提前",at:12}]},timing:{start:10,end:16}}),/one Unicode character/);
});
test("invalid timing, reversed cues and unknown fields fail before rendering",()=>{
  assert.throws(()=>provider.resolveCall({name:"create_cutout_cues",arguments:{...args,startTime:1},timing:{start:10,end:18}}),/宿主/);
  assert.throws(()=>provider.resolveCall({name:"create_cutout_cues",arguments:{...args,items:[args.items[1],args.items[0]]},timing:{start:10,end:18}}),/narration order/);
  assert.throws(()=>provider.resolveCall({name:"create_cutout_cues",arguments:{...args,items:[args.items[0],{...args.items[1],at:18}]},timing:{start:10,end:18}}),/inside/);
});
