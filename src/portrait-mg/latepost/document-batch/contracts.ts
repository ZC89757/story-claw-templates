import {closed, cue, envelope, fixedLine, text} from "./contract-helpers";
import {reportZoomContract} from "./report-zoom-contract";
import {reportEvidenceContract} from "./report-evidence-contract";
import {distillSourcesContract} from "./distill-sources-contract";
import {taskMatrixContract} from "./task-matrix-contract";
import {researchPaperContract} from "./research-paper-contract";

export type RegulatoryAmountSpec = {
  authority: string;
  document: string;
  headline: [string, string];
  date: string;
  amount: string;
  comparisonAbove: string;
  comparisonBelow: string;
  focus: {at: number};
  comparisons: {at: number};
};

function validateRegulatoryAmount(spec: unknown, duration: number) {
  const value = spec as RegulatoryAmountSpec;
  value.headline.forEach(line => fixedLine(line, 12.5, "公告标题"));
  fixedLine(value.amount, 9, "主要金额");
  fixedLine(value.comparisonAbove, 12, "上侧历史金额");
  fixedLine(value.comparisonBelow, 12, "下侧历史金额");
  if (value.focus.at < .85 || value.comparisons.at - value.focus.at < .8 || duration - value.comparisons.at < .6) {
    throw new Error("公告概览、原文摘数与两条历史金额必须依次完整出现");
  }
}

export const regulatoryAmountContract = {
  id: "latepost-V08_001",
  tag: "mg-v-regulatory-amount-extract",
  title: "监管原文与历史金额",
  description: "适合有真实公告截图、一个主金额和两个历史参照的监管事件。公布机构、双行原标题和发布日期依次就位，整页上推后从正文红线引出红底主金额，最后在其上下补历史金额。",
  definition: {
    type: "function" as const,
    name: "create_portrait_regulatory_amount_extract",
    strict: true,
    description: "仅 9:16。把真实监管公告中的主金额抽成红底大字，再给出两条历史参照。公告正文用真实静态截图。标题和日期照原文填写；不杜撰历史金额。focus.at 和 comparisons.at 是宿主旁白时间轴上的绝对秒数。",
    parameters: closed({
      ...envelope,
      authority: text(2000, "发布机构的横排透明 PNG 字标，包含原有徽标和机构名称；本地路径。"),
      document: text(2000, "真实公告正文截图的本地路径，裁成约 286:241，适配暗底。把需要摘录的行置于截图顶端的第二行左起处，保留周围正文。"),
      headline: {type: "array", minItems: 2, maxItems: 2, items: text(25, "按原有双行版式分行；固定字号，每行最多约 12 个全角字宽。")},
      date: {...text(10), pattern: "^\\d{4}-\\d{2}-\\d{2}$"},
      amount: text(18, "红底大字的公告结果和金额，例如罚没合计51.79亿元。"),
      comparisonAbove: text(20, "红条上方的历史事实及金额。"),
      comparisonBelow: text(20, "红条下方的历史事实及金额。"),
      focus: cue("开始读本公告主金额"),
      comparisons: cue("开始读历史金额参照"),
    }),
  },
  minimumDuration: 3.5,
  validate: validateRegulatoryAmount,
  media: () => [
    {type: "cutout" as const, path: ["authority"]},
    {type: "image" as const, path: ["document"]},
  ],
} as const;

export type PayrollSpec = {
  background: {source: string; sourceStart: number};
  base: PayrollRegularRow;
  weekday: PayrollRegularRow;
  weekend: PayrollRegularRow;
  extra: {at: number; nightDetail: string; values: [string, string, string, string]};
  total: {at: number; value: string};
};
type PayrollRegularRow = {
  at: number;
  days: string;
  perDay: string;
  hours: string;
  rate: string;
  amount: string;
};
const regularRow = closed({
  at: {type: "number", minimum: 0, description: "口播解释该行工资组成的绝对秒数。"},
  days: text(6), perDay: text(4), hours: text(5), rate: text(4), amount: text(8),
});

