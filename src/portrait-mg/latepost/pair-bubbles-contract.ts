export const pairBubblesId = "latepost-V12_004";
export const pairBubblesMinDuration = 2.7;

export type PairBubblesSpec = {
  year: number;
  watermarkImage: string;
  first: {label: string; value: number};
  second: {label: string; value: number; at: number};
  unit: string;
  note: string;
};

const object = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
} as const);
const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const amount = {label: text(6), value: {type: "integer", minimum: 1, maximum: 99999}};

export const pairBubblesFunction = {
  type: "function" as const,
  name: "create_portrait_side_by_side_amount_bubbles",
  strict: true as const,
  description: "仅 9:16。保留背景年号、对应主题的静态人物水印、两枚滚入的金额红圆、下方标签和原有注释。先显示较小的金额，再在介绍更大的第二项时向右让位。second.at 写真实口播绝对秒数。两值必须同一单位。最短 2.7 秒。",
  parameters: object({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    year: {type: "integer", minimum: 1900, maximum: 2099},
    watermarkImage: {type: "string", minLength: 1, maxLength: 2000, description: "主题人物的本地静态图。使用铺满水印区域的淡化铜版肖像风格，保留源素材类型。"},
    first: object(amount),
    second: object({...amount, at: {type: "number", minimum: 0}}),
    unit: text(3),
    note: text(32),
  }),
};

export function validatePairBubbles(spec: PairBubblesSpec, duration: number) {
  const relativeArea = spec.first.value / spec.second.value;
  if (relativeArea < .21 || relativeArea > .56) throw new Error("双金额圆的第一项须约为第二项的 21% 至 56%，使两组原有字位可读");
  if (spec.second.at < .95 || duration - spec.second.at < .85) throw new Error("双金额圆须留出先显示小圆及大圆完整入场的时间");
  for (const content of [spec.first.label, spec.second.label, spec.unit, spec.note]) {
    if (/[\r\n]/.test(content)) throw new Error("双金额圆的标签、单位和注释都是单行");
  }
}
