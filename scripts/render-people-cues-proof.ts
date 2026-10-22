import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {bundle} from "@remotion/bundler";
import {renderMedia,renderStill,selectComposition} from "@remotion/renderer";
import {getMgTemplateProvider} from "../src/provider";
import type {MgRuntimeEpisodeInput,MgRuntimeLayer} from "../src/runtime";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const landscape=process.argv.includes("--landscape"),force=process.argv.includes("--force");
const output=path.join("C:/Users/ZhangChi/Desktop/特斯拉_A版细化_20261020",landscape?"横屏版":"");
const groups=landscape?{plate:"company-landscape",founders:"duo-landscape",partnership:"pop-landscape",quote:"landscape"}:{plate:"company",founders:"duo",partnership:"pop",quote:"portrait"};
await fs.mkdir(output,{recursive:true});
const demo=JSON.parse(await fs.readFile(path.join(root,"public/people-cues/demo-specs.json"),"utf8"));
const provider=getMgTemplateProvider();
const resolve=(name:string,args:Record<string,unknown>,duration:number)=>provider.resolveCall({name,arguments:args,timing:{start:0,end:duration}});
const items=(key:string)=>demo[key].spec.items.map(({at,label,source}:any)=>({at,label,source}));
const calls={
  plate:resolve("create_image_plate",{group:groups.plate,order:null,...demo.founders.plate},demo.founders.duration),
  founders:resolve("create_cutout_cues",{group:groups.founders,order:null,items:items("founders")},demo.founders.duration),
  partnership:resolve("create_cutout_cues",{group:groups.partnership,order:null,items:items("partnership")},demo.partnership.duration),
  quote:resolve("create_speaker_quote",{group:groups.quote,order:null,speaker:demo.quote.spec.speaker,portrait:demo.quote.spec.portrait,quotation:demo.quote.spec.quotation,characters:demo.quote.spec.characters},demo.quote.duration),
};
const native=(render:MgRuntimeLayer,key:string,frames:number,parentNodeId?:string)=>({nodeId:key,videoPath:"",startFrame:0,endFrame:frames,zIndex:parentNodeId?1:0,render,htmlTag:render.kind,layerRole:render.layerRole,...(parentNodeId?{parentNodeId}:{})});
const episode=(key:string):MgRuntimeEpisodeInput=>{
  const frames=Math.ceil(demo[key].duration*24),base={width:landscape?1920:720,height:landscape?1080:1280,fps:24,durationFrames:frames};
  if(key==="founders")return {...base,nodes:[native(calls.plate.render,"company",frames),native(calls.founders.render,"founders",frames,"company")]};
  if(key==="partnership")return {...base,nodes:[{nodeId:"footage",htmlTag:"video-footage",videoPath:"people-cues/partnership-footage.mp4",startFrame:0,endFrame:frames,zIndex:0,layerRole:"scene"},native(calls.partnership.render,"logos",frames,"footage")]};
  return {...base,nodes:[native(calls.quote.render,"quote",frames)]};
};
const serveUrl=await bundle({entryPoint:path.join(root,"runtime/render-entry.tsx"),publicDir:path.join(root,"public")});
const ffmpeg="C:/Users/ZhangChi/Desktop/改写漫剧/story-claw/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe";
const ffprobe="C:/Users/ZhangChi/Desktop/改写漫剧/story-claw/node_modules/@ffprobe-installer/win32-x64/ffprobe.exe";
const names={founders:"01_创始人左右点名",partnership:"02_真实视频叠加Logo",quote:"03_名人说逐字观点"};
const results=[];
for(const key of ["founders","partnership","quote"] as const) {
  const value=episode(key),inputProps={episode:value};
  const composition=await selectComposition({serveUrl,id:"StoryClawMgEpisode",inputProps});
  const raw=path.join(output,`${names[key]}_原始.mp4`),final=path.join(output,`${names[key]}.mp4`);
  console.log(`[people-proof] rendering ${key} through formal StoryClawMgEpisode`);
  if(force||!await fs.stat(raw).then(s=>s.size>1000).catch(()=>false)) await renderMedia({serveUrl,composition,inputProps,outputLocation:raw,codec:"h264",crf:20,x264Preset:"veryfast",logLevel:"warn",concurrency:2});
  const probe=JSON.parse(execFileSync(ffprobe,["-v","error","-show_streams","-of","json",raw],{encoding:"utf8"}));
  const hasAudio=probe.streams.some((s:any)=>s.codec_type==="audio");
  execFileSync(ffmpeg,["-v","error","-y","-i",raw,"-i",path.join(root,`public/people-cues/${key}.wav`),...(hasAudio?["-filter_complex","[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=0,volume=2,apad[a]","-map","0:v:0","-map","[a]"]:["-map","0:v:0","-map","1:a:0","-af","apad"]),"-c:v","copy","-c:a","aac","-shortest","-movflags","+faststart",final]);
  const frames=key==="founders"?[Math.floor(4.0*24),Math.floor(4.7*24),Math.floor(6.5*24)]:key==="partnership"?[Math.floor(5*24),Math.floor(10.6*24)]:[Math.floor(2.0*24),Math.floor(5.9*24)];
  for(const frame of frames)await renderStill({serveUrl,composition,inputProps,frame,output:path.join(output,`${key}-${frame}.png`),imageFormat:"png",logLevel:"warn"});
  results.push({key,output:final,episode:value});
}
await fs.writeFile(path.join(output,"模板参数示例.json"),JSON.stringify({timingNote:"Demo uses local Windows SAPI word boundaries; characters within a word are subdivided. Production characters must come from the real Story Claw article timeline.",calls,demos:results},null,2),"utf8");
console.log(JSON.stringify({output,demos:results.map(r=>({key:r.key,output:r.output}))}));
