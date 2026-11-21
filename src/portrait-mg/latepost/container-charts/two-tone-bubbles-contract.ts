import {at, closed, line, requireSpacing, rootFields} from "../product-scenes/schema";

type Quantity = {value: string; at: number};
type BubbleGroup = {name: string; workers: Quantity; output: Quantity};

export type TwoToneBubbleSpec = {
  title: string;
  sourceNote: string;
  first: BubbleGroup;
  second: BubbleGroup & {at: number};
  workerUnit: string;
  outputUnit: string;
};

const quantity = (pattern: string, description: string) => closed({
  value: {...line(5, "数字，保留视觉允许的位数"), pattern},
  at: at(description),
});
const bubble = (side: string) => ({
  name: line(4, side + "下方的四字以内名称"),
  workers: quantity("^[1-9][0-9]?(\\.[0-9])?$", side + "的实心圆及人数入场"),
  output: quantity("^[1-9][0-9]{0,2}(\\.[0-9])?$", side + "的半透明大圆入场"),
});

export const twoToneBubbleContract = {
  id: "latepost-V04_001",
  tag: "mg-v-two-tone-output-bubbles",
  title: "双色气泡对照",
  description: "固定横向红蓝双圆。左侧名称、人数实心圆和产量外圈依次出现，接着右侧以相同顺序展开，重叠处持续透出双色。",
  minimumDuration: 4.3,
  definition: {
    type: "function",
    name: "create_portrait_two_tone_output_bubbles",
    strict: true,
    description: "仅 9:16。对照两组工人数和产出，第一组产出较大，第二组人数略多。红蓝圆及字位采用固定参考比例，第二组产量宜为第一组的约一半。请用同一单位，并缩短文案以适合固定字号。所有 at 都填真实口播绝对秒数。",
    parameters: closed({
      ...rootFields,
      title: line(13, "左上已有白色标题"),
      sourceNote: line(27, "标题下方已有灰色斜体数据来源短注"),
      first: closed(bubble("左侧红组")),
      second: closed({...bubble("右侧蓝组"), at: at("右侧名称入场")}),
      workerUnit: line(5, "两组人数单位"),
      outputUnit: line(4, "两组产量单位"),
    }),
  },
  validate(spec: unknown, duration: number) {
    const value = spec as TwoToneBubbleSpec;
    const {first, second} = value;
    requireSpacing([0, first.workers.at, first.output.at, second.at, second.workers.at, second.output.at, duration],
      [.26, .48, .85, .38, .48, .9], "双色气泡依次入场，每组须为小圆、大圆、数字预留完整展开时间");
    const workers = Number(second.workers.value) / Number(first.workers.value);
    const output = Number(second.output.value) / Number(first.output.value);
    if (workers < 1 || workers > 1.35 || output < .37 || output > .56) {
      throw new Error("双色气泡固定圆形比例要求右组人数接近且不低于左组，右组产出约为左组的 37%–56%");
    }
  },
} as const;
