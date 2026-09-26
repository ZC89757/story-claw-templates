import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {MG_STYLE_CATALOG, MG_TEMPLATE_USAGE, isMgStyleForTemplate} from "./catalog.js";
import type {MgStyleCatalogEntry} from "./catalog-data.js";
import type {MgLayerRole, MgRuntimeLayer, MgRuntimeLayerPlacement, MgTemplateName} from "./runtime.js";
export type {
  MgLayerRole,
  MgRuntimeEpisodeInput,
  MgRuntimeLayer,
  MgRuntimeLayerPlacement,
  CompositionNode,
  MgCompositionBundle,
  MgActiveWindow,
  MgRuntimeCompositionNode,
} from "./runtime.js";
import {progressTimelineFunctionDefinition, resolveProgressTimelineFunctionArgs} from "./progress-timeline/schema.js";
import {timedTableFunctionDefinition, resolveTimedTableFunctionArgs} from "./timed-table/schema.js";
import {directedGraphFunctionDefinition, resolveDirectedGraphFunctionArgs} from "./directed-graph/schema.js";
import {titleFunctionDefinition, resolveTitleFunctionArgs} from "./title/schema.js";
import {emphasisFunctionDefinition, resolveEmphasisFunctionArgs} from "./emphasis/schema.js";
import {newsFlashbackFunctionDefinition, resolveNewsFlashbackFunctionArgs} from "./news-flashback/schema.js";
import {xyChartFunctionDefinition, resolveXYChartFunctionArgs} from "./xy-chart/schema.js";
import {
  multiSeriesChartFunctionDefinition,
  resolveMultiSeriesChartFunctionArgs,
} from "./multi-series-chart/schema.js";
import {containmentFunctionDefinition, resolveContainmentFunctionArgs} from "./containment/schema.js";
import {decompositionFunctionDefinition, resolveDecompositionFunctionArgs} from "./decomposition/schema.js";
import {
  weightedComparisonFunctionDefinition,
  sideBySideComparisonFunctionDefinition,
  resolveWeightedComparisonFunctionArgs,
  resolveSideBySideComparisonFunctionArgs,
} from "./weighted-comparison/schema.js";
import {collageNetworkFunctionDefinition, resolveCollageNetworkFunctionArgs} from "./collage-network/schema.js";
import {
  imageStackFunctionDefinition,
  imageGridFunctionDefinition,
  resolveImageStackFunctionArgs,
  resolveImageGridFunctionArgs,
} from "./image-media/schema.js";
import {showcaseFunctionDefinition, resolveShowcaseFunctionArgs} from "./showcase/schema.js";
import {metricFunctionDefinition, resolveMetricFunctionArgs} from "./metric/schema.js";
import {transitionFunctionDefinition, resolveTransitionFunctionArgs} from "./transition/schema.js";
import {rhythmFunctionDefinition, resolveRhythmFunctionArgs} from "./rhythm/schema.js";
import {
  EFFECT_GROUP_ASSET_DIRS,
  EFFECT_GROUP_DESCRIPTIONS,
  effectFunctionDefinition,
  glassFractureEffectFunctionDefinition,
  objectDropEffectFunctionDefinition,
  resolveEffectFunctionArgs,
  resolveGlassFractureEffectFunctionArgs,
  resolveObjectDropEffectFunctionArgs,
} from "./effect/schema.js";
import {scVideoFunctionDefinition, resolveScVideoFunctionArgs} from "./sc-video/schema.js";
import {scLongtakeFunctionDefinition, resolveScLongtakeFunctionArgs} from "./sc-longtake/schema.js";
import {videoFootageFunctionDefinition, resolveVideoFootageFunctionArgs} from "./video-footage/schema.js";
import {formatVideoFootageLibraryForAgent, resolveVideoFootageAsset} from "./video-footage/library.js";
import {aiHotOpeningFunctionDefinition, resolveAiHotOpeningFunctionArgs} from "./ai-hot-opening/schema.js";
import {AI_HOT_OPENING_GROUP} from "./ai-hot-opening/types.js";
import {aiHotOpeningPlanningInstructions} from "./ai-hot-opening/prompt.js";
import {aiHotFocusStageFunctionDefinition, resolveAiHotFocusStageFunctionArgs} from "./ai-hot-focus-stage/schema.js";
import {AI_HOT_FOCUS_STAGE_GROUP} from "./ai-hot-focus-stage/types.js";
import {aiHotFocusStagePlanningInstructions} from "./ai-hot-focus-stage/prompt.js";
import {MG_CUTOUT_GROUP, mgCutoutRiseFunctionDefinition, resolveMgCutoutRiseFunctionArgs} from "./mg-cutout/schema.js";
import {MG_CUTOUT_CHROMA_COLOR, MG_CUTOUT_GENERATED_ASPECT_RATIO, mgCutoutGenerationPrompt, mgCutoutPlanningInstructions} from "./mg-cutout/prompt.js";
import {assertMgCutoutRiseSpec} from "./mg-cutout/validate.js";
import type {MgCutoutSource} from "./mg-cutout/types.js";
import {
  ERA_SHIFT_ASSET_DIRS,
  ERA_SHIFT_GROUP,
  ERA_SHIFT_FOREGROUND_DESCRIPTION,
  ERA_SHIFT_LOGO_DESCRIPTION,
  eraShiftFunctionDefinition,
  resolveEraShiftFunctionArgs,
} from "./era-shift/schema.js";
import {
  ERA_SHIFT_CHROMA_COLOR,
  ERA_SHIFT_GENERATED_ASPECT_RATIO,
  eraShiftForegroundPrompt,
  eraShiftPlanningInstructions,
} from "./era-shift/prompt.js";
import {assertEraShiftSpec} from "./era-shift/validate.js";
import {routeShiftFunctionDefinition, resolveRouteShiftFunctionArgs} from "./route-shift/schema.js";
import {newsFlashbackPlanningInstructions} from "./news-flashback/prompt.js";
import {newsReportFunctionDefinition, resolveNewsReportFunctionArgs} from "./news-report/schema.js";
import {newsReportPlanningInstructions} from "./news-report/prompt.js";
import {webNewsFocusFunctionDefinition, resolveWebNewsFocusFunctionArgs} from "./web-news-focus/schema.js";
import {WEB_NEWS_FOCUS_GROUP, type WebNewsFocusSpec} from "./web-news-focus/types.js";
import {webNewsFocusPlanningInstructions} from "./web-news-focus/prompt.js";
import {captureWebNewsFocus} from "./web-news-focus/capture.js";
import {assertWebNewsFocusSpec} from "./web-news-focus/validate.js";
import {multiSeriesChartPlanningInstructions} from "./multi-series-chart/prompt.js";
import {
  findLogoAsset,
  formatLogoAssetInventory,
  listLogoAssets,
  resolveLogoAssetSource,
} from "./logo-assets.js";

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));

/** The only static template description consumed by Story Claw. */
export type MgTemplateDescriptor = Readonly<{
  htmlTag: string;
  selectionHint: string;
  groups: readonly string[];
  layerRole: MgLayerRole;
}>;

export type MgPlanningTool = Readonly<{
  name: string;
  label: string;
  description: string;
  parameters: unknown;
}>;

export type MgProviderInstance = Readonly<{
  htmlTag: string;
  group: string;
  order?: number;
  mode: "together" | "split";
}>;

export type MgResolvedProviderCall = Readonly<{
  name: string;
  arguments: Record<string, unknown>;
  htmlTag: string;
  group: string;
  order?: number;
  at: number;
  elementAts: number[];
  instanceKey: string;
  layerRole: MgLayerRole;
  render: MgRuntimeLayer;
}>;

/** Host callbacks used when a template needs to materialize a generated asset. */
export type MgReferenceImageGenerationRequest = Readonly<{
  prompt: string;
  references: readonly string[];
  aspectRatio: string;
  /** Stable caller-provided key used by the host for its disk cache. */
  cacheKey: string;
}>;

