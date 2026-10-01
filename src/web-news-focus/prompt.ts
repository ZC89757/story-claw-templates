import {MAJOR_NEWS_HOSTS} from "./source-policy";

/** Instructions injected only when the web-news-focus template is present. */
export const webNewsFocusPlanningInstructions = `网页重点跟随模板补充规则：
- <web-news-focus group="focus"> 用真实浏览器打开一篇原网页，把可读的报道页面作为横屏画面，并在清稿对应语义出现的时间点自动高亮网页原话、推近和跟随镜头。
- 规划时先调用 search_web({query}) 寻找与事件直接相关的国内外主流新闻媒体原报道，再调用 search_web({url}) 读取选定报道正文；传入原文章 URL，不要传搜索结果页 URL、screenshotUrl 或 imageUrl。优先 Reuters、AP、BBC、TechCrunch、The Verge、Ars Technica、MIT Technology Review 等媒体；国内媒体也必须是有编辑责任的主流新闻机构。
- 此模板只选主流新闻媒体的编辑部原报道；媒体域名下的个人专栏、用户投稿和转载聚合内容仍不合格。优先采用 search_web 返回的 sourceQuality=major-media，并核验实际文章出处。程序目前接受这些媒体域名及其新闻子域名：${[...MAJOR_NEWS_HOSTS].join("、")}；其他域名不能直接提交，应继续搜索清单内的报道。官方公告、研究页面和技术文档请改用 web-page-focus；X、微博、个人博客、随机评论、匿名账号、转载聚合页、低权重博客和搜索摘要不能作为此模板的最终来源。
- 不要为了中文而换掉更权威的英文原站；截图前会翻译原网页可见文字。仍以原文逐字填写 highlights[].text，程序先在原网页定位，再按译后的排版测量高亮和镜头位置。
- highlights[].text 必须逐字复制自所选网页返回的 content，保留大小写、数字、单位、标点及短语内部空格；不要求在清稿或 HTML 标签原文中出现，也不能根据搜索摘要、标题或清稿改写/推测网页措辞。
- highlights[].at 使用清稿中语义对应内容首字的整集字级时间轴绝对 start；网页文字与清稿措辞不同时，以网页文字填写 text，以清稿对应语义的时间填写 at。
- highlights 至少 1 项、最多 8 项，按页面出现顺序和时间顺序排列。尽量选择同一段或相邻段落中的 1-4 个可读重点，不要把整篇文章标成高亮。
- entrance 只能从 fade、slide-right、cut 中选择：普通证据用 fade，页面从侧面进入用 slide-right，强调突发信息用 cut。
- 不要填写 x、y、width、height、camera、zoom、easing 或任何截图坐标；Provider 会在浏览器中用 DOM Range 和 getClientRects() 计算真实位置。
- 网页正文读取失败、页面被验证拦截、没有可对齐的网页原话或无法取得真实截图时，必须报告失败并重新搜索另一篇可靠报道；不得在同一个失败 URL 上反复调用。不得用清稿原话、搜索结果摘要、仿制网页、生成图片或搜索结果截图替代。
- 搜索和重点选择完成后，只调用一次 create_web_news_focus。`;
