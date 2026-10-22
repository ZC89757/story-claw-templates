export const SUBJECT_EXPANSION_CHROMA_COLOR = "#00ff00";

/** Fixed template art direction, shared by every image-bearing explainer. */
export const subjectExpansionGenerationPrompt = (description: string): string => [
  `One isolated editorial illustration of ${description.trim()}.`,
  "The reference image is a style board only: borrow its matte materials, rounded forms and restrained colors. Depict only the requested subject; do not copy the reference board, its arrangement or its example objects.",
  "Tactile matte materials, softly rounded geometry, gentle three-quarter perspective, restrained ivory, blue and terracotta palette.",
  "Complete silhouette with generous margin, one coherent object or compact group, no floor, no cast shadow, no scenery, no lettering, no labels, no logos, no frame.",
  `Perfectly flat solid ${SUBJECT_EXPANSION_CHROMA_COLOR} background edge to edge. No green on the subject, no green reflections.`,
].join(" ");

export const subjectExpansionPlanningInstructions = `
<subject-expansion group="progressive|impact" mode="together"> 是同一主体与对象/条件的渐进展开，不表达两个阵营对比，也不自动表示因果；group 实际只填其中一个值。
progressive 是已有平滑版，impact 是新增翻牌拍桌重节奏版；两组使用完全相同的 create_subject_expansion Schema，不添加 group 专用字段。原 progressive 的动画、时间语义和音轨保持原样。
impact 的 items[].at 是准确的拍桌落点：翻转最多提前 0.72 秒（实例开头不足时截短前摇），卡片在 at 时接触桌面、回弹和短震感，连线固定在 at+0.18 秒启动。模型只安排拍桌重音；不能声称当前有独立的连线时间字段。建议拍桌间隔不少于 1.4 秒，最后落点距实例结束留 0.9 秒左右；不要为了卡音乐而偏离旁白语义。
impact 内置低频氛围底乐与四下滚奏后的重拍，滚奏与 items.at 对齐，不需要传 BPM、音乐地址、音量或音效参数。已有对象保留，后续 highlights 仅重新聚焦，不再次触发拍桌或滚奏。
每实例一个完整父标签，values JSON 数组列出逐字原文节点。可用 <mg-value value="1"> 等内部标记与 values 文本、顺序完全一致，不能用原生 span。各节点分别对应 item 出现或 highlight 重新聚焦。连续叙述不要拆成多个模板标签。
整体时间由宿主从标签计算，禁止根 at/startTime/endTime/duration。subject 在实例开始出现。items[].at 和 highlights[].at 均为字级时间轴上的绝对秒数，须落在实例 [start,end) 内。
items 按时间排序，2-5 个，id 唯一且不能为 subject；relation 只写该对象与主体的真实关系。highlights 按时间严格递增，targets 只能指向已经出现的对象 ID 或 subject，note 是可选的短说明（不是大字标题）。
source.mode=transparent 时 image 提供已有 alpha 透明图片的 URL/文件路径，prompt=null；抽象条件不需要强行配图，可令 item.source=null。mode=generate 时只填写 prompt 主体描述、image=null；模板自动附带自身风格参考图，复用现有生图及绿幕抠除能力生成透明图片。不要让模型填写参考图、抠图颜色或生图接口参数，不伪造真实产品界面、Logo 或历史现场。
如需短视频或网页证据，用真实嵌套子标签及其独立 Function Call。固定右侧窗口从父实例首帧可用；子素材只显示其自身原文的时段，结束后露出父模板，不循环、不延长到父时长、不自动定格。不要传 children、slot、视频 URL 或子时长到本函数。
同一 group 的布局、颜色、位置、镜头和透明背景抠除规则固定。需要 6 个以上对象、任意边图或左右同维度对比时选用其他模板。
`.trim();
