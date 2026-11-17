import type {Profile, Slot} from "../reference-profiles";

const video = (label: string, at?: number): Slot => ({type: "video", label, demo: 0, at});
const image = (label: string, at?: number): Slot => ({type: "image", label, demo: 0, at});
const cutout = (label: string, at?: number): Slot => ({type: "cutout", label, demo: 0, at});
const text = (label: string, demo: string, maxUnits: number, at?: number, maxLines = 1): Slot =>
  ({type: "text", label, demo, at, max: maxUnits * maxLines * 2, maxUnits, maxLines});
const cue = (label: string, at: number): Slot => ({type: "cue", label, demo: 0, at});
const percent = (label: string, demo: string, at?: number) =>
  ({...text(label, demo, 5, at), pattern: "^(?:100|[1-9]?[0-9])%?$"});
const bg = video("全屏连续背景视频。");
const effectVideoBackground: Slot = {...video("贴合主体的全屏底层视频，从场景首帧连续播放至结束。"), optional: true};

type RelativeTime = {cue: string; offset?: number};
type Window = {from?: RelativeTime; to?: RelativeTime; stopBeforeEnd?: number};
type Hit = {key: string; after?: string; gap?: number; tail?: number};
type Options = {hits: Hit[]; windows?: Record<string, Window>};
const from = (cue: string, offset?: number) => ({cue, offset});
const enter = (key: string, tail: number, after?: string, gap?: number): Hit => ({key, tail, after, gap});
const profile = <Tag extends Profile["tag"]>(tag: Tag, name: string, hint: string, frames: number, slots: Profile["slots"], options: Options) =>
  ({tag, name, hint, duration: frames / 30, slots, tracks: [], ...options});

