import type {LatepostMediaSlot} from "../contracts";
import {checkCueSpacing, closed, rootFields} from "../structure-batch/schema";

type Quantity = {value: number; at: number};

export type PaybackSpec = {
  background: {source: string; sourceStart: number};
  equipmentCount: number;
  unitCostTenThousands: number;
  income: {at: number};
  monthlyHours: Quantity;
  hourlyRate: Quantity;
  months: Quantity;
  result: {at: number};
};

const at = (description: string) => ({type: "number", minimum: 0, description});
const positiveInteger = (maximum: number) => ({type: "integer", minimum: 1, maximum});
const quantity = (maximum: number, description: string) =>
  closed({value: positiveInteger(maximum), at: at(description)});

export const paybackTotals = (spec: PaybackSpec) => ({
  cost: spec.equipmentCount * spec.unitCostTenThousands,
  income: spec.monthlyHours.value * spec.hourlyRate.value * spec.months.value / 10_000,
});

function validate(spec: unknown, duration: number) {
  const value = spec as PaybackSpec;
  checkCueSpacing(
    [0, value.income.at, value.monthlyHours.at, value.hourlyRate.at, value.months.at, value.result.at, duration],
    [.55, .32, .35, .35, .42, .50],
    "回本公式需依次留下收入行展开、三次数值填入和结果停留时间",
  );
  const totals = paybackTotals(value);
  if (String(totals.cost).length > 5 || String(totals.income).length > 7) {
    throw new Error("回本公式的结果超出固定字位");
  }
}

export const paybackContract = {
  id: "latepost-V03_002",
  tag: "mg-v-payback-formula",
  title: "回本公式分步填空",
  description: "用红色成本、收入标签展示设备采购价和累计收入，按口播依次填入月产出、小时价格和回本月数，适合有连续相关现场视频的回本测算。",
  minimumDuration: 2.6,
  definition: {
    type: "function",
    name: "create_portrait_payback_formula",
    strict: true,
    description: "仅用于9:16。成本固定为设备台数×每台价格（万元），收入固定为小时/月×元/小时×月数，成本和收入结果由输入自动计算。背景需要足够覆盖整段的连续真实视频。各 at 为口播对应的绝对秒。",
    parameters: closed({
      ...rootFields,
      background: closed({
        source: {type: "string", minLength: 1, description: "无烧录文字、博主标志或平台水印的连续现场视频路径"},
        sourceStart: {type: "number", minimum: 0, description: "素材内的起始秒数"},
      }),
      equipmentCount: positiveInteger(999),
      unitCostTenThousands: positiveInteger(999),
      income: closed({at: at("收入标签开始展开的绝对秒")}),
      monthlyHours: quantity(99999, "月小时数从下方填入的绝对秒"),
      hourlyRate: quantity(999, "小时单价从下方填入的绝对秒"),
      months: quantity(99, "月份从下方填入并转红的绝对秒"),
      result: closed({at: at("累计收入结果从下方填入的绝对秒")}),
    }),
  },
  validate,
  media: (_spec: Record<string, unknown>, duration: number): LatepostMediaSlot[] =>
    [{type: "video", path: ["background"], seconds: duration}],
} as const;
