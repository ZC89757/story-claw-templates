import type {MgTemplateName} from "./runtime.js";

export type MgTemplateUsage = Readonly<{
  template: MgTemplateName;
  useWhen: string;
}>;

export const MG_TEMPLATE_USAGE: readonly MgTemplateUsage[] = Object.freeze([
  {template: "sc-video", useWhen: "指定原文需要生成普通 AI 视频片段，可选已有参考图、生成参考图或不指定创意参考图"},
  {template: "sc-longtake", useWhen: "一段较长的连续视觉叙事需要保持一镜到底；由多个 AI 视频片段接力生成，后段以前段尾帧作为首帧"},
  {template: "video-footage", useWhen: "固定素材库中已有语义匹配的真实视频，需要依据配套字幕时间轴选择一个连续片段，而不是再生成 AI 视频"},
  {template: "ai-hot-opening", useWhen: "AI 热点或科技新闻合集的开头，需要用一个中央栏目标题和 1-6 条新闻标题建立整期开场；一集最多使用一次，标注范围至少覆盖 7 秒"},
  {template: "ai-hot-focus-stage", useWhen: "AI 热点或科技新闻合集需要一个贯穿整集的章节舞台：开场展示总览，随后每条新闻在绝对时间点展开为全屏玻璃场景；一集最多使用一次，标签应覆盖整集正文"},
  {template: "progress-timeline", useWhen: "原文有明确时间、年份、阶段或里程碑，且需要按顺序展开"},
  {template: "timed-table", useWhen: "多个对象共享多个字段，需要逐项对照"},
  {template: "directed-graph", useWhen: "原文存在真实因果、依赖、转移或流程"},
  {template: "side-by-side-comparison", useWhen: "两个对象在同一维度上形成明确对比"},
  {template: "weighted-comparison", useWhen: "原文明确表达两侧的轻重、取舍或不对称权重"},
  {template: "decomposition", useWhen: "原文把一个整体明确拆成多个组成部分"},
  {template: "xy-chart", useWhen: "一组原文明确数字构成有意义的趋势"},
  {template: "multi-series-chart", useWhen: "多组原文明确数字可放在同一尺度上比较，或正文对象明确且能通过可靠公开资料补齐同口径数字"},
  {template: "containment", useWhen: "原文存在真实的包含、层级、范围或归属关系"},
  {template: "collage-network", useWhen: "多个真实实体之间存在明确生态或网络联系"},
  {template: "image-stack", useWhen: "多个具体图片或截图需要按顺序逐层展示"},
  {template: "image-grid", useWhen: "多个具体图片或截图需要在同一画面并列展示"},
  {template: "news-report", useWhen: "一段新闻报道需要用多张真实网页截图像纸张一样逐张摞起展示，且不需要中心标题"},
  {template: "web-news-focus", useWhen: "需要直接阅读国内外主流新闻媒体原报道，并在清稿对应语义出现时高亮网页中的原话、推近和跟随镜头；公司公告、个人博客和社交帖子不适用"},
  {template: "web-page-focus", useWhen: "需要直接阅读公司官网、官方公告、技术博客、产品文档或研究机构网页，并在重点出现时推近和跟随，但不需要高亮、下划线或勾选"},
  {template: "era-shift", useWhen: "原文解释一个公司、产品或产业发生明确的策略转向，适合用固定或按人物参考图生成的前景叠在两套代码生成的背景生态上，并在明确节点切换背景"},
  {template: "mg-cutout", useWhen: "一位人物、一个产品或一个完整物体需要作为纯透明前景叠在原视频上，从画面下方自然减速升起并停留；支持已有透明图、绿幕图抠除或按参考图生成绿幕后自动抠除"},
  {template: "route-shift", useWhen: "原文明确表达先处于 First 路线、随后在一个具体节点切换到 Second 路线，适合用两条道路和单一 Switch 标记表现转向"},
  {template: "title", useWhen: "原文出现真实章节或内容转场，需要简短提示"},
  {template: "emphasis", useWhen: "原文中的短句本身是决定性信息，值得短暂强调"},
  {template: "news-flashback", useWhen: "一句话需要拿真实网页资料来背书：整屏翻页展示检索到的文章截图，中央压着该实例的重点大字"},
  {template: "showcase", useWhen: "原文需要把多个功能、步骤、卡片或界面元素逐项陈列"},
  {template: "metric", useWhen: "原文包含可读的数字、比例、进度、仪表或指标变化"},
  {template: "transition", useWhen: "原文明确存在两个画面段落之间的转场节点，且需要几何擦除或闪切"},
  {template: "rhythm", useWhen: "原文需要在重音、节拍或蒙太奇节点施加短促的脉冲、冻结或频闪"},
  {template: "effect", useWhen: "原文需要光斑、扫描、框线、冲击、装配或品牌视觉效果；object-drop 只提供一张掉落物图片，glass-fracture 只提供一张裂纹下层图片，烟雾和裂纹由模板固定提供"},
]);
