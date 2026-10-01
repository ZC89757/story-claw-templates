import {
  AbsoluteFill,
  Composition,
  registerRoot,
  useCurrentFrame,
} from "remotion";
import type {ReactNode} from "react";
import {ProgressTimelineTemplate, VerticalProgressTimelineTemplate} from "../src/progress-timeline";
import {TimedTableTemplate} from "../src/timed-table";
import {DirectedGraphTemplate, RadialRelationTemplate} from "../src/directed-graph";
import {
  BlurSlideTitleTemplate,
  FadeTitleTemplate,
  RandomRevealTitleTemplate,
  ScrambleTitleTemplate,
  SlideTitleTemplate,
  SplitFlapTitleTemplate,
  ShotcraftTitleTemplate,
  TypewriterTitleTemplate,
} from "../src/title";
import {EmphasisTextTemplate} from "../src/emphasis";
import {NewsFlashbackTemplate} from "../src/news-flashback";
import {XYChartTemplate} from "../src/xy-chart";
import {MultiSeriesChartTemplate} from "../src/multi-series-chart";
import {ContainmentTemplate} from "../src/containment";
import {DecompositionTemplate} from "../src/decomposition";
import {BalanceComparisonTemplate, SideBySideComparisonTemplate} from "../src/weighted-comparison";
import {CollageNetworkTemplate} from "../src/collage-network";
import {ImageStackTemplate} from "../src/image-stack";
import {ImageGridTemplate} from "../src/image-grid";
import {NewsReportTemplate} from "../src/news-report";
import {WebNewsFocusTemplate} from "../src/web-news-focus";
import {WebPageFocusTemplate} from "../src/web-page-focus";
import {EraShiftTemplate} from "../src/era-shift";
import {RouteShiftTemplate} from "../src/route-shift";
import {ShowcaseTemplate} from "../src/showcase";
import {MetricTemplate} from "../src/metric";
import {TransitionTemplate} from "../src/transition";
import {RhythmTemplate} from "../src/rhythm";
import {EffectTemplate} from "../src/effect";
import {ScVideoPreviewPlate} from "../src/sc-video/preview";
import {ScLongtakeTemplate} from "../src/sc-longtake";
import {VideoFootageTemplate} from "../src/video-footage/VideoFootageTemplate";
import {AiHotOpeningTemplate} from "../src/ai-hot-opening";
import {AiHotFocusStageTemplate} from "../src/ai-hot-focus-stage";
import {MgCutoutTemplate} from "../src/mg-cutout";

type PreviewProps = {previewKind: string; style: string};

