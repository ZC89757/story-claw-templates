import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {getMgTemplateProvider} from '../src/provider';
import {genericDemos} from '../src/documentary-generic/demos';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const host=path.resolve(root,'../story-claw');
const {generateImage}=await import(pathToFileURL(path.join(host,'utils/image-gen.ts')).href);
const {removeSolidBackground}=await import(pathToFileURL(path.join(host,'utils/remove-solid-background.ts')).href);
const out='D:/StoryClawRuns/generic-mg-review-20261023/source-proof';await fs.mkdir(out,{recursive:true});
const args=structuredClone(genericDemos[2].production);
args.stages[2].parts[0].source={method:'generate',image:null,prompt:'A small compact pile of roasted coffee beans, whole beans, clean three-quarter view',background:{transparent:true}} as any;
const provider=getMgTemplateProvider();const call=provider.resolveCall({name:'create_production_chain',arguments:args,timing:{start:0,end:10}});
const events:unknown[]=[];
await provider.prepareRuntimeAssets({layers:[{render:call.render} as never],resolveImage:async p=>p,
 generateImageFromReferences:async input=>{const output=path.join(out,createHash('sha256').update(input.cacheKey).digest('hex').slice(0,16)+'.png');events.push({action:'generate',output,prompt:input.prompt});try{await fs.access(output)}catch{await generateImage(input.prompt,output,[...input.references],input.aspectRatio)}return output},
 removeSolidBackground:async input=>{const output=path.join(out,'beans-transparent.png');events.push({action:'remove',color:input.backgroundColor,source:input.sourcePath,output});await removeSolidBackground(input.sourcePath,output,input.backgroundColor);return output}
});
await fs.writeFile(path.join(out,'execution.json'),JSON.stringify({arguments:args,events,render:call.render},null,2));
await fs.copyFile(path.join(out,'beans-transparent.png'),path.join(root,'public/generic-documentary/beans-generated.png'));
console.log('REAL_GENERATION_AND_CUTOUT_OK');
