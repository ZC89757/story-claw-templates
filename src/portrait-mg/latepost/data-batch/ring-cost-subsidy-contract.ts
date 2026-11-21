export type RingCostSubsidySpec = {
  title: string;
  sourceLine: string;
  reportLine: string;
  centerSubject: string;
  centerMetric: string;
  stages: {label: string; cost: number}[];
  subsidy: {label: string; amount: number; at: number};
  ratio: {at: number};
};

const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const amount = {type: "integer", minimum: 100, maximum: 9_000_000} as const;
const at = {type: "number", minimum: 0} as const;
const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
const definition = {
  type: "function" as const,
  name: "create_portrait_ring_cost_subsidy",
  strict: true as const,
  description: "仅 9:16。灰环由五个真实阶段成本组成，中心同步累计，段首按原位依次揭示外部标签。补助或补贴为全量成本的较小份额，另用细红楔标注。cost 与 amount 统一填人民币元，模板自行换算万元和百分比；stages 按环图从左上窄扇段开始顺时针填写五项。subsidy.at 为口播提到补贴，ratio.at 为口播讲到补贴相对总成本的比例，两者都是绝对秒数。",
  parameters: closed({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    title: text(24),
    sourceLine: text(34),
    reportLine: text(34),
    centerSubject: text(6),
    centerMetric: text(9),
    stages: {type: "array", minItems: 5, maxItems: 5, items: closed({label: text(10), cost: amount})},
    subsidy: closed({label: text(5), amount, at}),
    ratio: closed({at}),
  }),
};

function validate(input: unknown, duration: number) {
  const spec = input as RingCostSubsidySpec;
  const total = spec.stages.reduce((sum, stage) => sum + stage.cost, 0);
  const shares = spec.stages.map(stage => stage.cost / total);
  if (shares[0] > .12 || shares[1] > .22 || shares[2] > .29 || shares[3] < .30 || shares[3] > .56 || shares[4] > .25) {
    throw new Error("环图文字位固定，填入的五段成本需符合原版小扇与主体扇区的顺序");
  }
  if (spec.subsidy.amount / total > .075 || spec.subsidy.amount > 999_999 || total > 9_000_000) {
    throw new Error("补贴须能作为细红楔显示，总值和补贴不能超出固定的数字位");
  }
  if (spec.subsidy.at < 4.23 || spec.ratio.at - spec.subsidy.at < .94 || duration - spec.ratio.at < .42) {
    throw new Error("须保留灰环累计、红楔展开及补贴比例入场的不同时间阶段");
  }
  const texts = [spec.title,spec.sourceLine,spec.reportLine,spec.centerSubject,spec.centerMetric,spec.subsidy.label,...spec.stages.map(stage=>stage.label)];
  const widths = [19.4,28,28,6,9,5,9,6,6,6,7];
  for (const [index, value] of texts.entries()) {
    const units = Array.from(value).reduce((sum,char)=>sum+(/^[\x20-\x7e]$/.test(char) ? .55 : 1),0);
    if (/[\r\n]/.test(value) || units > widths[index]) throw new Error("环图使用固定字号和字位，请缩短超宽文案");
  }
}

export const ringCostSubsidyContract = {
  id: "latepost-V13_003",
  tag: "mg-v-ring-cost-subsidy",
  title: "环形成本与补贴切片",
  description: "灰环沿圆周依次展开，中央同步累计总成本，外围显示各阶段，最后分开强调薄红色补贴楔。",
  minimumDuration: 5.6,
  definition,
  validate,
} as const;
