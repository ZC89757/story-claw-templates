export type SalesStructureSpec = {
  title: string;
  sourceLine: string;
  companyMark: string;
  unit: string;
  domestic: {label: string; amount: number; change: number};
  foreign: {label: string; change: number};
  total: {label: string; amount: number; change: number};
  split: {at: number};
};

const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const number = (minimum: number, maximum: number) => ({type: "number", minimum, maximum});
const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
const amountCard = closed({label: text(6), amount: number(.1, 9999.9), change: number(-99, 99)});

const definition = {
  type: "function" as const,
  name: "create_portrait_sales_structure_split",
  strict: true as const,
  description: "仅 9:16。先显示国内销量及同比下降，随后原卡缩到右下并在右上补海外销量与同比增长，左侧同时出现整体销量和同比。国内和整体金额采用同一 unit，海外规模由整体与国内之差计算；按真实数据填写。companyMark 为被讨论主体的透明静态标志，不得使用发布者角标。split.at 为开始讲海外部分的真实口播绝对秒数。",
  parameters: closed({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    title: text(24),
    sourceLine: text(34),
    companyMark: text(2048),
    unit: text(3),
    domestic: amountCard,
    foreign: closed({label: text(8), change: number(0, 200)}),
    total: amountCard,
    split: closed({at: {type: "number", minimum: 0}}),
  }),
};

function validate(input: unknown, duration: number) {
  const spec = input as SalesStructureSpec;
  const share = spec.domestic.amount / spec.total.amount;
  if (share <= .27 || share >= .73 || spec.domestic.change >= 0 || spec.foreign.change <= 0 || spec.total.change >= 0) {
    throw new Error("销量结构需要国内降、海外增、全量小幅下降，且两侧卡片都有可读面积");
  }
  if (spec.split.at < .67 || duration - spec.split.at < .76) throw new Error("需保留国内卡首次展开、拆分再停留的时间");
  const width = (value: string) => Array.from(value).reduce((sum, char) => sum + (/^[\x20-\x7e]$/.test(char) ? .55 : 1), 0);
  for (const [value, limit] of [
    [spec.title, 17.75], [spec.sourceLine, 26], [spec.unit, 3], [spec.domestic.label, 6], [spec.foreign.label, 8], [spec.total.label, 4.4],
  ] as const) {
    if (/[\r\n]/.test(value) || width(value) > limit) throw new Error("销量结构使用固定字位，请缩短文案");
  }
  if ([spec.domestic.change, spec.foreign.change, spec.total.change].some(value => !Number.isInteger(value))) {
    throw new Error("销量结构的同比字位使用整数百分比");
  }
}

export const salesStructureContract = {
  id: "latepost-V02_002",
  tag: "mg-v-sales-structure-split",
  title: "销量结构拆分",
  description: "国内销量整卡先展开，随后缩往右下。右上叠入海外销量卡，左侧亮出整体销量及同比。",
  minimumDuration: 1.7,
  definition,
  validate,
  media: () => [{type: "cutout" as const, path: ["companyMark"]}],
} as const;
