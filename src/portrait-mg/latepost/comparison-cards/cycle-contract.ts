import {at, checkSpacing, closed, identity, text} from "./fields";

type Path = {label: string; days: number; at: number};
export type CycleSpec = {
  structure: {abbreviation: string; title: string; stamp: string; investor: string; shell: string; foreign: string; local: string};
  direct: Path; indirect: Path;
  earlier: {label: string; at: number}; later: {label: string; at: number};
};

const path = closed({label: text(13), days: {type: "integer", minimum: 1, maximum: 999}, at: at("该周期红条开始伸展的绝对秒数")});
const conclusion = closed({label: {...text(3), minLength: 3}, at: at("结论字样出现的绝对秒数")});

export const cycleContract = {
  id: "latepost-V10_005", tag: "mg-v-listing-cycle-rewrite", title: "周期条与结论改写",
  description: "带章的立体架构卡上移，下方斜排周期红条由下至上展开，压暗后白字结论切换成红字。",
  minimumDuration: 3.6,
  definition: {
    type: "function", strict: true, name: "create_portrait_listing_cycle_rewrite",
    description: "仅9:16。适合用一个境内外分层架构、两条合规路径及真实天数比较流程耗时。较短路径在下先出现，较长路径在上随后出现，最后由白字三字旧判断改成红字三字结论。所有 at 为绝对秒。",
    parameters: closed({
      ...identity,
      structure: closed({abbreviation: text(4), title: text(6), stamp: {...text(2), minLength: 2}, investor: text(5), shell: text(5), foreign: text(6), local: text(5)}),
      direct: path, indirect: path, earlier: conclusion, later: conclusion,
    }),
  },
  validate: (spec: unknown, duration: number) => {
    const {direct, indirect, earlier, later} = spec as CycleSpec;
    checkSpacing([0, direct.at, indirect.at, earlier.at, later.at, duration], [.5,.65,1,.65,.6], "须按短周期、长周期、旧判断、新结论的顺序留足最短呈现时间");
    if (indirect.days <= direct.days) throw new Error("上方的间接路径天数必须大于直接路径天数");
  },
} as const;
