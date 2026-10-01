/** Instructions injected only when the web-page-focus template is present. */
export const webPageFocusPlanningInstructions = `网页重点推近模板补充规则：
- <web-page-focus group="focus"> 用真实浏览器打开一篇可靠网页，用网页原文重点作为 DOM 定位锚点，执行固定推近和跟随镜头；不显示黄色高亮、下划线或勾选。
- 规划时先调用 search_web({query}) 寻找公司官方公告、官方技术博客、产品文档、研究机构页面或主流新闻媒体，再调用 search_web({url}) 读取选定网页正文；不要为了中文而换掉更权威的英文原站，截图前会翻译原网页可见文字。
- 来源质量要求：优先公司官方公告、官方技术博客、产品文档、研究机构页面；也可使用 Reuters、AP、BBC、TechCrunch、The Verge、Ars Technica、MIT Technology Review 等主流媒体。
- X 只接受与事件直接相关的官方账号、公司高管、研究者、当事人或现场参与者；必须核验账号身份及其与事件的关系，无法核验或无法读取原帖时换用其他可靠来源。随机评论、匿名账号、转载聚合页、低权重博客、搜索摘要、微博和个人博客文章不能作为最终来源。
- focus[].text 必须逐字复制自所选网页返回的 content，保留大小写、数字、单位、标点及短语内部空格；它只用于 DOM 定位，不会显示为高亮。
- 程序先用英文等原文定位 focus，再按译后的排版测量镜头位置；不要把 focus[].text 自行翻译成中文。
- focus[].at 使用清稿中语义对应内容首字的整集字级时间轴绝对 start；网页文字与清稿措辞不同时，以网页文字填写 text，以清稿对应语义的时间填写 at。
- focus 至少 1 项、最多 8 项，按页面出现顺序和时间顺序排列。选择 1-4 个能代表当前论点的短语，不要把整篇文章标为重点。
- entrance 只能从 fade、slide-right、cut 中选择：普通证据用 fade，页面从侧面进入用 slide-right，强调突发信息用 cut。
- 不要填写 x、y、width、height、camera、zoom、easing 或任何截图坐标；Provider 会在浏览器中用 DOM Range 和 getClientRects() 计算真实位置。
- 网页正文读取失败、页面被验证拦截、没有可对齐的网页原话或无法取得真实截图时，必须报告失败并重新搜索另一篇可靠来源；不得在同一个失败 URL 上反复调用。不得用清稿原话、搜索结果摘要、仿制网页、生成图片或搜索结果截图替代。
- 搜索和重点选择完成后，只调用一次 create_web_page_focus。`;
