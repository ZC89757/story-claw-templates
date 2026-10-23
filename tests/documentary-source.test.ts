import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {PNG} from 'pngjs';
import {prepareDocumentaryImages} from '../src/documentary-generic/assets';
import {readSource} from '../src/documentary-generic/source';
import {genericDemos} from '../src/documentary-generic/demos';
import {resolveProduction} from '../src/documentary-generic/schema';
import {getMgTemplateProvider} from '../src/provider';
const root=path.resolve('public');
const fixture=async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'documentary-test-'));const png=new PNG({width:20,height:20});for(let y=0;y<20;y++)for(let x=0;x<20;x++){const i=(y*20+x)*4,inside=x>4&&x<15&&y>4&&y<15;png.data[i]=inside?200:0;png.data[i+1]=inside?40:255;png.data[i+2]=40;png.data[i+3]=255;}const solid=path.join(dir,'solid.png'),cut=path.join(dir,'cut.png');await fs.writeFile(solid,PNG.sync.write(png));for(let y=0;y<20;y++)for(let x=0;x<20;x++)if(x<=4||x>=15||y<=4||y>=15)png.data[(y*20+x)*4+3]=0;await fs.writeFile(cut,PNG.sync.write(png));return {dir,solid,cut};};
test('source actions reject ambiguous combinations and old mode',()=>{
 assert.throws(()=>readSource({method:'generate',image:'a.png',prompt:'beans',background:{transparent:true}}));
 assert.throws(()=>readSource({method:'existing',image:'a.png',prompt:null,background:{transparent:'true'}}));
 assert.throws(()=>readSource({mode:'transparent',image:'a.png',prompt:null}));
});
test('generate and transparency independently drive services; existing transparent bypasses both',async()=>{
 const f=await fixture();try{
 const calls:string[]=[];const services={generateImageFromReferences:async()=>{calls.push('generate');return f.solid},removeSolidBackground:async(i:any)=>{calls.push('remove:'+i.backgroundColor);return f.cut}};
 const generated=readSource({method:'generate',image:null,prompt:'coffee',background:{transparent:true}});
 assert.deepEqual(await prepareDocumentaryImages([generated],async p=>p,root,services),[f.cut]);assert.deepEqual(calls,['generate','remove:#00ff28']);
 calls.length=0;await prepareDocumentaryImages([{...generated,background:{transparent:false}}],async p=>p,root,services);assert.deepEqual(calls,['generate']);
 calls.length=0;await prepareDocumentaryImages([readSource({method:'existing',image:f.cut,prompt:null,background:{transparent:true}})],async p=>p,root,services);assert.deepEqual(calls,[]);
 await prepareDocumentaryImages([readSource({method:'existing',image:f.solid,prompt:null,background:{transparent:true}})],async p=>p,root,services);assert.deepEqual(calls,['remove:#00ff28']);
 await assert.rejects(prepareDocumentaryImages([generated],async p=>p,root,{...services,removeSolidBackground:async()=>f.solid}),/valid transparent/);
 await assert.rejects(prepareDocumentaryImages([generated],async p=>p,root,{}),/GENERATION_UNAVAILABLE/);
 }finally{await fs.rm(f.dir,{recursive:true,force:true})}
});
test('parts timing is absolute in calls and local once in render; rejects events that cannot be seen',()=>{
 const args=structuredClone(genericDemos[0].production);args.stages.forEach(s=>{s.at+=100;s.parts.forEach(p=>{p.appearAt+=100;p.mergeAt+=100})});args.links.forEach(l=>l.at+=100);
 const c=getMgTemplateProvider().resolveCall({name:'create_production_chain',arguments:args,timing:{start:100,end:110}});
 assert.ok(c.elementAts.includes(107.05));assert.ok(c.elementAts.includes(108.4));
 const spec=resolveProduction(args,{start:100,end:110}).spec;assert.ok(Math.abs(spec.stages[2].parts[0].mergeAt-8.4)<1e-8);
 for(const change of [(p:any)=>p.appearAt=100,(p:any)=>p.mergeAt=p.appearAt,(p:any)=>p.mergeAt=109.5]){const a=structuredClone(args);change(a.stages[2].parts[0]);assert.throws(()=>resolveProduction(a,{start:100,end:110}));}
});
