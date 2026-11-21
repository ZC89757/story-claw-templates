import {checkCueSpacing, chineseWidth, closed, cue, lineText, rootFields, stillImage} from "./schema";

type StackedLabel = {lineOne: string; lineTwo: string};
export type TechnologyTreeSpec = {
  title: string;
  leftFamily: string;
  rightFamily: string;
  leftTypes: StackedLabel;
  middleTypes: StackedLabel;
  rightType: string;
  upperProduct: {label: string; image: string; at: number};
  lowerBranch: {label: string; smallType: string; productLabel: string; frontImage: string; backImage: string; at: number};
  zoom: {at: number};
};

const partImage = stillImage("真实器件单独抠出的透明 PNG，保留其原图视角");
const twoLines = closed({lineOne: lineText(7), lineTwo: lineText(7)});

function validate(spec: unknown, duration: number) {
  const {upperProduct, lowerBranch, zoom, leftFamily, rightFamily} = spec as TechnologyTreeSpec;
  checkCueSpacing([0, upperProduct.at, lowerBranch.at, zoom.at, duration], [1, 1.05, 1.03, .65], "技术分类树须留出上层产品、下层产品和最后推镜的连续展示时间");
  if ([leftFamily, rightFamily].some(value => chineseWidth(value) > 8.6)
    || chineseWidth(lowerBranch.smallType) > 10.5 || chineseWidth(lowerBranch.productLabel) > 10.5) {
    throw new Error("技术分类树的分类名或产品短说明超出固定字位");
  }
}

export const technologyTreeContract = {
  id: "latepost-V09_003",
  tag: "mg-v-technology-tree",
  title: "技术分类树逐级展开",
  description: "用于两大技术类别及子类。上方呈现总类，红线连接细分类，右侧重点器件先后落在两枚红色圆形底座上，最后推近。",
  minimumDuration: 4.2,
  definition: {
    type: "function",
    name: "create_portrait_technology_tree",
    strict: true,
    description: "仅9:16。固定两大类、左左两组双行短名、右一组短名、上方独立重点产品和下方正反两张产品图。三张图片分别为透明 PNG，at 对应真实口播绝对秒数。最后推近上下两个产品。",
    parameters: closed({
      ...rootFields,
      title: lineText(4),
      leftFamily: lineText(13),
      rightFamily: lineText(13),
      leftTypes: twoLines,
      middleTypes: twoLines,
      rightType: lineText(8),
      upperProduct: closed({label: lineText(10), image: partImage, at: {type: "number", minimum: 0}}),
      lowerBranch: closed({
        label: lineText(9), smallType: lineText(17), productLabel: lineText(17),
        frontImage: partImage, backImage: partImage, at: {type: "number", minimum: 0},
      }),
      zoom: cue("上下两组产品齐备后开始推近的口播绝对秒数"),
    }),
  },
  validate,
  media: () => [
    {type: "cutout" as const, path: ["upperProduct", "image"]},
    {type: "cutout" as const, path: ["lowerBranch", "frontImage"]},
    {type: "cutout" as const, path: ["lowerBranch", "backImage"]},
  ],
} as const;
