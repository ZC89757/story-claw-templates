import path from 'node:path';
import fs from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
const out='D:/StoryClawRuns/tesla-mg-shotcraft-v3-20261022';
await fs.mkdir(out+'/qa',{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('runtime/preview-entry.tsx'),publicDir:path.resolve('public'),outDir:out+'/preview-bundle'});
const samples:[string,string,number[]][]=[['documentary-timeline','archive-rail',[30,90,150,225]],['documentary-price','editorial-scale',[100,310]],['documentary-config','editorial-scale',[170]],['documentary-factory','production-chain',[45,155,190]],['documentary-map','supply-chain',[180,345,635]]];
for(const [previewKind,style,frames]of samples){
 const inputProps={previewKind,style},composition=await selectComposition({serveUrl,id:'MgStylePreview',inputProps});
 for(const frame of frames){await renderStill({serveUrl,composition,inputProps,frame,output:out+'/qa/'+previewKind+'-'+frame+'.png',imageFormat:'png',logLevel:'warn'});console.log('FRAME_READY',previewKind,frame)}
}
await fs.writeFile(out+'/qa/frames.json',JSON.stringify(samples));
