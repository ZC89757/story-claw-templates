/** Instructions injected only when the news-report template is present. */
export const newsReportPlanningInstructions = `新闻报道模板补充规则：
- <news-report> 是纯新闻页面纸张堆叠效果，不显示中心标题、重点大字或额外解释文字。
- 处理 <news-report> 时，先根据当前标签原文和上下文组织搜索词，调用 search_web 搜索，再调用 create_news_report_stack。
- 优先选择真实新闻报道、技术媒体、机构公告或专题文章的网页截图；不要使用搜索结果页截图。
- 优先把 search_web 返回的 screenshotUrl 放入 pages.image，只有截图不可用时才使用 imageUrl；不要把普通文章 URL 当作图片 URL。
- pages 至少 2 张、最多 12 张，尽量来自不同报道或不同网站；source 和 title 可填写搜索结果中的来源与页面标题。
- 轻微滚动条、Cookie 条或边缘遮挡可以直接复用或裁切，不要为了小瑕疵反复搜索。
- 搜索和素材选择完成后，只调用一次 create_news_report_stack；不要在 Function Calling 中填入中心标题或改写当前 HTML 原文。`;
