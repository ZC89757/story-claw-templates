import {at, closed, cutout, image, line, requireSpacing, rootFields} from "./schema";

type Price = {value: string; unit: string; at: number};
export type ChipSpec = {
  small: {name: string; artwork: string; price: Price};
  large: {name: string; frontArtwork: string; backArtwork: string; at: number; price: Price};
};
const artwork = (description: string) => image(description + "，只有芯片实物，背景必须是真实透明 PNG");
const price = (pattern: string) => closed({
  value: {...line(3, "红色价格数字，可使用原位置的约等号或加号"), pattern},
  unit: line(2, "白色两字货币单位"),
  at: at("价格文字入场"),
});

export const chipContract = {
  id: "latepost-V09_004",
  tag: "mg-v-chip-price-comparison",
  title: "双芯片价差",
  description: "小芯片与红圆先展开并亮出单价，整组缩到左下，右上大红圆接着展开，放入正反面实物与更大的红色单价。",
  minimumDuration: 3.4,
  definition: {
    type: "function",
    name: "create_portrait_chip_price_comparison",
    strict: true,
    description: "仅 9:16 竖屏。对照两类芯片的单价。第一组芯片正反面叠放成一张图，第二组正面与背面为各一张图。固定画面支持短品名和小组一位数或两位数、大组至多两位数加号的价格。",
    parameters: closed({...rootFields,
      small: closed({name: line(14, "小圆底部品名"), artwork: artwork("重叠的芯片正反面图"), price: price("^≈?[0-9]{1,2}$")}),
      large: closed({name: line(10, "大圆底部品名"), frontArtwork: artwork("大圆左侧芯片正面"),
        backArtwork: artwork("大圆右侧芯片背面"), at: at("第一组移向左下并展开第二组"), price: price("^[0-9]{1,2}[+]?$")})}),
  },
  validate(spec: unknown, duration: number) {
    const {small, large} = spec as ChipSpec;
    requireSpacing([0, small.price.at, large.at, large.price.at, duration], [.65, .52, .95, .65],
      "两次价格入场之间须留出芯片缩移及大圆展开的时间");
  },
  media: () => [cutout("small", "artwork"), cutout("large", "frontArtwork"), cutout("large", "backArtwork")],
} as const;
