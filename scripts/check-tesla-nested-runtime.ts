import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import {getMgTemplateProvider} from '../src/provider';
import type {MgRuntimeEpisodeInput} from '../src/runtime';
const out='D:/StoryClawRuns/tesla-mg-shotcraft-v3-20261022';
const render=getMgTemplateProvider().resolveCall({name:'create_progress_timeline',timing:{start:0,end:244/30},arguments:{group:'archive-rail',order:null,title:'特斯拉成立',nodes:[{at:0,year:'2003',title:'特斯拉正式成立'}]}}).render;
const episode:MgRuntimeEpisodeInput={width:1280,height:720,fps:30,durationFrames:244,layers:[],nodes:[{nodeId:'progress-timeline::archive-rail::one',htmlTag:'progress-timeline',group:'archive-rail',videoPath:'',startFrame:0,endFrame:244,zIndex:0,render},{nodeId:'video-footage::full-bleed::one',parentNodeId:'progress-timeline::archive-rail::one',htmlTag:'video-footage',group:'full-bleed',videoPath:'documentary-demos/roadster.mp4',startFrame:119,endFrame:207,zIndex:1}]};
const serveUrl=await bundle({entryPoint:path.resolve('runtime/render-entry.tsx'),publicDir:path.resolve('public'),outDir:out+'/runtime-bundle'});
const inputProps={episode},composition=await selectComposition({serveUrl,id:'StoryClawMgEpisode',inputProps});
for(const frame of [90,150,225]){await renderStill({serveUrl,composition,inputProps,frame,output:out+'/qa/runtime-nested-'+frame+'.png',imageFormat:'png',logLevel:'warn'});console.log('RUNTIME_FRAME_READY',frame)}