function validatePayroll(spec: unknown, duration: number) {
  const value = spec as PayrollSpec;
  const order = [value.base, value.weekday, value.weekend, value.extra, value.total];
  if (order[0].at < 1.65 || order.some((row, index) => index > 0 && row.at - order[index - 1].at < [0,1.85,.9,1.16,.95][index])
    || duration - value.total.at < .65) {
    throw new Error("车间工资单需留足纸张进场、四次扫红和末尾聚光时间");
  }
  for (const row of [value.base, value.weekday, value.weekend]) {
    fixedLine(row.days, 4, "天数");
    fixedLine(row.perDay, 3, "每日时数");
    fixedLine(row.hours, 4, "合计时数");
    fixedLine(row.rate, 3, "时薪");
    fixedLine(row.amount, 5, "金额");
  }
  fixedLine(value.extra.nightDetail, 15, "夜班补贴");
  value.extra.values.forEach(amount => fixedLine(amount, 5, "其他收支金额"));
}

export const payrollContract = {
  id: "latepost-V04_002",
  tag: "mg-v-payroll-row-spotlight",
  title: "工资单逐行扫红",
  description: "适合真实介绍工资单中标准工时、平日及周末加班、其他收支和实发额。黑白真实车间视频贯穿画面，手持纸页从左摆入，四段逐行扫红后，圆形聚光和红色大字强调实发金额。",
  definition: {
    type: "function" as const,
    name: "create_portrait_payroll_row_spotlight",
    strict: true,
    description: "仅 9:16。用于真实工资单拆解。填标准工时、平日加班、周末加班四项计算量及金额，其他收支按夜班补贴、全勤奖、绩效、五险一金顺序给四个金额；最后给人民币实发金额。只填真实已有数据，at 为宿主时间轴上的绝对秒数。动态底片必须是真实相关车间视频。",
    parameters: closed({
      ...envelope,
      background: closed({
        source: text(2000, "真实车间视频的本地素材路径，视频剩余时长至少覆盖整段。"),
        sourceStart: {type: "number", minimum: 0},
      }),
      base: regularRow,
      weekday: regularRow,
      weekend: regularRow,
      extra: closed({
        at: {type: "number", minimum: 0},
        nightDetail: text(22, "夜班班次和补贴计算说明，保持一行短文案。"),
        values: {type: "array", minItems: 4, maxItems: 4, items: text(8)},
      }),
      total: closed({
        at: {type: "number", minimum: 0},
        value: {...text(4, "最终实发额，四位以内整数，以元为单位，不带单位。"), pattern: "^[0-9]{1,4}$"},
      }),
    }),
  },
  minimumDuration: 7,
  validate: validatePayroll,
  media: (_spec: unknown, duration: number) => [{type: "video" as const, path: ["background"], seconds: duration}],
} as const;

type SourceWindow = {table: string; focus: {at: number}};
type SupplyBase = {label: string};
export type SupplyComparisonSpec = {
  first: SupplyBase & {logo: string; table: string; firstFocus: {at: number}; secondFocus: {at: number}};
  second: SupplyBase & {leftLogo: string; rightLogo: string; table: string; at: number; firstFocus: {at: number}; secondFocus: {at: number}};
  third: SupplyBase & {logo: string; firstTable: SourceWindow; secondTable: SourceWindow; at: number};
  sourceNote: string;
};

const logo = text(2000, "单个原构图品牌位的透明 PNG，本地路径。");
const tableImage = text(2000, "保留原资料文字与表格线的静态横条 PNG，本地路径。将需扫红的原有文字按场景规定位置排入资料条，背景透明。");
const supplyLabel = text(18, "白色双品牌名称，采用「品牌 × 供应商」，固定一行。");
const caseAt = {type: "number", minimum: 0, description: "口播切入本案例的绝对秒数。"} as const;
const tableAt = {type: "number", minimum: 0, description: "口播切入该资料横条的绝对秒数，资料条在其首帧切入。"} as const;

