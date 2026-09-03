import {
  Composition,
  registerRoot,
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
import {XYChartTemplate} from "../src/xy-chart";
import {MultiSeriesChartTemplate} from "../src/multi-series-chart";
import {ContainmentTemplate} from "../src/containment";
import {DecompositionTemplate} from "../src/decomposition";
import {BalanceComparisonTemplate, SideBySideComparisonTemplate} from "../src/weighted-comparison";
import {CollageNetworkTemplate} from "../src/collage-network";
import {ImageStackTemplate} from "../src/image-stack";
import {ImageGridTemplate} from "../src/image-grid";
import {ShowcaseTemplate} from "../src/showcase";
import {MetricTemplate} from "../src/metric";
import {TransitionTemplate} from "../src/transition";
import {RhythmTemplate} from "../src/rhythm";
import {EffectTemplate} from "../src/effect";
import {CameraTemplate, CameraPreviewPlate} from "../src/camera";

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
    {id: "start", at: 0, progress: 0, kind: "major" as const, title: "研究起点", eyebrow: "阶段 01", detail: {type: "text" as const, value: "从基础研究开始"}, motion: "instant" as const},
    {id: "model", at: 0.65, progress: 50, kind: "major" as const, title: "模型突破", eyebrow: "阶段 02", detail: {type: "text" as const, value: "能力快速增长"}, motion: "ease" as const},
    {id: "product", at: 1.35, progress: 100, kind: "major" as const, title: "产品落地", eyebrow: "阶段 03", detail: {type: "text" as const, value: "进入真实场景"}, motion: "ease" as const},
  ],
};

const directedGraphSpec = {
  title: "能力关系",
  edges: [
    {at: 0, from: "数据", to: "训练", relation: "提供基础"},
    {at: 0.65, from: "训练", to: "模型", relation: "形成能力"},
    {at: 1.35, from: "模型", to: "产品", relation: "进入场景"},
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

const cameraSpec = {
  text: "原画底片运镜",
  at: 0,
};

const Preview = ({previewKind, style}: PreviewProps) => {
  let content: ReactNode;
  switch (previewKind) {
    case "sc-video-normal": content = <CameraPreviewPlate
      accent="#8ad3df"
      secondary="#ad8cff"
      label="<sc-video>"
    />; break;
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
    case "title-fade": content = <FadeTitleTemplate spec={{text: "一条关键结论", at: 0.15}} />; break;
    case "title-slide": content = <SlideTitleTemplate spec={{text: "一条关键结论", at: 0.15}} />; break;
    case "title-typewriter": content = <TypewriterTitleTemplate spec={{text: "一条关键结论", at: 0.15}} />; break;
    case "title-random": content = <RandomRevealTitleTemplate spec={{text: "一条关键结论", at: 0.15}} />; break;
    case "title-blur-slide": content = <BlurSlideTitleTemplate spec={{text: "从研究到产品的关键一步", at: 0.15}} />; break;
    case "title-scramble": content = <ScrambleTitleTemplate spec={{text: "MODEL READY 2026", at: 0.15}} />; break;
    case "title-split-flap": content = <SplitFlapTitleTemplate spec={{text: "SHIP FASTER", at: 0.15}} />; break;
    case "emphasis": content = <EmphasisTextTemplate spec={{text: "关键变化", at: 0.2}} />; break;
    case "title-shotcraft": content = <ShotcraftTitleTemplate spec={{text: "从数据到行动", at: 0.15}} style={style} />; break;
    case "showcase": content = <ShowcaseTemplate spec={showcaseSpec} style={style} />; break;
    case "metric": content = <MetricTemplate spec={metricSpec} style={style} />; break;
    case "transition": content = <TransitionTemplate spec={{text: "NEXT", at: 0.15}} style={style} />; break;
    case "rhythm": content = <RhythmTemplate spec={{text: "ON BEAT", at: 0.15}} style={style} />; break;
    case "effect": content = <EffectTemplate spec={effectSpec} style={style} />; break;
    case "camera": content = <CameraTemplate spec={cameraSpec} style={style} />; break;
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
/>;

registerRoot(Root);
