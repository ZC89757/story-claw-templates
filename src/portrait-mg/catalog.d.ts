import type {referenceProfiles} from "./reference-profiles";
import type {documentContracts} from "./latepost/document-batch/contracts";
import type {structureContracts} from "./latepost/structure-batch/contracts";
import type {dataContracts} from "./latepost/data-batch/contracts";
import type {characterContracts} from "./latepost/characters/contracts";
import type {calculationFlowContracts} from "./latepost/calculation-flow/contracts";
import type {productSceneContracts} from "./latepost/product-scenes/contracts";
import type {comparisonCardContracts} from "./latepost/comparison-cards/contracts";
import type {containerChartContracts} from "./latepost/container-charts/contracts";
import type {footageChartContracts} from "./latepost/footage-charts/contracts";
import type {mapTransferContracts} from "./latepost/map-transfer/contracts";
import type {motionSequenceContracts} from "./latepost/motion-sequence/contracts";

type LegacyPortraitName = "mg-v-torn-split" | "mg-v-picture-in-picture" | "mg-v-dual-window" | "mg-v-item-cards" | "mg-v-comment-panels" | "mg-v-vertical-relation" | "mg-v-cutout-collage" | "mg-v-person-profile" | "mg-v-page-perspective" | "mg-v-archive-window" | "mg-v-filmstrip" | "mg-v-document-highlight" | "mg-v-ink-title" | "mg-v-process-correction" | "mg-v-flash-cutout" | "mg-v-gradient-dual-card" | "mg-v-rotating-document";
export type PortraitTemplateName = LegacyPortraitName | (typeof referenceProfiles)[keyof typeof referenceProfiles]["tag"]
  | "mg-v-crossing-percentage-lines" | "mg-v-equal-share-bars" | "mg-v-side-by-side-amount-bubbles" | "mg-v-layered-amount-bubbles" | "mg-v-three-road-elimination" | "mg-v-real-value-comparison"
  | (typeof documentContracts)[number]["tag"] | (typeof structureContracts)[number]["tag"] | (typeof dataContracts)[number]["tag"]
  | (typeof characterContracts)[number]["tag"] | (typeof calculationFlowContracts)[number]["tag"] | (typeof productSceneContracts)[number]["tag"] | (typeof comparisonCardContracts)[number]["tag"]
  | (typeof containerChartContracts)[number]["tag"] | (typeof footageChartContracts)[number]["tag"] | (typeof mapTransferContracts)[number]["tag"] | (typeof motionSequenceContracts)[number]["tag"];
export type PortraitCatalogEntry = {
  id: string;
  template: PortraitTemplateName;
  htmlTag: PortraitTemplateName;
  style: "portrait";
  name: string;
  structureName: string;
  category: "素材" | "效果";
  renderMode: "replace" | "overlay";
  description: string;
  previewKind: string;
  isDefault: boolean;
  useWhen: string;
};
export const PORTRAIT_CATALOG: readonly PortraitCatalogEntry[];
