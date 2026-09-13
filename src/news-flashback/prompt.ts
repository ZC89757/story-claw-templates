/** Instructions injected only when a news-flashback template is present. */
export const newsFlashbackPlanningInstructions = `网页资料闪回模板补充规则：
- <news-flashback group="project"> 是“用真实网页资料给一句话背书”的效果：整屏翻页展示一组文章截图，中央压着该实例的重点大字。
- 这个模板是整屏 scene 图层，不是透明叠加：它会盖住该时间窗口内的原画，只用在确实需要翻资料佐证的节点上。
- 选用这个标签就必须准备网页素材：先根据当前标签文字和上下文组织搜索词，调用 search_web 搜索并选择页面，再调用 create_news_flashback。
- 搜索应优先找真实新闻报道、技术博客、机构公告或专题文章页面的配图/截图，不要使用搜索结果页截图。
- 优先把 search_web 返回的 screenshotUrl 放入 pages.image，以保留新闻报道页面本身；只有截图不可用时才使用 imageUrl。也可以使用可读取的本地图片路径；不要把普通文章 URL 当作图片 URL。
- pages 至少提供 2 张、最多 12 张，尽量来自不同报道或不同网站；source 填网站名，title 填页面标题或图片对应标题。
- 中央 text 必须逐字来自当前 HTML 实例文字，可以是任意主题、任意关键词；不要把它改写成搜索词之外的新文案。
- 如果已有合适图片只是局部有滚动条、Cookie 条或边缘遮挡，直接复用并在选择时说明，不要为了轻微瑕疵反复搜索。
- 搜索和素材选择完成后，再调用一次 create_news_flashback，并把 pages 一起传入。`;