export type MgSolidBackgroundRemovalRequest = Readonly<{
  /** Absolute local path returned by generateImageFromReferences. */
  sourcePath: string;
  backgroundColor: string;
  /** Stable caller-provided key used by the host for its disk cache. */
  cacheKey: string;
}>;

export type MgStylePreview = Readonly<{
  htmlTag: string;
  group: string;
  layerRole: MgLayerRole;
  previewFile: string;
  /** Presentation-only fields for a catalog/preview consumer. */
  name: string;
  structureName: string;
  category: MgStyleCatalogEntry["category"];
  description: string;
  previewKind: string;
  isDefault: boolean;
}>;

type ResolveResult = {
  group: string;
  order?: number | null;
  at: number;
  spec: unknown;
};

type Binding = {
  name: string;
  label: string;
  template: MgTemplateName;
  definition: {name: string; description: string; parameters: unknown};
  resolve: (input: unknown) => ResolveResult;
  elementAts: (input: Record<string, any>) => number[];
  groups?: readonly string[];
};

const assetForCollageNode = (node: {id: string; label: string; role?: string}): string | undefined =>
  findLogoAsset(node, {scope: "any"})?.runtimePath;

const elementAts = {
  // Every non-generated template has a root HTML element whose start time is
  // carried by the envelope `at`.  Keep that timestamp in the element list so
  // host-side validation can bind the outer tag as well as its child events.
  progress: (args: Record<string, any>) => [args.at, ...(args.nodes ?? []).map((item: any) => item.at)],
  table: (args: Record<string, any>) => [args.at, ...(args.cells ?? []).map((item: any) => item.at)],
  graph: (args: Record<string, any>) => [
    args.at,
    ...(args.nodes ?? []).map((item: any) => item.at),
    ...(args.edges ?? []).map((item: any) => item.at),
  ],
  root: (args: Record<string, any>) => [args.at],
  opening: (args: Record<string, any>) => [args.at, args.endTime],
  focusStage: (args: Record<string, any>) => [args.at, ...(args.items ?? []).map((item: any) => item.time)],
  xy: (args: Record<string, any>) => [args.at, ...(args.keyframes ?? []).map((item: any) => item.at)],
  multi: (args: Record<string, any>) => [args.at, ...(args.series ?? []).flatMap((series: any) => (series.data ?? []).map((item: any) => item.at))],
  relation: (args: Record<string, any>) => [args.at, ...(args.relations ?? []).map((item: any) => item.at), ...(args.highlights ?? []).map((item: any) => item.at)],
  decomposition: (args: Record<string, any>) => [args.at, ...(args.parts ?? []).map((item: any) => item.at), ...(args.highlights ?? []).map((item: any) => item.at)],
  comparison: (args: Record<string, any>) => [args.at, ...(args.items ?? []).map((item: any) => item.at), ...(args.highlights ?? []).map((item: any) => item.at)],
  network: (args: Record<string, any>) => [args.at, ...(args.nodes ?? []).map((item: any) => item.at), ...(args.edges ?? []).map((item: any) => item.at)],
  images: (args: Record<string, any>) => [args.at, ...(args.images ?? []).map((item: any) => item.at)],
  showcase: (args: Record<string, any>) => [args.at, ...(args.items ?? []).map((item: any) => item.at)],
  metric: (args: Record<string, any>) => [args.at, ...(args.points ?? []).map((item: any) => item.at)],
  cueItems: (args: Record<string, any>) => [args.at, ...(args.items ?? []).map((item: any) => item.at)],
  objectDrop: (args: Record<string, any>) => [args.at, args.impactAt],
  glassFracture: (args: Record<string, any>) => [args.at, args.crackAt],
  eraShift: (args: Record<string, any>) => [
    args.at,
    args.switchAt,
  ],
  mgCutoutRise: (args: Record<string, any>) => [args.at],
  routeShift: (args: Record<string, any>) => [
    args.at,
    args.switchTime,
  ],
  webNewsFocus: (args: Record<string, any>) => [
    args.at,
    ...(args.highlights ?? []).map((item: any) => item.at),
  ],
  longtake: (args: Record<string, any>) => [
    args.at,
    ...(args.segments ?? []).map((item: any) => item.at),
  ],
};

/** Fill omitted era-shift logos from the same fixed scanner used by collage
 * nodes. Explicit item.logo values remain untouched and are validated later. */
const resolveEraShiftCall = (input: unknown): ResolveResult => {
  const resolved = resolveEraShiftFunctionArgs(input as never);
  const spec = resolved.spec as {
    startItems?: Array<{text: string; logo?: string}>;
    endItems?: Array<{text: string; logo?: string}>;
  };
  for (const items of [spec.startItems, spec.endItems]) {
    if (!items) continue;
    for (const item of items) {
      if (item.logo) continue;
      const match = findLogoAsset({text: item.text}, {scope: "any"});
      if (match) item.logo = match.runtimePath;
    }
  }
  return resolved;
};

