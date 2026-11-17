import {selectedProfiles} from "./selected/profiles";
import type {CSSProperties} from "react";

export type Box = readonly [left: number, top: number, width: number, height: number];
export type Slot = {
  type: "video" | "image" | "cutout" | "text" | "cue";
  label: string;
  demo: number | string;
  at?: number;
  max?: number;
  maxUnits?: number;
  maxLines?: number;
  asciiUnits?: number;
  optional?: boolean;
  pattern?: string;
};
export type Motion = "fade" | "up" | "down" | "left" | "right" | "pop" | "drop" |
  "wipe" | "unroll" | "assemble" | "scan" | "streak" | "strip-join" | "shutter" | "exit-down" | "slide-window";
export type Track = {
  slot?: string;
  graphic?: "question" | "vs" | "pointer" | "grid" | "sphere" | "sparkles" | "rays" |
    "electric" | "electric-line" | "wave" | "dash" | "flash" | "smoke" | "net" | "letterbox";
  box: Box;
  from?: string;
  until?: string;
  motion?: Motion;
  seconds?: number;
  overlap?: number;
  fadeOut?: number;
  fit?: "cover" | "contain";
  clip?: "torn" | "diagonal" | "top-fold" | "bottom-fold";
  tilt?: number;
  perspective?: number;
  scroll?: number;
  size?: number;
  css?: CSSProperties;
  image?: CSSProperties;
};
export type Profile = {
  tag: `mg-v-${string}`;
  name: string;
  hint: string;
  duration: number;
  slots: Record<string, Slot>;
  tracks: readonly Track[];
  order?: readonly string[];
};

const full = [0, 0, 360, 640] as const;
const video = (label: string, demo: number, at?: number): Slot => ({type: "video", label, demo, at});
const image = (label: string, demo: number, at?: number): Slot => ({type: "image", label, demo, at});
const cutout = (label: string, demo: number, at?: number): Slot => ({type: "cutout", label, demo, at});
const text = (label: string, demo: string, max: number, at?: number): Slot => ({type: "text", label, demo, max, at});
const cue = (label: string, at: number): Slot => ({type: "cue", label, demo: 0, at});
const media = (slot: string, box: Box = full, options: Partial<Track> = {}): Track => ({slot, box, ...options});
const words = (slot: string, box: Box, size: number, options: Partial<Track> = {}): Track => ({slot, box, size, ...options});
const art = (graphic: Track["graphic"], box: Box = full, options: Partial<Track> = {}): Track => ({graphic, box, ...options});
const rounded = {borderRadius: 14};
const paleBorder = {border: "2px solid #f5f7fc", borderRadius: 12};
const blue = {background: "linear-gradient(110deg,#15668a,#4299b9)", border: "1px solid #77c1d5", borderRadius: 7};
const gold = {background: "linear-gradient(100deg,#b99a3d,#dac273)", borderRadius: 4, color: "#fff6cb"};
const purple = {background: "linear-gradient(110deg,#7037a6,#632de1)", border: "1px solid #b477db", borderRadius: 5};
const cyan = {background: "linear-gradient(95deg,#04bdac,#167ec7)", borderRadius: 3};
const gloss = {color: "#fff", textShadow: "0 2px 3px #07090c, 0 0 10px #080f19"};
const dim = {filter: "blur(9px) brightness(.54)", transform: "scale(1.08)"};
const deepBlue = {filter: "blur(5px) brightness(.45) saturate(1.25)", transform: "scale(1.06)"};
const red = {color: "#dd171b", textShadow: "1px 2px 1px #370d0e, 0 0 8px #84080a"};
const captionPanel = {background: "#b60b13", borderRadius: 7, color: "#fff5d7", padding: "8px 12px", whiteSpace: "pre-line" as const};

