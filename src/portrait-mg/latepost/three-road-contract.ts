export const threeRoadId = "latepost-V10_003";

type RoadOption = {label: string; appear: {at: number}};
type RejectedRoad = RoadOption & {reject: {at: number}};
export type ThreeRoadSpec = {
  title: string;
  first: RejectedRoad;
  second: RejectedRoad;
  remaining: RoadOption;
};

const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
} as const);
const cue = (description: string) => closed({at: {type: "number", minimum: 0, description}});
const option = {
  label: {type: "string", minLength: 1, maxLength: 4, description: "固定红框的短选项，最多两个全角字宽。"},
  appear: cue("原文首次说到本选项的绝对秒数"),
};
const rejected = closed({...option, reject: cue("原文否定本选项的绝对秒数")});

export const threeRoadContract = {
  minimumDuration: 4,
  definition: {
    type: "function" as const,
    name: "create_portrait_three_road_elimination",
    strict: true as const,
    description: "仅 9:16。适合逐一排除两个方案、保留第三个明确选项的场景。保持三条黑白透视道路、棋盘楼模、楼背后的红色四字标题；第一、第二条标出后划掉并压暗，第三条显示时继续高亮。at 填真实口播的绝对秒数。",
    parameters: closed({
      group: {type: "string", enum: ["portrait"]},
      order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
      title: {type: "string", minLength: 4, maxLength: 4, pattern: "^[一-龥]{4}$"},
      first: rejected,
      second: rejected,
      remaining: closed(option),
    }),
  },
  validate(input: unknown, duration: number) {
    const {first, second, remaining} = input as ThreeRoadSpec;
    const cues = [0, first.appear.at, first.reject.at, second.appear.at, second.reject.at, remaining.appear.at, duration];
    const gaps = [1.3, .3, .25, .3, .34, .45];
    if (gaps.some((gap, index) => cues[index + 1] - cues[index] + 1e-6 < gap)) {
      throw new Error("三岔路要为每个选项的原版入场、划除和剩余项停留保留时间");
    }
    if ([first, second, remaining].some(({label}) => Array.from(label).reduce((total, char) =>
      total + (/^[\x20-\x7e]$/.test(char) ? .57 : 1), 0) > 2 || /[\r\n]/.test(label))) {
      throw new Error("三岔路的选项红框只有两个全角字位，请缩短文字");
    }
  },
};
