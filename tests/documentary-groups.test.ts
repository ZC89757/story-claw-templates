import assert from "node:assert/strict";
import test from "node:test";
import {getMgTemplateProvider} from "../src/provider";
import {resolveRouteMapFunctionArgs} from "../src/route-map/schema";
import {findInheritedCompositionBounds,getCompositionSlotResolverForHtmlTag} from "../src/composition-layout";
import {TIMELINE_WINDOW_LAYOUT} from "../src/progress-timeline/content-window";
import {comparisonDisplay} from "../src/weighted-comparison/EditorialScaleTemplate";
import {childMediaWindows} from "../src/composition-media-context";
import {archiveVideoAmount} from "../src/progress-timeline/ArchiveRailTemplate";
import type {MgRuntimeCompositionNode} from "../src/runtime";

const provider=getMgTemplateProvider();
test("archive video appears only in the existing nested media interval",()=>{
 const parent={nodeId:"progress-timeline::archive-rail::one",startFrame:300,endFrame:540,videoPath:"",zIndex:0} as MgRuntimeCompositionNode;
 const child={nodeId:"video",parentNodeId:parent.nodeId,startFrame:419,endFrame:507,videoPath:"roadster.mp4",zIndex:1} as MgRuntimeCompositionNode;
 const windows=childMediaWindows(parent,[parent,child],30);
 assert.deepEqual(windows,[{start:119/30,end:207/30}]);
 assert.equal(archiveVideoAmount(2,windows[0]),0);
 assert.equal(archiveVideoAmount(5,windows[0]),1);
 assert.equal(archiveVideoAmount(7.2,windows[0]),0);
 assert.deepEqual(childMediaWindows(parent,[parent],30),[]);
});
test("single-year archive keeps a continuous inherited video window without relaxing older groups",()=>{
 const args={title:"成立",nodes:[{at:10,year:"2003",title:"特斯拉成立"}],order:null};
 const result=provider.resolveCall({name:"create_progress_timeline",timing:{start:10,end:17},arguments:{...args,group:"archive-rail"}});
 assert.equal((result.render.spec as {nodes:unknown[]}).nodes.length,1);
 assert.throws(()=>provider.resolveCall({name:"create_progress_timeline",timing:{start:10,end:17},arguments:{...args,group:"horizontal"}}),/at least two/);
 const parent={nodeId:"progress-timeline::archive-rail::one",htmlTag:"progress-timeline"};
 const child={nodeId:"video-footage::full-bleed::one",htmlTag:"video-footage",parentNodeId:parent.nodeId};
 assert.deepEqual(findInheritedCompositionBounds(child,new Map([[parent.nodeId,parent],[child.nodeId,child]])),TIMELINE_WINDOW_LAYOUT.bounds);
 assert.deepEqual(getCompositionSlotResolverForHtmlTag("progress-timeline")!(result.render.spec,30,210),[]);
});
test("minimal comparison preserves supplied inequalities, units and approximate multipliers",()=>{
 assert.deepEqual(comparisonDisplay("美国起售价：21,955 美元"),{value:"21,955",caption:"美国起售价",unit:"美元"});
 assert.equal(comparisonDisplay("超过1,500种配置组合").value,">1,500");
 assert.equal(comparisonDisplay("配置组合控制在100种以内").value,"≤100");
 assert.deepEqual(comparisonDisplay("最便宜的规划版本，抵免前价格约为凯美瑞的 2.6 倍"),{value:"约2.6倍",caption:"最低规划版本 · 抵免前",unit:""});
});
test("documentary groups preserve the existing Function Calling parameter contracts",()=>{
 const examples=[
  {name:"create_progress_timeline",old:"horizontal",group:"archive-rail",args:{title:"成长",nodes:[{at:10,year:"2003",title:"成立"},{at:12,year:"2008",title:"交付"}]}},
  {name:"create_side_by_side_comparison",old:"split-panel",group:"editorial-scale",args:{title:"价格对比",leftLabel:"家用车",rightLabel:"Model S",items:[{at:10,side:"left",text:"21,955 美元"},{at:12,side:"right",text:"价格约为它的 2.6 倍"}],highlights:[]}},
  {name:"create_directed_graph_timeline",old:"flow",group:"production-chain",args:{title:"分工",nodes:[{id:"n0",label:"厂房",at:10},{id:"n1",label:"电芯",at:12}],edges:[{at:12,from:"n0",to:"n1",relation:"提供生产条件"}]}},
 ];
 for(const e of examples){
  const resolve=(group:string)=>provider.resolveCall({name:e.name,timing:{start:10,end:15},arguments:{...e.args,group,order:null}});
  const old=resolve(e.old),current=resolve(e.group);
  const semantic=(spec:unknown)=>JSON.parse(JSON.stringify(spec),(key,value)=>e.name==="create_progress_timeline"&&key==="id"?undefined:value);
  assert.deepEqual(semantic(current.render.spec),semantic(old.render.spec));
  assert.equal(current.render.canvas,"full");
  assert.equal(current.group,e.group);
 }
});

const map={group:"supply-chain",order:null,title:"法国供应英国",stops:[
 {id:"fr",label:"法国",detail:"供应面板",longitude:2.35,latitude:48.8,at:10},
 {id:"uk",label:"英国",detail:"接收面板",longitude:-1.1,latitude:52,at:12},
],routes:[{from:"fr",to:"uk",at:12,waypoints:[]}]};
test("geographic supply routes preserve direction and use scene-local internal times",()=>{
 const result=provider.resolveCall({name:"create_route_map",timing:{start:10,end:15},arguments:map});
 assert.equal(result.htmlTag,"route-map");
 assert.deepEqual([...new Set(result.elementAts)],[10,12]);
 const spec=result.render.spec as typeof map;
 assert.deepEqual(spec.routes,[{from:"fr",to:"uk",at:2,waypoints:[]}]);
 assert.deepEqual(spec.stops.map(s=>s.at),[0,2]);
});
test("map rejects invalid coordinates and orphaned route endpoints",()=>{
 assert.throws(()=>resolveRouteMapFunctionArgs({...map,stops:[{...map.stops[0],latitude:400},map.stops[1]]},{start:10,end:15}),/coordinates/);
 assert.throws(()=>resolveRouteMapFunctionArgs({...map,routes:[{...map.routes[0],to:"unknown"}]},{start:10,end:15}),/endpoints/);
});
