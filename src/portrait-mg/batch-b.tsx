import type {ComponentType} from "react";
import type {PortraitDemo} from "./common";
import {peopleRenderers,peopleDemos} from './groups/people';
import {getReferenceDemo} from './reference-scene';
import {getReferenceProfile} from './reference-profiles';
import {PriceCards,ObjectSwap,Faceoff,Options,Documents} from './batch-b/scenes';
import {GoldArrow} from './batch-b/gold-arrow';
import {validateBatchBSpec} from './batch-b/constraints';

const implementations: Record<string, ComponentType<{spec:any}>> = {...peopleRenderers,V19_006:PriceCards,V28_002:ObjectSwap,V19_001:Faceoff,V31_003:Options,V21_002:GoldArrow,V21_005:Documents};
export const batchBRenderers:Record<string,ComponentType<{spec:any}>>=Object.fromEntries(Object.entries(implementations).map(([id,Component])=>[id,({spec}:{spec:any})=>{validateBatchBSpec(id,spec);return <Component spec={spec}/>;} ]));
const reference=(id:string)=>`D:/MG_Reference_Library/creators/eshuocaijing/effects/${id}/reference.mp4`;
const frameCounts:Record<string,number>={V19_006:275,V28_002:100,V19_001:92,V31_003:81,V21_002:88,V21_005:175};
export const batchBDemos: Record<string, PortraitDemo> = Object.fromEntries(Object.entries(peopleDemos).map(([id,d])=>[id,{...d,reference:reference(id)}]));
for(const [id,frames]of Object.entries(frameCounts)){const d=getReferenceDemo(id)!;batchBDemos[id]={...d,reference:reference(id),referenceStart:0,durationInFrames:frames,spec:{...d.spec,_duration:frames/30}};}
const video='portrait-mg/restored-layouts/office-demo-background.mp4';
const secondVideo='portrait-mg/restored-layouts/documents-demo-background.mp4';
const image='portrait-mg/strict-demo/photo-middle.jpg';
const image2='portrait-mg/strict-demo/photo-top.png';
const cutout='portrait-mg/V01_005/shorts.png';
const cutout2='portrait-mg/V01_005/camisole.png';
const v=(source:string,at=0)=>({source,sourceStart:0,at});
const im=(source:string,at=0)=>({source,sourceStart:null,at});
const w=(text:string,frame:number)=>({text,at:frame/30});
Object.assign(batchBDemos.V19_006.spec,{firstClip:v(video),secondClip:v(secondVideo,169/30),firstTitle:w('传统店',18),firstRow1:w('80-120平米',42),firstRow2:w('6-8个工位',80),firstRow3:w('12-15平米/位',111),secondTitle:w('快剪店',169),secondRow1:w('≈10平米',181),secondRow2:w('2-3个工位',198),secondRow3:w('3-4平米/位',224)});
Object.assign(batchBDemos.V28_002.spec,{background:v(video),first:im(image),second:im(image2),third:im('portrait-mg/strict-demo/photo-bottom.jpg'),foreground:im(cutout),replacement:im(cutout2,44/30)});
Object.assign(batchBDemos.V19_001.spec,{background:v(video),leftObject:im("portrait-mg/V04_001/silver.png"),rightObject:im("portrait-mg/V11_001/portrait.png"),leftLabel:w('十元快剪',0),rightLabel:w('设计总监',0)});
Object.assign(batchBDemos.V31_003.spec,{background:v(video),chosenClip:v(secondVideo,43/30),left:w('走账',0),right:w('走人',14)});
Object.assign(batchBDemos.V21_002.spec,{
  background:{source:'portrait-mg/batch-b/car-showroom-demo.mp4',sourceStart:0,sourceEnd:88/30},
  subject:im('portrait-mg/selected/vehicle.png'),first:w('42W',33),arrow:{at:43/30},second:w('22W',45),
  firstSubtitle:{text:'BEFORE'},secondSubtitle:{text:'AFTER'},
});
Object.assign(batchBDemos.V21_005.spec,{leftPage:im('portrait-mg/strict-demo/document-first.png',0),middlePage:im('portrait-mg/strict-demo/document-second.png',0),rightPage:im('portrait-mg/strict-demo/document-first.png',0),select:{at:35/30},excerpt:im('portrait-mg/batch-b/excerpt.png',72/30)});
batchBDemos.V04_001.durationInFrames=234;
batchBDemos.V01_005.spec.cards[0].text='20块的吊带';
batchBDemos.V01_005.spec.cards[1].text='十几块的短裤';
batchBDemos.V01_007.spec.nodes[0].label='英雄人物';
batchBDemos.V01_007.spec.nodes[1].label='民族精神的象征';
batchBDemos.V01_007.spec.nodes[1].media={source:'portrait-mg/batch-b/flag-close.mp4',sourceStart:0};
batchBDemos.V04_001.spec.cards[0].text='超级大满贯';
batchBDemos.V04_001.spec.cards[1].text='最佳运动员';
batchBDemos.V04_001.spec.headline.text='世界排名第一';

// Untimed source slots start at scene zero and are not public timing controls.
for(const [id,demo] of Object.entries(batchBDemos)){for(const [key,slot]of Object.entries(getReferenceProfile(id)?.slots??{})){if(slot.at===undefined&&demo.spec[key]&&typeof demo.spec[key]==='object')delete demo.spec[key].at;}}
