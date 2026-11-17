import type {ComponentType} from "react";
import {PORTRAIT_CATALOG} from "./catalog.js";
import {PortraitCanvas, PortraitMedia, type PortraitDemo} from "./common";
import {mediaRenderers, mediaDemos} from "./groups/media";
import {peopleRenderers, peopleDemos} from "./groups/people";
import {graphicsRenderers, graphicsDemos} from "./groups/graphics";
import {referenceRenderers, getReferenceDemo} from "./reference-scene";

import {batchARenderers, batchADemos} from "./batch-a";
import {batchBRenderers, batchBDemos} from "./batch-b";
import {batchCRenderers, batchCDemos} from "./batch-c";

import {selectedRenderers, selectedDemos} from "./selected";

export const portraitRenderers:Record<string,ComponentType<{spec:any}>>={...mediaRenderers,...peopleRenderers,...graphicsRenderers,...referenceRenderers,...batchARenderers,...batchBRenderers,...batchCRenderers,...selectedRenderers};
export const portraitDemos:Record<string,PortraitDemo>={...mediaDemos,...peopleDemos,...graphicsDemos,...batchADemos,...batchBDemos,...batchCDemos,...selectedDemos};
export const getPortraitDemo=(key:string)=>{
  const id=PORTRAIT_CATALOG.find(x=>x.template===key||x.previewKind===key||x.id===key)?.id;
  const demo = id ? portraitDemos[id] ?? getReferenceDemo(id) : undefined;
  if (!demo) throw new Error(`Missing portrait demo ${key}`);
  return demo;
};
export const PortraitTemplate=({kind,spec,viewport}:{kind:string;spec:any;viewport?:{width:number;height:number}})=>{
  const id=PORTRAIT_CATALOG.find(x=>x.template===kind||x.id===kind)?.id;
  const Component=id?portraitRenderers[id]:undefined;
  if(!Component)throw new Error(`Missing portrait renderer ${kind}`);
  return <PortraitCanvas viewport={viewport}><Component spec={spec}/></PortraitCanvas>;
};
export const PortraitPreview=({previewKind}:{previewKind:string})=>{
  const entry=PORTRAIT_CATALOG.find(x=>x.previewKind===previewKind);
  if(!entry)throw new Error(`Unknown portrait preview ${previewKind}`);
  const demo=getPortraitDemo(previewKind),Component=portraitRenderers[entry.id];
  return <PortraitCanvas>
    {"previewBackground" in demo && demo.previewBackground?<PortraitMedia media={{source:demo.previewBackground,sourceStart:/\.(?:mp4|webm|mov|m4v)$/i.test(demo.previewBackground)?0:null}} style={{position:"absolute",inset:0}}/>:null}
    <Component spec={demo.spec}/>
  </PortraitCanvas>;
};
