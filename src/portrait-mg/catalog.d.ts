import type {referenceProfiles} from "./reference-profiles";

type LegacyPortraitName = "mg-v-torn-split" | "mg-v-picture-in-picture" | "mg-v-dual-window" | "mg-v-item-cards" | "mg-v-comment-panels" | "mg-v-vertical-relation" | "mg-v-cutout-collage" | "mg-v-person-profile" | "mg-v-page-perspective" | "mg-v-archive-window" | "mg-v-filmstrip" | "mg-v-document-highlight" | "mg-v-ink-title" | "mg-v-process-correction" | "mg-v-flash-cutout" | "mg-v-gradient-dual-card" | "mg-v-rotating-document";
export type PortraitTemplateName = LegacyPortraitName | (typeof referenceProfiles)[keyof typeof referenceProfiles]["tag"];
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
