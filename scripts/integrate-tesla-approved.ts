import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {bundle} from '@remotion/bundler';import {selectComposition,renderMedia} from '@remotion/renderer';
import {getMgTemplateProvider} from '../src/provider';
const out='D:/StoryClawRuns/tesla-a-mg3-score-20261022',old='D:/StoryClawRuns/tesla-a-v2-20261022',name='特斯拉发展故事_A原稿_20261020';
const {novelPaths}=await import('../../story-claw/utils/paths');
const ep=novelPaths.episodeDir(name,1),read=async(p:string)=>JSON.parse(await fs.readFile(p,'utf8'));
const calls=await read(novelPaths.mgFunctionCalls(name,1)),meta=await read('D:/StoryClawRuns/tesla-mg-shotcraft-v3-20261022/demo-timings.json');
const provider=getMgTemplateProvider(),timed=await read(novelPaths.articleTimeline(name,1));
for(const p of ['public/documentary-design-v3','renders','review','temp'])await fs.mkdir(out+'/'+p,{recursive:true});
await fs.cp(path.resolve('public/documentary-design-v3'),out+'/public/documentary-design-v3',{recursive:true});
const roadsterSource=old+'/temp/story-claw-provider-assets-wcqjOn/video-footage/sources/tesla-roadster-2008-jayleno-archive.mp4';
await promisify(execFile)('D:/软件下载/ffmpeg-7.1.1-full_build/ffmpeg-7.1.1-full_build/bin/ffmpeg.exe',['-y','-v','error','-ss','638.5','-i',roadsterSource,'-t','3','-vf','fps=24,scale=1280:720,setsar=1','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','18',out+'/public/roadster.mp4'],{windowsHide:true});
await fs.writeFile(out+'/review/roadster-inset-source.json',JSON.stringify({source:roadsterSource,sourceStart:638.5,sourceEnd:641.5,reason:'Previously unused footage interval; avoids repeating the 630–637.261s clip already present later in the episode'},null,2));
const specs:any[]=[];
const add=(label:string,startFrame:number,endFrame:number,name:string,args:any,children:any[]=[])=>{
 const clampFrameRounding=(v:any)=>{if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){if(k==='at'&&typeof x==='number'&&x<startFrame/24&&startFrame/24-x<1/24)v[k]=startFrame/24;else if(typeof x==='object')clampFrameRounding(x)}};clampFrameRounding(args);
 const resolved=provider.resolveCall({name,arguments:args,timing:{start:startFrame/24,end:endFrame/24}});
 const id=label==='timeline'?'progress-timeline::archive-rail::one':label;
 specs.push({label,startFrame,endFrame,name,arguments:args,episode:{width:1280,height:720,fps:24,durationFrames:endFrame-startFrame,layers:[],nodes:[{nodeId:id,htmlTag:resolved.htmlTag,group:args.group,videoPath:'',startFrame:0,endFrame:endFrame-startFrame,zIndex:0,render:resolved.render},...children]}});
};
const carStart=Math.round(meta.meta.carWindow.start*24);
add('timeline',1567,1733,'create_progress_timeline',{group:'archive-rail',order:null,title:'特斯拉成立',nodes:[{at:1567/24,year:'2003',title:'特斯拉正式成立'}]},[{nodeId:'roadster-window',parentNodeId:'progress-timeline::archive-rail::one',htmlTag:'video-footage',group:'full-bleed',videoPath:'roadster.mp4',startFrame:carStart,endFrame:166,zIndex:1}]);
const m=structuredClone(meta.mapArgs);for(const v of [...m.stops,...m.routes])v.at+=3423/24;
add('map',3423,3963,'create_route_map',m);
for(const [key,label,group]of [['side-by-side-comparison::split-panel::01','price','editorial-scale'],['side-by-side-comparison::split-panel::02','config','editorial-scale'],['directed-graph::flow::one','factory','production-chain']]){
 const r=calls.find((c:any)=>c.instanceKey===key);const a={...r.arguments,group,order:null};if(label==='factory')a.title='超级工厂 · 特斯拉 × 松下';add(label,r.startFrame,r.endFrame,r.name,a);
}
await fs.writeFile(out+'/review/production-mg-inputs.json',JSON.stringify(specs,null,2));
const serveUrl=await bundle({entryPoint:fileURLToPath(provider.runtimeEntryUrl),publicDir:out+'/public',outDir:out+'/runtime-bundle'});
const only=process.argv.find(a=>a.startsWith('--only='))?.split('=')[1];
for(const s of specs.filter(s=>!only||s.label===only)){const inputProps={episode:s.episode},composition=await selectComposition({serveUrl,id:'StoryClawMgEpisode',inputProps});console.log('RENDER_START '+s.label+' '+s.episode.durationFrames+' frames');await renderMedia({serveUrl,composition,inputProps,codec:'h264',muted:true,outputLocation:out+'/renders/'+s.label+'.mp4',concurrency:2,crf:18,x264Preset:'fast',pixelFormat:'yuv420p',logLevel:'warn'});console.log('RENDER_READY '+s.label)}
console.log('ALL_PRODUCTION_INSERTS_READY');