export const referenceProfiles = {
  V07_004: {
    tag: "mg-v-question-reveal", name: "问号转答案", hint: "适合一个焦点最终落到一个短答案，且两路视频能辅助交代该重点。问号闪退后显示答案。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 114 / 30,
    slots: {background: video("连续的虚化底视频", 0), clip: video("中央圆角窗连续视频", 1), answer: {...text("答案出现的词和时点", "开屏广告", 8, 50 / 30), maxUnits: 4}},
    tracks: [media("background", full, {image: {...dim, filter: "blur(15px) brightness(.7) saturate(.9)"}}),
      media("clip", [55, 142, 250, 298], {css: rounded}), art("sparkles", full, {css: {opacity: .4}}),
      art("question", [126, 215, 108, 148], {until: "answer", motion: "pop", seconds: .25}),
      art("flash", [55, 142, 250, 298], {from: "answer", seconds: .18, css: rounded}),
      words("answer", [28, 231, 304, 80], 39, {motion: "pop", css: gloss})],
  },
  V19_005: {
    tag: "mg-v-particle-sphere-title", name: "粒子球标题", hint: "实拍先铺满，关键词放大，背后长字横移，细白粒子在同一视频上围成球壳。",
    duration: 4.3,
    slots: {background: video("全屏实拍", 0), title: text("中央关键词", "安静", 7, .75), backTitle: text("背后的长字原位", "QUIETNESS", 20, .75)},
    tracks: [media("background"), art("sphere", [22, 110, 316, 380], {from: "title", motion: "pop", seconds: .65}),
      words("backTitle", [-78, 258, 516, 105], 70, {motion: "left", seconds: 2.6, css: {color: "#dfe4e785", fontWeight: 500}}),
      words("title", [22, 259, 316, 93], 52, {motion: "pop", css: gloss})],
  },
  V20_006: {
    tag: "mg-v-torn-oval-inset", name: "双画面与椭圆窗", hint: "上下两个真实视频用撕纸边连接，下窗升入后，白边椭圆视频在接缝横向展开。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 134 / 30,
    slots: {upper: video("上方撕边实拍", 0), lower: video("从底部升入的下方实拍", 1, 44 / 30), oval: video("接缝椭圆窗实拍", 2, 89 / 30)},
    order: ["lower", "oval"],
    tracks: [{box: [0, 0, 360, 408], clip: "torn", css: {background: "#eee9dc"}},
      media("upper", [0, 0, 360, 404], {clip: "torn"}), media("lower", [0, 396, 360, 244], {motion: "up", seconds: .45}),
      media("oval", [55, 337, 250, 117], {motion: "unroll", seconds: .38, css: {border: "2px solid #eee8df", borderRadius: "50%"}})],
  },
  V22_002: {
    tag: "mg-v-circle-roll-drop", name: "圆窗换字下坠", hint: "适合两个短标签在同一位置前后接替，例如疑问与回答或同一状态前后变化。斜牌纵滚换字，圆窗最后下坠。",
    duration: 4.4,
    slots: {background: video("全屏实拍", 0), circle: video("圆窗中的实拍", 1), question: text("斜牌上的问题", "会不用？", 8, .7),
      answer: text("滚动换出的结论", "不怕！", 8, 1.9), drop: cue("圆窗加速落下的时点", 3.4)},
    order: ["question", "answer", "drop"],
    tracks: [media("background", full, {image: {filter: "brightness(.72)"}}),
      media("circle", [57, 206, 246, 246], {until: "drop", css: {borderRadius: "50%"}}),
      media("circle", [57, 206, 246, 246], {from: "drop", motion: "exit-down", seconds: .5, css: {borderRadius: "50%"}}),
      words("question", [74, 147, 212, 56], 30, {until: "answer", tilt: -8, motion: "up", css: {...blue, ...red}}),
      words("answer", [74, 147, 212, 56], 30, {until: "drop", tilt: -8, motion: "shutter", css: {...blue, ...red}})],
  },
  V19_006: {
    tag: "mg-v-staggered-price-cards", name: "错位双信息卡", hint: "适合两组各有三个短要点的信息，可对照两方或依次呈现两种情况。两路视频顺次播放，左上和右下信息卡各有标题和三个分时出现的文字位。",
    duration: 8.5,
    slots: {firstClip: video("第一组信息对应的视频", 0), secondClip: video("第二组信息对应的视频", 1, 4),
      firstTitle: text("左卡标题", "体感开屏", 9, .7), firstRow1: text("左卡第一行", "相比普通", 13, 1.3),
      firstRow2: text("左卡第二行", "单日刊例价", 13, 2.0), firstRow3: text("左卡第三行", "高出50万元", 13, 3.0),
      secondTitle: text("右卡标题", "首刷", 9, 4.2), secondRow1: text("右卡第一行", "当日首次打开", 13, 5.0),
      secondRow2: text("右卡第二行", "单日刊例价", 13, 6.0), secondRow3: text("右卡第三行", "超千万元", 13, 7.0)},
    order: ["firstTitle", "firstRow1", "firstRow2", "firstRow3", "secondClip", "secondTitle", "secondRow1", "secondRow2", "secondRow3"],
    tracks: [media("firstClip", full, {until: "secondClip", image: {filter: "brightness(.61)"}}),
      media("secondClip", full, {image: {filter: "brightness(.61)"}}), art("grid", full),
      ...priceCard("first", 38, 171), ...priceCard("second", 178, 317)],
  },
  V28_002: {
    tag: "mg-v-round-object-swap", name: "三个物件圆窗换主体", hint: "底部抠像一直保留，三张圆形图片渐隐，随后一张上方透明主体图淡入。",
    duration: 4.8,
    slots: {background: video("连续背景实拍", 0), first: image("上方第一张圆窗图", 0), second: image("右侧圆窗图", 1),
      third: image("左下圆窗图", 2), foreground: cutout("始终保留的底部物品抠像", 0), replacement: cutout("上方替换物件抠像", 1, 2.45)},
    tracks: [media("background", full, {image: {filter: "brightness(.76)"}}),
      ...([[34, 29, 143, 143], [183, 192, 145, 145], [34, 316, 149, 149]] as const).map((box, i) =>
        media(["first","second","third"][i], box, {until: "replacement", overlap: .35, fadeOut: .35, css: {borderRadius: "50%"}})),
      media("foreground", [0, 458, 360, 182], {fit: "contain"}),
      media("replacement", [22, 18, 316, 273], {fit: "contain", motion: "fade", seconds: .45})],
  },
  V19_001: {
    tag: "mg-v-perspective-faceoff", name: "透视对阵", hint: "两侧素材或抠像对阵。中央保留金色 VS，白、红竖题从相反方向滑入，透视网格包围主体。",
    duration: 4.5,
    slots: {background: video("场景实拍", 1), leftObject: cutout("左侧主体抠像", 0, .45), rightObject: cutout("右侧主体抠像", 1, .7),
      leftLabel: text("左侧白色竖题", "用户抵触", 7, .4), rightLabel: text("右侧红色竖题", "平台损失小", 8, .65)},
    tracks: [media("background", full, {image: dim}), art("grid", full), art("vs", [145, 268, 70, 70], {motion: "pop"}),
      media("leftObject", [-3, 166, 119, 312], {fit: "contain", tilt: -12, motion: "right"}),
      media("rightObject", [245, 165, 118, 299], {fit: "contain", tilt: 13, motion: "left"}),
      words("leftLabel", [110, 118, 57, 285], 38, {motion: "down", css: {...gloss, writingMode: "vertical-rl"}}),
      words("rightLabel", [193, 213, 60, 286], 38, {motion: "up", css: {...red, writingMode: "vertical-rl"}})],
  },
  V31_003: {
    tag: "mg-v-two-option-click", name: "双按钮点选", hint: "实拍画幅内亮起两个选项；换景时右选项退走，左选项移中，白色光标点选。",
    duration: 3.7,
    slots: {background: video("双选项出现时的实拍", 0), chosenClip: video("点选时切入的实拍", 1, 2.2),
      left: text("最终被选的左按钮文字", "沿用", 7, .45), right: text("右按钮文字", "换用", 7, 1.15)},
    order: ["left", "right", "chosenClip"],
    tracks: [art("letterbox"), media("background", [0, 81, 360, 397], {until: "chosenClip"}),
      words("left", [18, 260, 137, 86], 35, {until: "chosenClip", motion: "pop", css: blue}),
      words("right", [188, 260, 137, 86], 35, {until: "chosenClip", motion: "pop", css: blue}),
      media("chosenClip", [0, 81, 360, 397]),
      words("left", [99, 260, 137, 86], 35, {from: "chosenClip", motion: "right", seconds: .32, css: blue}),
      art("pointer", [218, 309, 49, 54], {from: "chosenClip", motion: "left", seconds: .5})],
  },
  V21_009: {
    tag: "mg-v-radiant-round-tag", name: "放射光圆牌", hint: "带双色光边的圆形黑牌从上落下，数码底爆发放射光。只显示正文实际点出的短标签。",
    duration: 1.8, slots: {title: text("圆牌标题", "现状偏差", 8, .03)},
    tracks: [art("rays"), words("title", [68, 187, 224, 224], 35, {motion: "drop", seconds: .36,
      css: {border: "2px solid #edb879", borderRadius: "50%", background: "radial-gradient(ellipse,#08090f 60%,#31162c)", boxShadow: "0 0 22px #ff5c9d90"}})],
  },
  V27_006: {
    tag: "mg-v-assembled-two-lines", name: "双行字符聚合", hint: "保留实际暗背景，蓝色发光板升起，两行按口播先后聚合在同一板上。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 6,
    slots: {background: video("暗化后的背景实拍", 0), title: {...text("原有标题位", "任务变难时", 15, 0), maxUnits: 8},
      firstLine: {...text("先聚合的第一行", "总计16人", 15, 2 / 30), maxUnits: 7}, secondLine: {...text("后聚合的第二行", "倾向默认13人", 15, 83 / 30), maxUnits: 7}},
    tracks: [media("background", full, {image: {filter: "brightness(.4)"}}), art("net", full),
      words("title", [22, 155, 316, 58], 33, {motion: "fade", css: gloss}),
      {box: [26, 216, 308, 185], from: "title", motion: "up", css: {background: "#174864a8", border: "2px solid #77c5ea", boxShadow: "0 0 14px #4ba7e9, inset 0 0 13px #4282b8", borderRadius: 4}},
      words("firstLine", [40, 237, 280, 63], 32, {motion: "assemble"}),
      words("secondLine", [40, 311, 280, 63], 32, {motion: "assemble"})],
  },
  V24_001: {
    tag: "mg-v-torn-title-reversal", name: "撕边视频与前后标题", hint: "中央撕边窗换镜，原有白字撤下后切到暗实拍和红字，白烟从红字背后横过。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 175 / 30,
    slots: {background: video("撕边窗后压暗实拍", 0), clip: video("中央第一段视频", 1), nextClip: video("同一窗后续视频", 2, 88 / 30),
      opening: text("上方白字", "换用成本", 5, 0), closing: text("收尾红字", "待割韭菜", 4, 128 / 30)},
    tracks: [media("background", full, {image: dim}),
      {box: [0, 158, 360, 298], until: "closing", clip: "torn", css: {background: "#ebe8df"}},
      media("clip", [0, 161, 360, 292], {until: "nextClip", clip: "torn"}),
      media("nextClip", [0, 161, 360, 292], {until: "closing", clip: "torn"}),
      words("opening", [23, 37, 314, 104], 53, {until: "closing", motion: "assemble", css: gloss}),
      art("smoke", [0, 180, 360, 248], {from: "closing", motion: "right", seconds: .65}),
      words("closing", [22, 240, 316, 125], 55, {motion: "pop", css: red})],
  },
  V10_008: {
    tag: "mg-v-stacked-footage-strips", name: "横条素材分屏", hint: "实拍引入后，五条连续视频同时从左右交错滑入。upper.at 为五路共同入场时点；每路只填视频路径、源取用范围和原有短标签，位置、字号与动作固定。",
    duration: 7,
    slots: {lead: video("分屏之前的连续视频", 0), upper: video("第一条视频及五路共同入场时点", 1, 1.4),
      middle: video("第二条视频", 2), lower: video("第三条视频", 0), fourth: video("第四条视频", 1), fifth: video("第五条视频", 2),
      ...Object.fromEntries(["upper","middle","lower","fourth","fifth"].map((key,i)=>[key+"Text",{...text("第"+(i+1)+"条原有短标签",["邀约","项目包装","律师咨询","机场接待","更改路线"][i],6),maxUnits:6}]))},
    tracks: [art("letterbox"), media("lead", [0, 69, 360, 401], {until: "upper"}),
      ...["upper","middle","lower","fourth","fifth"].flatMap((key,i)=>[
        media(key,[0,[0,128,256,424,536][i],360,[144,144,184,128,128][i]],{from:"upper",motion:i%2?"right":"left",seconds:.4}),
        words(key+"Text",[38,[105,229,360,512,617][i],280,22],20,{from:"upper",css:gloss})
      ])],
  },
  V13_003: {
    tag: "mg-v-report-scroll-window", name: "长图滚动窗", hint: "适合用连续上滚呈现足够长的文章、文件或资料截图。窗外保留与主题相符的视频。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 196 / 30,
    slots: {background: video("报道窗之外的连续实拍", 0), document: image("真实报道长截图", 2, 0)},
    tracks: [art("letterbox"), media("background", [0, 60, 360, 447], {image: {filter: "brightness(.78)"}}),
      media("document", [31, 159, 298, 214], {motion: "down", seconds: .45, scroll: .92, css: {borderRadius: 25, border: "2px solid white", boxShadow: "0 6px 18px #0008", background: "white"}})],
  },
  V16_002: {
    tag: "mg-v-folded-three-photos", name: "三张透视图", hint: "三张静态图在连续视频前各自沿原固定轨迹入场；各图at对齐各自口播词，可错开且不限制顺序。背景sourceStart/sourceEnd是源视频取用范围，长度等于实例时长。每图应在末尾淡出前完成约0.87秒入场。原尖角、金框及入退场固定。底部原有字幕和署名可以替换或留空。",
    duration: 69 / 30,
    slots: {background: video("连续实拍背景", 1), top: image("第一张静态图", 0, 0),
      middle: image("第二张静态图", 1, 0), bottom: image("第三张静态图", 2, 0)},
    tracks: [art("letterbox"), media("background", [0, 63, 360, 428]),
      media("top", [129, 92, 218, 139], {perspective: -25, clip: "top-fold", motion: "left"}),
      media("middle", [32, 175, 251, 145], {perspective: 24, clip: "bottom-fold", motion: "right"}),
      media("bottom", [124, 251, 217, 141], {perspective: -25, clip: "top-fold", motion: "left"})],
  },
  V21_005: {
    tag: "mg-v-document-row-focus", name: "文档队列与摘行", hint: "适合从三张资料图中挑出一张，并引用其中一行。透视队列叠在相关视频上，光标点选后展开中间文档，再露出同页摘句。",
    duration: 5.2,
    slots: {leftPage: image("左侧文档截图", 0, .25), middlePage: image("要点选的正文截图", 2, .52),
      rightPage: image("右侧文档截图", 1, .72), select: cue("中间正文展开时点", 1.8), excerpt: image("从同一正文截取的真实原句图片", 2, 3.65)},
    order: ["leftPage", "middlePage", "rightPage", "select", "excerpt"],
    tracks: [art("sparkles", full, {css: {background: "radial-gradient(ellipse at 50% 0,#122464,#070820)"}}),
      media("leftPage", [21, 234, 99, 179], {motion: "left", perspective: 24, until: "select", css: paleBorder}),
      media("rightPage", [241, 234, 97, 179], {motion: "left", perspective: -24, until: "select", css: paleBorder}),
      media("middlePage", [115, 212, 130, 216], {motion: "left", until: "select", css: paleBorder}),
      media("middlePage", [35, 77, 290, 422], {from: "select", motion: "pop", seconds: .5, fit: "contain", css: {background: "#f8f8ee"}}),
      art("pointer", [220, 332, 44, 48], {from: "select", until: "excerpt", motion: "left", seconds: .36}),
      media("excerpt", [27, 208, 306, 72], {motion: "pop", fit: "contain", css: {background: "white", boxShadow: "0 5px 18px #0009"}})],
  },
  V20_009: {
    tag: "mg-v-same-card-text-sweep", name: "同牌换字", hint: "上方始终是真实视频，下方蓝色牌保持原位，原字清空后粒子扫出第二个短语。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 106 / 30,
    slots: {upper: video("上方连续实拍", 0), before: text("原牌先显示的词", "呈现更频繁", 6, 32 / 30),
      after: text("横扫后显示的词", "好感通常更高", 6, 66 / 30)},
    order: ["before", "after"],
    tracks: [art("sparkles", full, {css: {background: "#071723", opacity: .73}}), media("upper", [0, 22, 360, 384], {css: {borderBlock: "2px solid #d4edf7"}}),
      {box: [37, 433, 286, 91], css: blue, from: "before", motion: "up"},
      words("before", [46, 437, 268, 82], 38, {until: "after", motion: "pop"}),
      art("sparkles", [43, 440, 274, 77], {from: "after", seconds: .6, motion: "wipe", css: {filter: "sepia(1) saturate(5)"}}),
      words("after", [46, 437, 268, 82], 37, {motion: "scan", seconds: .55})],
  },
  V20_003: {
    tag: "mg-v-two-window-switch", name: "双画面切换", hint: "上圆角近景和下全景为真实视频；全景先叠化，上窗再横滑换镜，最后退出下窗。",
    duration: 5.9,
    slots: {upper: video("上窗第一段实拍", 0), lower: video("下窗第一段实拍", 1),
      lowerNext: video("下窗叠化到的实拍", 2, 1.55), upperNext: video("上窗滑到的实拍", 2, 2.95),
      closeLower: cue("下方全景退出的时点", 4.65)},
    order: ["lowerNext", "upperNext", "closeLower"],
    tracks: [art("sparkles", full, {css: {background: "#07090d", opacity: .75, filter: "sepia(.4)"}}),
      media("upper", [14, 88, 332, 216], {until: "upperNext", overlap: .44, css: {...rounded, border: "1px solid #e1cd9b"}}),
      media("upperNext", [14, 88, 332, 216], {motion: "slide-window", seconds: .44, css: {...rounded, border: "1px solid #e1cd9b"}}),
      media("lower", [0, 373, 360, 231], {until: "lowerNext", overlap: .46}),
      media("lowerNext", [0, 373, 360, 231], {until: "closeLower", motion: "fade", seconds: .46})],
  },
  V18_003: {
    tag: "mg-v-strip-join-inset", name: "横条拼合视频窗", hint: "实拍前的错向横条拼成视频窗。黄字扫描后，闪白切成完整圆角窗并继续播放。",
    duration: 5.7,
    slots: {background: video("窗外连续实拍", 0), strips: video("横条内同一段视频", 1, .32),
      label: text("横条原有黄字位", "开屏广告", 10, .65), inset: video("闪白后完整圆角窗", 2, 2.45),
      next: video("圆角窗第二段真实视频", 0, 4.15)},
    order: ["strips", "label", "inset", "next"],
    tracks: [art("letterbox"), media("background", [0, 56, 360, 451], {image: {filter: "brightness(.73)"}}),
      media("strips", [12, 194, 336, 235], {until: "inset", motion: "strip-join", seconds: .76}),
      words("label", [48, 244, 264, 63], 34, {until: "inset", motion: "scan", css: {color: "#f8d52b", textShadow: "0 1px 6px #101010"}}),
      media("inset", [12, 194, 336, 235], {until: "next", css: rounded}),
      media("next", [12, 194, 336, 235], {css: rounded}),
      art("flash", [12, 194, 336, 235], {from: "inset", seconds: .2, css: rounded})],
  },
  V21_002: {
    tag: "mg-v-gold-price-arrow", name: "双金牌与虚线箭头", hint: "适合在轻微虚化的主题视频上呈现两个有方向关系的短标签，如前后变化、输入与结果。两块金牌分时显字，虚线箭头从左向右，蓝色波网与透明主体保留原动作。",
    duration: 3.8,
    slots: {background: {...video("全屏主题视频，从场景首帧持续播放至结束", 0), optional: true},
      subject: cutout("下方主体透明图片", 0), first: text("左侧金牌文字", "流量", 8, .8),
      arrow: cue("虚线箭头出现时点", 1.45), second: text("右侧金牌文字", "收入", 8, 2.25)},
    order: ["first", "arrow", "second"],
    tracks: [art("wave"), media("subject", [26, 285, 308, 239], {fit: "contain", motion: "streak", seconds: .44}),
      words("first", [13, 159, 111, 76], 29, {motion: "scan", css: gold}),
      art("dash", [129, 182, 99, 31], {from: "arrow", motion: "wipe", seconds: .32}),
      words("second", [235, 159, 111, 76], 29, {motion: "scan", css: gold})],
  },
  V21_008: {
    tag: "mg-v-one-large-two-small", name: "一大两小信息卡", hint: "虚化实拍上先落一张紫色大卡，再左右落两张较小的紫色卡，三张一直保留。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 106 / 30,
    slots: {background: video("三卡背后的真实视频", 1), title: text("上方大牌", "困扰", 3, 0),
      left: text("左下小牌", "误跳转", 3, 32 / 30), right: text("右下小牌", "打断", 3, 60 / 30),
      titleSubtitle: {...text("大牌原有英文副行", "Disruption", 18), optional: true, pattern: "^[ -~]+$"},
      leftSubtitle: {...text("左牌原有英文副行", "Misclick", 20), optional: true, pattern: "^[ -~]+$"},
      rightSubtitle: {...text("右牌原有英文副行", "Interrupt", 20), optional: true, pattern: "^[ -~]+$"}},
    tracks: [media("background", full, {image: dim}),
      words("title", [63, 172, 234, 127], 48, {motion: "pop", css: purple}),
      words("left", [18, 369, 146, 79], 28, {motion: "pop", css: {...purple, background: "linear-gradient(120deg,#493769,#7131ba)"}}),
      words("right", [196, 369, 146, 79], 28, {motion: "pop", css: {...purple, background: "linear-gradient(120deg,#843366,#7026a9)"}})],
  },
  V28_001: {
    tag: "mg-v-electric-frame-title", name: "电弧扫出标题", hint: "暗化实拍的四边保持蓝色电光，中央横扫露出短标题和原版矩形框。",
    duration: 4.0,
    slots: {background: video("蓝暗实拍背景", 0), title: text("框内点题短语", "选择权", 9, 1.0)},
    tracks: [media("background", full, {image: deepBlue}), art("electric", [4, 4, 352, 632]),
      {box: [42, 246, 276, 119], from: "title", motion: "wipe", css: {background: "#143a55b8", border: "1px solid #72daedb0", boxShadow: "0 0 19px #1ca2e690"}},
      art("electric", [43, 244, 274, 121], {from: "title", motion: "wipe", seconds: .65}),
      words("title", [50, 259, 260, 91], 44, {motion: "scan", css: {color: "#cbfaff", textShadow: "0 0 10px #36b6e9, 2px 3px 1px #0f2e50"}})],
  },
  V18_002: {
    tag: "mg-v-red-scroll-quote", name: "红底引文滚动", hint: "正文按原顺序从窄矩形红底内向上滚动，亮闪后切满宽圆角红底和新背景，继续展示剩余引文。",
    duration: 5.9,
    slots: {firstBackground: video("换板前的实拍背景", 0), secondBackground: video("换板后的实拍背景", 1, 3.05),
      firstQuote: text("窄板上的原文引句，按真实分行", "经营者应保障用户选择\n关闭标志应当显著\n确保广告一键关闭", 180, .6),
      secondQuote: text("满宽红板内续上的真实引句", "不得以虚假提示诱导点击\n用户可以自行关闭", 180, 3.05)},
    order: ["firstQuote", "secondBackground"],
    tracks: [art("letterbox"), media("firstBackground", [0, 67, 360, 409], {until: "secondBackground", image: dim}),
      media("secondBackground", [0, 67, 360, 409], {image: {filter: "brightness(.85)"}}),
      words("firstQuote", [56, 157, 249, 237], 22, {until: "secondBackground", motion: "streak", scroll: .56, css: captionPanel}),
      words("secondQuote", [4, 143, 352, 238], 24, {motion: "fade", scroll: .62, css: {...captionPanel, borderRadius: 26}}),
      art("flash", [0, 67, 360, 409], {from: "secondBackground", seconds: .18})],
  },
  V26_001: {
    tag: "mg-v-three-diagonal-clips", name: "三格斜切", hint: "三个真实视频从首帧连续占据左低右高的斜切槽；upperHit、middleHit、lowerHit控制各槽短促提亮。三路素材均需覆盖整段；不提供无效的媒体出现时间。各闪亮时点独立填写。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 145 / 30,
    slots: {upper: video("上方斜切实拍", 0), middle: video("中间斜切实拍", 1), lower: video("下方斜切实拍", 2),
      upperHit: cue("上格闪亮时点", 35 / 30), middleHit: cue("中格闪亮时点", 82 / 30), lowerHit: cue("下格闪亮时点", 110 / 30)},
    tracks: [
      ...([[0, -14, 360, 251], [0, 193, 360, 253], [0, 401, 360, 256]] as const).flatMap((box, i) => {
        const key = ["upper", "middle", "lower"][i];
        return [media(key, box, {motion: i ? "left" : undefined, clip: "diagonal", seconds: .34}),
          art("flash", box, {from: key + "Hit", clip: "diagonal", seconds: .18})];
      })],
  },
  V11_003: {
    tag: "mg-v-torn-label-stages", name: "撕纸分区与标签", hint: "下窗持续播放，上方先两条彩牌分别飞入，再切换到错落的三条彩牌自下向上露字。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 287 / 30,
    slots: {clip: video("下方撕边窗的连续真实视频", 2), first: text("第一阶段第一牌", "4月", 4, 40 / 30),
      second: text("第一阶段第二牌", "为期半年", 4, 67 / 30), finalTop: text("第二阶段上牌", "4月", 4, 190 / 30),
      finalMiddle: text("第二阶段中牌", "为期半年", 4, 203 / 30), finalBottom: text("第二阶段下牌", "弹窗广告", 4, 218 / 30)},
    tracks: [art("net", full, {css: {background: "linear-gradient(138deg,#26373d,#1e2735 57%,#38262d)"}}),
      {box: [0, 238, 360, 374], clip: "torn", css: {background: "#eee8d9"}},
      media("clip", [0, 244, 360, 362], {clip: "torn"}),
      words("first", [74, 62, 163, 44], 26, {motion: "down", until: "finalTop", css: cyan}),
      words("second", [74, 130, 163, 44], 26, {motion: "right", until: "finalTop", css: purple}),
      words("finalTop", [171, 38, 158, 39], 25, {motion: "shutter", css: {...blue, borderRadius: 0}}),
      words("finalMiddle", [34, 103, 158, 39], 25, {motion: "shutter", css: {...purple, borderRadius: 0}}),
      words("finalBottom", [171, 172, 158, 41], 24, {motion: "shutter", css: {...gold, borderRadius: 0}})],
  },
  V16_001: {
    tag: "mg-v-sliding-document-pair", name: "资料滑换", hint: "上方固定红色标题；两张真实白底文件截图先左入，后从右侧接替。 素材按原类型提供；视频sourceStart/sourceEnd表示源视频取用范围，长度等于该槽实际播放时长。仅内容与必要时点可变，样式和动作参数固定。",
    duration: 226 / 30,
    slots: {background: video("压暗虚化的视频底景", 2), title: text("固定红牌标题", "参议院", 4, 7 / 30),
      first: image("第一份真实资料截图", 3, 1 / 30), second: image("从右侧滑换的第二份资料", 1, 105 / 30)},
    order: ["first", "second"],
    tracks: [media("background", full, {image: {...dim, filter: "blur(16px) brightness(.72)"}}), art("net", full, {css: {opacity: .28}}),
      words("title", [35, 63, 290, 79], 42, {motion: "drop", css: {...captionPanel, ...gloss}}),
      media("first", [27, 186, 306, 252], {until: "second", overlap: .42, fadeOut: .42, motion: "right", seconds: .42, fit: "contain", css: {...rounded, background: "white"}}),
      media("second", [27, 186, 306, 252], {motion: "left", seconds: .42, fit: "contain", css: {...rounded, background: "white"}})],
  },
  V20_007: {
    tag: "mg-v-three-gradient-ribbons", name: "三条渐变字牌", hint: "适合三个依次强调的短语。在稍虚化的主题视频上，三张渐变字牌从上到下卷出，成形后一起保留。",
    duration: 4.6,
    slots: {background: {...video("轻微虚化的全屏主题视频，覆盖整段", 0), optional: true}, first: text("绿色上牌短语", "约谈", 9, .55), second: text("青蓝中牌短语", "通报", 9, 1.8),
      third: text("紫蓝下牌短语", "下架", 9, 3.0)},
    order: ["first", "second", "third"],
    tracks: [art("sparkles", full, {css: {background: "#03090f"}}),
      words("first", [64, 123, 232, 58], 32, {motion: "unroll", css: {background: "linear-gradient(95deg,#168c6a,#4ec795)", borderRadius: 3}}),
      words("second", [64, 246, 232, 58], 32, {motion: "unroll", css: cyan}),
      words("third", [64, 369, 232, 58], 32, {motion: "unroll", css: {...purple, background: "linear-gradient(95deg,#bd39a4,#4040bb)"}})],
  },
  V21_006: {
    tag: "mg-v-fragment-electric-title", name: "碎字聚合与电光", hint: "全屏实拍虚化；破碎笔画聚合成一个白色短语，字下蓝色电弧扩亮。",
    duration: 1.65,
    slots: {background: video("暗化的实拍视频", 1), title: text("聚合出的白字", "不稳定", 9, .13)},
    tracks: [media("background", full, {image: dim}), art("electric-line", [31, 277, 298, 146], {from: "title", motion: "pop", seconds: .48}),
      words("title", [25, 208, 310, 119], 55, {motion: "assemble", seconds: .44, css: gloss})],
  },
  V25_001: {
    tag: "mg-v-blue-gold-nameplate", name: "实拍金字横牌", hint: "与短语对应的实拍连续播放，蓝牌横向拖影入场，牌内金字逐个变清并短暂回弹。",
    duration: 4.8,
    slots: {background: video("全屏连续实拍", 2), title: text("横牌内的金色短语", "班主任查课", 9, .86)},
    tracks: [media("background"), words("title", [26, 242, 308, 108], 44, {motion: "streak", seconds: .55,
      css: {...blue, color: "#ffc047", border: "2px solid #7bb8e7", fontStyle: "italic", textShadow: "0 1px 1px #57340f"}})],
  },
  V10_001: {
    tag: "mg-v-offset-media-collage", name: "多窗口错位拼贴", hint: "连续实拍和透明前景上依次叠入白边素材窗，图片窗和连续视频窗分别保留原素材类型。",
    duration: 7.4,
    slots: {background: video("持续播放的场景底片", 0), foreground: cutout("底部与主题相关的透明前景图", 1),
      firstClip: video("第一个白边实拍窗", 1, .6), secondClip: video("错位的第二个实拍窗", 2, 2.0),
      document: image("原有静态资料窗的图片", 2, 3.55), finalClip: video("最后的实拍窗", 0, 4.8)},
    order: ["firstClip", "secondClip", "document", "finalClip"],
    tracks: [media("background", full, {image: dim}), media("foreground", [0, 396, 360, 244], {fit: "contain"}),
      media("firstClip", [19, 76, 224, 147], {motion: "up", css: paleBorder}),
      media("secondClip", [137, 198, 205, 136], {motion: "left", css: paleBorder}),
      media("document", [33, 300, 166, 178], {motion: "up", fit: "contain", css: {...paleBorder, background: "#fff"}}),
      media("finalClip", [151, 403, 193, 137], {motion: "up", css: paleBorder})],
  },
  ...selectedProfiles,
} satisfies Record<string, Profile>;


