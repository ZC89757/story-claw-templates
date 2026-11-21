import {at, checkSpacing, clip, closed, identity, image, text, type Clip} from "./fields";

type PlayingCard = {label: string; figure: string};
export type TableRevealSpec = {heading: string; left: PlayingCard; right: PlayingCard; hidden: PlayingCard & {at: number}};
const playingCard = {label: text(7), figure: image("纸牌前景角色透明 PNG，边缘已去底")};

export const tableRevealContract = {
  id: "latepost-V11_001", tag: "mg-v-card-table-third-reveal", title: "第三方牌桌揭晓",
  description: "绿呢台面升起，两张话题牌从下方斜滑并交错，第三张剪影牌叠入前层，前两张退出。",
  minimumDuration: 2,
  definition: {
    type: "function", strict: true, name: "create_portrait_card_table_third_reveal",
    description: "仅9:16。以两个热门参与方衬托未知第三方。台面和第一、二张牌在镜头开始触发，第三张牌按 hidden.at 绝对秒进入。台面标题须三个汉字，第三张牌用黑色剪影。",
    parameters: closed({
      ...identity, heading: {...text(3), minLength: 3}, left: closed(playingCard), right: closed(playingCard),
      hidden: closed({...playingCard, label: text(2), at: at("第三张牌叠到前景的绝对秒数")}),
    }),
  },
  validate: (spec: unknown, duration: number) => {
    const {hidden} = spec as TableRevealSpec;
    checkSpacing([0, hidden.at, duration], [1.05, .85], "至少留出两张牌入场和第三张牌完整揭晓的时长");
  },
  media: () => ["left", "right", "hidden"].map(slot => ({type: "cutout" as const, path: [slot, "figure"]})),
} as const;

export type ScrollCardsSpec = {
  background: Clip;
  first: {label: string; figure: string};
  second: {label: string; figure: string; at: number};
};
const step = {label: text(6), figure: image("红色编号卡内的简洁图形，透明 PNG")};

export const scrollCardsContract = {
  id: "latepost-V11_003", tag: "mg-v-price-scroll-steps", title: "滚动比价页叠卡",
  description: "压暗的两列报价页录屏连续滚动，两张红色步骤卡依次从下方滑入并排停留。",
  minimumDuration: 1.7,
  definition: {
    type: "function", strict: true, name: "create_portrait_price_scroll_steps",
    description: "仅9:16。用真实商品报价页的连续滚屏视频做底，展示两步平台动作。第一张红卡在镜头开始出现，second.at 为第二张划入的绝对秒数。",
    parameters: closed({
      ...identity, background: clip("不含创作者标记的连续比价网页录屏，两列商品与价格"),
      first: closed(step), second: closed({...step, at: at("右侧步骤卡入场的绝对秒数")}),
    }),
  },
  validate: (spec: unknown, duration: number) => {
    const {second} = spec as ScrollCardsSpec;
    checkSpacing([0, second.at, duration], [.65, .9], "两张卡应分别进场，且第二张有完整展示时间");
  },
  media: (_spec: unknown, duration: number) => [
    {type: "video" as const, path: ["background"], seconds: duration},
    {type: "cutout" as const, path: ["first", "figure"]},
    {type: "cutout" as const, path: ["second", "figure"]},
  ],
} as const;
