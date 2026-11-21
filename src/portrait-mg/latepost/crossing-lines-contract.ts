export const crossingLinesId = "latepost-V10_002";
export const crossingLinesMinDuration = 5.8;

type Series = {label: string; values: number[]};
export type CrossingLinesSpec = {
  title: string;
  firstYear: number;
  rising: Series;
  declining: Series & {at: number};
};

const percentage = {type: "number", minimum: 0, maximum: 100} as const;
const series = {
  label: {type: "string", minLength: 1, maxLength: 9},
  values: {type: "array", items: percentage, minItems: 7, maxItems: 7},
};
const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
} as const);

export const crossingLinesFunction = {
  type: "function" as const,
  name: "create_portrait_crossing_percentage_lines",
  strict: true as const,
  description: "仅 9:16。七个连续年份内，灰色份额线已经上升，红色份额线按讲述向下描出并与灰线交叉。填写真实百分比，勿编造走势。declining.at 是口播开始解释红线反转的绝对秒数。整个片段至少 5.8 秒。",
  parameters: closed({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    title: {type: "string", minLength: 1, maxLength: 17},
    firstYear: {type: "integer", minimum: 1900, maximum: 2093},
    rising: closed(series),
    declining: closed({...series, at: {type: "number", minimum: 0}}),
  }),
};

export function validateCrossingLines(spec: CrossingLinesSpec, duration: number) {
  const {title, rising, declining} = spec;
  const {at} = declining;
  if (at < 1.8 || duration - at < 2.3) {
    throw new Error("交叉折线必须保留红线标签预告及至少 2.3 秒描线时间");
  }
  for (const [text, limit] of [[title, 11.5], [rising.label, 8], [declining.label, 9]] as const) {
    const units = Array.from(text).reduce((sum, char) => sum + (/^[\x20-\x7e]$/.test(char) ? .66 : 1), 0);
    if (/[\r\n]/.test(text) || units > limit) throw new Error("交叉折线的标题和图例为固定字号的单行，请缩短文案");
  }
  if (rising.values.some((value, index) => index > 0 && value < rising.values[index - 1])
    || declining.values.some((value, index) => index > 0 && value > declining.values[index - 1])
    || declining.values[0] <= rising.values[0]
    || declining.values[6] >= rising.values[6]) {
    throw new Error("交叉折线需要一升一降、且在七年内交叉的真实百分比");
  }
}
