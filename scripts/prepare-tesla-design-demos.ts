import fs from 'node:fs/promises';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {resolveProgressTimelineFunctionArgs} from '../src/progress-timeline/schema';
import {resolveSideBySideComparisonFunctionArgs} from '../src/weighted-comparison/schema';
import {resolveDirectedGraphFunctionArgs} from '../src/directed-graph/schema';
import {resolveRouteMapFunctionArgs} from '../src/route-map/schema';
const run=promisify(execFile),root='D:/StoryClawRuns/tesla-a-v2-20261022/workspace/特斯拉发展故事_A原稿_20261020/ep01',out='public/documentary-demos',ff='D:/软件下载/ffmpeg-7.1.1-full_build/ffmpeg-7.1.1-full_build/bin/ffmpeg.exe';
const calls=JSON.parse(await fs.readFile(root+'/mg/function_calls.json','utf8')),timeline=JSON.parse(await fs.readFile(root+'/article_timeline.json','utf8')) as {char:string;start:number;end:number}[];
const find=(s:string,min:number)=>{const a=timeline.filter(c=>c.start>=min),i=a.map(c=>c.char).join('').indexOf(s);if(i<0)throw new Error('Missing timeline '+s);return a[i].start};
await fs.mkdir(out,{recursive:true});
const record=(key:string)=>calls.find((c:any)=>c.instanceKey===key);
const audio=async(name:string,start:number,duration:number)=>run(ff,['-y','-v','error','-ss',String(start),'-i',root+'/ep01_aligned_audio.wav','-t',String(duration),'-ar','48000','-ac','1','-c:a','pcm_s16le',out+'/'+name+'.wav'],{windowsHide:true});
const timelineStart=1567/24,timelineEnd=1733/24,timelineLength=timelineEnd-timelineStart;
const carFromFrame=Math.round((find('第一款车',timelineStart)-timelineStart)*30),carToFrame=Math.round(timelineLength*30);
await audio('timeline',timelineStart,timelineLength);
await run(ff,['-y','-v','error','-i','D:/StoryClawRuns/tesla-a-v2-20261022/prepared/footage-28.mp4','-t',String(timelineLength+.05),'-c:v','libx264','-threads','2','-preset','fast','-crf','19','-an','-movflags','+faststart',out+'/roadster.mp4'],{windowsHide:true});
const documentaryTimelineSpec=resolveProgressTimelineFunctionArgs({group:'archive-rail',order:null,title:'特斯拉成立',nodes:[{at:0,year:'2003',title:'特斯拉正式成立'}]},{start:0,end:timelineLength}).spec;
const price=record('side-by-side-comparison::split-panel::01'),config=record('side-by-side-comparison::split-panel::02'),factory=record('directed-graph::flow::one');
const locals=(r:any,start=r.startFrame/24)=>({...r.arguments,group:'editorial-scale',order:null,items:r.arguments.items.map((v:any)=>({...v,at:Math.max(0,v.at-start)})),highlights:r.arguments.highlights.map((v:any)=>({...v,at:Math.max(0,v.at-start)}))});
const priceLength=(price.endFrame-price.startFrame)/24,configLength=(config.endFrame-config.startFrame)/24;
const documentaryPriceSpec=resolveSideBySideComparisonFunctionArgs(locals(price),{start:0,end:priceLength}).spec;
const documentaryConfigSpec=resolveSideBySideComparisonFunctionArgs(locals(config),{start:0,end:configLength}).spec;
await audio('price',price.startFrame/24,priceLength);await audio('config',config.startFrame/24,configLength);
const factoryStart=factory.arguments.nodes[0].at-.35,factoryLength=factory.endFrame/24-factoryStart;
const documentaryFactorySpec=resolveDirectedGraphFunctionArgs({...factory.arguments,title:'超级工厂 · 特斯拉 × 松下',group:'production-chain',order:null,nodes:factory.arguments.nodes.map((v:any)=>({...v,at:v.at-factoryStart})),edges:factory.arguments.edges.map((v:any)=>({...v,at:v.at-factoryStart}))},{start:0,end:factoryLength}).spec;
await audio('factory',factoryStart,factoryLength);
const mapStart=3423/24,mapEnd=3963/24,mapLength=mapEnd-mapStart,at=(s:string)=>find(s,mapStart)-mapStart;
const mapArgs={group:'supply-chain',order:null,title:'一辆 Roadster，跨越多个国家',stops:[
 {id:'jp',label:'日本',detail:'电芯',longitude:139.7,latitude:35.6,at:at('日本')},
 {id:'th',label:'泰国',detail:'电池组装',longitude:100.5,latitude:13.75,at:at('泰国')},
 {id:'uk',label:'英国',detail:'车体配合',longitude:-1.1,latitude:52,at:at('英国')},
 {id:'fr',label:'法国',detail:'车身面板',longitude:2.35,latitude:48.8,at:at('法国')},
 {id:'atlantic',label:'大西洋',detail:'',longitude:-35,latitude:31,at:at('大西洋')},
 {id:'panama',label:'巴拿马运河',detail:'',longitude:-79.9,latitude:9,at:at('巴拿马运河')},
 {id:'us',label:'美国',detail:'最终装配',longitude:-122.1,latitude:37.4,at:at('美国')},
],routes:[
 {from:'jp',to:'th',at:at('泰国'),waypoints:[]},
 {from:'th',to:'uk',at:at('英国'),waypoints:[]},
 {from:'fr',to:'uk',at:at('法国'),waypoints:[]},
 {from:'uk',to:'atlantic',at:at('大西洋'),waypoints:[]},
 {from:'atlantic',to:'panama',at:at('巴拿马运河'),waypoints:[{longitude:-60,latitude:23},{longitude:-74,latitude:15}]},
 {from:'panama',to:'us',at:at('美国'),waypoints:[{longitude:-84,latitude:5},{longitude:-107,latitude:20}]}
]};
const documentaryMapSpec=resolveRouteMapFunctionArgs(mapArgs,{start:0,end:mapLength}).spec;await audio('map',mapStart,mapLength);
const specs={documentaryTimelineSpec,documentaryPriceSpec,documentaryConfigSpec,documentaryFactorySpec,documentaryMapSpec};
const types={documentaryTimelineSpec:'ProgressTimelineSpec',documentaryPriceSpec:'SideBySideComparisonSpec',documentaryConfigSpec:'SideBySideComparisonSpec',documentaryFactorySpec:'DirectedGraphSpec',documentaryMapSpec:'RouteMapSpec'};
const header='// Prepared from the Tesla A original narration; every preview uses the production component.\nimport type {ProgressTimelineSpec} from "./progress-timeline/types";\nimport type {SideBySideComparisonSpec} from "./weighted-comparison/types";\nimport type {DirectedGraphSpec} from "./directed-graph/types";\nimport type {RouteMapSpec} from "./route-map/schema";\n';
const meta={carFromFrame,carDurationFrames:carToFrame-carFromFrame,carWindow:{start:carFromFrame/30,end:carToFrame/30},durations:{'documentary-timeline':Math.ceil((timelineLength+1.2)*30),'documentary-price':Math.ceil(priceLength*30),'documentary-config':Math.ceil(configLength*30),'documentary-factory':Math.ceil(factoryLength*30),'documentary-map':Math.ceil(mapLength*30)}};
await fs.writeFile('src/documentary-previews.ts',header+Object.entries(specs).map(([k,v])=>'export const '+k+': '+types[k as keyof typeof types]+' = '+JSON.stringify(v,null,2)+';').join('\n')+'\nexport const documentaryDemoMeta = '+JSON.stringify(meta,null,2)+' as const;\n');
const delivery=process.argv[2]??'D:/StoryClawRuns/tesla-mg-shotcraft-v3-20261022';await fs.mkdir(delivery,{recursive:true});
await fs.writeFile(delivery+'/demo-timings.json',JSON.stringify({meta,sourceRanges:{timeline:[timelineStart,timelineEnd],price:[price.startFrame/24,price.endFrame/24],config:[config.startFrame/24,config.endFrame/24],factory:[factoryStart,factory.endFrame/24],map:[mapStart,mapEnd]},mapArgs},null,2));
console.log('Narrated demo assets and typed specs ready',meta);
