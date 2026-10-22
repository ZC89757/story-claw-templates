import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const host=path.resolve(root,"../story-claw");
const runtime="D:/StoryClawByteDancePreview";
process.env.STORY_CLAW_WORK_DIR=runtime;
process.env.STORY_CLAW_APP_ROOT=host;
process.env.STORY_CLAW_MG_TEMPLATES_DIR=path.join(root,"build/mg-template-pack");
const episode=path.join(runtime,"workspace/字节跳动的发展与决策_20261015/ep01");
const {locateMgInstances,validateMgAnnotationHtml}=await import(pathToFileURL(path.join(host,"runner/mg/html.ts")).href);
const {mgProvider}=await import(pathToFileURL(path.join(host,"runner/mg/registry.ts")).href);
const html=await fs.readFile(path.join(episode,"mg_annotation_v5.html"),"utf8");
const article=await fs.readFile(path.join(episode,"原文_clean.txt"),"utf8");
const timeline=JSON.parse(await fs.readFile(path.join(episode,"article_timeline.json"),"utf8"));
validateMgAnnotationHtml(html,article);
const instances=[...locateMgInstances(html,timeline,article).values()];
const rows=instances.map((instance:any,index:number)=>({index,key:instance.instanceKey,tag:instance.tag,group:instance.group,order:instance.order??null,
  parent:instance.parentInstance??null,mode:instance.mode,start:instance.tags[0].start,end:instance.tags.at(-1).end,
  text:instance.tags.map((tag:any)=>tag.text).join(""),anchors:instance.tags.flatMap((tag:any)=>tag.valueAnchors??[]),graph:instance.graph??null}));
const tools=mgProvider.getPlanningTools([...new Set(instances.map((i:any)=>i.tag))]);
await fs.writeFile(path.join(runtime,"byte-offline-inputs.json"),JSON.stringify(rows,null,2));
await fs.writeFile(path.join(runtime,"byte-offline-schemas.json"),JSON.stringify(tools.map(({name,parameters}:any)=>({name,parameters})),null,2));
console.log(JSON.stringify({instances:rows.length,tools:tools.map((t:any)=>t.name)}));
