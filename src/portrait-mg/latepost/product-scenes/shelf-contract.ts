import {at, closed, cutout, image, requireSpacing, rootFields} from "./schema";

export const shelfCounts = [7, 4, 7, 5] as const;
export type ShelfLevel = {products: string[]; at: number};
export type ShelfSpec = {shelf: string; top: ShelfLevel; upperMiddle: ShelfLevel; lowerMiddle: ShelfLevel; bottom: ShelfLevel};
export const levels = ["top", "upperMiddle", "lowerMiddle", "bottom"] as const;
const row = (count: number) => closed({
  products: {type: "array", minItems: count, maxItems: count, items: image("单件商品透明 PNG，按左到右放置")},
  at: at("该层左侧首个商品开始消失"),
});

export const shelfContract = {
  id: "latepost-V06_005",
  tag: "mg-v-shelf-clearing",
  title: "货架逐层清空",
  description: "蓝色四层货架保持正面，满架商品按从上到下、同层从左到右的顺序分批淡出，保留货架、价签和周围道具。",
  minimumDuration: 4.6,
  definition: {
    type: "function",
    name: "create_portrait_shelf_clearing",
    strict: true,
    description: "仅 9:16 竖屏。用蓝色四层货架内的商品依次消失来呈现品牌退出。空货架底图采用与画面相同的正面布局，四层商品各自抠图，只保留商品实物和包装。",
    parameters: closed({...rootFields,
      shelf: image("400×704 画幅的正面空货架图，中央 360×640 为主画幅，外侧留出入场镜头所需边缘"),
      top: row(shelfCounts[0]), upperMiddle: row(shelfCounts[1]), lowerMiddle: row(shelfCounts[2]), bottom: row(shelfCounts[3])}),
  },
  validate(spec: unknown, duration: number) {
    const scene = spec as ShelfSpec;
    requireSpacing([0, ...levels.map(level => scene[level].at), duration], [.55, .85, .58, .78, 1.0],
      "货架须先完整陈列，再从上往下清空四层并停留在空货架");
  },
  media: () => [{type: "image" as const, path: ["shelf"]},
    ...levels.flatMap((level, rowIndex) => Array.from({length: shelfCounts[rowIndex]}, (_, col) => cutout(level, "products", col)))],
} as const;