function validateSupplyComparison(spec: unknown, duration: number) {
  const value = spec as SupplyComparisonSpec;
  for (const entry of [value.first, value.second, value.third]) fixedLine(entry.label, 10.8, "品牌配对");
  fixedLine(value.sourceNote, 33, "原资料说明");
  const cues = [
    value.first.firstFocus.at, value.first.secondFocus.at, value.second.at,
    value.second.firstFocus.at, value.second.secondFocus.at, value.third.at,
    value.third.firstTable.focus.at, value.third.secondTable.focus.at, duration,
  ];
  if (cues[0] < .9 || cues.slice(1).some((at,index) => at - cues[index] < [.45,.72,.35,.35,.57,0,.72,.6][index])
    || value.second.at - value.first.secondFocus.at <= .55) {
    throw new Error("资料横条必须按三组案例及各自原有焦点依次呈现，请留足滚动与红线时间");
  }
}

export const supplyComparisonContract = {
  id: "latepost-V06_003",
  tag: "mg-v-supplier-document-strip",
  title: "供应商横滚原文摘录",
  description: "适合顺序列出三组品牌与供应商关系，并由三份横滚资料作证。上方依次保留单枚、并列两枚、左置一枚品牌标志，下面用原始截图横向滚动、局部条文扫红。",
  definition: {
    type: "function" as const,
    name: "create_portrait_supplier_document_strip",
    strict: true,
    description: "仅 9:16。须有三个可核验的供应商案例。第一、二案使用原始黑底透明资料长条，各自包含两处需标红的不同现有文字。第三案的长条高度更窄，分成产品/取水与供应主体两个静态截图切窗。保留真实原文，勿增编资料。所有 at 为绝对秒数。仅使用透明品牌图和静态资料图片。",
    parameters: closed({
      ...envelope,
      first: closed({logo,label:supplyLabel,table:{...tableImage,description:tableImage.description+" 画布 584×113，标注文字位左缘 244 与 444 像素，顶部 35 与 43 像素。"},firstFocus:cue("讲第一案例的取水地公司"),secondFocus:cue("讲第一案例的供应商")}),
      second: closed({leftLogo:logo,rightLogo:logo,label:supplyLabel,at:caseAt,table:{...tableImage,description:tableImage.description+" 画布 390×112，文字标注位左缘 94 与 282 像素，顶部 34 与 42 像素。"},firstFocus:cue("讲第二案例的零售企业"),secondFocus:cue("讲第二案例的供货企业")}),
      third: closed({
        logo,label:supplyLabel,at:caseAt,
        firstTable: closed({table:{...tableImage,description:tableImage.description+" 画布 405×41，标注文字位左缘 157、顶部 14 像素。"},focus:closed({at:tableAt})}),
        secondTable: closed({table:{...tableImage,description:tableImage.description+" 画布 399×41，标注文字位左缘 68、顶部 14 像素。"},focus:closed({at:tableAt})}),
      }),
      sourceNote: text(35,"原例资料说明所在的底部一行，不增加额外说明。"),
    }),
  },
  minimumDuration: 6,
  validate: validateSupplyComparison,
  media: () => [
    {type:"cutout" as const,path:["first","logo"]}, {type:"image" as const,path:["first","table"]},
    {type:"cutout" as const,path:["second","leftLogo"]}, {type:"cutout" as const,path:["second","rightLogo"]},
    {type:"image" as const,path:["second","table"]}, {type:"cutout" as const,path:["third","logo"]},
    {type:"image" as const,path:["third","firstTable","table"]}, {type:"image" as const,path:["third","secondTable","table"]},
  ],
} as const;

export const documentContracts = [regulatoryAmountContract, payrollContract, supplyComparisonContract, reportZoomContract, reportEvidenceContract, distillSourcesContract, taskMatrixContract, researchPaperContract] as const;