const bindings: readonly Binding[] = Object.freeze([
  {name: scVideoFunctionDefinition.name, label: "普通 AI 视频", template: "sc-video", definition: scVideoFunctionDefinition, resolve: resolveScVideoFunctionArgs, elementAts: elementAts.root},
  {name: scLongtakeFunctionDefinition.name, label: "接力一镜到底", template: "sc-longtake", definition: scLongtakeFunctionDefinition, resolve: resolveScLongtakeFunctionArgs, elementAts: elementAts.longtake},
  {name: videoFootageFunctionDefinition.name, label: "素材视频截取", template: "video-footage", definition: videoFootageFunctionDefinition, resolve: resolveVideoFootageFunctionArgs, elementAts: elementAts.root},
  {name: aiHotOpeningFunctionDefinition.name, label: "AI 热点开场", template: "ai-hot-opening", definition: aiHotOpeningFunctionDefinition, resolve: resolveAiHotOpeningFunctionArgs, elementAts: elementAts.opening, groups: [AI_HOT_OPENING_GROUP]},
  {name: aiHotFocusStageFunctionDefinition.name, label: "AI 热点章节舞台", template: "ai-hot-focus-stage", definition: aiHotFocusStageFunctionDefinition, resolve: resolveAiHotFocusStageFunctionArgs, elementAts: elementAts.focusStage, groups: [AI_HOT_FOCUS_STAGE_GROUP]},
  {name: progressTimelineFunctionDefinition.name, label: "时间进度条", template: "progress-timeline", definition: progressTimelineFunctionDefinition, resolve: (input) => resolveProgressTimelineFunctionArgs(input as never), elementAts: elementAts.progress},
  {name: timedTableFunctionDefinition.name, label: "动态表格", template: "timed-table", definition: timedTableFunctionDefinition, resolve: (input) => resolveTimedTableFunctionArgs(input as never), elementAts: elementAts.table},
  {name: directedGraphFunctionDefinition.name, label: "有向关系图", template: "directed-graph", definition: directedGraphFunctionDefinition, resolve: (input) => resolveDirectedGraphFunctionArgs(input as never), elementAts: elementAts.graph},
  {name: titleFunctionDefinition.name, label: "标题动画", template: "title", definition: titleFunctionDefinition, resolve: (input) => resolveTitleFunctionArgs(input as never), elementAts: elementAts.root},
  {name: emphasisFunctionDefinition.name, label: "重点大字", template: "emphasis", definition: emphasisFunctionDefinition, resolve: (input) => resolveEmphasisFunctionArgs(input as never), elementAts: elementAts.root},
  {name: newsFlashbackFunctionDefinition.name, label: "网页资料闪回", template: "news-flashback", definition: newsFlashbackFunctionDefinition, resolve: (input) => resolveNewsFlashbackFunctionArgs(input as never), elementAts: elementAts.root},
  {name: xyChartFunctionDefinition.name, label: "坐标趋势图", template: "xy-chart", definition: xyChartFunctionDefinition, resolve: (input) => resolveXYChartFunctionArgs(input as never), elementAts: elementAts.xy},
  {name: multiSeriesChartFunctionDefinition.name, label: "多系列图表", template: "multi-series-chart", definition: multiSeriesChartFunctionDefinition, resolve: (input) => resolveMultiSeriesChartFunctionArgs(input as never), elementAts: elementAts.multi},
  {name: containmentFunctionDefinition.name, label: "包含关系", template: "containment", definition: containmentFunctionDefinition, resolve: (input) => resolveContainmentFunctionArgs(input as never), elementAts: elementAts.relation},
  {name: decompositionFunctionDefinition.name, label: "整体拆解", template: "decomposition", definition: decompositionFunctionDefinition, resolve: (input) => resolveDecompositionFunctionArgs(input as never), elementAts: elementAts.decomposition},
  {name: weightedComparisonFunctionDefinition.name, label: "加权对比", template: "weighted-comparison", definition: weightedComparisonFunctionDefinition, resolve: (input) => resolveWeightedComparisonFunctionArgs(input as never), elementAts: elementAts.comparison},
  {name: sideBySideComparisonFunctionDefinition.name, label: "左右对比", template: "side-by-side-comparison", definition: sideBySideComparisonFunctionDefinition, resolve: (input) => resolveSideBySideComparisonFunctionArgs(input as never), elementAts: elementAts.comparison},
  {name: collageNetworkFunctionDefinition.name, label: "拼贴关系网络", template: "collage-network", definition: collageNetworkFunctionDefinition, resolve: (input) => resolveCollageNetworkFunctionArgs(input as never, {resolveAsset: assetForCollageNode}), elementAts: elementAts.network},
  {name: imageStackFunctionDefinition.name, label: "图片叠加", template: "image-stack", definition: imageStackFunctionDefinition, resolve: (input) => resolveImageStackFunctionArgs(input as never), elementAts: elementAts.images},
  {name: imageGridFunctionDefinition.name, label: "图片并列", template: "image-grid", definition: imageGridFunctionDefinition, resolve: (input) => resolveImageGridFunctionArgs(input as never), elementAts: elementAts.images},
  {name: newsReportFunctionDefinition.name, label: "新闻报道纸张", template: "news-report", definition: newsReportFunctionDefinition, resolve: (input) => resolveNewsReportFunctionArgs(input as never), elementAts: elementAts.root},
  {name: webNewsFocusFunctionDefinition.name, label: "网页重点跟随", template: "web-news-focus", definition: webNewsFocusFunctionDefinition, resolve: (input) => resolveWebNewsFocusFunctionArgs(input as never), elementAts: elementAts.webNewsFocus, groups: [WEB_NEWS_FOCUS_GROUP]},
  {name: eraShiftFunctionDefinition.name, label: "策略转向", template: "era-shift", definition: eraShiftFunctionDefinition, resolve: resolveEraShiftCall, elementAts: elementAts.eraShift},
  {name: mgCutoutRiseFunctionDefinition.name, label: "透明主体上升", template: "mg-cutout", definition: mgCutoutRiseFunctionDefinition, resolve: (input) => resolveMgCutoutRiseFunctionArgs(input as never), elementAts: elementAts.mgCutoutRise, groups: [MG_CUTOUT_GROUP]},
  {name: routeShiftFunctionDefinition.name, label: "路线切换", template: "route-shift", definition: routeShiftFunctionDefinition, resolve: (input) => resolveRouteShiftFunctionArgs(input as never), elementAts: elementAts.routeShift},
  {name: showcaseFunctionDefinition.name, label: "界面陈列", template: "showcase", definition: showcaseFunctionDefinition, resolve: (input) => resolveShowcaseFunctionArgs(input as never), elementAts: elementAts.showcase},
  {name: metricFunctionDefinition.name, label: "指标动画", template: "metric", definition: metricFunctionDefinition, resolve: (input) => resolveMetricFunctionArgs(input as never), elementAts: elementAts.metric},
  {name: transitionFunctionDefinition.name, label: "转场", template: "transition", definition: transitionFunctionDefinition, resolve: (input) => resolveTransitionFunctionArgs(input as never), elementAts: elementAts.root},
  {name: rhythmFunctionDefinition.name, label: "节拍强调", template: "rhythm", definition: rhythmFunctionDefinition, resolve: (input) => resolveRhythmFunctionArgs(input as never), elementAts: elementAts.root},
  {name: effectFunctionDefinition.name, label: "视觉效果", template: "effect", definition: effectFunctionDefinition, resolve: (input) => resolveEffectFunctionArgs(input as never), elementAts: elementAts.cueItems, groups: MG_STYLE_CATALOG.filter((entry) => entry.template === "effect" && entry.style !== "object-drop" && entry.style !== "glass-fracture").map((entry) => entry.style)},
  {name: objectDropEffectFunctionDefinition.name, label: "物体坠落", template: "effect", definition: objectDropEffectFunctionDefinition, resolve: (input) => resolveObjectDropEffectFunctionArgs(input as never), elementAts: elementAts.objectDrop, groups: ["object-drop"]},
  {name: glassFractureEffectFunctionDefinition.name, label: "破碎效果", template: "effect", definition: glassFractureEffectFunctionDefinition, resolve: (input) => resolveGlassFractureEffectFunctionArgs(input as never), elementAts: elementAts.glassFracture, groups: ["glass-fracture"]},
]);

const catalogByTemplate = new Map<MgTemplateName, MgStyleCatalogEntry[]>();
const htmlTagByTemplate = new Map<MgTemplateName, string>();
for (const entry of MG_STYLE_CATALOG) {
  const rows = catalogByTemplate.get(entry.template) ?? [];
  rows.push(entry);
  catalogByTemplate.set(entry.template, rows);
  const current = htmlTagByTemplate.get(entry.template);
  if (current && current !== entry.htmlTag) throw new Error(`模板 ${entry.template} 注册了多个 HTML 标签`);
  htmlTagByTemplate.set(entry.template, entry.htmlTag);
}

const usageByTemplate = new Map(MG_TEMPLATE_USAGE.map((entry) => [entry.template, entry.useWhen]));
const templateByHtmlTag = new Map<string, MgTemplateName>();
const descriptors: readonly MgTemplateDescriptor[] = Object.freeze(
  [...catalogByTemplate.entries()].map(([template, entries]) => {
    const htmlTag = htmlTagByTemplate.get(template);
    if (!htmlTag) throw new Error(`模板 ${template} 缺少 HTML 标签`);
    const roles = new Set(entries.map((entry) => entry.renderMode === "overlay" ? "overlay" : "scene"));
    if (roles.size !== 1) throw new Error(`<${htmlTag}> 的 group 不能混用 scene 和 overlay 图层职责`);
    templateByHtmlTag.set(htmlTag, template);
    return Object.freeze({
      htmlTag,
      selectionHint: usageByTemplate.get(template) ?? "原文存在适合该动画结构的明确语义",
      groups: Object.freeze(entries.map((entry) => entry.style)),
      layerRole: [...roles][0] as MgLayerRole,
    });
  }),
);

const descriptorByHtmlTag = new Map(descriptors.map((descriptor) => [descriptor.htmlTag, descriptor]));
const bindingByName = new Map(bindings.map((binding) => [binding.name, binding]));

