import {checkCueSpacing, chineseWidth, closed, cue, lineText, rootFields} from "../structure-batch/schema";

export type SankeySpec = {
  title: string;
  credit: string;
  sources: string[];
  alternativeLabel: string;
  focusLabel: string;
  destinations: string[];
  incoming: number[][];
  outgoing: number[][];
  unit: string;
  alternatives: {at: number};
  focus: {at: number};
  share: {at: number};
  amount: {at: number};
  destinationFocus: {at: number};
};

const fixedArray = (items: object, count: number) => ({
  type: "array", items, minItems: count, maxItems: count,
});
const matrix = (rows: number, columns: number, description: string) => ({
  ...fixedArray(fixedArray({type: "number", minimum: 0, maximum: 1e12}, columns), rows),
  description,
});

export const sumFlow = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0);
export const sumColumn = (matrix: number[][], column: number) => sumFlow(matrix.map(row => row[column]));

function validate(spec: unknown, duration: number) {
  const data = spec as SankeySpec;
  const relayAmounts = data.outgoing.map(sumFlow);
  for (const [index, outgoing] of relayAmounts.entries()) {
    const incoming = sumColumn(data.incoming, index);
    if (outgoing <= 0 || Math.abs(incoming - outgoing) > 1e-8 * outgoing) {
      throw new Error("桑基图的每个中转节点必须有正流量且流入、流出守恒");
    }
  }
  if (data.incoming.some(row => sumFlow(row) <= 0) ||
      data.destinations.some((_, index) => sumColumn(data.outgoing, index) <= 0)) {
    throw new Error("桑基图的来源和终点均须有正流量");
  }
  if (chineseWidth(data.title) > 15.2 || chineseWidth(data.credit) > 22.5 ||
      chineseWidth(data.focusLabel) > 4.1 ||
      data.sources.some(label => chineseWidth(label) > 8) ||
      chineseWidth(String(Math.round(relayAmounts[4])) + data.unit) > 7.2) {
    throw new Error("桑基图文案超过原版固定字位，请缩短文字或换算单位");
  }
  checkCueSpacing(
    [0, data.alternatives.at, data.focus.at, data.share.at, data.amount.at, data.destinationFocus.at, duration],
    [.4, .85, .95, .55, .65, .95],
    "桑基图需依次留出灰图、蓝线、红流束、占比、金额和终点推进时间",
  );
}

export const sankeyContract = {
  id: "latepost-V10_001",
  tag: "mg-v-layered-sankey",
  title: "桑基图逐层亮流",
  description: "从三组来源经五条中间路径流向六组终点。先点亮蓝色备选路径，再以红色突出重点路径和占比，最后推进终点公司。",
  minimumDuration: 4.35,
  definition: {
    type: "function",
    name: "create_portrait_layered_sankey",
    strict: true,
    description: "仅用于9:16竖屏。三组来源、五条中间路径、六组终点均由左到右排列。中间依次为直达路径、蓝色备选路径三条、红色重点路径。按同一单位填写真实流量，允许零流束，但每个节点均须有正流量。各中间节点入流等于出流，占比和金额自动计算。按口播提供绝对秒。",
    parameters: closed({
      ...rootFields,
      title: lineText(24),
      credit: lineText(45),
      sources: fixedArray(lineText(9), 3),
      alternativeLabel: lineText(7),
      focusLabel: lineText(6),
      destinations: fixedArray(lineText(4), 6),
      incoming: matrix(3, 5, "每行一个来源，五列是对应中转节点的流入量。"),
      outgoing: matrix(5, 6, "每行一个中转节点，六列是对应终点的流出量。"),
      unit: lineText(4),
      alternatives: cue("蓝色流束开始点亮的绝对秒"),
      focus: cue("红色主流束开始点亮的绝对秒"),
      share: cue("重点路径占比从下向上落位的绝对秒"),
      amount: cue("重点路径金额出现的绝对秒"),
      destinationFocus: cue("视角推进底部终点时的绝对秒"),
    }),
  },
  validate,
} as const;
