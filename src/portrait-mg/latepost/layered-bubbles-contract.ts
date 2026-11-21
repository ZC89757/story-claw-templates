export const layeredBubblesId = "latepost-V13_005";
export const layeredBubblesMinDuration = 5.4;
type BubbleAmount = {value: number; detail: string; label: string};
export type LayeredBubblesSpec = {
  title: string;
  sourceLine: string;
  unit: string;
  main: BubbleAmount & {at: number};
  context: [BubbleAmount & {at: number}, BubbleAmount & {at: number}];
  large: BubbleAmount & {at: number};
  small: BubbleAmount;
};

const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
} as const);
const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const bubble = {value: {type: "number", minimum: 1, maximum: 99999}, detail: text(17), label: text(13)};
const timedBubble = closed({...bubble, at: {type: "number", minimum: 0}});

export const layeredBubblesFunction = {
  type: "function" as const,
  name: "create_portrait_layered_amount_bubbles",
  strict: true as const,
  description: "仅 9:16。五个同单位金额。主红圆先展开且随后显示左侧金额，上方两个较小的红圆依次作为历史参照，移出后主红圆向上淡化，新的大红圆与底部小蓝圆补入。各 at 为口播绝对秒数。标签与副行仅填画面原有字位。",
  parameters: closed({
    group: {type: "string", enum: ["portrait"]},
    order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
    title: text(18),
    sourceLine: text(24),
    unit: text(2),
    main: timedBubble,
    context: {type: "array", minItems: 2, maxItems: 2, items: timedBubble},
    large: timedBubble,
    small: closed(bubble),
  }),
};

export function validateLayeredBubbles(spec: LayeredBubblesSpec, duration: number) {
  const [middle, top] = spec.context;
  const {main, large, small} = spec;
  if (main.at < .6 || middle.at - main.at < .38 || top.at - middle.at < .36
    || large.at - top.at < .42 || duration - large.at < 1) {
    throw new Error("竖排金额圆的主值、两枚历史圆和最后一组比较必须依次完整出现");
  }
  if (large.value <= main.value || middle.value >= main.value || top.value >= middle.value || small.value >= main.value) {
    throw new Error("竖排金额圆需要两个较小历史值，以及一大一小两个新参照");
  }
  const minimums = [[main, .42], [middle, .18], [top, .1], [small, .21]] as const;
  if (minimums.some(([part, min]) => part.value / large.value < min)) {
    throw new Error("金额比例过小会使原有圆内字位无法阅读");
  }
  for (const [item, rowLimit] of [[main, 12], [middle, 9], [top, 7], [large, 12], [small, 9]] as const) {
    const units = (value: string) => Array.from(value).reduce((sum, char) => sum + (/^[\x20-\x7e]$/.test(char) ? .55 : 1), 0);
    if ([item.detail,item.label].some(value => /[\r\n]/.test(value) || units(value) > rowLimit)) {
      throw new Error("竖排金额圆的圆内两行使用原字号，请缩短文字");
    }
    if (String(item.value).length > 6) throw new Error("金额数字超出固定字位，请换用更高一级的单位");
  }
}
