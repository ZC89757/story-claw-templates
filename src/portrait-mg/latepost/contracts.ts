import {crossingLinesFunction, crossingLinesId, crossingLinesMinDuration, validateCrossingLines, type CrossingLinesSpec} from "./crossing-lines-contract";
import {equalShareBarsFunction, equalShareBarsId, equalShareBarsMinDuration, validateEqualShareBars, type EqualShareBarsSpec} from "./equal-share-bars-contract";
import {pairBubblesFunction, pairBubblesId, pairBubblesMinDuration, validatePairBubbles, type PairBubblesSpec} from "./pair-bubbles-contract";
import {layeredBubblesFunction, layeredBubblesId, layeredBubblesMinDuration, validateLayeredBubbles, type LayeredBubblesSpec} from "./layered-bubbles-contract";
import {threeRoadContract, threeRoadId} from "./three-road-contract";
import {realValueContract, realValueId} from "./real-value-contract";
import {dataContracts} from "./data-batch/contracts";
import {documentContracts} from "./document-batch/contracts";
import {structureContracts} from "./structure-batch/contracts";
import {characterContracts} from "./characters/contracts";
import {calculationFlowContracts} from "./calculation-flow/contracts";
import {productSceneContracts} from "./product-scenes/contracts";
import {comparisonCardContracts} from "./comparison-cards/contracts";
import {containerChartContracts} from "./container-charts/contracts";
import {footageChartContracts} from "./footage-charts/contracts";
import {mapTransferContracts} from "./map-transfer/contracts";
import {motionSequenceContracts} from "./motion-sequence/contracts";

type MediaPath = readonly (string | number)[];
export type LatepostMediaSlot =
  | {type: "image" | "cutout"; path: MediaPath}
  | {type: "video"; path: MediaPath; seconds: number};

export type LatepostContract = {
  definition: {
    type: "function";
    name: string;
    description: string;
    strict: true;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required: readonly string[];
      additionalProperties: boolean;
    };
  };
  minimumDuration: number;
  validate?: (spec: unknown, duration: number) => void;
  media?: (spec: Record<string, any>, duration: number) => readonly LatepostMediaSlot[];
};

// The portrait schema checks the closed field shape before these content rules run.
export const latepostContracts = new Map<string, LatepostContract>([
  [crossingLinesId, {
    definition: crossingLinesFunction,
    minimumDuration: crossingLinesMinDuration,
    validate: (spec, duration) => validateCrossingLines(spec as CrossingLinesSpec, duration),
  }],
  [equalShareBarsId, {
    definition: equalShareBarsFunction,
    minimumDuration: equalShareBarsMinDuration,
    validate: (spec, duration) => validateEqualShareBars(spec as EqualShareBarsSpec, duration),
  }],
  [pairBubblesId, {
    definition: pairBubblesFunction,
    minimumDuration: pairBubblesMinDuration,
    validate: (spec, duration) => validatePairBubbles(spec as PairBubblesSpec, duration),
    media: () => [{type: "image", path: ["watermarkImage"]}],
  }],
  [layeredBubblesId, {
    definition: layeredBubblesFunction,
    minimumDuration: layeredBubblesMinDuration,
    validate: (spec, duration) => validateLayeredBubbles(spec as LayeredBubblesSpec, duration),
  }],
  [threeRoadId, threeRoadContract],
  [realValueId, realValueContract],
  ...[
    ...dataContracts, ...documentContracts, ...structureContracts, ...characterContracts,
    ...calculationFlowContracts, ...productSceneContracts, ...comparisonCardContracts,
    ...containerChartContracts, ...footageChartContracts, ...mapTransferContracts, ...motionSequenceContracts,
  ].map((entry) => [entry.id, entry] as const),
]);
