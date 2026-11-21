import {checkCueSpacing, chineseWidth, closed, cue, lineText, rootFields, stillImage} from "./schema";

type Participant = {name: string; photo: string};
type Cue = {at: number};
type Rate = Cue & {rate: number};
export type RevenueDistributionSpec = {
  upstream: Participant;
  broker: Participant;
  factory: Participant;
  worker: Participant;
  purchase: Rate & {label: string};
  workerPay: Rate;
  factoryPay: Rate;
  margin: Cue;
  equipment: Cue & {count: number};
  hours: Cue & {count: number};
  deposit: Cue & {amount: number};
  expand: Cue & {multiplier: number};
};

const participant = closed({name: lineText(6), photo: stillImage("已准备好的静态人物照片，人物居于中间，适合原版圆形裁取。")});
const at = {type: "number", minimum: 0, description: "实际口播绝对秒数"} as const;
const rate = closed({rate: {type: "number", minimum: .01, maximum: 999.99}, at});

function validate(spec: unknown, duration: number) {
  const {upstream, broker, factory, worker, purchase, workerPay, factoryPay, margin, equipment, hours, deposit, expand} = spec as RevenueDistributionSpec;
  checkCueSpacing([0, purchase.at, workerPay.at, factoryPay.at, margin.at, equipment.at, hours.at, deposit.at, expand.at, duration],
    [.35, .48, .5, .62, .5, .48, 1.45, 1.04, 1.65], "分账和推演需依次显示收购、分账、工时收入、押金和规模变化");
  const retained = purchase.rate - workerPay.rate - factoryPay.rate;
  const rates = [purchase.rate, workerPay.rate, factoryPay.rate];
  if (retained <= .001 || rates.some(value => Math.abs(value * 100 - Math.round(value * 100)) > 1e-7)
    || retained * hours.count * expand.multiplier > 9_999_999 || equipment.count * expand.multiplier > 99_999) {
    throw new Error("分账需使用两位小数内的真实费率，保留正的中间商收入，推演结果需能放入固定的小字字位");
  }
  if ([upstream, factory, worker].some(item => chineseWidth(item.name) > 4.5)
    || chineseWidth(broker.name) > 3.8 || chineseWidth(purchase.label) > 5.2) {
    throw new Error("角色名称超出固定字位，请缩短名称");
  }
}

export const revenueDistributionContract = {
  id: "latepost-V03_004",
  tag: "mg-v-revenue-distribution",
  title: "角色分账与收入推演",
  description: "用于一笔按时收费由上游、经手人、工厂和工人四方分账。先补齐白色折线和费率，再算工时收入、补入押金及规模变化，在原有落位标红结果。",
  minimumDuration: 9.7,
  definition: {
    type: "function",
    name: "create_portrait_revenue_distribution",
    strict: true,
    description: "仅9:16。四方各用一张居中的真实人物图片并保留圆窗。元/小时为固定单位，分账、工时收入与扩张结果由模板算出。填业务金额、数量和实际口播绝对时间，保持事件顺序。",
    parameters: closed({
      ...rootFields,
      upstream: participant, broker: participant, factory: participant, worker: participant,
      purchase: closed({...rate.properties, label: lineText(7)}),
      workerPay: rate, factoryPay: rate,
      margin: cue("开始介绍剩余中间商收费的绝对秒数"),
      equipment: closed({count: {type: "integer", minimum: 1, maximum: 9999}, at}),
      hours: closed({count: {type: "integer", minimum: 1, maximum: 99999}, at}),
      deposit: closed({amount: {type: "integer", minimum: 1, maximum: 9999999}, at}),
      expand: closed({multiplier: {type: "integer", minimum: 2, maximum: 99}, at}),
    }),
  },
  validate,
  media: () => ["upstream", "broker", "factory", "worker"].map(key => ({type: "image" as const, path: [key, "photo"]})),
} as const;