const backgroundFor = (template: MgTemplateName, group: string): string => {
  if (template === "progress-timeline" && group === "vertical") return "#191d21";
  if (template === "directed-graph" && group === "radial") return "#f4f0e8";
  const backgrounds: Record<MgTemplateName, string> = {
    "sc-video": "#000000",
    "sc-longtake": "#071014",
    "video-footage": "#000000",
    "ai-hot-opening": "transparent",
    "ai-hot-focus-stage": "#020306",
    "progress-timeline": "#f4f1ea",
    "timed-table": "#171c20",
    "directed-graph": "#191d21",
    title: "transparent",
    emphasis: "transparent",
    "xy-chart": "#f3f0e9",
    "multi-series-chart": "#171c20",
    containment: "#f4f1ea",
    decomposition: "#f3efe6",
    "weighted-comparison": "#171d1f",
    "side-by-side-comparison": "#f3efe6",
    "collage-network": "#eee9de",
    "image-stack": "#f3f0e9",
    "image-grid": "#f3f0e9",
    "news-report": "transparent",
    "web-news-focus": "#070b0d",
    "news-flashback": "#0a0f13",
    "era-shift": "#0a1117",
    "mg-cutout": "transparent",
    "route-shift": "#071118",
    showcase: "#10171b",
    metric: "#0e1519",
    transition: "transparent",
    rhythm: "transparent",
    effect: "transparent",
  };
  return backgrounds[template];
};

/** 这些模板自带整屏画面，必须是 full canvas 而不是 safe 内缩画布。 */
const FULL_CANVAS_TEMPLATES = new Set<MgTemplateName>(["video-footage", "news-flashback", "ai-hot-focus-stage", "web-news-focus"]);

const makeRuntimeLayer = (template: MgTemplateName, group: string, spec: unknown): MgRuntimeLayer => {
  const descriptor = descriptorByHtmlTag.get(htmlTagByTemplate.get(template) ?? "");
  if (!descriptor) throw new Error(`模板 ${template} 缺少 Provider 描述`);
  return {
    kind: template,
    group,
    spec,
    layerRole: descriptor.layerRole,
    canvas: FULL_CANVAS_TEMPLATES.has(template) || descriptor.layerRole === "overlay" ? "full" : "safe",
    background: backgroundFor(template, group),
  };
};

const defaultGroups = () => descriptors.map((descriptor) => {
  const template = templateByHtmlTag.get(descriptor.htmlTag)!;
  const entry = catalogByTemplate.get(template)?.find((candidate) => candidate.isDefault);
  return entry ? `<${descriptor.htmlTag}>=${entry.style}` : "";
}).filter(Boolean).join("、");

const planningInstructions = `你负责把 HTML 中的 MG 标签转换成动画工具调用。

调用规则：
- 每个动画实例必须调用一次对应工具，包括嵌套实例；实例由“HTML 标签名 + group + order”确定
- 同标签、同 group 的单实例在 HTML 中没有 order 时，Function Call 的 order 填 null；重复实例必须原样复制其 order
- group 必须从 HTML 原样复制，不得自行改写；value 顺序对应同一实例的元素顺序
- <ai-hot-opening> 是例外：create_ai_hot_opening 不传 group 或 order，模板内部固定使用 color-orb
- <ai-hot-focus-stage> 是例外：create_ai_hot_focus_stage 不传 group、order 或 endTime，模板内部固定使用 focus-stage
- 只调用输入 HTML 中实际存在标签所对应的工具，不得合并、遗漏或创建不存在的实例

有向关系图规则：
- <directed-graph> 的 nodes 和 edges 是 HTML 标注阶段已经确定、并经过人工审核的固定拓扑
- Function Call 必须逐项复制这套 nodes/edges，保持节点 id、label、边的 from/to 和顺序不变
- 只能根据真实字级时间轴补每个节点的 at、每条边的 at 和 relation；不得新增、删除、改名或改连线

时间规则：
- at 直接使用字级时间轴 JSON 的 start 数值，不进行换算
- 根 at 使用该实例首个标签文字的 start；每个结构元素使用其对应标签文字首字的 start
- 没有单独对应文字的结构性元素使用实例根 at
- <sc-video> 的时间窗口由宿主代码根据标签文字绑定，其工具参数不填写 at
- <sc-longtake> 的时间窗口由宿主代码根据标签文字绑定；工具参数中的根 at 和 segments.at 必须来自同一实例的真实字级时间轴
- <video-footage> 的 at 使用标签首字在整集的绝对时间；sourceStart/sourceEnd 是所选源视频内部的秒数，不得与 at 混用
- <ai-hot-opening> 的 at 使用标签首字 start，endTime 使用标签末字 end，二者至少间隔 7 秒
- <ai-hot-focus-stage> 的 at 使用标签首字 start；items[].time 使用各章节标题首字的绝对 start，第一项至少晚于 at 5 秒，后续至少间隔 2.5 秒

连续视频规则：
- <sc-video> 是普通短视频片段；<sc-longtake group="relay"> 是接力式一镜到底，二者不能混用
- <sc-longtake> 只能使用 group="relay"，不填写 mode 或 value；一个 HTML 实例只调用一次 create_sc_longtake
- create_sc_longtake 必须提供 2-8 个按 at 严格递增的 segments；第一个 segment.at 应对应实例起点，最后一个片段延伸到实例结束
- 第一段使用 reference_image_state 指定的初始参考图；每个后续片段自动使用上一段生成视频的尾帧作为首帧
- 每个后续 video_prompt 都要明确从提供的首帧继续，保持主体、镜头轴线、视角、焦段、光线、空间布局和运动方向连续；禁止硬切、重置构图、字幕、Logo 和水印

已有素材视频规则：
- <video-footage group="full-bleed"> 只能从 Provider 列出的固定素材库选取，不能把它当作 <sc-video> 去生成新视频
- 调用 use_video_footage 前必须先阅读其工具说明中的当前素材和字幕时间轴，再选择 source、sourceStart 和 sourceEnd
- sourceEnd-sourceStart 必须至少覆盖 HTML 标签的完整时间窗口；只选一个连续区间，不循环、不冻结尾帧、不变速

策略转向规则：
- <era-shift group="foreground-with-background"> 调用 create_era_shift；foreground 选择 existing 或 generate，startItems/endItems 只填语义文字和可选 logo 文件名
- switchAt 是背景从 startItems 切换到 endItems 的绝对时间；不要给 item 填 at，也不要输出 assetDir、title、label 或视觉参数
- <mg-cutout group="rise"> 调用 create_cutout_rise；at 是主体入场时间，source 依工具说明选择透明图、已有绿幕图或参考图生成
- 主体从画面下方上升并自然减速停住；图层只有透明主体，不绘制或替换任何背景，不添加回弹、烟雾、标题或装饰

内容规则：
- 根据标签文字及其所在段落填写工具参数，保留原文数字、正负号、年份、单位和系列关系
- 需要图片的工具中，图片字段只能填写输入中逐字出现的 URL、本地路径或可直接用于生图的描述；无法确认 URL 时不要编造
- <era-shift> 的固定素材或人物参考图选择规则以 Provider 工具说明为准；不要编造图片地址
- 参数必须符合工具 Schema；工具返回错误时修正当前实例；全部实例调用完成后结束`;

