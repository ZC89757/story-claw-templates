export const aiHotFocusStagePlanningInstructions = `AI 热点章节舞台规则：
- <ai-hot-focus-stage> 只调用 create_ai_hot_focus_stage，一集最多使用一次。
- 标签必须包住整篇原文；HTML 的 values 属性按新闻顺序列出数据库标题，正文中的 mg-value 标记给出每个标题的精确时间锚点。Function Call 的 items 必须逐项对应 values，items[].time 使用对应 mg-value 首字的绝对 start，表示新闻切换动作的触发时间；不要自行加上标题收起或展开时长。
- at 使用标签首字的绝对 start；不要传 endTime。
- title 是开场球体中央的栏目标题；sub_title 是可选的小字，没有副标题时传 null。
- items 按章节顺序填写 1-6 个对象，每个对象只有 title 和 time；title 必须等于对应 values 元素的标题原文；time 是整集绝对秒数，第一条至少晚于 at 5 秒，后续每条至少间隔 2.5 秒。
- 模板内部固定玻璃按钮、球体、炫彩、开幕、展开和收回动画；嵌套内容会等当前标题完整展开后才显示。不要传颜色、位置、大小、速度、音效或 group/order。最后一条会持续到整集结束。`;
