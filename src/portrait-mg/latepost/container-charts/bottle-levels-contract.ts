import {closed, cue, cutout, image, line, requireSpacing, rootFields} from "../product-scenes/schema";

type Retailer = {mark: string; percent: number};

export type BottleLevelSpec = {
  title: string;
  sourceNote: string;
  upper: {first: Retailer; second: Retailer; third: Retailer};
  lower: {first: Retailer; second: Retailer; third: Retailer; fourth: Retailer};
  comparison: {at: number};
  lead: {at: number};
  followers: {at: number};
};

const retailer = closed({
  mark: image("该零售品牌的透明 PNG 标识，主体裁紧且保留自身形状，素材只包含用于数据对照的品牌内容"),
  percent: {type: "integer", minimum: 1, maximum: 100, description: "液位所代表的整数百分比，不填百分号"},
});

export const bottleLevelContract = {
  id: "latepost-V06_001",
  tag: "mg-v-bottle-level-comparison",
  title: "瓶身液位对比",
  description: "双货架的三加四只瓶子和品牌图标分批显现，再由三组红色液位从瓶底升起，瓶口下方的白色百分比逐个亮出。",
  minimumDuration: 3.0,
  definition: {
    type: "function",
    name: "create_portrait_bottle_level_comparison",
    strict: true,
    description: "仅 9:16。七个品牌依原有双层三加四位置放置，三组液位按原顺序依次升起并停留。上层第一项承载最高占比，下层后三项承载较低占比。所有时间字段填真实口播绝对秒数。",
    parameters: closed({
      ...rootFields,
      title: line(15, "左上已有的白色标题，最多十五字"),
      sourceNote: line(27, "标题下方已有灰色斜体数据来源短注"),
      upper: closed({first: retailer, second: retailer, third: retailer}),
      lower: closed({first: retailer, second: retailer, third: retailer, fourth: retailer}),
      comparison: cue("上层第二、三瓶和下层第一瓶开始升液位"),
      lead: cue("上层第一瓶开始升液位"),
      followers: cue("下层第二、三、四瓶开始升液位"),
    }),
  },
  validate(spec: unknown, duration: number) {
    const value = spec as BottleLevelSpec;
    requireSpacing([0, value.comparison.at, value.lead.at, value.followers.at, duration],
      [.30, .85, .91, .77], "瓶身的三组液位须依原顺序上升，每组预留完整上升时间");
    const {upper, lower} = value;
    const lead = upper.first.percent;
    const comparisons = [upper.second.percent, upper.third.percent, lower.first.percent];
    const followers = [lower.second.percent, lower.third.percent, lower.fourth.percent];
    if (lead < Math.max(...comparisons) || Math.max(...followers) > Math.min(...comparisons)) {
      throw new Error("上层首瓶为最高值，下层后三瓶的值不可超过首批亮起的瓶身");
    }
  },
  media: () => [
    cutout("upper", "first", "mark"), cutout("upper", "second", "mark"), cutout("upper", "third", "mark"),
    cutout("lower", "first", "mark"), cutout("lower", "second", "mark"),
    cutout("lower", "third", "mark"), cutout("lower", "fourth", "mark"),
  ],
} as const;