// 2026-11-14 reference-aligned defaults. Caller controls content and real cues only.
Object.assign(referenceProfiles.V28_001.slots,{subtitle:{...text("原有英文副行","thrifty",16,.35),maxUnits:4.2,asciiUnits:.56,optional:true}});
Object.assign(referenceProfiles.V10_001.slots,{openingTitle:{...text("开场原有字位","泰国",4,0),maxUnits:3,optional:true}});
const refinedDefaults:Record<string,{duration:number;ats:Record<string,number>}> = {
  "V19_006": {
    "duration": 9.166666666666666,
    "ats": {
      "firstClip": 0,
      "secondClip": 5.633333333333334,
      "firstTitle": 0.6,
      "firstRow1": 1.4,
      "firstRow2": 2.6666666666666665,
      "firstRow3": 3.7,
      "secondTitle": 5.633333333333334,
      "secondRow1": 6.033333333333333,
      "secondRow2": 6.6,
      "secondRow3": 7.466666666666667
    }
  },
  "V28_002": {
    "duration": 3.3333333333333335,
    "ats": {
      "background": 0,
      "first": 0,
      "second": 0,
      "third": 0,
      "foreground": 0,
      "replacement": 1.4666666666666666
    }
  },
  "V19_001": {
    "duration": 3.066666666666667,
    "ats": {
      "background": 0,
      "leftObject": 0,
      "rightObject": 0,
      "leftLabel": 0,
      "rightLabel": 0
    }
  },
  "V31_003": {
    "duration": 2.7,
    "ats": {
      "background": 0,
      "chosenClip": 1.4333333333333333,
      "left": 0,
      "right": 0.4666666666666667
    }
  },
  "V21_002": {
    "duration": 2.933333333333333,
    "ats": {
      "subject": 0,
      "first": 1.1,
      "arrow": 1.4333333333333333,
      "second": 1.5
    }
  },
  "V21_005": {
    "duration": 5.833333333333333,
    "ats": {
      "leftPage": 0,
      "middlePage": 0,
      "rightPage": 0,
      "select": 1.1666666666666667,
      "excerpt": 2.4
    }
  },
  "V19_005": {
    "duration": 1.6,
    "ats": {
      "title": 0,
      "backTitle": 0.1
    }
  },
  "V22_002": {
    "duration": 5.533333333333333,
    "ats": {
      "question": 2.6,
      "answer": 4,
      "drop": 5
    }
  },
  "V21_009": {
    "duration": 4,
    "ats": {
      "title": 0
    }
  },
  "V20_003": {
    "duration": 12,
    "ats": {
      "lowerNext": 1.5,
      "upperNext": 8.1,
      "closeLower": 11.9666667
    }
  },
  "V18_003": {
    "duration": 8.066666666666666,
    "ats": {
      "strips": 0,
      "label": 1.1,
      "inset": 3.5,
      "next": 6.4
    }
  },
  "V28_001": {
    "duration": 2.2,
    "ats": {
      "title": 0.25,
      "subtitle": 0.35
    }
  },
  "V18_002": {
    "duration": 2.2666666666666666,
    "ats": {
      "secondBackground": 1.15,
      "firstQuote": 0,
      "secondQuote": 1.15
    }
  },
  "V20_007": {
    "duration": 2.933333333333333,
    "ats": {
      "first": 0,
      "second": 1.45,
      "third": 2.05
    }
  },
  "V21_006": {
    "duration": 1.8666666666666667,
    "ats": {
      "title": 0
    }
  },
  "V25_001": {
    "duration": 3.7,
    "ats": {
      "title": 0
    }
  },
  "V10_001": {
    "duration": 11,
    "ats": {
      "openingTitle": 0,
      "firstClip": 0.9,
      "secondClip": 2.4,
      "document": 4.3,
      "finalClip": 8.7
    }
  }
};
for (const [id, setup] of Object.entries(refinedDefaults)) {
  const profile = (referenceProfiles as Record<string,Profile>)[id];
  profile.duration=setup.duration;
  for (const [key, at] of Object.entries(setup.ats)) if(profile.slots[key]?.at!==undefined) profile.slots[key].at=at;
}
// Queue images enter together in the original; only select and excerpt depend on order.
(referenceProfiles.V21_005 as Profile).order=["select","excerpt"];
(referenceProfiles.V19_006 as Profile).order=["firstTitle","firstRow1","firstRow2","firstRow3","secondTitle","secondRow1","secondRow2","secondRow3"];
const fixedTextCapacities:Record<string,Record<string,number>>={
 V19_006:{firstTitle:3,secondTitle:3,firstRow1:7,firstRow2:7,firstRow3:7,secondRow1:7,secondRow2:7,secondRow3:7},
 V19_001:{leftLabel:4,rightLabel:4},V31_003:{left:2,right:2},V21_002:{first:3,second:3},
 V19_005:{title:4,backTitle:20},V22_002:{question:3,answer:3},V21_009:{title:3},
 V28_001:{title:4},V20_007:{first:4,second:4,third:4},V21_006:{title:4},V25_001:{title:4},
 V18_003:{label:12},V18_002:{firstQuote:14,secondQuote:14}
};
for(const [id, slots] of Object.entries(fixedTextCapacities)) for(const [key, capacity] of Object.entries(slots)){
 const slot=(referenceProfiles as Record<string,Profile>)[id].slots[key];
 slot.maxUnits=capacity;slot.max=Math.max(slot.max??0,capacity);
 if(id==="V19_006"&&key.includes("Row")){slot.asciiUnits=.55;slot.max=14;}
 if(id==="V18_003"){slot.maxLines=2;slot.max=50;}
 if(id==="V18_002"){slot.maxLines=18;slot.max=550;}
}

function priceCard(prefix: string, x: number, y: number): Track[] {
  const title = prefix + "Title";
  return [
    {box: [x, y, 157, 171], from: title, motion: "up", seconds: .45,
      css: {background: "#0e1116e8", border: "3px double #bbad87", borderRadius: 6, boxShadow: "0 4px 14px #000a"}},
    words(title, [x + 5, y + 12, 147, 38], 23, {motion: "fade", css: {color: "#efe3a7"}}),
    ...[1, 2, 3].map(i => words(prefix + "Row" + i, [x + 6, y + 44 + i * 28, 145, 27], 18, {motion: "scan"})),
  ];
}

export function getReferenceProfile(id: string): Profile | undefined {
  return Object.hasOwn(referenceProfiles, id) ? referenceProfiles[id as keyof typeof referenceProfiles] : undefined;
}
