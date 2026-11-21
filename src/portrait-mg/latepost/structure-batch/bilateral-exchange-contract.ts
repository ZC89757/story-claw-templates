import {checkCueSpacing, chineseWidth, closed, lineText, rootFields, stillImage} from "./schema";

type Party = {label: string; image: string};
type Handoff = {label: string; image: string; at: number};
export type BilateralExchangeSpec = {
  supplier: Party;
  customer: Party & {at: number};
  outgoing: Handoff;
  returning: Handoff;
};

const image = stillImage("只提供该主体或物件的真实静态透明 PNG，保留原图视角。");
const party = {label: lineText(7), image};
const handoff = closed({label: lineText(5), image, at: {type: "number", minimum: 0, description: "口播开始解释这一次转移的绝对秒数"}});

function validate(spec: unknown, duration: number) {
  const {supplier, customer, outgoing, returning} = spec as BilateralExchangeSpec;
  checkCueSpacing([0, customer.at, outgoing.at, returning.at, duration], [.72, .64, .93, 2.2], "双方闭环需要依次显示第二主体、正向交易和反向交易及双方收入");
  if ([supplier, customer].some(item => chineseWidth(item.label) > 5.4)
    || [outgoing, returning].some(item => chineseWidth(item.label) > 4.3)) {
    throw new Error("双方闭环的角色或物件名称超出原版固定字位，请缩短名称");
  }
}

export const bilateralExchangeContract = {
  id: "latepost-V03_003",
  tag: "mg-v-bilateral-exchange",
  title: "双主体交易闭环",
  description: "用于两个主体以两种物件往返形成收入闭环。主体红圆对角排列，两枚暗色物件圆分别沿虚线弧亮起，双方分别落入银币。",
  minimumDuration: 4.6,
  definition: {
    type: "function",
    name: "create_portrait_bilateral_exchange",
    strict: true,
    description: "仅9:16。左上主体向右下主体送出一件物品，右下主体沿反向路线送回另一件。只填可替换名称、各自主体和物件透明 PNG 及口播绝对时间。银币和转移方向固定。",
    parameters: closed({
      ...rootFields,
      supplier: closed(party),
      customer: closed({...party, at: {type: "number", minimum: 0, description: "开始介绍第二主体的口播绝对秒数"}}),
      outgoing: handoff,
      returning: handoff,
    }),
  },
  validate,
  media: () => ["supplier", "customer", "outgoing", "returning"].map(key => ({type: "cutout" as const, path: [key, "image"]})),
} as const;
