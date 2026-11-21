type Series = {name: string; value: number; trace: number[]};

export type PairedPriceTracesSpec = {
  title: string;
  sourceLine: string;
  periodLine: string;
  firstTick: string;
  lastTick: string;
  rise: Series;
  comparison: Series;
  record: {at: number};
  emphasis: {at: number};
  exit: {at: number};
};

const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
const cue = (description: string) => closed({at: {type: "number", minimum: 0, description}});
const series = closed({
  name: text(4),
  value: {type: "integer", minimum: 1, maximum: 9999},
  trace: {type: "array", minItems: 8, maxItems: 100, items: {type: "number", minimum: 0}, description: "真实同间隔数据。每条线以自己的基准变化走势绘制，与末端实际元值为不同口径。"},
});
const definition = {
  type: "function" as const,
  name: "create_portrait_paired_price_traces",
  strict: true as const,
  description: "仅 9:16。两个标的同期间走势左到右描出，终点分别展示实际价格。按同一真实采样间隔和相同样本数填写两组真实价格数据。模板使用与原参考相同的起点对齐，显示相对变化趋势及两项真实终值，保留数据来源与对比周期，已有风险说明原位显示。三个 at 依次为口播首次点明终点价格、强调上涨者、从这一对照退出的绝对秒数。",
  parameters: closed({
    group: {type: "string", enum: ["portrait"]}, order: {anyOf:[{type:"integer",minimum:1},{type:"null"}]},
    title:text(25), sourceLine:text(32), periodLine:text(35), firstTick:text(6), lastTick:text(6), rise:series, comparison:series,
    record:cue("口播第一次给出比较的最终价格。"),
    emphasis:cue("口播突出上涨者，蓝线随即减淡。"),
    exit:cue("对照段落结束，原版背景圆晕进入并淡出图表。"),
  }),
};

export function pairedChanges(prices: readonly number[]) {
  return prices.map(price => (price-prices[0])/prices[0]);
}

function validate(input: unknown, duration: number) {
  const spec = input as PairedPriceTracesSpec;
  const {rise, comparison} = spec;
  if (rise.trace.length !== comparison.trace.length || rise.trace[0] <= 0 || comparison.trace[0] <= 0) {
    throw new Error("双折线要求两组真实采样数据、等长且同间隔，初值为正");
  }
  const red = pairedChanges(rise.trace);
  const blue = pairedChanges(comparison.trace);
  if (red.at(-1)! <= 0 || red.at(-1)! <= blue.at(-1)! || Math.max(...red) > red.at(-1)! * 1.08) {
    throw new Error("双折线的原版强调位需要红线高点停在末端");
  }
  if (spec.record.at < 1.70 || spec.emphasis.at - spec.record.at < .57 || spec.exit.at-spec.emphasis.at < .55
    || duration-spec.exit.at < .31) {
    throw new Error("需保留同步描线、末值入场、蓝线减淡和圆晕退场时间");
  }
  const widths = [[spec.title,16.7],[spec.sourceLine,18],[spec.periodLine,24],[spec.firstTick,6],[spec.lastTick,6],[rise.name,3.1],[comparison.name,3.1]] as const;
  for(const [value,limit] of widths){
    const units=Array.from(value).reduce((sum,char)=>sum+(/^[\x20-\x7e]$/.test(char) ? .54 : 1),0);
    if (/[\r\n]/.test(value) || units>limit) throw new Error("双折线的文字须放进固定字号与原版字位");
  }
}

export const pairedPriceTracesContract = {
  id:"latepost-V14_001",
  tag:"mg-v-paired-price-traces",
  title:"双折线同轴跑数",
  description:"左右时点之间同步描出红蓝两条走势；右侧先显示两笔终值，蓝线随后淡下，最后浅红圆晕带走图表。",
  minimumDuration:3.25,
  definition,
  validate,
} as const;
