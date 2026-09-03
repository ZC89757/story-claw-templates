import type {MgTemplateName} from "./runtime.js";

export type MgTemplateUsage = Readonly<{
  template: MgTemplateName;
  useWhen: string;
}>;

export const MG_TEMPLATE_USAGE: readonly MgTemplateUsage[] = Object.freeze([
  {template: "sc-video", useWhen: "指定原文需要生成普通 AI 视频片段，可选已有参考图、生成参考图或不指定创意参考图"},
  {template: "progress-timeline", useWhen: "原文有明确时间、年份、阶段或里程碑，且需要按顺序展开"},
  {template: "timed-table", useWhen: "多个对象共享多个字段，需要逐项对照"},
  {template: "directed-graph", useWhen: "原文存在真实因果、依赖、转移或流程"},
  {template: "side-by-side-comparison", useWhen: "两个对象在同一维度上形成明确对比"},
  {template: "weighted-comparison", useWhen: "原文明确表达两侧的轻重、取舍或不对称权重"},
  {template: "decomposition", useWhen: "原文把一个整体明确拆成多个组成部分"},
  {template: "xy-chart", useWhen: "一组原文明确数字构成有意义的趋势"},
  {template: "multi-series-chart", useWhen: "多组原文明确数字可放在同一尺度上比较"},
  {template: "containment", useWhen: "原文存在真实的包含、层级、范围或归属关系"},
  {template: "collage-network", useWhen: "多个真实实体之间存在明确生态或网络联系"},
  {template: "image-stack", useWhen: "多个具体图片或截图需要按顺序逐层展示"},
  {template: "image-grid", useWhen: "多个具体图片或截图需要在同一画面并列展示"},
  {template: "title", useWhen: "原文出现真实章节或内容转场，需要简短提示"},
  {template: "emphasis", useWhen: "原文中的短句本身是决定性信息，值得短暂强调"},
  {template: "showcase", useWhen: "原文需要把多个功能、步骤、卡片或界面元素逐项陈列"},
  {template: "metric", useWhen: "原文包含可读的数字、比例、进度、仪表或指标变化"},
  {template: "transition", useWhen: "原文明确存在两个画面段落之间的转场节点，且需要几何擦除或闪切"},
  {template: "rhythm", useWhen: "原文需要在重音、节拍或蒙太奇节点施加短促的脉冲、冻结或频闪"},
  {template: "effect", useWhen: "原文需要光斑、扫描、框线、冲击、装配或品牌视觉效果"},
  {template: "camera", useWhen: "原文适合用独立模板场景表现固定推拉、俯仰、旋转、视差或定格运镜"},
]);
