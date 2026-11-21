import {checkCueSpacing, chineseWidth, closed, lineText, rootFields} from "./schema";

export type ServiceTierPyramidSpec = {
  tiers: {label: string; english: string; at: number};
  peak: {label: string; englishOne: string; englishTwo: string; at: number};
  labels: {text: string; at: number}[];
};

const at = {type: "number", minimum: 0, description: "实际口播绝对秒数"} as const;

function validate(spec: unknown, duration: number) {
  const {tiers, peak, labels} = spec as ServiceTierPyramidSpec;
  checkCueSpacing([0, tiers.at, peak.at, ...labels.map(item => item.at), duration],
    [.94, 1.05, .67, .17, .17, .17, .17, .17, .35], "服务触点金字塔须依次留出拆层、推近和六处引线揭示");
  if ([tiers.english, peak.englishOne, peak.englishTwo].some(value => !/^[\x20-\x7e]+$/.test(value))
    || labels.some(item => chineseWidth(item.text) > 5.2)) {
    throw new Error("说明与触点名称超出固定字位，请缩短内容");
  }
}

export const serviceTierPyramidContract = {
  id: "latepost-V05_004",
  tag: "mg-v-service-tier-pyramid",
  title: "服务触点分级金字塔",
  description: "用于三层服务触点或优先级及最上层的六项内容。三层立体三角面从实心拆分，镜头推近，六个红点按左下到左上、再右下到右上的顺序逐项连出。",
  minimumDuration: 4.0,
  definition: {
    type: "function",
    name: "create_portrait_service_tier_pyramid",
    strict: true,
    description: "仅9:16。三个黑白立体层与红色面板固定。填写主说明与最上层标题及各自英文说明，以及最上层六项触点。六项按左下、左中、左上、右下、右中、右上依次入场，at 为实际口播绝对秒数。",
    parameters: closed({
      ...rootFields,
      tiers: closed({label: lineText(5), english: lineText(22), at}),
      peak: closed({label: lineText(5), englishOne: lineText(19), englishTwo: lineText(19), at}),
      labels: {type: "array", minItems: 6, maxItems: 6, items: closed({text: lineText(6), at})},
    }),
  },
  validate,
} as const;
