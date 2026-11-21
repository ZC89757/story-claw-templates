import {checkCueSpacing, chineseWidth, closed, lineText, rootFields, stillImage} from "./schema";

type Company = {logo: string; name: string};
type Transaction = {lineOne: string; lineTwo: string; at: number};
export type TransactionLoopSpec = {
  top: Company;
  left: Company;
  right: Company;
  investment: Transaction;
  orderDeal: Transaction;
  purchase: Transaction;
};

const company = closed({logo: stillImage("真实静态标志图，分辨率满足近景特写"), name: lineText(10)});
const transaction = closed({
  lineOne: lineText(15),
  lineTwo: lineText(10),
  at: {type: "number", minimum: 0, description: "画面转向这笔交易的真实口播绝对秒数"},
});

function validate(spec: unknown, duration: number) {
  const {top, left, right, investment, orderDeal, purchase} = spec as TransactionLoopSpec;
  checkCueSpacing([0, investment.at, orderDeal.at, purchase.at, duration], [1, .8, 2.5, 1.2], "三方闭环须依次留出右侧特写、左侧特写及回到全图后补线的时间");
  if ([top, left, right].some(({name}) => chineseWidth(name) > 5.8)
    || [investment, orderDeal, purchase].some(({lineOne, lineTwo}) => chineseWidth(lineOne) > 8.6 || chineseWidth(lineTwo) > 7)) {
    throw new Error("三方闭环的公司名称或交易文案超出固定字位，请缩短文案");
  }
}

export const transactionLoopContract = {
  id: "latepost-V14_002",
  tag: "mg-v-transaction-loop",
  title: "三方交易闭环",
  description: "用于同一链路的三笔真实交易。三方标志节点呈三角形，镜头依次聚焦右方出资、左方订单，回到全图后补齐底部采购弧线。",
  minimumDuration: 5.5,
  definition: {
    type: "function",
    name: "create_portrait_transaction_loop",
    strict: true,
    description: "仅9:16竖屏。上方中心方将订单给左方，右方向中心方投资，左方向右方采购，三条连接次序固定。按真实交易填写标志图、公司名和两行文案，三处 at 均为真实口播绝对秒数。",
    parameters: closed({...rootFields, top: company, left: company, right: company, investment: transaction, orderDeal: transaction, purchase: transaction}),
  },
  validate,
  media: () => (["top", "left", "right"] as const).map(node => ({type: "image" as const, path: [node, "logo"]})),
} as const;
