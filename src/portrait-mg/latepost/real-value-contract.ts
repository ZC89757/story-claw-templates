export const realValueId = "latepost-V12_005";

export type RealValueSpec = {
  headline: [string, string];
  subtitle: string;
  note: string;
  portrait: string;
  axisLabel: string;
  axisStartYear: number;
  values: {year: number; percent: number}[];
  resultLead: string;
  compare: {at: number};
};

const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
} as const);
const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const year = {type: "integer", minimum: 1850, maximum: 2090};

export const realValueContract = {
  minimumDuration: 3.6,
  definition: {
    type: "function" as const,
    name: "create_portrait_real_value_comparison",
    strict: true as const,
    description: "仅 9:16。按真实年度描出以初值为 100% 的长期实际价值曲线，随后退灰，仅保留首尾红点、横向虚线、双向箭头与倍数。portrait 使用主题人物的透明静态 PNG。compare.at 为口播对比实际价值时的绝对秒数，倍数按末值计算。",
    parameters: closed({
      group: {type: "string", enum: ["portrait"]},
      order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
      headline: {type: "array", items: text(27), minItems: 2, maxItems: 2},
      subtitle: text(18),
      note: text(43),
      portrait: text(2000),
      axisLabel: text(5),
      axisStartYear: year,
      values: {type: "array", minItems: 6, maxItems: 80, items: closed({
        year, percent: {type: "number", minimum: 0, maximum: 360},
      })},
      resultLead: text(7),
      compare: closed({at: {type: "number", minimum: 0}}),
    }),
  },
  media: () => [{type: "cutout" as const, path: ["portrait"]}],
  validate(input: unknown, duration: number) {
    const spec = input as RealValueSpec;
    const last = spec.values.at(-1)!;
    if (spec.compare.at < 1.75 || duration - spec.compare.at < 1.25) {
      throw new Error("长期实际价值曲线需要完整描线和比较动画的时间");
    }
    if (spec.values[0].percent !== 100 || last.percent < 180
      || spec.values.some((point, index) => point.year < spec.axisStartYear || point.year > spec.axisStartYear + 130
        || (index > 0 && point.year <= spec.values[index - 1].year))) {
      throw new Error("实际价值数据必须按年严格递增，基准为 100%，结束值至少为基准的 1.8 倍");
    }
    for (const [value, maxWidth] of [
      [spec.headline[0], 18], [spec.headline[1], 18], [spec.subtitle, 17],
      [spec.note, 30], [spec.axisLabel, 5], [spec.resultLead, 5],
    ] as const) {
      const units = Array.from(value).reduce((width, char) => width + (/^[\x20-\x7e]$/.test(char) ? .57 : 1), 0);
      if (/[\r\n]/.test(value) || units > maxWidth) throw new Error("实际价值图的原字位固定，请缩短文案");
    }
  },
};
