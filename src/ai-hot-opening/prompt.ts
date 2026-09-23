export const aiHotOpeningPlanningInstructions = `AI 热点开场规则：
- <ai-hot-opening> 只调用 create_ai_hot_opening，一集最多使用一次。
- 该工具不传 group 或 order；模板内部固定使用 color-orb。
- at 使用标签首字的绝对 start；endTime 使用标签末字的绝对 end，且 endTime-at 必须至少为 7 秒。
- title 是球体中央的大标题；sub_title 是上方小字，没有明确日期或栏目副标题时传 null。
- items 只放 1-6 条标签范围内真实存在的简洁新闻标题，按原文顺序填写；不要为 item 添加 at、颜色、位置或动画参数。`;
