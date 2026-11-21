import {checkCueSpacing, chineseWidth, closed, cue, lineText, rootFields} from "./schema";

export type PromotionRouteSpec = {
  title: string;
  englishTitle: string;
  roles: string[];
  leadNote: string;
  expand: {at: number};
};

function validate(spec: unknown, duration: number) {
  const {expand, roles, leadNote, englishTitle} = spec as PromotionRouteSpec;
  checkCueSpacing([0, expand.at, duration], [.27, 1.35], "晋升路线须留出首节点进入和整条路线展开的时间");
  const englishWidth = [...englishTitle].reduce((width, letter) => {
    if ("MW@%".includes(letter)) return width + .92;
    if ("mw".includes(letter)) return width + .73;
    if ("iIljtfr .,:;!()".includes(letter)) return width + .31;
    return width + (/[A-Z]/.test(letter) ? .65 : .53);
  }, 0);
  if (roles.some(role => chineseWidth(role) > 10.4) || chineseWidth(leadNote) > 17
    || !/^[\x20-\x7e]+$/.test(englishTitle) || englishWidth > 14.4) {
    throw new Error("晋升路线的岗位、注释或英文副题超出固定字位，请缩短文案");
  }
}

export const promotionRouteContract = {
  id: "latepost-V15_002",
  tag: "mg-v-promotion-route",
  title: "岗位晋升路线",
  description: "用于七级职位或能力等级的晋升路径。节点沿中轴向下依次亮起，职位名左右交错，第五级用红点和小字标记。",
  minimumDuration: 2.65,
  definition: {
    type: "function",
    name: "create_portrait_promotion_route",
    strict: true,
    description: "仅9:16竖屏。七级晋升路线，第五个岗位固定标红并带一行说明。expand.at 为从首职位转入后续等级时的真实口播绝对秒数。",
    parameters: closed({
      ...rootFields,
      title: lineText(8),
      englishTitle: lineText(38),
      roles: {type: "array", minItems: 7, maxItems: 7, items: lineText(15)},
      leadNote: lineText(20),
      expand: cue("开始从首职位往下展开其他等级的绝对秒数"),
    }),
  },
  validate,
} as const;
