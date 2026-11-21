import {at, checkSpacing, clip, closed, identity, image, text, type Clip} from "./fields";

type Card = {name: string; logo: string};
export type BusinessTriangleSpec = {
  main: Card; left: Card & {at: number}; right: Card & {at: number};
  background: Clip; secondShot: Clip & {at: number}; fade: {at: number};
};

const card = {name: text(5), logo: image("可替换的业务标志，透明 PNG")};
const next = closed({...card, at: at("对应业务卡从下缘滑入的绝对秒数")});

export const businessTriangleContract = {
  id: "latepost-V11_005",
  tag: "mg-v-business-triangle-cards",
  title: "三角业务卡",
  description: "一张红色业务编号卡滑至上方，两张卡紧接着从下方滑到左右，镜头换底后三卡按同一节奏淡出。",
  minimumDuration: 2.35,
  definition: {
    type: "function",
    name: "create_portrait_business_triangle_cards",
    strict: true,
    description: "仅9:16。用三个短名和可替换业务标志总结三条业务线。第一张在镜头开头入场。left、right、secondShot、fade 的 at 均为绝对秒。",
    parameters: closed({
      ...identity, main: closed(card), left: next, right: next,
      background: clip("第一个横向业务实拍镜头"),
      secondShot: closed({...clip("第二个横向业务实拍镜头").properties, at: at("底片硬切的绝对秒数")}),
      fade: closed({at: at("三卡一起开始淡出的绝对秒数")}),
    }),
  },
  validate: (spec: unknown, duration: number) => {
    const {left, right, secondShot, fade} = spec as BusinessTriangleSpec;
    checkSpacing([0, left.at, right.at, fade.at, duration], [.45, .38, .65, .36], "三张业务卡需要依次滑入并留出共同呈现与淡出时间");
    checkSpacing([0, secondShot.at, duration], [.4, .4], "两个背景镜头都要保留可见时长");
  },
  media: (spec: Record<string, any>, duration: number) => [
    {type: "video" as const, path: ["background"], seconds: spec.secondShot.at},
    {type: "video" as const, path: ["secondShot"], seconds: duration - spec.secondShot.at},
    ...["main", "left", "right"].map((slot) => ({type: "cutout" as const, path: [slot, "logo"]})),
  ],
} as const;