const annotationInstructions = () => `模板用法（由模板包提供）：
${descriptors.map((descriptor) => `- <${descriptor.htmlTag}>：${descriptor.selectionHint}`).join("\n")}

可用 group：
${descriptors.map((descriptor) => `- <${descriptor.htmlTag}>：${descriptor.groups.join("、")}`).join("\n")}

标注协议：
- <article> 内只能保留原文文本节点和本 Provider 注册的自定义标签；禁止使用 p、div、span、br、strong 等原生 HTML 正文标签
- 必须逐字保留原文及其换行，不得为排版添加、删除或移动空白，也不得自行增加标题、加粗或段落样式
- group 必须从该标签的可用 group 中选择；首次生成使用默认样式：${defaultGroups()}
- 实例身份是“HTML 标签名 + group + order”。不同 group 本身已能区分实例，不需要共用 order
- 只有相同 HTML 标签且相同 group 出现两个或更多独立实例时，才给这组实例按首次出现顺序填写连续 order=1、2、3；单实例不写 order
- 相同 HTML 标签且相同 group 出现在不同父标签中时，属于多个独立实例，也必须在全文范围内使用连续 order 区分
- <sc-video> 只允许 group="normal" 和可选 order，不使用 mode 或 value
- <sc-longtake> 只允许 group="relay" 和可选 order，不使用 mode 或 value
- <video-footage> 只允许 group="full-bleed"、可选 order 和 mode="together"，不使用 value；一个标签覆盖一个完整的连续素材片段
- <ai-hot-opening> 只允许 group="color-orb" 和 mode="together"，不使用 order 或 value；一集最多标注一次，标签范围必须覆盖至少 7 秒
- <ai-hot-focus-stage> 只允许 group="focus-stage" 和 mode="together"，不使用 order 或外层 value；一集最多标注一次，标签必须覆盖整集正文，values 属性按新闻顺序逐项填写数据库标题，并用连续编号的 <mg-value value="N"> 在正文中标出相同标题
- <directed-graph> 必须在 HTML 标注阶段同时写入 nodes 和 edges：nodes 是按显示顺序排列的非空节点文字 JSON 数组，edges 是引用 nodes 下标的 [from,to] JSON 数组；这套拓扑供人工审核，规划阶段不得改动
- value 是当前实例内部元素的正文顺序，从 1 连续编号；同一实例的 group、order、mode 必须一致
- mode 只能是 together 或 split；标签可嵌套，但不能嵌套同一个动画实例
- mode="split" 时每个节点独立标注；mode="together" 时一个标签覆盖完整范围，并用 values JSON 字符串数组列出需要显示的节点词
- <era-shift group="foreground-with-background"> 用于一个固定或可生成的前景人物/物体与两套背景生态的策略转向；每个实例只用一个 mode="together" 标签，标注时只保留正文原文，不写 foreground、switchAt、startItems 或 endItems，这些在规划阶段根据时间轴、搜索结果和 Provider 素材规则填写
- <mg-cutout group="rise"> 用于把一个人物或完整物体作为透明前景从下方升入原视频；每个实例一个 mode="together" 标签，标注时只保留正文原文，图片来源在规划阶段选择
- <mg-effect group="object-drop"> 只用于正文明确出现产品或实体物体落下/砸落的节点；<mg-effect group="glass-fracture"> 只用于计划、方案或屏幕明确失败/破碎的节点。图片在后续规划阶段从模板固定目录选择，标注 HTML 不写 image。
- <news-flashback group="project"> 用于“这句话有公开报道为证”的节点：规划阶段会先联网检索真实网页截图再生成动画；标注 HTML 只写标签和原文，不写 pages。它是整屏画面，会盖住该时间窗口内的原画，一段原文只标注一次。
- <web-news-focus group="focus"> 用于“直接阅读真实报道并跟随页面重点”的节点：标注 HTML 只写标签和清稿原文，不写 url、highlights、entrance 或坐标；规划阶段搜索 canonical URL、读取所选网页正文，从网页中逐字选择重点短语，并把高亮时间对齐清稿中对应语义。
- <mg-title>、<emphasis> 和 <news-flashback> 的单个动画实例只能包裹一段文字`;

export type MgTemplateProvider = Readonly<{
  protocolVersion: 1;
  templates: readonly MgTemplateDescriptor[];
  runtimeEntryUrl: URL;
  getAnnotationInstructions(): string;
  getPlanningInstructions(): string;
  getTemplatePlanningInstructions(htmlTags: readonly string[]): string;
  listStylePreviews(): readonly MgStylePreview[];
  supportsHtmlTag(htmlTag: string): boolean;
  supportsGroup(htmlTag: string, group: string): boolean;
  instanceKey(input: Pick<MgProviderInstance, "htmlTag" | "group" | "order">): string;
  getPlanningTools(htmlTags: readonly string[]): readonly MgPlanningTool[];
  resolveCall(input: {name: string; arguments: Record<string, unknown>}): MgResolvedProviderCall;
  isToolAllowed(input: {htmlTag: string; group: string; name: string}): boolean;
  validateAnnotatedInstance(input: {htmlTag: string; tagCount: number}): void;
  prepareRuntimeAssets(input: {
    layers: readonly MgRuntimeLayerPlacement[];
    resolveImage(source: string): Promise<string>;
    generateImageFromReferences?(input: MgReferenceImageGenerationRequest): Promise<string>;
    removeSolidBackground?(input: MgSolidBackgroundRemovalRequest): Promise<string>;
  }): Promise<void>;
  copyRuntimeAssets(publicDir: string): Promise<void>;
}>;

const instanceKey = ({htmlTag, group, order}: Pick<MgProviderInstance, "htmlTag" | "group" | "order">): string =>
  `${htmlTag}::${group}::${order === undefined ? "one" : String(order).padStart(2, "0")}`;

type ConfigurableEffectGroup = keyof typeof EFFECT_GROUP_ASSET_DIRS;
const EFFECT_IMAGE_FILE = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i;

const isConfigurableEffectGroup = (group: string): group is ConfigurableEffectGroup =>
  group === "object-drop" || group === "glass-fracture";

const isPathInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === ""
    || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

const effectAssetToolInstructions = (groups: readonly ConfigurableEffectGroup[]): string => [
  "可配置素材目录由模板 Provider 固定，禁止输出 assetDir：",
  ...groups.map((group) => {
    const directory = path.join(publicRoot, "mg-effect", group);
    let candidates: string[] = [];
    try {
      candidates = fsSync.readdirSync(directory, {withFileTypes: true})
        .filter((entry) => entry.isFile() && EFFECT_IMAGE_FILE.test(entry.name))
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right, "zh-CN"));
    } catch {
      // Missing directories are reported by runtime validation if selected.
    }
    return `- group=${group}：${EFFECT_GROUP_DESCRIPTIONS[group]} 固定目录：${directory}；当前候选：${candidates.join("、") || "无"}。按主体描述选择一张，只把文件名或该文件的绝对路径填入 image；不要传烟雾、裂纹或其他效果参数。`;
  }),
].join("\n");

