/** Instructions injected only when the web-news-focus template is present. */
export const webNewsFocusPlanningInstructions = `网页重点跟随模板补充规则：
- <web-news-focus group="focus"> 用真实浏览器打开一篇原网页，把可读的报道页面作为横屏画面，并在原文重点出现的时间点自动高亮、推近和跟随镜头。
- 规划时先根据当前标签文字和上下文调用 search_web，选择可靠报道、机构公告或技术文章的 canonical URL；传入原文章 URL，不要传搜索结果页 URL、screenshotUrl 或 imageUrl。
- highlights[].text 必须是当前标签原文中逐字出现的短语，保留原文大小写、数字、单位和标点；每一项的 at 使用该短语首字在整集字级时间轴中的绝对 start。
- highlights 至少 1 项、最多 8 项，按页面出现顺序和时间顺序排列。尽量选择同一段或相邻段落中的 1-4 个可读重点，不要把整篇文章标成高亮。
- entrance 只能从 fade、slide-right、cut 中选择：普通证据用 fade，页面从侧面进入用 slide-right，强调突发信息用 cut。
- 不要填写 x、y、width、height、camera、zoom、easing 或任何截图坐标；Provider 会在浏览器中用 DOM Range 和 getClientRects() 计算真实位置。
- 页面加载失败、找不到原文或无法取得真实截图时必须报告错误并修正 URL/原文，不得用仿制网页、生成图片或搜索结果截图替代。
- 搜索和重点选择完成后，只调用一次 create_web_news_focus。`;
