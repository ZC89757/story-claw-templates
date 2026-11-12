import {execFile} from "node:child_process";
import {promisify} from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";
import {PORTRAIT_CATALOG} from "./catalog.js";
import {getReferenceProfile} from "./reference-profiles";
import {preparePortraitCapture,removePortraitTemporary} from "./capture";

const execute=promisify(execFile);
// Source module is src/portrait-mg/assets.ts; packaged Provider bundles it into src/provider.js.
const moduleDirectory=path.dirname(fileURLToPath(import.meta.url));
const packageRoot=path.resolve(moduleDirectory,path.basename(moduleDirectory)==="portrait-mg"?"../..":"..");
const imageExtensions=new Set([".png",".jpg",".jpeg",".webp",".avif",".bmp"]);
const videoExtensions=new Set([".mp4",".mov",".mkv",".webm",".m4v",".avi"]);
export type PortraitAssetContext={publicRoot:string;resolveImage:(source:string)=>Promise<string>;webSnapshotDirectory?:string};

/** Prepares only this instance's actual media intervals; never loops or freezes short video. */
export async function preparePortraitAssets(kind:string,spec:any,context:PortraitAssetContext):Promise<any> {
  const entry=PORTRAIT_CATALOG.find(e=>e.id===kind||e.htmlTag===kind);if(!entry)throw new Error(`Unknown portrait template: ${kind}`);
  const id=entry.id;const duration=Number(spec._duration);
  if(!Number.isFinite(duration)||duration<=0)throw new Error(`${id}: 缺少有效的 _duration 秒数`);
  let temporary:string|undefined;
  const temp=async()=>temporary??=await fs.mkdtemp(path.join(os.tmpdir(),"story-claw-portrait-assets-"));
  const fail=(label:string,message:string):never=>{throw new Error(`${id} ${label}: ${message}`)};
  const locate=async(source:string,label:string)=>{
    if(typeof source!=="string"||!source.trim())return fail(label,"素材路径不能为空");
    if(/^(?:https?:|data:|blob:)/i.test(source))return fail(label,"请提供已准备好的本地素材路径");
    if(source.startsWith("file:"))source=fileURLToPath(source);
    const absolute=path.isAbsolute(source);const relative=source.replace(/\\/g,"/").replace(/^\/+/,"");
    if(!absolute&&relative.split("/").includes(".."))return fail(label,"素材相对路径不能包含 ..");
    const candidates=absolute?[source]:[path.join(context.publicRoot,relative),path.join(packageRoot,"public",relative),path.resolve(source)];
    for(const candidate of candidates){const stat=await fs.stat(candidate).catch(()=>null);if(stat?.isFile())return {file:path.resolve(candidate),relative:!absolute&&relative.startsWith("portrait-mg/")?relative:null};}
    return fail(label,`找不到素材 ${source}`);
  };
  const probe=async(file:string,label:string)=>{
    try {const {stdout}=await execute(process.env.FFPROBE_PATH||"ffprobe",["-v","error","-select_streams","v:0","-show_entries","stream=codec_name,width,height,duration,nb_frames:format=format_name,duration","-of","json",file],{windowsHide:true,maxBuffer:1024*1024,timeout:30000});const info=JSON.parse(stdout);if(!info.streams?.[0]?.width)throw Error("no video/image stream");return info;}
    catch(e){return fail(label,`无法读取图像/视频: ${(e as Error).message}`);}
  };
  let serial=0;
  const image=async(source:string,label:string,alpha=false,crop=false)=>{
    const located=await locate(source,label);const extension=path.extname(located.file).toLowerCase();
    if(!imageExtensions.has(extension))return fail(label,"需要静态图片，不能把视频当成图片");
    const info=await probe(located.file,label);const stream=info.streams[0];
    const stillFormat=/(?:_pipe|image2)/.test(info.format?.format_name??"")||(extension===".avif"&&stream.codec_name==="av1"&&Number(stream.nb_frames)===1);
    if(!stillFormat||Number(stream.nb_frames)>1)return fail(label,"文件实际内容不是静态图片，不能仅更换扩展名");
    let file=located.file;
    if(alpha){
      if(extension!==".png")return fail(label,"透明主体必须为带有效 Alpha 的 PNG");
      let png:PNG;try{png=PNG.sync.read(await fs.readFile(file));}catch{return fail(label,"PNG 解码失败");}
      let min=255,max=0,x0=png.width,y0=png.height,x1=-1,y1=-1;
      for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){const a=png.data[(y*png.width+x)*4+3];min=Math.min(min,a);max=Math.max(max,a);if(a>0){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
      if(min>=250||max<20)return fail(label,"PNG 必须同时包含透明区域和可见主体，不能是全不透明或全透明图片");
      if(crop&&(x0>0||y0>0||x1<png.width-1||y1<png.height-1)){const out=new PNG({width:x1-x0+1,height:y1-y0+1});PNG.bitblt(png,out,x0,y0,out.width,out.height,0,0);file=path.join(await temp(),`crop-${serial++}.png`);await fs.writeFile(file,PNG.sync.write(out));}
    }
    return {file,source:file===located.file&&located.relative?located.relative:await context.resolveImage(file)};
  };
  const media=async(value:any,label:string,needed:number)=>{
    if(!Number.isFinite(needed)||needed<=0)return fail(label,"媒体可见区间必须大于零");
    if(value.sourceStart===null){value.source=(await image(value.source,label)).source;return;}
    if(typeof value.sourceStart!=="number"||!Number.isFinite(value.sourceStart)||value.sourceStart<0)return fail(label,"视频 sourceStart 必须为非负秒数；图片必须为 null");
    const located=await locate(value.source,label);if(!videoExtensions.has(path.extname(located.file).toLowerCase()))return fail(label,"sourceStart 为数字时必须提供视频文件");
    const info=await probe(located.file,label);const stream=info.streams[0];
    if(/(?:_pipe|image2|apng|gif)/.test(info.format?.format_name??""))return fail(label,"文件实际内容不是视频，不能仅更换扩展名");
    const length=Number(stream.duration??info.format?.duration);
    if(!Number.isFinite(length)||length+0.001<value.sourceStart+needed)return fail(label,`视频长度 ${length.toFixed(3)}s 不足，需要 [${value.sourceStart.toFixed(3)}, ${(value.sourceStart+needed).toFixed(3)}]s，禁止循环或冻帧补足`);
    if(located.relative){value.source=located.relative;return;}
    const output=path.join(await temp(),`clip-${serial++}.mp4`);
    // H.264 at source frame cadence, bounded to exactly the consumed interval; no tpad/loop.
    await execute(process.env.FFMPEG_PATH||"ffmpeg",["-v","error","-y","-ss",String(value.sourceStart),"-i",located.file,"-t",String(needed),"-map","0:v:0","-an","-vf","scale=trunc(iw/2)*2:trunc(ih/2)*2","-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",output],{windowsHide:true,maxBuffer:4*1024*1024,timeout:180000});
    const bytes=await fs.readFile(output);value.source=`data:video/mp4;base64,${bytes.toString("base64")}`;value.sourceStart=0;
  };
  const at=(value:any,label:string)=>{if(typeof value!=="number"||!Number.isFinite(value)||value<0||value>=duration)return fail(label,`at 必须在 [0, ${duration}) 秒内`);return value;};
  const playlist=async(items:any[],label:string)=>{for(let i=0;i<items.length;i++){const start=at(items[i].at,`${label}[${i}].at`);const end=i+1<items.length?at(items[i+1].at,`${label}[${i+1}].at`):duration;if(end<=start)return fail(label,"换镜时间必须严格递增");await media(items[i].media,`${label}[${i}].media`,end-start);}};
  try {
    const profile = getReferenceProfile(id);
    if (profile) {
      for (const [key, slot] of Object.entries(profile.slots)) {
        const value = spec[key];
        if (slot.type === "video") {
          const start = value.at ?? 0;
          const windows = profile.tracks.filter(track => track.slot === key);
          const stop = Math.max(...windows.map(track => {
            const end = track.until ? spec[track.until].at + (track.overlap ?? 0) : duration;
            return track.motion === "exit-down" ? Math.min(end, spec[track.from!].at + (track.seconds ?? .37)) : end;
          }));
          await media(value, key, Math.min(stop, duration) - start);
        } else if (slot.type === "image" || slot.type === "cutout") {
          value.source = (await image(value.source, key, slot.type === "cutout")).source;
        }
      }
      return spec;
    }
    switch(id){
      case "V01_001":await playlist(spec.upper,"upper");await media(spec.lower,"lower",duration);break;
      case "V01_002":await media(spec.background,"background",duration);await playlist(spec.clips,"clips");break;
      case "V01_006":for(const [i,panel]of spec.panels.entries())for(const [j,comment]of panel.comments.entries())if(comment.avatar!==null)comment.avatar=(await image(comment.avatar,`panels[${i}].comments[${j}].avatar`)).source;break;
      case "V04_002":case "V07_003":spec.capture=await preparePortraitCapture(id,spec,context);break;
      case "V05_002":await playlist(spec.clips,"clips");break;
      case "V10_005":spec.subject.image=(await image(spec.subject.image,"subject.image")).source;break;
      case "V12_001":spec.coverImage=(await image(spec.coverImage,"coverImage")).source;if(spec.body)spec.body.image=(await image(spec.body.image,"body.image")).source;break;
    }
    return spec;
  } finally {if(temporary)await removePortraitTemporary(temporary);}
}
