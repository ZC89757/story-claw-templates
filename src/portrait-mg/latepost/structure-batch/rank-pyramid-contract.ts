import {checkCueSpacing, closed, cue, lineText, rootFields, stillImage} from "./schema";

export type RankPyramidSpec = {
  portrait: string;
  name: string;
  latinName: string;
  rankLabel: string;
  lowestRank: number;
  rise: {at: number};
};

function validate(spec: unknown, duration: number) {
  const {latinName, rise} = spec as RankPyramidSpec;
  checkCueSpacing([0, rise.at, duration], [1.0, .97], "职级阶梯须留出人物介绍及全部十级阶梯的入场时间");
  const latinWidth = Array.from(latinName).reduce((sum, letter) => {
    if ("MW@mw".includes(letter)) return sum + .84;
    if ("iIljtfr .,:;!()".includes(letter)) return sum + .31;
    return sum + (/[A-Z]/.test(letter) ? .67 : .5);
  }, 0);
  if (!/^[\x20-\x7e]+$/.test(latinName) || latinWidth > 5.1) {
    throw new Error("英文姓名需要使用可放进原版窄字位的短拉丁文");
  }
}

export const rankPyramidContract = {
  id: "latepost-V01_002",
  tag: "mg-v-rank-pyramid",
  title: "人物职级阶梯",
  description: "用于人物介绍后点明人物达到十级递进职级中的最高一级。红框圆形头像向右上移动，十级红色阶梯由下往上叠入，箭角指向头像。",
  minimumDuration: 2.3,
  definition: {
    type: "function",
    name: "create_portrait_rank_pyramid",
    strict: true,
    description: "仅9:16。十级由低到高依次叠起并指向最高一级；人物照片保留圆形裁切，填写真实姓名和职级，rise.at 为口播开始说明职级的绝对秒数。",
    parameters: closed({
      ...rootFields,
      portrait: stillImage("人物真实静态肖像，主体居于中心，头肩须能在圆窗中清楚辨认"),
      name: lineText(4),
      latinName: lineText(13),
      rankLabel: lineText(2),
      lowestRank: {type: "integer", minimum: 0, maximum: 90},
      rise: cue("人物介绍切入阶梯及最高职级的真实绝对秒数"),
    }),
  },
  validate,
  media: () => [{type: "image" as const, path: ["portrait"]}],
} as const;