export const selectedProfiles = {
  V07_001: profile("mg-v-poster-comparison", "海报翻入与活动对比",
    "用于一张主海报加两项并列对比；上半页角翻开，两张圆形小图与短词在交界处出现。", 180, {
      background: bg, poster: image("上半部横幅海报图，保留海报自身内容。"),
      amount: text("海报下部的短数字。", "500", 5, 3.5),
      left: image("左边青色圆窗里的对比图片。"), right: image("右边洋红圆窗里的对比图片。"),
      leftLabel: text("左侧圆窗下的短标签。", "免费", 4),
      rightLabel: text("右侧圆窗下的短标签。", "收费", 4),
    }, {hits: [enter("amount", .36, undefined, 1)]}),
  V07_002: profile("mg-v-circle-ratio", "圆窗与比例数字强调",
    "用于一个地点或现象与一项比例；从全屏实拍进入左圆窗，红色比例牌横向展开。", 90, {
      background: bg, detail: image("左侧圆窗使用的主题细节图。"),
      ratio: {...text("比例牌的数字，例如 1:50。", "1:50", 6, 1.55), pattern: "^[0-9]{1,3}[:：][0-9]{1,3}$"},
    }, {hits: [enter("ratio", .65, undefined, .45)]}),
  V09_001: profile("mg-v-tilted-photo-collage", "倾斜照片拼贴",
    "适合并列呈现三张照片。上、下、中央照片按顺序错位进入，中央照片叠在前面。", 90, {
      background: image("作为虚化底层的静态图片。"),
      top: image("左上方图片。", .32), lower: image("右下方倾斜图片。", .82),
      center: image("最上层、尺寸最大的中央图片。", 1.32),
    }, {hits: [enter("top", .3), enter("lower", .33, "top", .2), enter("center", .42, "lower", .24)]}),
  V10_002: profile("mg-v-image-list-cards", "画面清单卡",
    "适合四个短并列事项，每条带一张横向图片、一个白色主标题及一行小号副标题。", 150, {
      background: bg,
      image1: image("第一条卡片图片。", .18), title1: text("第一条标题。", "广告公司", 7), sub1: text("第一条小字。", "Advertising company", 26),
      image2: image("第二条卡片图片。", .85), title2: text("第二条标题。", "做餐饮", 7), sub2: text("第二条小字。", "Food and beverage", 26),
      image3: image("第三条卡片图片。", 1.35), title3: text("第三条标题。", "房地产业", 7), sub3: text("第三条小字。", "Real estate", 26),
      image4: image("第四条卡片图片。", 1.86), title4: text("第四条标题。", "干金融", 7), sub4: text("第四条小字。", "Work in finance", 26),
    }, {hits: [enter("image1", .32), ...[2,3,4].map(i => enter("image"+i, .34, "image"+(i-1), .18))]}),
  V10_003: profile("mg-v-ornate-list-board", "竖向清单卡",
    "适合列举四个短条目。黑色竖板在实拍上翻入，四条彩牌逐项出现。", 180, {
      background: bg, first: text("第一条红色标签。", "熟人介绍", 7, .62),
      second: text("第二条青色标签。", "正规签证", 7, 1.5),
      third: text("第三条紫色标签。", "推送机票", 7, 2.62),
      fourth: text("第四条橙色标签。", "旅游推荐", 7, 3.92),
    }, {hits: [enter("first", .36), enter("second", .32, "first", .3),
      enter("third", .32, "second", .3), enter("fourth", .32, "third", .3)]}),
  V11_005: profile("mg-v-two-video-profiles", "双视频卡递进",
    "适合先讲一个主体再引入第二个主体。第一窗从下位移至上位，第二窗补到下方。", 240, {
      background: bg, first: video("先出现的圆角视频窗，可随位移继续播放。", .3),
      firstLabel: text("第一窗内的短名或短标。", "研究员", 7),
      second: video("随后进入下方的圆角视频窗。", 2.1),
      secondLabel: text("第二窗内的短名或短标。", "产品经理", 7),
    }, {hits: [enter("first", .4), enter("second", .55, "first", .55)]}),
  V18_001: profile("mg-v-cutout-diagonal-pair", "人物抠像与斜向双窗",
    "适合先介绍透明人物，再用上下错位的两段视频解释。红色竖字与各主体同时出现。", 123, {
      background: video("人物阶段全屏实拍。"), person: cutout("右下进入的透明人物 PNG。", .34),
      personLabel: text("人物旁的红色竖字。", "提案人", 6),
      upper: video("右上先进入的连续视频窗。", 2.03),
      upperLabel: text("右上窗左边的红色竖字。", "相关规定", 6),
      nextBackground: video("双窗阶段更换的底层连续视频。"),
      lower: video("左下进入的连续视频窗。", 2.52),
      lowerLabel: text("左下窗右边的红色竖字。", "申请材料", 6),
    }, {hits: [enter("person", .35), enter("upper", .36, "person", .66), enter("lower", .48, "upper", .22)],
      windows: {background: {to: from("lower")}, nextBackground: {from: from("lower")}}}),
  V19_002: profile("mg-v-callout-three-objects", "提示卡与三物件升起",
    "适合介绍一个主角及三个相关物件。蓝色提示卡立在中央，三张透明图从下方错峰升起。", 187, {
      lead: video("进提示卡前的连续开场视频。"), background: video("提示卡背后的主题视频。"),
      subject: cutout("蓝色提示卡内的透明主体 PNG。", .68), label: text("蓝色提示卡内的短标题。", "展示样品", 6),
      left: cutout("左下物件透明 PNG。", 1.55), middle: cutout("下方中间的物件透明 PNG。", 1.9),
      right: cutout("右下物件透明 PNG。", 2.2),
    }, {hits: [enter("subject", .35, undefined, .18), enter("left", .36, "subject", .35),
      enter("middle", .36, "left", .12), enter("right", .36, "middle", .12)],
      windows: {lead: {to: from("subject")}, background: {from: from("subject")}}}),
  V19_003: profile("mg-v-priority-card-shift", "新卡升起与旧卡让位",
    "适合前两张信息给第三张让位。三张内容图依次换位，末尾出现原有金色结论条。", 193, {
      background: bg, first: image("后层蓝色卡的内容图。"), firstLabel: text("蓝卡标签。", "方案一", 5),
      second: image("红色卡的内容图。", .23), secondLabel: text("红卡标签。", "方案二", 5),
      third: image("紫色前景卡的内容图。", 1.7), thirdLabel: text("紫卡标签。", "方案三", 5),
      result: text("底部金色结论条的短词。", "组合调整", 7, 3.65),
    }, {hits: [enter("second", .4), enter("third", .52, "second", .55), enter("result", .4, "third", .56)]}),
  V19_004: profile("mg-v-source-pie-conclusion", "调查来源、扇形图与结论框",
    "适合一项来源明确的调查或占比统计。来源标先出现，扇形按真实占比填充，再升起双行结论。", 140, {
      background: bg, sourceLabel: text("白卡上红色来源名。", "调查简报", 6, .57),
      ratio: percent("扇形的百分比数值，0 到 100。", "77%", 1.55),
      result: text("图下原有双行结论。", "77%受访者\n使用线上服务", 13, 2.67, 2),
    }, {hits: [enter("sourceLabel", .28), enter("ratio", .68, "sourceLabel", .48), enter("result", .32, "ratio", .58)]}),
  V20_002: profile("mg-v-interactions-torn-panorama", "互动数值切换与撕纸全景窗",
    "适合先展示一个视频现象和三项互动量，再突出总量并打开下方全景窗。", 270, {
      upper: video("贯穿全段的上方视频。"), comment: text("评论图标下的数值。", "56万", 7, 1.38),
      save: text("星标下的数值。", "40万", 7, 1.76), share: text("分享图标下的数值。", "19万", 7, 2.16),
      like: text("中央心形下的数值。", "117万", 8, 3.37),
      lower: video("自下方撕纸入场的全景视频。", 4.25),
      signature: text("原页脚字位的真实署名。", "现场记录", 14),
    }, {hits: [enter("comment", .3, undefined, .6), enter("save", .3, "comment", .16),
      enter("share", .3, "save", .16), enter("like", .42, "share", .36), enter("lower", .58, "like", .42)]}),
  V20_005: profile("mg-v-cutout-echo-collapse", "残影聚合人物与压线退场",
    "适合一次突出单人或单件。透明主体带多重残影聚成清晰轮廓，末尾压成一条竖线。", 60, {
      background: bg, subject: cutout("聚合成清晰轮廓的透明人物或单件 PNG。"),
      close: cue("开始压线退场的时点。", 1.52),
    }, {hits: [enter("close", .44, undefined, .54)], windows: {background: {to: from("close")}}}),
  V21_001: profile("mg-v-object-streak-round-badge", "物件拖影冲入与圆牌落下",
    "适合一个主体和一个短指标。在贴合主题的实拍底上保留蓝色波网，透明主体冲入后落下发光圆牌。", 53, {
      background: effectVideoBackground,
      object: cutout("带 Alpha 的单件主体，从左边冲入。"),
      label: text("发光圆牌里的短数字或量级。", "9W", 5, .85),
    }, {hits: [enter("label", .34, undefined, .38)]}),
  V21_003: profile("mg-v-image-chromatic-break", "图文显形与色散碎裂",
    "适合在主题视频上用一张图和一个短词强调主体，随即以色散碎裂结束。", 61, {
      background: effectVideoBackground,
      picture: image("显形后碎裂的中央照片。"), title: text("照片上的金色短词。", "新车", 5),
      break: cue("开始色散碎裂的时点。", 1.41),
    }, {hits: [enter("break", .45, undefined, .62)]}),
  V22_001: profile("mg-v-window-percent-roll", "图窗扩展与翻滚百分比",
    "适合从蓝框图片点出主题，再扩大到独立主体并展示一个百分比。", 124, {
      background: bg, clip: image("中央蓝框中的静态主题图片。", .52), title: text("蓝框内的白色短题。", "城市更新", 8),
      subject: cutout("向外扩大的透明主题 PNG。", 1.82),
      ratio: percent("上方翻滚出现的百分比。", "98%", 2.48),
    }, {hits: [enter("clip", .34), enter("subject", .48, "clip", .45), enter("ratio", .64, "subject", .29)]}),
  V27_001: profile("mg-v-year-silhouette-pair", "年份聚合、剪影与双牌升起",
    "适合某个年份及其两项并列对象。白年份聚合、剪影和三角线升起，两张内容牌分别从背后出现。", 209, {
      background: bg, year: {...text("上方四位年份。", "2026", 5, .51), pattern: "^[0-9]{4}$"},
      person: cutout("呈现在发光倒三角形前后的剪影主体 PNG。", 1.05), label: text("剪影内的白色竖题。", "市场观察", 5),
      left: image("左侧金色小牌内容。", 3.6), leftLabel: text("左侧小牌内的白色竖字。", "参考数据", 5),
      right: image("右侧蓝色小牌内容。", 4), rightLabel: text("右侧小牌内的白色竖字。", "实施方案", 5),
    }, {hits: [enter("year", .42), enter("person", .5, "year", .3),
      enter("left", .48, "person", .5), enter("right", .48, "person", .5)]}),
  V27_003: profile("mg-v-year-two-data-windows", "时间标题与上下双层数据窗",
    "适合一个时间标题配两个数据事实。两段视频分别从上、下撕边窗进入，数据写在各窗内。", 164, {
      background: bg, title: text("画面正中的时间短语。", "25年后", 8),
      upper: video("顶部先进入的撕边视频。", .55), upperLabel: text("顶部视频中的短数字说明。", "792万人", 10),
      lower: video("底部后进入的撕边视频。", 2.55), lowerLabel: text("底部视频中的短数字说明。", "2400万家庭", 10),
    }, {hits: [enter("upper", .44), enter("lower", .44, "upper", .5)]}),
  V28_004: profile("mg-v-document-zoom-highlight", "资料放大定位与逐字高亮",
    "适合引用一行原始资料。资料页从右侧升入，推近真实截图后按原方向逐字扫过高亮。", 133, {
      background: bg, document: image("真实资料原页截图。", .38),
      focus: cue("资料开始推近引文的时点。", 1.47), highlight: cue("资料定位后开始逐字高亮的时点。", 2.53),
    }, {hits: [enter("document", .42), enter("focus", .52, "document", .48), enter("highlight", .62, "focus", .63)]}),
  V29_001: profile("mg-v-torn-circle-shatter-montage", "撕边圆窗、数字碎裂与多窗转场",
    "用于比较两个短数字，随后同主题三段实拍组成三窗，再展开最终一幕。", 204, {
      background: video("环绕撕边圆窗的连续视频。"), circle: video("中央撕边圆窗中的连续视频。"),
      first: text("圆窗上第一个白字数值。", "39元", 6, .63),
      second: text("同一字位替换的第二个数值。", "33万", 6, 2.04),
      shatter: cue("第二个数值碎裂的时点。", 3.33),
      top: video("多窗阶段左上视频。", 4.16), right: video("多窗阶段右侧视频。"),
      bottom: video("多窗阶段左下视频。"), finalClip: video("最后展开的实拍视频。", 5.68),
      signature: text("原页脚真实署名。", "现场记录", 14),
    }, {hits: [enter("first", .28), enter("second", .32, "first", .38), enter("shatter", .48, "second", .45),
      enter("top", .46, "shatter", .52), enter("finalClip", .45, "top", .55)],
      windows: {background: {to: from("finalClip")}, circle: {to: from("top", .45)}, top: {to: from("finalClip")},
        right: {from: from("top", .1), to: from("finalClip")}, bottom: {from: from("top", .18), to: from("finalClip")}}}),
  V30_001: profile("mg-v-side-tears-object-label", "双侧撕纸、物件升起与横牌揭示",
    "适合一个透明主体加一个短标签。先裂开两侧实拍，再升起物件，紫青横牌显形并上移。", 167, {
      background: bg, side: video("裂开展开的两侧实拍，共用一条视频。", .48),
      object: cutout("升到两侧撕纸中间的透明物件 PNG。", 1.23),
      title: text("紫青横牌的白色短词。", "人气样品", 7, 2.65),
    }, {hits: [enter("side", .46), enter("object", .52, "side", .35), enter("title", .84, "object", .52)]}),
  V31_001: profile("mg-v-presenter-diagonal-close", "讲解人升起、斜切双窗与字卡收束",
    "适合一个讲解人引入两个例子，最后单窗聚焦并落在红色短语。", 96, {
      background: bg, presenter: cutout("下方右侧出现的透明讲解人 PNG。", .29),
      backing: video("双窗背后的蓝色主题视频。"),
      upper: video("右上斜窗视频。", .94), upperLabel: text("右上窗左侧的红色竖字。", "日常", 4),
      lower: video("左下斜窗视频。"), lowerLabel: text("左下窗右侧的红色竖字。", "讲解", 4),
      focus: video("最后移到中央的蓝色圆角视频窗。", 2.03), focusLabel: text("最后中央窗上的红色短词。", "关键点", 4),
    }, {hits: [enter("presenter", .33), enter("upper", .43, "presenter", .34), enter("focus", .54, "upper", .53)],
      windows: {backing: {from: from("upper"), to: from("focus", .29)}, upper: {to: from("focus", .29)},
        lower: {from: from("upper", .1), to: from("focus", .29)}, focus: {stopBeforeEnd: .13}}}),
  opening_layered: profile("mg-v-layered-opening", "层叠切窗开场",
    "用于竖屏视频开头的一句主题和两个紧接着点到的分题。首帧连续实拍，主标题迅速聚焦，两个切角实拍窗按口播先后打开。只有一句短主题时可选用单标题模板。", 108, {
      background: video("开场主画面，选能一眼交代主题的连续实拍，覆盖全段。"),
      title: text("开头主标题，建议 4 到 6 个汉字。", "中期选举", 6, .067),
      first: video("第一个分题的连续实拍，从分题命中开始播放。", .60),
      firstLabel: text("第一个窗的短标签。", "美国局势", 5),
      second: video("第二个分题的连续实拍，从分题命中开始播放。", 1.24),
      secondLabel: text("第二个窗的短标签。", "AI 竞争", 5),
    }, {hits: [
      enter("title", .25), enter("first", .46, "title", .27), enter("second", .63, "first", .22),
    ]}),
} satisfies Record<string, Profile & Options>;