/** Resolve an effect image strictly from its package-owned group directory. */
const resolveEffectAssetPath = async (group: ConfigurableEffectGroup, source: string): Promise<string> => {
  let value = source.trim().replace(/^(["'])(.*)\1$/, "$2");
  if (!value) throw new Error(`${group} requires one image asset`);
  if (/^(?:https?:|data:|blob:)/i.test(value)) {
    throw new Error(`${group} 的 image 必须来自固定素材目录，不能使用 URL 或 data 图片`);
  }
  if (/^file:\/\//i.test(value)) {
    try { value = fileURLToPath(value); } catch { /* Fall through to the normal error below. */ }
  }

  const groupRoot = path.join(publicRoot, "mg-effect", group);
  const normalized = value.replaceAll("/", path.sep);
  const withoutPublic = normalized.replace(/^public[\\/]+/i, "");
  const candidates: string[] = [];
  if (path.isAbsolute(normalized) || /^[A-Za-z]:[\\/]/.test(normalized)) {
    candidates.push(normalized);
  } else {
    candidates.push(path.resolve(publicRoot, withoutPublic));
    if (!/[\\/]/.test(normalized)) candidates.push(path.join(groupRoot, normalized));
  }

  for (const candidate of candidates) {
    let stat;
    try { stat = await fs.stat(candidate); } catch { continue; }
    if (!stat.isFile()) continue;
    if (!EFFECT_IMAGE_FILE.test(candidate)) {
      throw new Error(`${group} 的 image 不是支持的图片文件: ${source}`);
    }
    if (!isPathInside(groupRoot, candidate)) continue;
    const relative = path.relative(groupRoot, candidate);
    if (!relative || relative.includes(path.sep)) continue;
    return `mg-effect/${group}/${relative.replaceAll(path.sep, "/")}`;
  }

  throw new Error(`${group} 的 image 不在固定素材目录 ${EFFECT_GROUP_ASSET_DIRS[group]}：${source}`);
};

type EraShiftAssetKind = "foreground" | "logo";
const ERA_SHIFT_IMAGE_FILE = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i;

const eraShiftAssetDirectory = (kind: EraShiftAssetKind): string =>
  path.join(publicRoot, "era-shift", kind === "foreground" ? "foreground" : "logos");

const listEraShiftForegroundAssets = (): string[] => {
  const directory = eraShiftAssetDirectory("foreground");
  try {
    return fsSync.readdirSync(directory, {withFileTypes: true})
      .filter((entry) => entry.isFile() && ERA_SHIFT_IMAGE_FILE.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right, "zh-CN"));
  } catch {
    return [];
  }
};

/** Keep asset selection and generation rules in the provider. */
const eraShiftAssetToolInstructions = (): string => {
  const foreground = listEraShiftForegroundAssets();
  const logos = [...new Set(listLogoAssets("any").map((asset) => asset.fileName))];
  return [
    "era-shift 的素材目录和分类由模板 Provider 固定，Function Call 不要输出 assetDir：",
    `- foreground.mode=existing：${ERA_SHIFT_FOREGROUND_DESCRIPTION} 当前可选固定文件：${foreground.join("、") || "无"}。填写 foreground.image 为其中一个文件名，foreground.person=null，foreground.references=[]。`,
    `- foreground.mode=generate：当固定文件没有合适人物时，先用 search_web 搜索可靠肖像/全身照片，选择 1-3 个结果的直接 imageUrl；填写 foreground.person（人物或人物组合描述）、foreground.references（直接图片 URL），foreground.image=null。不要把结果页 URL 或 screenshotUrl 当作参考图。`,
    `- startItems/endItems[].logo（可选）：${ERA_SHIFT_LOGO_DESCRIPTION} 当前可选文件：${logos.join("、") || "无"}。Provider 会扫描固定 Logo 目录（主目录 public/era-shift/logos/，兼容目录 public/ai-company-logos/）；填写时只选清单中的文件名，省略时按文字自动匹配，否则显示文字卡片。`,
    "- startItems 和 endItems 的 item 只填写 text 和可选 logo；不要填写每项 at、title、label、颜色、布局或音效。switchAt 是唯一的背景切换时间。",
  ].join("\n");
};

const mgCutoutSourceToolInstructions = (): string => [
  "source 只描述图片来源，入场动作和视觉参数均由模板固定：",
  "- mode=transparent：image 只能是已经带透明通道的图片 URL 或本地图片路径；subject=null，references=[]。",
  "- mode=chroma：image 必须是已有绿幕图片的绝对本地文件路径；模板固定抠除 #00ff00；subject=null，references=[]。",
  "- mode=generate：若需要生成新主体，先用 search_web 搜索可靠肖像或产品图片，选择 1-3 个直接 imageUrl；填写 subject 和 references，image=null。宿主会先按模板提示词生成纯绿背景图，再自动抠除为透明 PNG。",
  "不要输出色键颜色、抠图阈值、背景、烟雾、阴影、音效或其他视觉参数。",
].join("\n");

const resolveEraShiftAssetPath = async (kind: EraShiftAssetKind, source: string): Promise<string> => {
  let value = source.trim().replace(/^(["'])(.*)\1$/, "$2");
  if (!value) throw new Error(`era-shift ${kind} asset is required`);
  if (/^(?:https?:|data:|blob:)/i.test(value)) {
    throw new Error(`era-shift ${kind} 素材必须来自模板固定目录，不能使用 URL 或 data 图片`);
  }
  if (/^file:\/\//i.test(value)) {
    try { value = fileURLToPath(value); } catch { /* Fall through to normal path validation. */ }
  }

  if (kind === "logo") {
    const match = resolveLogoAssetSource(value, "any");
    if (match) return match.runtimePath;
    throw new Error(`era-shift ${kind} 素材不在模板固定 Logo 目录（${ERA_SHIFT_ASSET_DIRS.logos} 或 public/ai-company-logos/）: ${source}`);
  }

  const root = eraShiftAssetDirectory(kind);
  const normalized = value.replaceAll("/", path.sep);
  const withoutPublic = normalized.replace(/^public[\\/]+/i, "");
  const candidates: string[] = [];
  if (path.isAbsolute(normalized) || /^[A-Za-z]:[\\/]/.test(normalized)) {
    candidates.push(normalized);
  } else {
    candidates.push(path.resolve(publicRoot, withoutPublic));
    if (!/[\\/]/.test(normalized)) candidates.push(path.join(root, normalized));
  }

  for (const candidate of candidates) {
    let stat;
    try { stat = await fs.stat(candidate); } catch { continue; }
    if (!stat.isFile()) continue;
    if (!ERA_SHIFT_IMAGE_FILE.test(candidate)) {
      throw new Error(`era-shift ${kind} 素材不是支持的图片文件: ${source}`);
    }
    if (!isPathInside(root, candidate)) continue;
    const relative = path.relative(root, candidate);
    if (!relative || relative.includes(path.sep)) continue;
    const folder = kind === "foreground" ? "foreground" : "logos";
    return `era-shift/${folder}/${relative.replaceAll(path.sep, "/")}`;
  }

  const directory = kind === "foreground" ? ERA_SHIFT_ASSET_DIRS.foreground : ERA_SHIFT_ASSET_DIRS.logos;
  throw new Error(`era-shift ${kind} 素材不在固定目录 ${directory}: ${source}`);
};

type RuntimeAssetPreparationContext = {
  resolveImage: (source: string) => Promise<string>;
  generateImageFromReferences?: (input: MgReferenceImageGenerationRequest) => Promise<string>;
  removeSolidBackground?: (input: MgSolidBackgroundRemovalRequest) => Promise<string>;
};

const prepareLayerAssets = async (
  layer: MgRuntimeLayer,
  context: RuntimeAssetPreparationContext,
): Promise<void> => {
  const {resolveImage, generateImageFromReferences, removeSolidBackground} = context;
  if (layer.kind === "video-footage") {
    if (!layer.spec || typeof layer.spec !== "object" || Array.isArray(layer.spec)) {
      throw new Error("video-footage 缺少有效 spec");
    }
    // Video-footage specs are intentionally frozen by the resolver.  Runtime
    // preparation only needs to replace the source with the package-relative
    // runtime path and attach its asset version, so do that on a fresh object
    // instead of mutating the resolver-owned spec.
    const spec = {
      ...(layer.spec as {source?: unknown; sourceStart?: unknown; sourceEnd?: unknown; assetVersion?: unknown}),
    };
    if (typeof spec.source !== "string" || typeof spec.sourceStart !== "number" || typeof spec.sourceEnd !== "number") {
      throw new Error("video-footage spec 缺少 source/sourceStart/sourceEnd");
    }
    const asset = resolveVideoFootageAsset(spec.source);
    if (spec.sourceEnd <= spec.sourceStart || spec.sourceEnd > asset.duration + 0.001) {
      throw new Error(`video-footage 截取区间超出素材 ${asset.source} 的 ${asset.duration}s 时长`);
    }
    spec.source = asset.runtimeSource;
    spec.assetVersion = asset.assetVersion;
    layer.spec = spec;
    return;
  }
  if (layer.kind === "mg-cutout") {
    if (layer.group !== MG_CUTOUT_GROUP) throw new Error(`mg-cutout group must be ${MG_CUTOUT_GROUP}`);
    if (!layer.spec || typeof layer.spec !== "object" || Array.isArray(layer.spec)) {
      throw new Error("mg-cutout 缺少有效 spec");
    }
    const spec = assertMgCutoutRiseSpec(layer.spec);
    if (spec.prepared) return;
    const source = spec.source as MgCutoutSource;
    if (source.mode === "transparent") {
      spec.image = await resolveImage(source.image);
    } else {
      if (!removeSolidBackground) {
        throw new Error("mg-cutout 需要宿主提供纯色背景抠除能力");
      }
      let sourcePath: string;
      if (source.mode === "chroma") {
        try {
          sourcePath = /^file:\/\//i.test(source.image) ? fileURLToPath(source.image) : source.image;
        } catch {
          throw new Error("mg-cutout chroma 图片的 file URL 无效");
        }
        if (!path.isAbsolute(sourcePath) && !/^[A-Za-z]:[\\/]/.test(sourcePath)) {
          throw new Error("mg-cutout chroma 模式必须提供已有绿幕图片的绝对本地文件路径");
        }
      } else {
        if (!generateImageFromReferences) {
          throw new Error("mg-cutout generate 模式需要宿主提供参考图生图能力");
        }
        sourcePath = await generateImageFromReferences({
          prompt: mgCutoutGenerationPrompt(source.subject),
          references: source.references,
          aspectRatio: MG_CUTOUT_GENERATED_ASPECT_RATIO,
          cacheKey: `mg-cutout:${source.subject}:${source.references.join("|")}`,
        });
      }
      const cutoutPath = await removeSolidBackground({
        sourcePath,
        backgroundColor: MG_CUTOUT_CHROMA_COLOR,
        cacheKey: `mg-cutout:${source.mode}:${sourcePath}:${source.mode === "generate" ? source.subject : ""}`,
      });
      spec.image = await resolveImage(cutoutPath);
    }
    spec.prepared = true;
    assertMgCutoutRiseSpec(spec);
    return;
  }
  if (layer.kind === "era-shift") {
    if (layer.group !== ERA_SHIFT_GROUP) {
      throw new Error(`era-shift group must be ${ERA_SHIFT_GROUP}`);
    }
    if (!layer.spec || typeof layer.spec !== "object" || Array.isArray(layer.spec)) {
      throw new Error("era-shift 缺少有效 spec");
    }
    const spec = layer.spec as {
      image?: unknown;
      foreground?: unknown;
      switchAt?: unknown;
      startItems?: unknown;
      endItems?: unknown;
    };
    if (typeof spec.switchAt !== "number" || !Number.isFinite(spec.switchAt) || spec.switchAt < 0) {
      throw new Error("era-shift 的 switchAt 必须是非负时间");
    }
    if (!Array.isArray(spec.startItems) || !Array.isArray(spec.endItems)) {
      throw new Error("era-shift 必须提供 startItems 和 endItems");
    }
    assertEraShiftSpec(spec);
    const foreground = spec.foreground ?? {
      mode: "existing",
      image: spec.image,
      person: null,
      references: [],
    };
    if (!foreground || typeof foreground !== "object" || Array.isArray(foreground)) {
      throw new Error("era-shift 缺少 foreground 选择");
    }
    const selection = foreground as {
      mode?: unknown;
      image?: unknown;
      person?: unknown;
      references?: unknown;
    };
    if (selection.mode === "existing") {
      if (typeof spec.image !== "string" || !spec.image.trim()) {
        throw new Error("era-shift existing 模式必须提供一张 image");
      }
      // These files are package-owned and copied into the render public dir first.
      // Keep their verified static paths instead of re-resolving a project-local lookalike.
      spec.image = await resolveEraShiftAssetPath("foreground", spec.image);
    } else if (selection.mode === "generate") {
      if (typeof selection.person !== "string" || !selection.person.trim()) {
        throw new Error("era-shift generate 模式缺少 foreground.person");
      }
      if (!Array.isArray(selection.references) || selection.references.length < 1 || selection.references.length > 3) {
        throw new Error("era-shift generate 模式需要 1-3 个 foreground.references");
      }
      if (typeof spec.image === "string" && spec.image.startsWith("assets/") && spec.image.trim()) {
        // prepareRuntimeAssets can be called more than once for the same in-memory layer.
      } else {
        if (!generateImageFromReferences || !removeSolidBackground) {
          throw new Error("era-shift generate 模式需要宿主提供参考图生图和纯色背景抠图能力");
        }
        let finalPath: string | undefined;
        let lastError: unknown;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const cacheKey = `era-shift:${selection.person}:${selection.references.join("|")}:attempt-${attempt}`;
            const generatedPath = await generateImageFromReferences({
              prompt: eraShiftForegroundPrompt(selection.person, attempt > 1),
              references: selection.references.map(String),
              aspectRatio: ERA_SHIFT_GENERATED_ASPECT_RATIO,
              cacheKey,
            });
            const cutoutPath = await removeSolidBackground({
              sourcePath: generatedPath,
              backgroundColor: ERA_SHIFT_CHROMA_COLOR,
              cacheKey,
            });
            finalPath = await resolveImage(cutoutPath);
            break;
          } catch (error) {
            lastError = error;
            if (attempt < 2) continue;
          }
        }
        if (!finalPath) {
          throw new Error(`era-shift 自定义前景生成或抠图失败: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
        }
        spec.image = finalPath;
      }
    } else {
      throw new Error("era-shift foreground.mode 必须是 existing 或 generate");
    }
    for (const side of [spec.startItems, spec.endItems]) {
      for (const item of side) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          throw new Error("era-shift 的背景 item 必须是对象");
        }
        const logo = (item as {logo?: unknown}).logo;
        if (logo === undefined) {
          const text = (item as {text?: unknown}).text;
          if (typeof text === "string") {
            const inferred = findLogoAsset({text}, {scope: "any"});
            if (inferred) (item as {logo: string}).logo = inferred.runtimePath;
          }
          continue;
        }
        if (typeof logo !== "string" || !logo.trim()) {
          throw new Error("era-shift item.logo 必须是非空字符串");
        }
        (item as {logo: string}).logo = await resolveEraShiftAssetPath("logo", logo);
      }
    }
    return;
  }
  if (layer.kind === "effect") {
    if (!isConfigurableEffectGroup(layer.group)) return;
    if (!layer.spec || typeof layer.spec !== "object" || Array.isArray(layer.spec)) {
      throw new Error(`${layer.group} 缺少有效的 effect spec`);
    }
    const spec = layer.spec as {image?: unknown; items?: unknown};
    if (typeof spec.image !== "string" || !spec.image.trim()) {
      throw new Error(`${layer.group} 必须提供一张 image`);
    }
    if (spec.items !== undefined) {
      throw new Error(`${layer.group} 只接受 image，不能传 items`);
    }
    const canonicalPath = await resolveEffectAssetPath(layer.group, spec.image);
    spec.image = await resolveImage(canonicalPath);
    return;
  }
  if (layer.kind === "news-flashback") {
    if (!layer.spec || typeof layer.spec !== "object") return;
    const pages = (layer.spec as {pages?: Array<{image?: unknown}>}).pages;
    if (!Array.isArray(pages)) return;
    for (const page of pages) {
      if (!page || typeof page.image !== "string" || !page.image.trim()) {
        throw new Error("news-flashback 的网页素材 image 必须是非空字符串");
      }
      page.image = await resolveImage(page.image);
    }
    return;
  }
  if (layer.kind === "news-report") {
    if (!layer.spec || typeof layer.spec !== "object") return;
    const pages = (layer.spec as {pages?: Array<{image?: unknown}>}).pages;
    if (!Array.isArray(pages)) return;
    for (const page of pages) {
      if (!page || typeof page.image !== "string" || !page.image.trim()) {
        throw new Error("news-report 的网页素材 image 必须是非空字符串");
      }
      page.image = await resolveImage(page.image);
    }
    return;
  }
  if (layer.kind === "web-news-focus") {
    if (!layer.spec || typeof layer.spec !== "object" || Array.isArray(layer.spec)) {
      throw new Error("web-news-focus 缺少有效 spec");
    }
    const spec = assertWebNewsFocusSpec(layer.spec) as WebNewsFocusSpec;
    let capture;
    try {
      capture = await captureWebNewsFocus({
        url: spec.url,
        highlights: spec.highlights.map((highlight) => highlight.text),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`WEB_NEWS_FOCUS_CAPTURE_FAILED url=${spec.url} ${detail}`);
    }
    try {
      const [baseImage, highlightedImage] = await Promise.all([
        resolveImage(capture.basePath),
        resolveImage(capture.highlightedPath),
      ]);
      spec.capture = {
        ...capture.metadata,
        baseImage,
        highlightedImage,
      };
    } finally {
      await fs.rm(capture.temporaryDirectory, {recursive: true, force: true}).catch(() => undefined);
    }
    return;
  }
  if (layer.kind !== "image-stack" && layer.kind !== "image-grid") return;
  if (!layer.spec || typeof layer.spec !== "object") return;
  const media = layer.spec as {images?: Array<{image?: unknown}>};
  if (!Array.isArray(media.images)) return;
  for (const item of media.images) {
    if (!item || typeof item.image !== "string" || !item.image.trim()) {
      throw new Error(`${layer.kind} 的图片素材 image 必须是非空字符串`);
    }
    item.image = await resolveImage(item.image);
  }
};

const copyDirectoryIfPresent = async (source: string, target: string): Promise<void> => {
  try {
    await fs.cp(source, target, {recursive: true, force: true});
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }
};

export const mgTemplateProvider: MgTemplateProvider = Object.freeze({
  protocolVersion: 1,
  templates: descriptors,
  runtimeEntryUrl: new URL("../runtime/render-entry.tsx", import.meta.url),
  getAnnotationInstructions: annotationInstructions,
  getPlanningInstructions: () => planningInstructions,
  getTemplatePlanningInstructions: (htmlTags) => {
    const requested = new Set(htmlTags);
    return [
      requested.has("news-flashback") ? newsFlashbackPlanningInstructions : "",
      requested.has("news-report") ? newsReportPlanningInstructions : "",
      requested.has("web-news-focus") ? webNewsFocusPlanningInstructions : "",
      requested.has("multi-series-chart") ? multiSeriesChartPlanningInstructions : "",
      requested.has("era-shift") ? eraShiftPlanningInstructions : "",
      requested.has("mg-cutout") ? mgCutoutPlanningInstructions : "",
      requested.has("ai-hot-opening") ? aiHotOpeningPlanningInstructions : "",
      requested.has("ai-hot-focus-stage") ? aiHotFocusStagePlanningInstructions : "",
    ].filter(Boolean).join("\n\n");
  },
  listStylePreviews: () => MG_STYLE_CATALOG.map((entry) => Object.freeze({
    htmlTag: entry.htmlTag,
    group: entry.style,
    layerRole: entry.renderMode === "overlay" ? "overlay" : "scene",
    previewFile: `mg-previews/${entry.template}-${entry.style}.mp4`,
    name: entry.name,
    structureName: entry.structureName,
    category: entry.category,
    description: entry.description,
    previewKind: entry.previewKind,
    isDefault: entry.isDefault,
  })),
  supportsHtmlTag: (htmlTag) => descriptorByHtmlTag.has(htmlTag),
  supportsGroup: (htmlTag, group) => descriptorByHtmlTag.get(htmlTag)?.groups.includes(group) ?? false,
  instanceKey,
  getPlanningTools: (htmlTags) => {
    const requested = new Set(htmlTags);
    return bindings
      .filter((binding) => requested.has(htmlTagByTemplate.get(binding.template) ?? ""))
      .map((binding) => Object.freeze({
        name: binding.name,
        label: binding.label,
        description: (() => {
          const configurableGroups = (binding.groups ?? []).filter(isConfigurableEffectGroup);
          if (binding.template === "video-footage") {
            return `${binding.definition.description}\n\n${formatVideoFootageLibraryForAgent()}`;
          }
          if (binding.template === "era-shift") {
            return `${binding.definition.description}\n\n${eraShiftAssetToolInstructions()}`;
          }
          if (binding.template === "mg-cutout") {
            return `${binding.definition.description}\n\n${mgCutoutSourceToolInstructions()}`;
          }
          if (binding.template === "collage-network") {
            return `${binding.definition.description}\n\n${formatLogoAssetInventory("any")}\n关系图节点只填写实体语义字段；不要新增 logo、assetDir 或视觉参数。`;
          }
          return configurableGroups.length
            ? `${binding.definition.description}\n\n${effectAssetToolInstructions(configurableGroups)}`
            : binding.definition.description;
        })(),
        parameters: binding.definition.parameters,
      }));
  },
  resolveCall: ({name, arguments: args}) => {
    const binding = bindingByName.get(name);
    if (!binding) throw new Error(`未知 MG Function Call: ${name}`);
    const resolved = binding.resolve(args);
    const htmlTag = htmlTagByTemplate.get(binding.template);
    if (!htmlTag) throw new Error(`Function Call ${name} 的模板没有 HTML 标签`);
    if (!isMgStyleForTemplate(binding.template, resolved.group)) {
      throw new Error(`<${htmlTag}> 不支持 group 样式 ${resolved.group}`);
    }
    if (binding.groups && !binding.groups.includes(resolved.group)) {
      throw new Error(`${name} 不支持 group=${resolved.group}`);
    }
    const order = typeof resolved.order === "number" ? resolved.order : undefined;
    return {
      name,
      arguments: args,
      htmlTag,
      group: resolved.group,
      ...(order === undefined ? {} : {order}),
      at: resolved.at,
      elementAts: binding.elementAts(args).filter(Number.isFinite),
      instanceKey: instanceKey({htmlTag, group: resolved.group, order}),
      layerRole: descriptorByHtmlTag.get(htmlTag)!.layerRole,
      render: makeRuntimeLayer(binding.template, resolved.group, resolved.spec),
    };
  },
  isToolAllowed: ({htmlTag, group, name}) => {
    const template = templateByHtmlTag.get(htmlTag);
    const binding = bindingByName.get(name);
    return Boolean(
      template
      && binding
      && binding.template === template
      && isMgStyleForTemplate(template, group)
      && (!binding.groups || binding.groups.includes(group)),
    );
  },
  validateAnnotatedInstance: ({htmlTag, tagCount}) => {
    const template = templateByHtmlTag.get(htmlTag);
    if (!template) throw new Error(`不支持的 MG 标签 <${htmlTag}>`);
    if ((template === "sc-video" || template === "sc-longtake" || template === "video-footage" || template === "era-shift" || template === "ai-hot-opening" || template === "ai-hot-focus-stage") && tagCount !== 1) {
      throw new Error(`<${htmlTag}> 的单个动画实例只能出现一次`);
    }
    if ((template === "title" || template === "emphasis" || template === "news-flashback") && tagCount !== 1) {
      throw new Error(`<${htmlTag}> 的单个动画实例只能出现一次`);
    }
  },
  prepareRuntimeAssets: async ({layers, resolveImage, generateImageFromReferences, removeSolidBackground}) => {
    const context: RuntimeAssetPreparationContext = {
      resolveImage,
      ...(generateImageFromReferences ? {generateImageFromReferences} : {}),
      ...(removeSolidBackground ? {removeSolidBackground} : {}),
    };
    for (const layer of layers) await prepareLayerAssets(layer.render, context);
  },
  copyRuntimeAssets: async (targetPublicDir) => {
    await Promise.all([
      copyDirectoryIfPresent(path.join(publicRoot, "ai-company-logos"), path.join(targetPublicDir, "ai-company-logos")),
      copyDirectoryIfPresent(path.join(publicRoot, "audio"), path.join(targetPublicDir, "audio")),
      copyDirectoryIfPresent(path.join(publicRoot, "era-shift"), path.join(targetPublicDir, "era-shift")),
      copyDirectoryIfPresent(path.join(publicRoot, "mg-effect"), path.join(targetPublicDir, "mg-effect")),
      copyDirectoryIfPresent(path.join(publicRoot, "video-footage", "sources"), path.join(targetPublicDir, "video-footage", "sources")),
      copyDirectoryIfPresent(path.join(publicRoot, "web-news"), path.join(targetPublicDir, "web-news")),
    ]);
  },
});

export const getMgTemplateProvider = (): MgTemplateProvider => mgTemplateProvider;
