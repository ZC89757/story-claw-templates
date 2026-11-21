import type {ComponentType} from "react";
import {useVideoConfig} from "remotion";
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
import {CrossingLines, crossingLinesDemo} from "./latepost/crossing-lines";
import {crossingLinesId} from "./latepost/crossing-lines-contract";
import {EqualShareBars, equalShareBarsDemo} from "./latepost/equal-share-bars";
import {equalShareBarsId} from "./latepost/equal-share-bars-contract";
import {PairBubbles, pairBubblesDemo} from "./latepost/pair-bubbles";
import {pairBubblesId} from "./latepost/pair-bubbles-contract";
import {LayeredBubbles, layeredBubblesDemo} from "./latepost/layered-bubbles";
import {layeredBubblesId} from "./latepost/layered-bubbles-contract";
import {ThreeRoad, threeRoadDemo} from "./latepost/three-road";
import {threeRoadId} from "./latepost/three-road-contract";
import {RealValue, realValueDemo} from "./latepost/real-value";
import {realValueId} from "./latepost/real-value-contract";
import {dataBatch} from "./latepost/data-batch";
import {documentBatch} from "./latepost/document-batch";
import {structureBatch} from "./latepost/structure-batch";
import {characterBatch} from "./latepost/characters";
import {calculationFlowBatch} from "./latepost/calculation-flow";
import {productSceneBatch} from "./latepost/product-scenes";
import {comparisonCardBatch} from "./latepost/comparison-cards";
import {containerChartBatch} from "./latepost/container-charts";
import {footageChartBatch} from "./latepost/footage-charts";
import {mapTransferBatch} from "./latepost/map-transfer";
import {motionSequenceBatch} from "./latepost/motion-sequence";

const registeredPortraitIds = new Set(PORTRAIT_CATALOG.map(({id}) => id));
const latepostBatch = [
  {id:crossingLinesId, Component:CrossingLines, demo:crossingLinesDemo},
  {id:equalShareBarsId, Component:EqualShareBars, demo:equalShareBarsDemo},
  {id:pairBubblesId, Component:PairBubbles, demo:pairBubblesDemo},
  {id:layeredBubblesId, Component:LayeredBubbles, demo:layeredBubblesDemo},
  {id:threeRoadId, Component:ThreeRoad, demo:threeRoadDemo},
  {id:realValueId, Component:RealValue, demo:realValueDemo},
  ...dataBatch,
  ...documentBatch,
  ...structureBatch,
  ...characterBatch,
  ...calculationFlowBatch,
  ...productSceneBatch,
  ...comparisonCardBatch,
  ...containerChartBatch,
  ...footageChartBatch,
  ...mapTransferBatch,
  ...motionSequenceBatch,
].filter(({id}) => registeredPortraitIds.has(id));
export const portraitRenderers:Record<string,ComponentType<{spec:any}>>={...mediaRenderers,...peopleRenderers,...graphicsRenderers,...referenceRenderers,...batchARenderers,...batchBRenderers,...batchCRenderers,...selectedRenderers,...Object.fromEntries(latepostBatch.map(item=>[item.id,item.Component]))};
export const portraitDemos:Record<string,PortraitDemo>={...mediaDemos,...peopleDemos,...graphicsDemos,...batchADemos,...batchBDemos,...batchCDemos,...selectedDemos,...Object.fromEntries(latepostBatch.map(item=>[item.id,item.demo]))};
export const getPortraitDemo=(key:string)=>{
  const id=PORTRAIT_CATALOG.find(x=>x.template===key||x.previewKind===key||x.id===key)?.id;
  const demo = id ? portraitDemos[id] ?? getReferenceDemo(id) : undefined;
  if (!demo) throw new Error(`Missing portrait demo ${key}`);
  return demo;
};
export const PortraitTemplate=({kind,spec,viewport}:{kind:string;spec:any;viewport?:{width:number;height:number}})=>{
  const {width, height} = useVideoConfig();
  const id=PORTRAIT_CATALOG.find(x=>x.template===kind||x.id===kind)?.id;
  const Component=id?portraitRenderers[id]:undefined;
  if(!Component)throw new Error(`Missing portrait renderer ${kind}`);
  if (id?.startsWith("latepost-") && width >= height) {
    throw new Error(`${kind} only supports portrait video`);
  }
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
