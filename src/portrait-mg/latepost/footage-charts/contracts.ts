type Cue = {at: number};
export type PeakEndSpec = {
  portrait: string;
  person: {name: string; english: string; role: string};
  principle: {name: string; english: string; at: number};
  curve: Cue;
  peak: {label: string; at: number};
  endpoint: {label: string; at: number};
};

const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const line = (maxLength: number, description: string) => ({
  type: "string", minLength: 1, maxLength, pattern: "^[^\\r\\n]+$", description,
});
const at = (description: string) => ({type: "number", minimum: 0, description});
const envelope = {
  group: {type: "string", enum: ["portrait"]},
  order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
};

export const peakEndContract = {
  id: "latepost-V05_003",
  tag: "mg-v-peak-end-curve",
  title: "峰终定律体验曲线",
  description: "黑白人物照片缓慢拉远。体验曲线在上方从左至右绘制，镜头沿曲线先聚焦中间峰值，再向右带出终点。两个关键位置以红色圆斑标出。",
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_peak_end_curve",
    description: "仅用于解释峰终定律或等义表述。曲线为定性示意。四个 at 均为旁白时间轴绝对秒数。",
    parameters: closed({
      ...envelope,
      portrait: line(2000, "黑白人物照片路径，使用 360:202 的横向构图，面部位于画面右侧。"),
      person: closed({
        name: line(8, "人物名，固定字位。"),
        english: line(24, "英文姓名，固定字位。"),
        role: line(14, "人物身份，固定字位。"),
      }),
      principle: closed({
        name: line(5, "定律中文名，固定字位。"),
        english: line(16, "定律英文名，固定字位。"),
        at: at("两行定律名称入场的绝对秒数。"),
      }),
      curve: closed({at: at("白色体验曲线开始描画的绝对秒数。")}),
      peak: closed({label: line(2, "峰值标记短词。"), at: at("首次聚焦峰值的绝对秒数。")}),
      endpoint: closed({label: line(2, "终点标记短词。"), at: at("转向体验终点的绝对秒数。")}),
    }),
  },
  minimumDuration: 6.2,
  validate(spec: unknown, duration: number) {
    const {principle, curve, peak, endpoint} = spec as PeakEndSpec;
    if (principle.at < 1.8 || curve.at - principle.at < .42 || peak.at - curve.at < 1.2 ||
        endpoint.at - peak.at < .64 || duration - endpoint.at < 1.1) {
      throw new Error("请按定律名称、描画曲线、峰值、终点依次安排旁白时点，并留出末段停留。");
    }
  },
  media: () => [{type: "image" as const, path: ["portrait"]}],
} as const;



type RevenueItem = {label: string; amount: number};
export type RevenuePieSpec = {
  background: {source: string; sourceStart: number};
  title: string;
  source: string;
  total: number;
  unit: string;
  retail: RevenueItem & Cue;
  franchise: RevenueItem & Cue;
  leased: RevenueItem;
  other: RevenueItem;
};

const amount = {type: "number", minimum: .01, maximum: 999.99};
const item = (max: number, description: string) => ({label: line(max, description), amount});

export const revenuePieContract = {
  id: "latepost-V05_005",
  tag: "mg-v-revenue-pie",
  title: "实拍底营收饼图",
  description: "枕头实拍暗底上先亮出标题、灰色整圆与总收入，随后红色零售扇区上浮、数字滚动，再突出左侧酒店加盟扇区与两个小项。",
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_revenue_pie",
    description: "仅 9:16。用于四项收入结构，两项主要收入和两项小额收入。按右侧主项、左侧主项的顺序讲解，两个 at 为旁白时间轴绝对秒数。",
    parameters: closed({
      ...envelope,
      background: closed({
        source: line(2000, "相关实拍视频路径。使用完整连续运动画面，无字幕、博主标志、角标和平台水印。"),
        sourceStart: {type: "number", minimum: 0},
      }),
      title: line(19, "报表标题，单行固定字位。"),
      source: line(16, "报表数据出处。"),
      total: amount,
      unit: line(2, "统一金额单位，如亿元。"),
      retail: closed({...item(4, "右侧主项短标签。"), at: at("突出右侧主项的绝对秒数。")}),
      franchise: closed({...item(4, "左侧主项标签，下一行固定为收入。"), at: at("转向左侧主项与两个小项的绝对秒数。")}),
      leased: closed(item(4, "左下小项标签，下一行固定为收入。")),
      other: closed(item(2, "右下小项短标签。")),
    }),
  },
  minimumDuration: 4.6,
  validate(spec: unknown, duration: number) {
    const {retail, franchise, leased, other, total, title} = spec as RevenuePieSpec;
    const titleWidth = Array.from(title).reduce((width, character) =>
      width + (/^[\x20-\x7e]$/.test(character) ? .6 : 1), 0);
    if (titleWidth > 13) throw new Error("标题超出固定字位，请缩短文案。");
    const sum = retail.amount + franchise.amount + leased.amount + other.amount;
    if (Math.abs(total - sum) > .020001) throw new Error("总收入须等于四项之和，允许报表四舍五入产生的尾差。");
    if (retail.amount / sum < .27 || retail.amount / sum > .47 ||
        franchise.amount / sum < .43 || (leased.amount + other.amount) / sum > .13) {
      throw new Error("金额占比须适应两大两小的固定饼图布局。");
    }
    if (retail.at < 1.1 || franchise.at - retail.at < 2.1 || duration - franchise.at < 1.4) {
      throw new Error("请给灰圆、右侧出场、左侧出场依次留足播放时间。");
    }
  },
  media: (_spec: unknown, duration: number) => [{type: "video" as const, path: ["background"], seconds: duration}],
} as const;

export const footageChartContracts = [peakEndContract, revenuePieContract] as const;


