export const equalShareBarsId = "latepost-V13_004";
export const equalShareBarsMinDuration = 8;

export type EqualShareBarsSpec = {
  title: string;
  sourceLine: string;
  axisLabel: string;
  groups: {label: string; value: number}[];
  equalAmount: number;
  firstBar: {at: number};
  firstRatio: {at: number};
  otherBars: {at: number};
  otherRatios: {at: number};
};

const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
} as const);
const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const amount = {type: "integer", minimum: 1, maximum: 10_000_000} as const;
const cue = (description: string) => closed({at: {type: "number", minimum: 0, description}});

export const equalShareBarsFunction = {
  type: "function" as const,
  name: "create_portrait_equal_share_bars",
  strict: true as const,
  description: "仅 9:16。用于五个各占 20% 的等量分组叠加同一金额时的占比。按真实组值降序填写。动画先展示最高组与其占比，再补剩余的底条与占比。标题、资料来源行、轴注保持原版位置；百分比从等额金额和组值计算。事件 at 为实际口播的绝对秒数。",
  parameters: closed({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    title: text(26),
    sourceLine: text(29),
    axisLabel: text(14),
    groups: {type: "array", minItems: 5, maxItems: 5, items: closed({label: text(6), value: amount})},
    equalAmount: amount,
    firstBar: cue("开始读最高分组的金额"),
    firstRatio: cue("读最高分组占比"),
    otherBars: cue("开始讨论其他分组的金额"),
    otherRatios: cue("依次给出其他分组占比"),
  }),
};

export function validateEqualShareBars(spec: EqualShareBarsSpec, duration: number) {
  const cues = [spec.firstBar.at, spec.firstRatio.at, spec.otherBars.at, spec.otherRatios.at, duration];
  if (cues[0] < 2.7 || cues.slice(1).some((at, index) => at - cues[index] < [0.45, 0.35, 1.15, 1.1][index])) {
    throw new Error("等额占比需要依次留出最高组金额、最高组占比、其余底条及其余占比的原版动作");
  }
  if (spec.groups.some(({value}, index) => value < spec.equalAmount || (index > 0 && value > spec.groups[index - 1].value))) {
    throw new Error("五组原始金额必须按降序填写，每组金额须至少等于等额金额");
  }
  if (spec.groups.some(({label}) => /[\r\n]/.test(label))) {
    throw new Error("等额占比的分组名称必须适合单行显示");
  }
  for (const [value, limit] of [[spec.title, 19], [spec.sourceLine, 28], [spec.axisLabel, 12]] as const) {
    const units = Array.from(value).reduce((sum, char) => sum + (/^[\x20-\x7e]$/.test(char) ? 0.56 : 1), 0);
    if (/[\r\n]/.test(value) || units > limit) throw new Error("等额占比应缩短固定字号下放不进原版的文字");
  }
}
