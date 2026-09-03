import type {MgTemplateName} from "./runtime";

export type MgStyleCatalogEntry = {
  template: MgTemplateName;
  htmlTag: string;
  style: string;
  name: string;
  structureName: string;
  category: "视频" | "引导" | "数据" | "关系" | "对比" | "结构" | "强调" | "素材" | "文字" | "界面" | "转场" | "节奏" | "效果" | "运镜";
  renderMode: "replace" | "overlay";
  description: string;
  previewKind: string;
  isDefault: boolean;
};

export const MG_STYLE_CATALOG: readonly MgStyleCatalogEntry[];