const ScaledCanvas = ({children}: {children: ReactNode}) => {
  const fit = 0.5;
  return <div style={{position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${fit})`, transformOrigin: "top left"}}>{children}</div>;
};

const progressSpec = {
  title: "AI 发展路径",
  subtitle: "关键节点逐步展开",
  followViewport: true,
  nodes: [
    {id: "start", at: 0, progress: 0, kind: "major" as const, title: "研究起点", eyebrow: "2018年", detail: {type: "text" as const, value: "从基础研究开始"}, motion: "instant" as const},
    {id: "model", at: 0.65, progress: 50, kind: "major" as const, title: "模型突破", eyebrow: "2022年", detail: {type: "text" as const, value: "能力快速增长"}, motion: "ease" as const},
    {id: "product", at: 1.35, progress: 100, kind: "major" as const, title: "产品落地", eyebrow: "2025年", detail: {type: "text" as const, value: "进入真实场景"}, motion: "ease" as const},
  ],
};

const directedGraphSpec = {
  title: "能力关系",
  nodes: [
    {id: "n0", label: "数据", at: 0},
    {id: "n1", label: "训练", at: 0.65},
    {id: "n2", label: "模型", at: 1.35},
    {id: "n3", label: "产品", at: 2.05},
  ],
  edges: [
    {at: 0.8, from: "n0", to: "n1", relation: "提供基础"},
    {at: 1.5, from: "n1", to: "n2", relation: "形成能力"},
    {at: 2.2, from: "n2", to: "n3", relation: "进入场景"},
  ],
};

const tableSpec = {
  size: {rows: 3, columns: 3},
  cells: [
    {at: 0, text: "维度"}, {at: 0, text: "方案 A"}, {at: 0, text: "方案 B"},
    {at: 0.7, text: "速度"}, {at: 0.9, text: "快速"}, {at: 1.1, text: "稳定"},
    {at: 1.45, text: "适用"}, {at: 1.65, text: "探索"}, {at: 1.85, text: "生产"},
  ],
};

const xySpec = {
  title: "模型能力趋势",
  axes: {x: {min: 2022, max: 2025, label: "年份", unit: "年", ticks: 4}, y: {min: 0, max: 100, label: "能力", unit: "%", ticks: 6}},
  keyframes: [
    {at: 0, x: 2022, y: 25, label: "2022", motion: "instant" as const},
    {at: 0.8, x: 2023, y: 48, label: "2023", motion: "ease" as const},
    {at: 1.6, x: 2024, y: 78, label: "2024", motion: "ease" as const},
    {at: 2.3, x: 2025, y: 92, label: "2025", motion: "ease" as const},
  ],
};

const multiSeriesSpec = {
  title: "两条增长曲线",
  xAxis: {label: "季度", categories: ["Q1", "Q2", "Q3", "Q4"]},
  yAxis: {min: 0, max: 100, label: "指数", unit: "分", ticks: 6},
  series: [
    {name: "模型 A", data: [{at: 0, value: 28}, {at: 0.7, value: 42}, {at: 1.4, value: 66}, {at: 2.1, value: 82}]},
    {name: "模型 B", data: [{at: 0, value: 20}, {at: 0.7, value: 35}, {at: 1.4, value: 52}, {at: 2.1, value: 70}]},
  ],
};

const containmentSpec = {
  title: "系统包含关系",
  root: "AI 系统",
  events: [
    {at: 0, action: "contain" as const, parent: "AI 系统", child: "模型"},
    {at: 0.8, action: "contain" as const, parent: "AI 系统", child: "工具"},
    {at: 1.5, action: "highlight" as const, target: "模型"},
  ],
};

const decompositionSpec = {
  title: "产品拆解",
  whole: "智能产品",
  events: [
    {at: 0, action: "extract" as const, part: "模型"},
    {at: 0.8, action: "extract" as const, part: "数据"},
    {at: 1.5, action: "extract" as const, part: "交互"},
  ],
};

const comparisonEvents = [
  {at: 0, action: "add" as const, side: "left" as const, text: "响应快", weight: 4},
  {at: 0.55, action: "add" as const, side: "right" as const, text: "生态广", weight: 3},
  {at: 1.15, action: "add" as const, side: "left" as const, text: "成本低", weight: 3},
  {at: 1.75, action: "highlight" as const, side: "right" as const},
];

const sideEvents = comparisonEvents.map((event) => event.action === "add"
  ? {at: event.at, action: "add" as const, side: event.side, text: event.text}
  : event);

const collageSpec = {
  title: "AI 产业关系",
  subtitle: "模型、云与芯片",
  nodes: [
    {id: "model", label: "模型", at: 0, role: "能力", kind: "model" as const},
    {id: "cloud", label: "云平台", at: 0.55, role: "基础设施", kind: "cloud" as const},
    {id: "chip", label: "芯片", at: 1.1, role: "算力", kind: "chip" as const},
  ],
  edges: [
    {at: 0.8, from: "cloud", to: "model", relation: "托管", type: "cloud" as const},
    {at: 1.4, from: "chip", to: "cloud", relation: "供给", type: "supply" as const},
  ],
};

const imageStackSpec = {
  title: "官方证据逐层展开",
  images: [
    {at: 0, image: "ai-company-logos/openai.svg", label: "OpenAI 官方标识"},
    {at: 0.72, image: "ai-company-logos/microsoft.svg", label: "合作平台"},
    {at: 1.44, image: "AI 生成：数据中心与模型服务器的真实摄影画面", label: "待生成环境"},
  ],
};

const imageGridSpec = {
  title: "同一报道的多张证据",
  images: [
    {at: 0, image: "ai-company-logos/openai.svg", label: "产品主体"},
    {at: 0.42, image: "ai-company-logos/google.svg", label: "官方页面"},
    {at: 0.84, image: "ai-company-logos/nvidia.svg", label: "硬件现场"},
    {at: 1.26, image: "AI 生成：办公室里查看网页截图的真实场景", label: "补充画面"},
  ],
};

const newsReportSpec = {
  at: 0.2,
  pages: [
    {image: "web-news/nvidia-newsroom.png", source: "NVIDIA NEWSROOM", title: "GeForce 256 enters the market"},
    {image: "web-news/techtimes.png", source: "TECH TIMES", title: "The first GPU changes 3D graphics"},
    {image: "web-news/rcr-clean.png", source: "RCR WIRELESS", title: "Performance leads the benchmark"},
    {image: "web-news/accelerated-clean.png", source: "AI REPORT", title: "A new class of graphics processor"},
  ],
};

const webNewsFocusSpec = {
  at: 0,
  url: "https://tokenstead.ai/guides/zcode-silent-git-history-upload",
  entrance: "slide-right" as const,
  highlights: [{text: "313MB encrypted archive", at: 1.1}],
  capture: {
    url: "https://tokenstead.ai/guides/zcode-silent-git-history-upload",
    title: "ZCode uploads your git history; Z.ai holds the only key",
    viewport: {width: 1400, height: 900, deviceScaleFactor: 1},
    scroll: {x: 0, y: 186},
    highlights: [{
      text: "313MB encrypted archive",
      rects: [{x: 555.96875, y: 511.5, width: 185.625, height: 17}],
      unionRect: {x: 555.96875, y: 511.5, width: 185.625, height: 17},
    }],
    baseImage: "web-news/dom-demo/base.png",
    highlightedImage: "web-news/dom-demo/highlighted.png",
  },
};

const webPageFocusSpec = {
  at: 0,
  url: "https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/",
  entrance: "slide-right" as const,
  focus: [{text: "AI factories", at: 1.1}],
  capture: {
    url: "https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/",
    title: "Inside NVIDIA Rubin GPU Architecture: Powering the Era of Agentic AI",
    viewport: {width: 1280, height: 1400, deviceScaleFactor: 1},
    scroll: {x: 0, y: 0},
    focus: [{
      text: "AI factories",
      rects: [{x: 255, y: 883, width: 90, height: 20}],
      unionRect: {x: 255, y: 883, width: 90, height: 20},
    }],
    baseImage: "web-news/nvidia-arch.png",
  },
};

const eraShiftSpec = {
  image: "era-shift/foreground/jensen-huang.png",
  foreground: {
    mode: "existing" as const,
    image: "jensen-huang.png",
    person: null,
    references: [],
  },
  switchAt: 2.7,
  startItems: [
    {text: "游戏显卡", logo: "nvidia.svg"},
    {text: "3D 图形"},
    {text: "并行计算"},
    {text: "GPU", logo: "nvidia.svg"},
  ],
  endItems: [
    {text: "OpenAI", logo: "openai.svg"},
    {text: "Anthropic", logo: "anthropic.svg"},
    {text: "AI 基础设施"},
    {text: "NVIDIA 系统", logo: "nvidia.svg"},
  ],
};

const routeShiftSpec = {
  title: "NV1 失败后，英伟达重新选择路线",
  first: "NV1 路线",
  second: "三角形渲染",
  switchTime: 2.55,
  switch: "切换到三角形渲染",
};

const showcaseSpec = {
  title: "功能逐项显现",
  items: [
    {id: "one", text: "先看懂核心结论", at: 0},
    {id: "two", text: "证据与步骤随后汇入", at: 0.5},
    {id: "three", text: "最后收束为可执行动作", at: 1.0},
    {id: "four", text: "所有信息保持可读", at: 1.5},
  ],
};

const metricSpec = {
  title: "一组真实指标",
  points: [
    {id: "speed", label: "响应速度", value: "96%", at: 0},
    {id: "scale", label: "覆盖规模", value: "12.4M", at: 0.72},
    {id: "quality", label: "完成率", value: "99.8%", at: 1.44},
  ],
};

const effectSpec = {
  text: "关键节点已锁定",
  at: 0.15,
  items: [
    {text: "扫描并确认", at: 0.15},
    {text: "结果已就绪", at: 0.55},
  ],
};

const effectAssetPreviewSpec = (style: string) => style === "object-drop"
  ? {text: "NV1", at: 0.15, impactAt: 1.15, image: "mg-effect/object-drop/nv1-gpu-reference.jpg"}
  : style === "glass-fracture"
    ? {text: "计划失败", at: 0.15, crackAt: 0.85, image: "mg-effect/glass-fracture/nvidia-eye.svg"}
    : effectSpec;

const scLongtakeSpec = {
  group: "relay" as const,
  order: null,
  at: 0.2,
  reference_image_state: "generate" as const,
  reference_image_prompt: "A researcher at a glowing GPU workstation in a dark laboratory",
  segments: [
    {at: 0.2, video_prompt: "The camera slowly pushes toward the researcher and the illuminated GPU workstation."},
    {at: 1.55, video_prompt: "Continue exactly from the supplied tail frame as the camera glides past the workstation toward the connected server racks."},
    {at: 2.9, video_prompt: "Continue the same uninterrupted movement into the server room, preserving lighting, lens, camera axis, and spatial direction."},
  ],
};

const videoFootagePreviewSpec = {
  source: "video-footage/sources/nvidia-gtc-2026-vera-rubin.mp4",
  sourceStart: 0,
  sourceEnd: 6,
  assetVersion: "preview",
};

const aiHotOpeningPreviewSpec = {
  title: "AI热点",
  subTitle: "2026/09/21",
  durationSeconds: 7,
  items: [
    "OpenAI 发布全新模型能力升级",
    "多模态生成迈向实时交互",
    "国产大模型迎来推理效率突破",
    "机器人具身智能持续升温",
    "AI 智能体加速进入真实业务",
    "芯片厂商加码下一代 AI 算力",
  ],
};

const aiHotFocusStagePreviewSpec = {
  title: "AI热点",
  subTitle: "2026/09/21",
  items: [
    {title: "OpenAI 发布全新推理模型", time: 5.2},
    {title: "多模态交互进入实时生成阶段", time: 10.4},
    {title: "智能体开始接管复杂工作流", time: 15.6},
  ],
};

const mgCutoutRisePreviewSpec = {
  image: "era-shift/foreground/jensen-huang.png",
  source: {mode: "transparent" as const, image: "era-shift/foreground/jensen-huang.png", subject: null, references: [] as []},
  at: 0,
};

/** Preview-only moving plate so the template's transparent pixels are visible. */
const MgCutoutDemoPlate = () => {
  const frame = useCurrentFrame();
  const drift = (frame * 11) % 520;
  return <AbsoluteFill style={{background: "linear-gradient(180deg, #a7d4e1 0%, #d8d2b5 53%, #607c76 54%, #17272a 100%)", overflow: "hidden"}}>
    <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 590, background: "linear-gradient(180deg, rgba(244,247,228,.42), transparent)"}} />
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
      <path d="M0 638 C230 570 390 592 630 638 C830 677 1010 570 1240 614 C1500 665 1690 570 1920 610 L1920 1080 L0 1080 Z" fill="#72847a" />
      <path d="M0 734 C300 681 490 748 730 713 C1030 670 1250 744 1510 702 C1690 674 1810 692 1920 710 L1920 1080 L0 1080 Z" fill="#435a55" />
      <path d="M0 868 C260 824 455 892 670 858 C930 817 1170 893 1410 850 C1630 812 1780 833 1920 850 L1920 1080 L0 1080 Z" fill="#20383a" />
      {Array.from({length: 10}, (_, index) => <path
        key={index}
        d={`M${-300 + ((drift + index * 230) % 2500)} ${900 + index * 17} q 180 -24 360 0`}
        fill="none"
        stroke={index % 3 === 0 ? "#d0c7a4" : "#88aaa0"}
        strokeOpacity={index % 3 === 0 ? 0.36 : 0.22}
        strokeWidth={index % 3 === 0 ? 4 : 2}
      />)}
    </svg>
  </AbsoluteFill>;
};

const Preview = ({previewKind, style}: PreviewProps) => {
  let content: ReactNode;
  switch (previewKind) {
    case "sc-video-normal": content = <ScVideoPreviewPlate
      accent="#8ad3df"
      secondary="#ad8cff"
      label="<sc-video>"
    />; break;
    case "sc-longtake-relay": content = <ScLongtakeTemplate spec={scLongtakeSpec} />; break;
    case "video-footage-full-bleed": content = <VideoFootageTemplate spec={videoFootagePreviewSpec} durationInFrames={135} />; break;
    case "ai-hot-opening-color-orb": content = <AiHotOpeningTemplate spec={aiHotOpeningPreviewSpec} />; break;
    case "ai-hot-focus-stage": content = <AiHotFocusStageTemplate spec={aiHotFocusStagePreviewSpec} />; break;
    case "mg-cutout-rise": content = <><MgCutoutDemoPlate /><MgCutoutTemplate spec={mgCutoutRisePreviewSpec} /></>; break;
    case "timeline-horizontal": content = <ProgressTimelineTemplate spec={progressSpec} />; break;
    case "timeline-vertical": content = <VerticalProgressTimelineTemplate spec={progressSpec} />; break;
    case "table": content = <TimedTableTemplate spec={tableSpec} />; break;
    case "graph-flow": content = <DirectedGraphTemplate spec={directedGraphSpec} />; break;
    case "graph-radial": content = <RadialRelationTemplate spec={directedGraphSpec} />; break;
    case "chart-line": content = <XYChartTemplate spec={xySpec} />; break;
    case "chart-bar": content = <MultiSeriesChartTemplate spec={multiSeriesSpec} group="bar" />; break;
    case "chart-multi-line": content = <MultiSeriesChartTemplate spec={multiSeriesSpec} group="line" />; break;
    case "containment": content = <ContainmentTemplate spec={containmentSpec} />; break;
    case "decomposition": content = <DecompositionTemplate spec={decompositionSpec} />; break;
    case "comparison-weighted": content = <BalanceComparisonTemplate spec={{title: "方案对比", leftLabel: "方案 A", rightLabel: "方案 B", events: comparisonEvents}} />; break;
    case "comparison-side": content = <SideBySideComparisonTemplate spec={{title: "方案对比", leftLabel: "方案 A", rightLabel: "方案 B", events: sideEvents}} />; break;
    case "collage": content = <CollageNetworkTemplate spec={collageSpec} />; break;
    case "image-stack": content = <ImageStackTemplate spec={imageStackSpec} />; break;
    case "image-grid": content = <ImageGridTemplate spec={imageGridSpec} />; break;
    case "news-report-paper-stack": content = <NewsReportTemplate spec={newsReportSpec} />; break;
    case "web-news-focus": content = <WebNewsFocusTemplate spec={webNewsFocusSpec} />; break;
    case "web-page-focus": content = <WebPageFocusTemplate spec={webPageFocusSpec} />; break;
    case "era-shift-foreground-with-background": content = <EraShiftTemplate spec={eraShiftSpec} />; break;
    case "route-shift-road-transfer": content = <RouteShiftTemplate spec={routeShiftSpec} />; break;
    case "title-fade": content = <FadeTitleTemplate spec={{text: "一条关键结论", at: 0.15}} />; break;
    case "title-slide": content = <SlideTitleTemplate spec={{text: "一条关键结论", at: 0.15}} />; break;
    case "title-typewriter": content = <TypewriterTitleTemplate spec={{text: "一条关键结论", at: 0.15}} />; break;
    case "title-random": content = <RandomRevealTitleTemplate spec={{text: "一条关键结论", at: 0.15}} />; break;
    case "title-blur-slide": content = <BlurSlideTitleTemplate spec={{text: "从研究到产品的关键一步", at: 0.15}} />; break;
    case "title-scramble": content = <ScrambleTitleTemplate spec={{text: "MODEL READY 2026", at: 0.15}} />; break;
    case "title-split-flap": content = <SplitFlapTitleTemplate spec={{text: "SHIP FASTER", at: 0.15}} />; break;
    case "emphasis": content = <EmphasisTextTemplate spec={{text: "关键变化", at: 0.2}} />; break;
    case "news-flashback-project": content = <NewsFlashbackTemplate spec={{
      text: "NVIDIA Rubin GPU",
      at: 0.2,
      pages: [
        {image: "web-news/nvidia-newsroom.png", source: "NVIDIA NEWSROOM", title: "Rubin platform announcement"},
        {image: "web-news/nvidia-arch.png", source: "TECH REPORT", title: "Next-generation GPU architecture"},
        {image: "web-news/accelerated-clean.png", source: "AI REPORT", title: "Accelerated computing expands"},
      ],
    }} />; break;
    case "title-shotcraft": content = <ShotcraftTitleTemplate spec={{text: "从数据到行动", at: 0.15}} style={style} />; break;
    case "showcase": content = <ShowcaseTemplate spec={showcaseSpec} style={style} />; break;
    case "metric": content = <MetricTemplate spec={metricSpec} style={style} />; break;
    case "transition": content = <TransitionTemplate spec={{text: "NEXT", at: 0.15}} style={style} />; break;
    case "rhythm": content = <RhythmTemplate spec={{text: "ON BEAT", at: 0.15}} style={style} />; break;
    case "effect": content = <EffectTemplate spec={effectAssetPreviewSpec(style)} style={style} />; break;
    default: throw new Error(`Unknown preview kind: ${previewKind} (${style})`);
  }
  return <div style={{position: "absolute", inset: 0, overflow: "hidden"}}><ScaledCanvas>{content}</ScaledCanvas></div>;
};

const Root = () => <Composition
  id="MgStylePreview"
  component={Preview}
  defaultProps={{previewKind: "timeline-horizontal", style: "horizontal"}}
  width={960}
  height={540}
  fps={30}
  durationInFrames={150}
  calculateMetadata={({props}) => ({
    durationInFrames: props.previewKind === "ai-hot-opening-color-orb"
      ? 210
      : props.previewKind === "ai-hot-focus-stage" ? 630
        : props.previewKind === "mg-cutout-rise" ? 180
          : props.previewKind === "web-news-focus" || props.previewKind === "web-page-focus" ? 180 : 150,
  })}
/>;

registerRoot(Root);
