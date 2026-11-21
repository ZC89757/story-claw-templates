type TierColumn = {label: string; value: number};
type Focus = {label: string; valueText: string; firstColumn: number; lastColumn: number; at: number};

export type TierColumnFocusSpec = {
  title: string;
  sourceLine: string;
  columns: TierColumn[];
  focus: Focus[];
};

const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const columnNumber = {type: "integer", minimum: 1, maximum: 41} as const;

const definition = {
  type: "function" as const,
  name: "create_portrait_tier_column_focus",
  description: "仅 9:16。41 个按百分比降序排列的对象，底图固定为原版三阶分区。三个口播阶段分别强调居中对象、左侧一组和右侧对象。每阶段以 firstColumn 和 lastColumn 指明从 1 开始的闭区间，单项使用相同首尾。填写口播强调的真实百分比短语。",
  strict: true as const,
  parameters: closed({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    title: text(32),
    sourceLine: text(80),
    columns: {type: "array", minItems: 41, maxItems: 41, items: closed({label: text(6), value: {type: "number", minimum: 0, maximum: 100}})},
    focus: {
      type: "array", minItems: 3, maxItems: 3,
      items: closed({
        label: text(16),
        valueText: {...text(5), pattern: "^[<>]?[0-9]{1,3}(\\.[0-9])?%$"},
        firstColumn: columnNumber,
        lastColumn: columnNumber,
        at: {type: "number", minimum: 0, description: "开始讲述该阶段的绝对秒数。"},
      }),
    },
  }),
};

function validate(input: unknown, duration: number) {
  const spec = input as TierColumnFocusSpec;
  if (spec.columns[0].value <= 0 || spec.columns.some((column, index) => index > 0 && column.value > spec.columns[index - 1].value)) {
    throw new Error("三阶柱图的对象必须按真实百分比降序填写");
  }
  if (spec.focus.some((stage, index) => stage.firstColumn > stage.lastColumn
    || Number(stage.valueText.replace(/[^\d.]/g, "")) > 100
    || stage.at < (index ? spec.focus[index - 1].at + 1.01 : .65)) || duration - spec.focus[2].at < .85) {
    throw new Error("三阶柱图需要三个顺序阶段、有效柱区间和完整停留时间");
  }
  const [middle, left, right] = spec.focus;
  if (middle.firstColumn !== middle.lastColumn || middle.firstColumn < 14 || middle.lastColumn > 25
    || left.firstColumn >= left.lastColumn || left.lastColumn > 13
    || right.firstColumn !== right.lastColumn || right.firstColumn < 26) {
    throw new Error("三阶柱图的三个焦点分别落在中间单柱、左侧多柱及右侧单柱");
  }
  if (!/^\d{1,2}%$/.test(middle.valueText) || !/^[<>]?\d{1,2}%$/.test(left.valueText) || !/^\d%$/.test(right.valueText)) {
    throw new Error("百分比文案须符合原版三个数字位的宽度");
  }
  for (const [value, maximum] of [
    [spec.title, 17.6], [spec.sourceLine, 42], [middle.label, 12], [left.label, 14], [right.label, 11.3],
  ] as const) {
    const units = Array.from(value).reduce((sum, char) => sum + (/^[\x20-\x7e]$/.test(char) ? (/[WM]/.test(char) ? .85 : .55) : 1), 0);
    if (/[\r\n]/.test(value) || units > maximum) throw new Error("三阶柱图使用固定字号单行文字，请缩短文案");
  }
  if (spec.columns.some(column => /[\r\n]/.test(column.label))) throw new Error("柱名为连续短词，竖排由模板处理");
}

export const tierColumnFocusContract = {
  id: "latepost-V06_004",
  tag: "mg-v-tier-column-focus",
  title: "降序柱图逐项聚焦",
  description: "三阶降序底图左到右织入。点亮中间一项、左侧一组及末端一项，使用原版大红比例逐项聚焦。",
  minimumDuration: 3.6,
  definition,
  validate,
} as const;
