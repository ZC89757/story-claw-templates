import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia} from '@remotion/renderer';
import {getMgTemplateProvider} from '../src/provider';
const run=promisify(execFile),out='D:/StoryClawRuns/tesla-a-timeline-v4-20261022',previous='D:/StoryClawRuns/tesla-a-mg3-score-20261022';
const ff='D:/软件下载/ffmpeg-7.1.1-full_build/ffmpeg-7.1.1-full_build/bin/ffmpeg.exe';
const events=JSON.parse(await fs.readFile(out+'/review/timeline-events.json','utf8'));
const first=events[0].startFrame,last=events.at(-1).endFrame;
const provider=getMgTemplateProvider(),args={group:'archive-rail',order:null,title:'特斯拉发展历程',nodes:events.map((e:any)=>({at:e.startFrame/24,year:e.year,title:e.title}))};
const resolved=provider.resolveCall({name:'create_progress_timeline',arguments:args,timing:{start:first/24,end:last/24}});
const parentId='progress-timeline::archive-rail::one';
const nodes:any[]=[{nodeId:parentId,htmlTag:'progress-timeline',group:'archive-rail',videoPath:'',startFrame:0,endFrame:last-first,zIndex:0,render:resolved.render,activeWindows:events.map((e:any)=>({startFrame:e.startFrame-first,endFrame:e.endFrame-first}))}];
for(const e of events){if(e.mediaStart===null)continue;
 const file=e.id+'.mp4',mediaFrame=e.startFrame+e.mediaStart,count=e.endFrame-mediaFrame;
 if(e===events[0])await fs.copyFile(previous+'/public/roadster.mp4',out+'/public/'+file);
 else {
 const isFlight=e.id==='year-2026-11';
 const source=isFlight?'D:/StoryClawRuns/tesla-a-v2-20261022/temp/story-claw-provider-assets-wcqjOn/video-footage/sources/tesla-roadster-2026-official-flight.mp4':previous+'/visual-master.mov';
 await run(ff,['-y','-v','error','-ss',String(isFlight?33:mediaFrame/24),'-i',source,'-t',String(count/24),'-an','-vf','fps=24,scale=1280:720,setsar=1','-c:v','libx264','-threads','2','-preset','veryfast','-crf','18',out+'/public/'+file],{windowsHide:true});
 if(isFlight)await fs.writeFile(out+'/review/roadster-inset-source.json',JSON.stringify({source,start:33,end:33+count/24,provenance:'https://x.com/Tesla/status/2110926164306931860',reason:'Unused interval showing the actual flying Roadster; avoids static Cybercab stage shot at 27s'},null,2));
 }
 nodes.push({nodeId:e.id+'-footage',parentNodeId:parentId,htmlTag:'video-footage',group:'full-bleed',videoPath:file,startFrame:mediaFrame-first,endFrame:e.endFrame-first,zIndex:1});
}
const episode={width:1280,height:720,fps:24,durationFrames:last-first,layers:[],nodes};
await fs.writeFile(out+'/review/timeline-function-call.json',JSON.stringify({name:'create_progress_timeline',arguments:args,timing:{start:first/24,end:last/24},mode:'split'},null,2));
await fs.writeFile(out+'/review/timeline-runtime.json',JSON.stringify(episode,null,2));
const serveUrl=await bundle({entryPoint:fileURLToPath(provider.runtimeEntryUrl),publicDir:out+'/public',outDir:out+'/runtime-bundle'}),inputProps={episode};
const composition=await selectComposition({serveUrl,id:'StoryClawMgEpisode',inputProps});
for(const e of events){console.log('TIMELINE_RENDER '+e.id);await renderMedia({serveUrl,composition,inputProps,frameRange:[e.startFrame-first,e.endFrame-first-1],codec:'h264',muted:true,outputLocation:out+'/renders/'+e.id+'.mp4',concurrency:2,crf:18,x264Preset:'fast',pixelFormat:'yuv420p',logLevel:'warn'});console.log('TIMELINE_READY '+e.id)}
