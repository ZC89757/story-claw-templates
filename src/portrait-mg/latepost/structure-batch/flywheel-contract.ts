import {checkCueSpacing, closed, lineText, rootFields, stillImage} from "./schema";

type FlywheelStep = {artwork: string; title: string; at: number};
export type FlywheelSpec = {
  title: string;
  part: number;
  first: FlywheelStep;
  second: FlywheelStep;
  third: FlywheelStep;
};

const step = (length: number) => closed({
  artwork: stillImage("带有效 Alpha 的真实拼贴 PNG；透明区域显露原版红色圆牌"),
  title: lineText(length),
  at: {type: "number", minimum: 0, description: "口播转入该环节的绝对秒数"},
});

function validate(spec: unknown, duration: number) {
  const {first, second, third} = spec as FlywheelSpec;
  checkCueSpacing([0, first.at, second.at, third.at, duration], [.85, .76, .78, .9], "商业飞轮须留出全环显现和三次聚焦、落字的时间");
}

export const flywheelContract = {
  id: "latepost-V08_003",
  tag: "mg-v-business-flywheel",
  title: "三节点商业飞轮",
  description: "用于三个连续环节构成的飞轮。红环和三张拼贴圆牌同屏展开，随后三个节点依次放大、其余节点压暗，白色大字逐字落位。",
  minimumDuration: 3.6,
  definition: {
    type: "function",
    name: "create_portrait_business_flywheel",
    strict: true,
    description: "仅 9:16 竖屏。三个节点都需要各自独立的真实透明 PNG，不能用整张完成画面。环形布局、三张红圆牌、聚焦顺序和三个英文序号由模板固定。标题与三个步骤均应采用足以容纳在原版固定字位的短句。",
    parameters: closed({...rootFields, title: lineText(8), part: {type: "integer", minimum: 1, maximum: 9}, first: step(5), second: step(5), third: step(8)}),
  },
  validate,
  media: () => (["first", "second", "third"] as const).map(node => ({type: "cutout" as const, path: [node, "artwork"]})),
} as const;
