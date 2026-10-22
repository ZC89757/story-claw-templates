/** Render Codex-authored arguments through the existing Story Claw Provider and formal renderer. */
import fs from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath,pathToFileURL} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const host=path.resolve(root,"../story-claw");
const runtime="D:/StoryClawByteDancePreview";
process.env.STORY_CLAW_WORK_DIR=runtime;
process.env.STORY_CLAW_APP_ROOT=host;
process.env.STORY_CLAW_MG_TEMPLATES_DIR=path.join(root,"build/mg-template-pack");
const name="字节跳动的发展与决策_20261015";
const episode=path.join(runtime,"workspace",name,"ep01");
const {locateMgInstances}=await import(pathToFileURL(path.join(host,"runner/mg/html.ts")).href);
const {mgProvider,resolveMgFunctionCall}=await import(pathToFileURL(path.join(host,"runner/mg/registry.ts")).href);
const {getMgAnnotationWindow}=await import(pathToFileURL(path.join(host,"runner/mg/timing.ts")).href);
const {reviewedTopologyErrors}=await import(pathToFileURL(path.join(host,"runner/mg/reviewed-topology.ts")).href);
const {renderVisualTagTemplateClip}=await import(pathToFileURL(path.join(host,"runner/mg/renderer.ts")).href);
const {assertMgVideoFrames}=await import(pathToFileURL(path.join(host,"runner/mg/media.ts")).href);
const article=await fs.readFile(path.join(episode,"原文_clean.txt"),"utf8");
const timeline=JSON.parse(await fs.readFile(path.join(episode,"article_timeline.json"),"utf8"));
const instances=locateMgInstances(await fs.readFile(path.join(episode,"mg_annotation_v5.html"),"utf8"),timeline,article);
const video={width:1280,height:720,fps:24,duration:840.672018,durationFrames:Math.ceil(840.672018*24)};
const windowFor=(instance:any):any=>{
  const own=getMgAnnotationWindow(instance.tags,instances,video);
  if(!instance.parentInstance)return own;
  const parent=windowFor(instances.get(instance.parentInstance));
  return {startFrame:Math.max(own.startFrame,parent.startFrame),endFrame:Math.min(own.endFrame,parent.endFrame)};
};
const inputFile=path.join(episode,"mg/codex_parameters.json");
const raw=JSON.parse(await fs.readFile(inputFile,"utf8"));
const validated=[];
for(const call of raw){
  const identity=mgProvider.identifyCall(call);
  const instance=instances.get(identity.instanceKey);
  if(!instance)throw new Error(`Unknown instance ${identity.instanceKey}`);
  if(!mgProvider.isToolAllowed({htmlTag:instance.tag,group:instance.group,name:call.name}))throw new Error("Tool/tag mismatch");
  const window=windowFor(instance);
  let resolved;
  try {resolved=resolveMgFunctionCall(call,{start:instance.tags[0].start,end:window.endFrame/video.fps});}
  catch(error){throw new Error(`${identity.instanceKey}: ${error instanceof Error?error.message:String(error)}`);}
  const errors=reviewedTopologyErrors(call.arguments,instance.graph);
  for(const tag of instance.tags)for(const at of [tag.start,...(tag.valueAnchors??[]).map((a:any)=>a.start)])
    if(!resolved.elementAts.some((event:number)=>Math.abs(event-at)<=0.35))errors.push(`Missing event at ${at}`);
  if(errors.length)throw new Error(`${identity.instanceKey}: ${errors.join("; ")}`);
  validated.push({call,instance,resolved,window});
}
await fs.writeFile(path.join(episode,"mg/codex_parameters_validation.json"),JSON.stringify({author:"Codex",validated:validated.length,totalInstances:instances.size,allPresent:validated.length===instances.size,sourceTextChanged:false},null,2));
console.log(`[Codex parameters] ${validated.length}/${instances.size} validated`);
if(!process.argv.includes("--render"))process.exit(0);
const checkpoint=path.join(episode,"mg/codex-render-checkpoints.json");
const completed:any[]=await fs.readFile(checkpoint,"utf8").then(JSON.parse).catch(()=>[]);
const sel={novelName:name,episode:1,aspectRatio:"16:9",articleType:"essay"};
for(const {call,instance,resolved,window}of validated){
  if(["sc-video","sc-longtake"].includes(instance.tag))continue;
  const signature=createHash("sha256").update(JSON.stringify({call,window})).digest("hex");
  const old=completed.find((c:any)=>c.instanceKey===instance.instanceKey&&c.signature===signature);
  const frames=window.endFrame-window.startFrame;
  if(old){try{await assertMgVideoFrames(old.videoPath,frames,video.fps);continue;}catch{}}
  const extension=resolved.layerRole==="overlay"?"mov":"mp4";
  const output=path.join(episode,"mg/offline-clips",`${instance.instanceKey.replaceAll(":","_")}_${signature.slice(0,12)}.${extension}`);
  await renderVisualTagTemplateClip(sel,instance.instanceKey,resolved.render,video.width,video.height,frames,video.fps,output);
  const record={instanceKey:instance.instanceKey,signature,videoPath:output,startFrame:window.startFrame,endFrame:window.endFrame,layerRole:resolved.layerRole,arguments:call.arguments,name:call.name};
  const existing=completed.findIndex((c:any)=>c.instanceKey===record.instanceKey);
  if(existing>=0)completed[existing]=record;else completed.push(record);
  await fs.writeFile(checkpoint,JSON.stringify(completed,null,2));
  console.log(`[Codex render] ${completed.length} completed: ${instance.instanceKey}`);
}
