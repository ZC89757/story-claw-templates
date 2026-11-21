type RankRow = {name: string; image: string; nextRank: number};
export type RankReorderSpec = {
  firstTitle: string;
  secondTitle: string;
  sourceLine: string;
  rows: RankRow[];
  leadHighlight: {at: number};
  reorder: {at: number};
};

const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const cue = (description: string) => closed({at: {type: "number", minimum: 0, description}});

const definition = {
  type: "function" as const,
  name: "create_portrait_rank_reorder",
  description: "仅 9:16。在两期排名间重排同一批四个对象。rows 按第一期顺序填写，nextRank 是各对象第二期名次。每个对象填透明 PNG。真实口播时间先触发首位红条，再切第二期标题并移动对象；两期首位必须变化。标题与来源保留原位。",
  strict: true as const,
  parameters: closed({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    firstTitle: text(28),
    secondTitle: text(28),
    sourceLine: text(43),
    rows: {
      type: "array", minItems: 4, maxItems: 4,
      items: closed({
        name: text(11),
        image: {...text(2048), description: "已准备的透明 PNG，主体侧视，朝向与原示例一致。"},
        nextRank: {type: "integer", minimum: 1, maximum: 4},
      }),
    },
    leadHighlight: cue("口播指出第一期头名的绝对秒数。"),
    reorder: cue("开始说明第二期榜单的绝对秒数。"),
  }),
};

function validate(input: unknown, duration: number) {
  const spec = input as RankReorderSpec;
  if (new Set(spec.rows.map(row => row.nextRank)).size !== 4 || spec.rows[0].nextRank === 1) {
    throw new Error("跨期榜单需要四个不同的新名次，且头名换位");
  }
  if (new Set(spec.rows.map(row => row.name)).size !== 4) throw new Error("跨期榜单中的四个对象应可区分");
  if (spec.leadHighlight.at < 0.48 || spec.reorder.at - spec.leadHighlight.at < 0.45 || duration - spec.reorder.at < 0.66) {
    throw new Error("跨期榜单须保留首次入场、头名红条和重排停留的时间");
  }
  for (const [value, maximum] of [[spec.firstTitle, 12], [spec.secondTitle, 13], [spec.sourceLine, 23], ...spec.rows.map(({name}) => [name, 6] as const)] as const) {
    const units = Array.from(value).reduce((sum, char) => sum + (/^[\x20-\x7e]$/.test(char) ? (/[WM]/.test(char) ? .85 : .54) : 1), 0);
    if (/[\r\n]/.test(value) || units > maximum) throw new Error("跨期榜单使用固定字号单行文字，请缩短文案");
  }
}

export const rankReorderContract = {
  id: "latepost-V02_001",
  tag: "mg-v-rank-reorder",
  title: "跨期榜单换位",
  description: "同一批四个对象按第一期依次落位。首位铺红，第二期逐字换标题，对象与名称同步沿各行换位。",
  minimumDuration: 2.1,
  definition,
  validate,
  media: (spec: unknown) => (spec as RankReorderSpec).rows.map((_, index) => ({type: "cutout" as const, path: ["rows", index, "image"]})),
} as const;