export const getSelectedProfile = (id: string): (Profile & Options) | undefined =>
  Object.hasOwn(selectedProfiles, id) ? selectedProfiles[id as keyof typeof selectedProfiles] : undefined;

export function selectedVideoWindow(id: string, key: string, spec: Record<string, {at?: number}>, start: number, end: number) {
  const window = getSelectedProfile(id)?.windows?.[key];
  const relative = (point: RelativeTime) => (spec[point.cue]?.at ?? start) + (point.offset ?? 0);
  return {
    start: window?.from ? relative(window.from) : spec[key]?.at ?? start,
    end: window?.to ? Math.min(relative(window.to), end) : end - (window?.stopBeforeEnd ?? 0),
  };
}

export function validateSelectedTimings(id: string, args: Record<string, {at?: number}>, start: number, end: number) {
  const at = (key: string) => args[key]?.at ?? start;
  for (const {key, after, gap = 0, tail = 0} of getSelectedProfile(id)?.hits ?? []) {
    if (at(key) - (after ? at(after) : start) + 1e-6 < gap)
      throw new Error(id + "." + key + ": leave room for the preceding fixed phase");
    if (end - at(key) + 1e-6 < tail)
      throw new Error(id + "." + key + ": allow the complete fixed motion before the scene ends");
  }
}
