import {at, checkSpacing, closed, identity, image, text} from "./fields";

type Metric = {label: string; english: string; icon: string};
export type MetricsSpec = {rows: Metric[]; reorder: {at: number}};

function validate(spec: unknown, duration: number) {
  const {rows, reorder} = spec as MetricsSpec;
  checkSpacing([0, reorder.at, duration], [1.05, .72], "四项指标必须先呈现，再完成换位和复勾");
  if (rows.some((row) => !/^[A-Za-z][A-Za-z '-]*$/.test(row.english))) throw new Error("英文标签请使用简短的英语词组");
}

export const metricsContract = {
  id: "latepost-V01_005",
  tag: "mg-v-metric-list-swap",
  title: "指标清单换位",
  description: "四组银色图标和中英文字逐项进入，右边出现三个红勾。末项沿同一列向上移至首位，其余三项顺延。",
  minimumDuration: 1.77,
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_metric_list_swap",
    description: "仅9:16。比较同一组四条短指标的前后排序。中文固定两字，英文为短词。reorder.at 为末项开始换位的口播绝对秒数。",
    parameters: closed({
      ...identity,
      rows: {type: "array", minItems: 4, maxItems: 4, items: closed({
        label: {...text(2), minLength: 2},
        english: text(14),
        icon: image("去底银色立体指标图标，透明 PNG"),
      })},
      reorder: closed({at: at("末项沿同列升到首位的绝对秒数")}),
    }),
  },
  validate,
  media: () => [0, 1, 2, 3].map((index) => ({type: "cutout" as const, path: ["rows", index, "icon"]})),
} as const;
