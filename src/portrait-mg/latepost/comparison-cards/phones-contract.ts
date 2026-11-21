import {at, checkSpacing, closed, identity, image, text} from "./fields";

type Quote = {price: number; at: number};
export type PhonesSpec = {
  room: {photo: string; name: string; area: string; bed: string; guests: string; amenity: string};
  rightLogo: string; leftLogo: string; initialPrice: number; rounds: Quote[];
};

const price = {type: "integer", minimum: 1, maximum: 9999};
export const phonesContract = {
  id: "latepost-V08_004", tag: "mg-v-dueling-phone-prices", title: "双手机交替压价",
  description: "两张持机订房页共用房型图片。左右手机交替移到前层，同时红色房价逐轮向下翻动。",
  minimumDuration: 4,
  definition: {
    type: "function", strict: true, name: "create_portrait_dueling_phone_prices",
    description: "仅9:16。两个订房平台比价，先出现右侧起价，再按左、右交替给出六个持续下降的报价。两部手机共用同一个房型与属性。六个 at 都是实际口播绝对秒数。",
    parameters: closed({
      ...identity,
      room: closed({photo: image("酒店房型室内图片"), name: text(7), area: text(6), bed: text(7), guests: text(6), amenity: text(7)}),
      rightLogo: image("起价方订房业务标志"), leftLogo: image("首次降价方订房业务标志"),
      initialPrice: price,
      rounds: {type: "array", minItems: 6, maxItems: 6, items: closed({price, at: at("该轮换位和下调报价的绝对秒数")})},
    }),
  },
  validate: (spec: unknown, duration: number) => {
    const {initialPrice, rounds} = spec as PhonesSpec;
    checkSpacing([0,...rounds.map(({at: time}) => time),duration], [.6,.55,.55,.55,.55,.55,.65], "两个平台需要足够时长交替抬升及读完六轮降价");
    const prices = [initialPrice,...rounds.map(quote => quote.price)];
    if (prices.some((value, index) => index > 0 && value >= prices[index - 1])) throw new Error("每轮报价必须低于上一轮");
  },
  media: () => [
    {type: "image" as const, path: ["room", "photo"]}, {type: "image" as const, path: ["rightLogo"]}, {type: "image" as const, path: ["leftLogo"]},
  ],
} as const;
