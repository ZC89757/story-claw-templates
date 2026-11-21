import {at, closed, cutout, image, line, rootFields} from "./schema";

const anchorNames = ["headlight", "battery", "body", "chip", "motor", "chassis"] as const;
export type AnchorName = typeof anchorNames[number];
export type Label = {share: string; name: string; detail: string; secondLine: string | null; focus: {at: number} | null};
export type CostSpec = {title: string; sourceNote: string; vehicle: string; labels: Record<AnchorName, Label>};

const label = (location: string, maxName = 5, maxDetail = 9) => closed({
  share: {...line(5, location + "红色成本占比，含百分号"), pattern: "^[0-9]{1,2}(\\.[0-9])?%$|^100%$"},
  name: line(maxName, location + "白色部件名称"),
  detail: line(maxDetail, location + "说明第一行"),
  secondLine: {anyOf: [line(maxDetail, location + "说明第二行"), {type: "null"}]},
  focus: {anyOf: [closed({at: at(location + "部件引线短暂加强")}), {type: "null"}]},
});

export const costContract = {
  id: "latepost-V02_003",
  tag: "mg-v-component-cost-callouts",
  title: "部件成本标注",
  description: "蓝色汽车剖视图片向上放大，六个红点沿虚线连接上下两排成本标签，口播提及时加强对应标签和引线。",
  minimumDuration: 1.4,
  definition: {
    type: "function",
    name: "create_portrait_component_cost_callouts",
    strict: true,
    description: "仅 9:16 竖屏。为汽车各部位标注成本占比。须传入匹配原构图朝向和锚点的透视汽车剖视透明 PNG，车头在左前方。标签位置、字号与颜色固定，用短句填入。",
    parameters: closed({...rootFields, title: line(16, "一行主标题"), sourceNote: line(32, "标题下方的小字数据来源"),
      vehicle: image("位于中央的剖视汽车透明 PNG 路径，无外部标签或定位点"),
      labels: closed({headlight: label("左上", 5, 8), battery: label("中上"), body: label("右上"),
        chip: label("左下", 6, 7), motor: label("中下", 4, 7), chassis: label("右下", 5, 9)})}),
  },
  validate(spec: unknown, duration: number) {
    const {labels} = spec as CostSpec;
    for (const key of anchorNames) {
      const focus = labels[key].focus;
      if (focus && (focus.at < .85 || focus.at > duration - .35 + 1e-6)) {
        throw new Error("请在六个标注落位后且画面结束至少 0.35 秒前加强部件引线");
      }
    }
  },
  media: () => [cutout("vehicle")],
} as const;
