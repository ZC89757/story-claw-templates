import {at, closed, cue, cutout, image, line, requireSpacing, rootFields} from "./schema";

export type TerrainSpec = {
  vehicle: string;
  opening: string;
  climb: {at: number};
  gains: {text: string; at: number};
  reversal: {at: number};
  burden: {text: string; at: number};
  cost: {text: string; at: number};
};
const title = (length: number, description: string) => closed({text: line(length, description), at: at(description + "入场")});
export const terrainContract = {
  id: "latepost-V02_005",
  tag: "mg-v-curve-becomes-terrain",
  title: "曲线变地形",
  description: "侧视车从左驶入，随红色曲线上坡；越过峰顶后地形转灰，车头随下坡低下，右上依次显示两句红字。",
  minimumDuration: 6.1,
  definition: {
    type: "function",
    name: "create_portrait_curve_becomes_terrain",
    strict: true,
    description: "仅 9:16 竖屏。用一辆朝右的完整侧视汽车和前升后降的地形表现同一项投入由收益转为负担。左右位置、地形变化、画面色彩与文字风格固定。",
    parameters: closed({...rootFields,
      vehicle: image("朝右的车辆侧视实物透明 PNG，裁到车身和轮胎轮廓"),
      opening: line(5, "左上白色开场短句"),
      climb: cue("红色地形出现，车辆开始爬坡"),
      gains: title(9, "上坡时的白色收益标题"),
      reversal: cue("由红色上坡切到灰色下坡"),
      burden: title(5, "右上第一行红色负担标题"),
      cost: title(6, "右上第二行红色成本短句")}),
  },
  validate(spec: unknown, duration: number) {
    const {climb, gains, reversal, burden, cost} = spec as TerrainSpec;
    requireSpacing([0, climb.at, gains.at, reversal.at, burden.at, cost.at, duration],
      [1.10, .55, .7, .30, .65, .65], "须给侧视车、地形反转及两行红字保留完整动作时间");
  },
  media: () => [cutout("vehicle")],
} as const;
