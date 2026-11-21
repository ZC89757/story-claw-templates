import {closed, image, line, rootFields} from "../product-scenes/schema";

export const assetRoot = "portrait-mg/latepost/map-transfer/";
const cutout = (field: string) => ({type: "cutout" as const, path: [field]});

export const mapFootageFrames = 513;
export const teacherSceneFrames = 336;

function checkFootageLength(duration: number, sourceFrames: number, name: string) {
  if (duration > sourceFrames / 30 + 1e-6) {
    throw new Error(`${name}的连续素材最多覆盖 ${sourceFrames / 30} 秒，请选用此范围内的时间窗`);
  }
}

export type SupplierMapSpec = {
  firstName: string;
  secondName: string;
  thirdName: string;
  firstBottle: string;
  firstExtraBottle: string;
  secondBottle: string;
  secondExtraBottle: string;
  thirdBottle: string;
};
const supplierName = line(4, "该定位针上方的真实供应商简称");
const bottle = image("单个产品的直立透明 PNG 剪影。");
export const supplierMapContract = {
  id: "latepost-V06_002",
  tag: "mg-v-supplier-map",
  title: "地图标注供货商",
  description: "灰阶巴马地图上的三个厂点随镜头推进依次标出。定位针为红色，厂名在黑底上显示，三个点分别承载两瓶、两瓶和一瓶产品。",
  minimumDuration: 15.2,
  definition: {
    type: "function",
    name: "create_portrait_supplier_map",
    strict: true,
    description: "仅 9:16，宿主时间窗 15.2 至 17.1 秒。用于在巴马地图交代三处相邻水厂和瓶装水产品。填三个厂名，按出场次序填写五张透明产品图。地图和固定厂点已跟踪。",
    parameters: closed({
      ...rootFields,
      firstName: supplierName,
      secondName: supplierName,
      thirdName: supplierName,
      firstBottle: bottle,
      firstExtraBottle: bottle,
      secondBottle: bottle,
      secondExtraBottle: bottle,
      thirdBottle: bottle,
    }),
  },
  validate(_spec: unknown, duration: number) {
    checkFootageLength(duration, mapFootageFrames, "地图镜头");
  },
  media: () => ["firstBottle", "firstExtraBottle", "secondBottle", "secondExtraBottle", "thirdBottle"].map(cutout),
} as const;



export type TeacherTransferSpec = {
  teacher: string;
  student: string;
  question: string;
  reasoning: string;
  answer: string;
  example: string;
};
export const teacherTransferContract = {
  id: "latepost-V07_004",
  tag: "mg-v-teacher-data-transfer",
  title: "教师到学生的数据传递",
  description: "聚光圆区内，大模型发出红线指向题目、推理过程和答案三列表，数据依次扫红，第二条红线抵达学生模型，随后闪切进入真实连续粒子流。",
  minimumDuration: 10,
  definition: {
    type: "function",
    name: "create_portrait_teacher_data_transfer",
    strict: true,
    description: "仅 9:16，宿主时间窗 10 至 11.2 秒。呈现大模型产出一条训练样例，再传到学生模型。填写两个模型的短名称、三列正文和题目中的静态样例图。节点、连线和扫红时序固定。",
    parameters: closed({
      ...rootFields,
      teacher: line(11, "左上教师模型短名称，原位窄体显示"),
      student: line(5, "右下学生模型短名称，原位窄体显示"),
      question: line(7, "左栏单行问题"),
      reasoning: line(24, "中栏单行推理过程，限三个短片段或概率表述"),
      answer: line(3, "右栏单行答案"),
      example: image("用于题目的真实静态样例图路径"),
    }),
  },
  validate(spec: unknown, duration: number) {
    checkFootageLength(duration, teacherSceneFrames, "教师到学生镜头");
    const {teacher, student, reasoning} = spec as TeacherTransferSpec;
    const units = (text: string) => [...text].reduce((sum, char) => sum + (/^[\x00-\x7f]$/.test(char) ? .55 : 1), 0);
    if (units(teacher) > 6.35 || units(student) > 4.5 || units(reasoning) > 16.2) {
      throw new Error("模型名称或推理过程超过原画面的固定字位，请缩短文本");
    }
  },
  media: () => [{type: "image" as const, path: ["example"]}],
} as const;


export type DiffusionSpec = {
  origin: string;
  receiver: string;
  originHeading: string;
  receiverHeading: string;
  originPlate: string;
  receiverPlate: string;
  transfer: string;
  distribution: string;
  spread: string;
  originLogos: string[];
  receiverLogos: string[];
};
const logo = image("已抠出的静态标志或圆形主体图，透明 PNG。");
export const diffusionContract = {
  id: "latepost-V07_005",
  tag: "mg-v-isometric-tech-diffusion",
  title: "等轴技术扩散图",
  description: "深灰等轴平面上，红色面板和地区标题依次立起。白箭头由原始技术连到接收者，再分向三个红方块。镜头依次对准三个区域并最终拉远。",
  minimumDuration: 14.7,
  definition: {
    type: "function",
    name: "create_portrait_isometric_tech_diffusion",
    strict: true,
    description: "仅 9:16，宿主时间窗至少 14.7 秒。用于表现一方技术经另一方学习继而传播的固定顺序。填两地区简称、短标题、立牌上下两行各两字、两条路径的两字词、扩散区两字及静态标志。",
    parameters: closed({
      ...rootFields,
      origin: line(2, "起点地区的两字简称"),
      receiver: line(2, "承接地区的两字简称"),
      originHeading: line(7, "起点地区上方的单行红字"),
      receiverHeading: line(7, "承接地区上方的单行红字"),
      originPlate: line(4, "起点红牌白字，四个连续中文汉字"),
      receiverPlate: line(4, "承接红牌白字，四个连续中文汉字"),
      transfer: line(2, "前一条白线上的红字"),
      distribution: line(2, "三条分支箭头旁的红字"),
      spread: line(2, "方块前的白色两字"),
      originLogos: {type: "array", items: logo, minItems: 3, maxItems: 3},
      receiverLogos: {type: "array", items: logo, minItems: 4, maxItems: 4},
    }),
  },
  validate(spec: unknown) {
    const values = spec as DiffusionSpec;
    if (![values.originPlate, values.receiverPlate].every(value => /^\p{Script=Han}{4}$/u.test(value))) {
      throw new Error("两处立牌各使用四个中文汉字，上下各两字");
    }
  },
  media: () => [
    ...[0, 1, 2].map(i => ({type: "cutout" as const, path: ["originLogos", i]})),
    ...[0, 1, 2, 3].map(i => ({type: "cutout" as const, path: ["receiverLogos", i]})),
  ],
} as const;

export const mapTransferContracts = [supplierMapContract, teacherTransferContract, diffusionContract] as const;

