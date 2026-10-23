import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {bundle} from "@remotion/bundler";
import {selectComposition, renderMedia, renderStill} from "@remotion/renderer";
import {getMgTemplateProvider} from "../src/provider";
import {genericDemos} from "../src/documentary-generic/demos";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const dest=path.resolve(process.argv.find(s=>s.startsWith("--out="))?.slice(6)??path.join(root,"out/generic-documentary"));
const stillOnly=process.argv.includes("--stills");
const provider=getMgTemplateProvider();
await fs.mkdir(dest,{recursive:true});
await fs.mkdir(path.join(dest,"public/assets"),{recursive:true});
await fs.mkdir(path.join(dest,"review"),{recursive:true});
const prepared=async (absolute:string)=>{
  const bytes=await fs.readFile(absolute),file=createHash("sha256").update(bytes).digest("hex").slice(0,16)+path.extname(absolute);
  await fs.writeFile(path.join(dest,"public/assets",file),bytes);
  return `assets/${file}`;
};
const episodes=[];
for(const demo of genericDemos){
  const calls=[
    provider.resolveCall({name:"create_production_chain",arguments:structuredClone(demo.production),timing:{start:0,end:10}}),
    provider.resolveCall({name:"create_numeric_comparison",arguments:{...structuredClone(demo.numeric),left:{...demo.numeric.left,at:10},right:{...demo.numeric.right,at:13}},timing:{start:10,end:18}}),
  ];
  const nodes=calls.map((c,i)=>({nodeId:`${demo.id}-${i}`,htmlTag:c.htmlTag,group:c.group,startFrame:i*240,endFrame:i===0?240:432,videoPath:"",render:c.render,zIndex:0}));
  await provider.prepareRuntimeAssets({layers:nodes.map(n=>({render:n.render} as never)),resolveImage:prepared});
  const episode={width:1280,height:720,fps:24,durationFrames:432,layers:[],nodes};
  await fs.writeFile(path.join(dest,"review",demo.id+"-inputs.json"),JSON.stringify({demo,functions:calls,episode},null,2));
  episodes.push({demo,episode});
}
const serveUrl=await bundle({entryPoint:fileURLToPath(provider.runtimeEntryUrl),publicDir:path.join(dest,"public"),outDir:path.join(dest,"runtime-bundle")});
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE;
for(const {demo,episode} of episodes){
  const inputProps={episode},composition=await selectComposition({serveUrl,id:"StoryClawMgEpisode",inputProps,browserExecutable});
  for(const [name,frame] of [["intro",48],["flow",210],["compare",380]] as const){
    await renderStill({serveUrl,composition,inputProps,frame,output:path.join(dest,"review",`${demo.id}-${name}.png`),browserExecutable});
  }
  console.log(`STILLS_READY ${demo.id}`);
  if(!stillOnly){
    await renderMedia({serveUrl,composition,inputProps,codec:"h264",outputLocation:path.join(dest,`${demo.id}.mp4`),browserExecutable,concurrency:2,crf:18,x264Preset:"fast",pixelFormat:"yuv420p",logLevel:"warn"});
    console.log(`VIDEO_READY ${demo.id}`);
  }
}
const cards=genericDemos.map((d,i)=>`<article><header><span>0${i+1}</span><h2>${d.title}</h2></header><video controls playsinline preload="metadata" poster="review/${d.id}-flow.png?v=2" src="${d.id}.mp4?v=2"></video><div class="actions"><button onclick="jump(this,0)">看分工流程</button><button onclick="jump(this,6.8)">看部件融合</button><button onclick="jump(this,10)">看数值比较</button><a href="${d.id}.mp4" download>下载 MP4</a></div><p>${d.note}</p></article>`).join("");
await fs.writeFile(path.join(dest,"index.html"),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>通用 MG · 三题材评审</title><style>*{box-sizing:border-box}body{margin:0;background:#e5ebee;color:#192c38;font-family:"Microsoft YaHei",sans-serif}main{max-width:1300px;margin:55px auto;padding:0 30px}h1{font-size:36px;margin-bottom:12px}.lead{color:#5c7484;font-size:17px;line-height:1.8}article{margin:36px 0;background:#f6f9fb;border:1px solid #bccbd4;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px #233f5012}header{display:flex;align-items:center;gap:15px;padding:16px 24px}header span{color:#c42839;font-size:24px;font-weight:bold}h2{font-size:23px;margin:0}video{display:block;width:100%;aspect-ratio:16/9;background:#dae4ea}.actions{display:flex;gap:12px;padding:20px 24px 0}button,a{font:inherit;padding:10px 16px;border:1px solid #a5b8c4;border-radius:8px;color:#192c38;background:white;text-decoration:none;cursor:pointer}p{padding:0 24px 16px;line-height:1.7;color:#5c7484}code{font-size:14px}</style><main><h1>同一套设计，三个题材 · 参数执行版</h1><div class="lead">保留银灰舞台、蓝红配色、立体陈列与渐进揭示。每段 18 秒：前 10 秒看分工，后 8 秒看比较。<br>三段共用正式组件。部件在 7.05 秒出现、8.4 秒开始融合；咖啡部件已实际通过生图与抠图服务生成。本次为无口播的动画评审；等你确认后再继续完整流程。</div>${cards}</main><script>function jump(b,t){let v=b.closest('article').querySelector('video');v.currentTime=t;v.play()}document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>document.querySelectorAll('video').forEach(o=>{if(o!==v)o.pause()})))</script></html>`);
console.log(`REVIEW_READY ${path.join(dest,"index.html")}`);
