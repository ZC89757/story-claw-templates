import test from "node:test";
import assert from "node:assert/strict";
import {getMgTemplateProvider} from "../src/provider";
import {imageGraphPreviewArgs,imageComparisonPreviewArgs} from "../src/explainer-previews";
import {editorialGraphCamera,editorialGraphLayout} from "../src/image-directed-graph/EditorialGraphTemplate";
const provider=getMgTemplateProvider();
test("editorial metric group preserves every independently timed quantity",()=>{
 const args={group:"editorial-ledger",order:null,title:"不同口径的统计",points:[{label:"上传",value:"超过55亿条",at:1},{label:"观看",value:"超过13万亿次",at:4},{label:"折算日均上传",value:"超过1500万条",at:7}]};
 const resolved=provider.resolveCall({name:"create_metric_timeline",arguments:args,timing:{start:0,end:12}});
 assert.deepEqual((resolved.render.spec as any).points.map((p:any)=>[p.label,p.value,p.at]),args.points.map(p=>[p.label,p.value,p.at]));
 assert.equal(resolved.group,"editorial-ledger");
});
test("editorial groups reuse existing function parameter shapes and preserve old specs",()=>{
 for(const [name,args,groups] of [["create_image_directed_graph",imageGraphPreviewArgs,["editorial","editorial-paper"]],["create_image_comparison",imageComparisonPreviewArgs,["editorial-paper"]]] as const){
  const old=provider.resolveCall({name,arguments:args,timing:{start:0,end:12}});
  for(const group of groups){const next=provider.resolveCall({name,arguments:{...args,group},timing:{start:0,end:12}});assert.deepEqual(next.render.spec,old.render.spec);assert.equal(next.group,group);}
 }
});
test("editorial camera fits introduced nodes and is deterministic",()=>{
 const layer=provider.resolveCall({name:"create_image_directed_graph",arguments:{...imageGraphPreviewArgs,group:"editorial"},timing:{start:0,end:12}});
 const spec=layer.render.spec as any;const layout=editorialGraphLayout(spec);
 for(const t of [0,2.7,4.7,9]){
  const camera=editorialGraphCamera(spec,layout,t);
  assert.deepEqual(camera,editorialGraphCamera(spec,layout,t));
  for(const n of spec.nodes.filter((n:any)=>n.at<=t)){const p=layout.node(n.id);assert.ok((p.x-180)*camera.scale+camera.x>=50);assert.ok((p.x+180)*camera.scale+camera.x<=1870);}
 }
});
test("editorial branches keep all contributors inside the content window",()=>{
 const spec:any={title:"Contributors",nodes:Array.from({length:5},(_,i)=>({id:`n${i}`,label:`N${i}`,at:i})),edges:Array.from({length:4},(_,i)=>({from:`n${i}`,to:"n4",relation:"contributes",at:4}))};
 const graph=editorialGraphLayout(spec),camera=editorialGraphCamera(spec,graph,9);
 for(const n of spec.nodes){const p=graph.node(n.id);assert.ok((p.x-180)*camera.scale+camera.x>=50);assert.ok((p.x+180)*camera.scale+camera.x<=1870);assert.ok((p.y-p.height/2)*camera.scale+camera.y>=135);assert.ok((p.y+p.height/2)*camera.scale+camera.y<=925);}
});
test("independent editorial objects form a readable horizontal row",()=>{
 const spec:any={title:"Independent investments",nodes:Array.from({length:3},(_,i)=>({id:`n${i}`,label:`N${i}`,at:i})),edges:[]};
 const graph=editorialGraphLayout(spec);
 assert.equal(graph.node("n0").y,graph.node("n2").y);
 assert.ok(graph.node("n0").x<graph.node("n1").x&&graph.node("n1").x<graph.node("n2").x);
});
