type NodeWeight = {label: string; share: number};
type TreeLayer = {label: string; cells: NodeWeight[]};

export type PortfolioTreemapSpec = {
  title: string;
  portraitImage: string;
  stock: TreeLayer;
  alternative: NodeWeight & {subtitle: string};
  fixedIncome: TreeLayer;
  infrastructure: NodeWeight;
  principles: {text: string; at: number}[];
};

const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const share = {type: "number", minimum: .1, maximum: 95} as const;
const cell = {label: text(12), share};
const cells = (count: number) => closed({label: text(13), cells: {type: "array", items: closed(cell), minItems: count, maxItems: count}});
export const sumTreeShares = (group: readonly NodeWeight[]) => group.reduce((total, node) => total + node.share, 0);

const definition = {
  type: "function" as const,
  name: "create_portrait_portfolio_treemap",
  description: "仅 9:16。按原版固定拓扑铺开股票、另类资产、固定收益、房地产四块并累计各组占比，再依次贴出三条分析原则。share 为叶节点占总额的真实百分点，合计须为 100；禁止用预览量取值当正式数据。股票 7 块、固定收益 4 块。左侧股票前两项、右侧股票其余 5 项依原版排列。portraitImage 使用独立静态人物像，模板处理淡化。",
  strict: true as const,
  parameters: closed({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    title: text(26),
    portraitImage: {...text(2048), description: "带 Alpha 的静态人物肖像 PNG 路径，人物侧面轮廓用来构成树图后方的淡水印。"},
    stock: cells(7),
    alternative: closed({...cell, subtitle: text(16)}),
    fixedIncome: cells(4),
    infrastructure: closed(cell),
    principles: {
      type: "array", minItems: 3, maxItems: 3,
      items: closed({
        text: text(5),
        at: {type: "number", minimum: 0, description: "这条原则原文口播的绝对秒数。"},
      }),
    },
  }),
};

function validate(input: unknown, duration: number) {
  const spec = input as PortfolioTreemapSpec;
  const stock = sumTreeShares(spec.stock.cells);
  const fixedIncome = sumTreeShares(spec.fixedIncome.cells);
  const total = stock + fixedIncome + spec.alternative.share + spec.infrastructure.share;
  if (Math.abs(total - 100) > .05) throw new Error("矩形树图的叶节点占比必须合计 100%");
  const left = sumTreeShares(spec.stock.cells.slice(0, 2)) + spec.alternative.share;
  const right = total - left;
  if (left < 39 || left > 67 || spec.alternative.share / left < .20
    || fixedIncome / right < .12 || spec.infrastructure.share / right < .12) {
    throw new Error("这组占比不能在原版左右两列的拓扑内排出可读区域，请选适合数据的布局");
  }
  const times = spec.principles.map(item => item.at);
  if (times[0] < 2.25 || times[1] - times[0] < .29 || times[2] - times[1] < .29 || duration - times[2] < .45) {
    throw new Error("矩形树图需要先铺图并完成累计，再按原版依次展现三条原则");
  }
  const bounds: [string, number][] = [
    [spec.title, 17.2], [spec.stock.label, 5], [spec.fixedIncome.label, 8],
    [spec.alternative.label, 7], [spec.alternative.subtitle, 13], [spec.infrastructure.label, 11],
    ...spec.stock.cells.map((item, index): [string, number] => [item.label, [6, 6, 6, 4, 6, 7, 2][index]]),
    ...spec.fixedIncome.cells.map((item, index): [string, number] => [item.label, [6, 7, 7, 2][index]]),
    ...spec.principles.map((item, index): [string, number] => [item.text, [4, 4, 4][index]]),
  ];
  for (const [value, maximum] of bounds) {
    const units = Array.from(value).reduce((sum, char) => sum + (/^[\x20-\x7e]$/.test(char) ? (/[WM]/.test(char) ? .85 : .56) : 1), 0);
    if (/[\r\n]/.test(value) || units > maximum) throw new Error("矩形树图使用固定字号，请缩短超出原字位的文案");
  }
}

export const portfolioTreemapContract = {
  id: "latepost-V12_003",
  tag: "mg-v-portfolio-treemap",
  title: "资产配置矩形树图",
  description: "淡色人物像上铺入四类资产的圆角矩形，各组百分比同时上升，三张白条按讲述顺序压在指定位置。",
  minimumDuration: 3.3,
  definition,
  validate,
  media: () => [{type: "cutout" as const, path: ["portraitImage"]}],
} as const;
