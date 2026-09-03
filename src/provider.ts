import fs from "node:fs/promises";
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
import {effectFunctionDefinition, resolveEffectFunctionArgs} from "./effect/schema.js";
import {cameraFunctionDefinition, resolveCameraFunctionArgs} from "./camera/schema.js";
import {scVideoFunctionDefinition, resolveScVideoFunctionArgs} from "./sc-video/schema.js";

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
};

const assetForCollageNode = (node: {id: string; label: string}): string | undefined => {
  const key = `${node.id} ${node.label}`.toLowerCase();
  const candidates: Array<[RegExp, string]> = [
    [/(microsoft|微软)/i, "microsoft.svg"],
    [/(openai)/i, "openai.svg"],
    [/(amazon|亚马逊|aws)/i, "amazon.svg"],
    [/(anthropic)/i, "anthropic.svg"],
    [/(google|谷歌)/i, "google.svg"],
    [/(nvidia|英伟达)/i, "nvidia.svg"],
  ];
  const match = candidates.find(([pattern]) => pattern.test(key));
  return match ? `ai-company-logos/${match[1]}` : undefined;
};

const elementAts = {
  progress: (args: Record<string, any>) => (args.nodes ?? []).map((item: any) => item.at),
  table: (args: Record<string, any>) => (args.cells ?? []).map((item: any) => item.at),
  graph: (args: Record<string, any>) => (args.edges ?? []).map((item: any) => item.at),
  root: (args: Record<string, any>) => [args.at],
  xy: (args: Record<string, any>) => (args.keyframes ?? []).map((item: any) => item.at),
  multi: (args: Record<string, any>) => (args.series ?? []).flatMap((series: any) => (series.data ?? []).map((item: any) => item.at)),
  relation: (args: Record<string, any>) => [...(args.relations ?? []), ...(args.highlights ?? [])].map((item: any) => item.at),
  decomposition: (args: Record<string, any>) => [...(args.parts ?? []), ...(args.highlights ?? [])].map((item: any) => item.at),
  comparison: (args: Record<string, any>) => [...(args.items ?? []), ...(args.highlights ?? [])].map((item: any) => item.at),
  network: (args: Record<string, any>) => [...(args.nodes ?? []), ...(args.edges ?? [])].map((item: any) => item.at),
  images: (args: Record<string, any>) => (args.images ?? []).map((item: any) => item.at),
  showcase: (args: Record<string, any>) => (args.items ?? []).map((item: any) => item.at),
  metric: (args: Record<string, any>) => (args.points ?? []).map((item: any) => item.at),
  cueItems: (args: Record<string, any>) => [args.at, ...(args.items ?? []).map((item: any) => item.at)],
};

const bindings: readonly Binding[] = Object.freeze([
  {name: scVideoFunctionDefinition.name, label: "普通 AI 视频", template: "sc-video", definition: scVideoFunctionDefinition, resolve: resolveScVideoFunctionArgs, elementAts: elementAts.root},
  {name: progressTimelineFunctionDefinition.name, label: "时间进度条", template: "progress-timeline", definition: progressTimelineFunctionDefinition, resolve: (input) => resolveProgressTimelineFunctionArgs(input as never), elementAts: elementAts.progress},
  {name: timedTableFunctionDefinition.name, label: "动态表格", template: "timed-table", definition: timedTableFunctionDefinition, resolve: (input) => resolveTimedTableFunctionArgs(input as never), elementAts: elementAts.table},
  {name: directedGraphFunctionDefinition.name, label: "有向关系图", template: "directed-graph", definition: directedGraphFunctionDefinition, resolve: (input) => resolveDirectedGraphFunctionArgs(input as never), elementAts: elementAts.graph},
  {name: titleFunctionDefinition.name, label: "标题动画", template: "title", definition: titleFunctionDefinition, resolve: (input) => resolveTitleFunctionArgs(input as never), elementAts: elementAts.root},
  {name: emphasisFunctionDefinition.name, label: "重点大字", template: "emphasis", definition: emphasisFunctionDefinition, resolve: (input) => resolveEmphasisFunctionArgs(input as never), elementAts: elementAts.root},
  {name: xyChartFunctionDefinition.name, label: "坐标趋势图", template: "xy-chart", definition: xyChartFunctionDefinition, resolve: (input) => resolveXYChartFunctionArgs(input as never), elementAts: elementAts.xy},
  {name: multiSeriesChartFunctionDefinition.name, label: "多系列图表", template: "multi-series-chart", definition: multiSeriesChartFunctionDefinition, resolve: (input) => resolveMultiSeriesChartFunctionArgs(input as never), elementAts: elementAts.multi},
  {name: containmentFunctionDefinition.name, label: "包含关系", template: "containment", definition: containmentFunctionDefinition, resolve: (input) => resolveContainmentFunctionArgs(input as never), elementAts: elementAts.relation},
  {name: decompositionFunctionDefinition.name, label: "整体拆解", template: "decomposition", definition: decompositionFunctionDefinition, resolve: (input) => resolveDecompositionFunctionArgs(input as never), elementAts: elementAts.decomposition},
  {name: weightedComparisonFunctionDefinition.name, label: "加权对比", template: "weighted-comparison", definition: weightedComparisonFunctionDefinition, resolve: (input) => resolveWeightedComparisonFunctionArgs(input as never), elementAts: elementAts.comparison},
  {name: sideBySideComparisonFunctionDefinition.name, label: "左右对比", template: "side-by-side-comparison", definition: sideBySideComparisonFunctionDefinition, resolve: (input) => resolveSideBySideComparisonFunctionArgs(input as never), elementAts: elementAts.comparison},
  {name: collageNetworkFunctionDefinition.name, label: "拼贴关系网络", template: "collage-network", definition: collageNetworkFunctionDefinition, resolve: (input) => resolveCollageNetworkFunctionArgs(input as never, {resolveAsset: assetForCollageNode}), elementAts: elementAts.network},
  {name: imageStackFunctionDefinition.name, label: "图片叠加", template: "image-stack", definition: imageStackFunctionDefinition, resolve: (input) => resolveImageStackFunctionArgs(input as never), elementAts: elementAts.images},
  {name: imageGridFunctionDefinition.name, label: "图片并列", template: "image-grid", definition: imageGridFunctionDefinition, resolve: (input) => resolveImageGridFunctionArgs(input as never), elementAts: elementAts.images},
  {name: showcaseFunctionDefinition.name, label: "界面陈列", template: "showcase", definition: showcaseFunctionDefinition, resolve: (input) => resolveShowcaseFunctionArgs(input as never), elementAts: elementAts.showcase},
  {name: metricFunctionDefinition.name, label: "指标动画", template: "metric", definition: metricFunctionDefinition, resolve: (input) => resolveMetricFunctionArgs(input as never), elementAts: elementAts.metric},
  {name: transitionFunctionDefinition.name, label: "转场", template: "transition", definition: transitionFunctionDefinition, resolve: (input) => resolveTransitionFunctionArgs(input as never), elementAts: elementAts.root},
  {name: rhythmFunctionDefinition.name, label: "节拍强调", template: "rhythm", definition: rhythmFunctionDefinition, resolve: (input) => resolveRhythmFunctionArgs(input as never), elementAts: elementAts.root},
  {name: effectFunctionDefinition.name, label: "视觉效果", template: "effect", definition: effectFunctionDefinition, resolve: (input) => resolveEffectFunctionArgs(input as never), elementAts: elementAts.cueItems},
  {name: cameraFunctionDefinition.name, label: "运镜", template: "camera", definition: cameraFunctionDefinition, resolve: (input) => resolveCameraFunctionArgs(input as never), elementAts: elementAts.cueItems},
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
    showcase: "#10171b",
    metric: "#0e1519",
    transition: "transparent",
    rhythm: "transparent",
    effect: "transparent",
    camera: "transparent",
  };
  return backgrounds[template];
};

const makeRuntimeLayer = (template: MgTemplateName, group: string, spec: unknown): MgRuntimeLayer => {
  const descriptor = descriptorByHtmlTag.get(htmlTagByTemplate.get(template) ?? "");
  if (!descriptor) throw new Error(`模板 ${template} 缺少 Provider 描述`);
  return {
    kind: template,
    group,
    spec,
    layerRole: descriptor.layerRole,
    canvas: descriptor.layerRole === "scene" ? "safe" : "full",
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
- 只调用输入 HTML 中实际存在标签所对应的工具，不得合并、遗漏或创建不存在的实例

时间规则：
- at 直接使用字级时间轴 JSON 的 start 数值，不进行换算
- 根 at 使用该实例首个标签文字的 start；每个结构元素使用其对应标签文字首字的 start
- 没有单独对应文字的结构性元素使用实例根 at
- <sc-video> 的时间窗口由宿主代码根据标签文字绑定，其工具参数不填写 at

内容规则：
- 根据标签文字及其所在段落填写工具参数，保留原文数字、正负号、年份、单位和系列关系
- 需要图片的工具中，图片字段只能填写输入中逐字出现的 URL、本地路径或可直接用于生图的描述；无法确认 URL 时不要编造
- 参数必须符合工具 Schema；工具返回错误时修正当前实例；全部实例调用完成后结束`;

const annotationInstructions = () => `模板用法（由模板包提供）：
${descriptors.map((descriptor) => `- <${descriptor.htmlTag}>：${descriptor.selectionHint}`).join("\n")}

可用 group：
${descriptors.map((descriptor) => `- <${descriptor.htmlTag}>：${descriptor.groups.join("、")}`).join("\n")}

标注协议：
- group 必须从该标签的可用 group 中选择；首次生成使用默认样式：${defaultGroups()}
- 实例身份是“HTML 标签名 + group + order”。不同 group 本身已能区分实例，不需要共用 order
- 只有相同 HTML 标签且相同 group 出现两个或更多独立实例时，才给这组实例按首次出现顺序填写连续 order=1、2、3；单实例不写 order
- 相同 HTML 标签且相同 group 出现在不同父标签中时，属于多个独立实例，也必须在全文范围内使用连续 order 区分
- <sc-video> 只允许 group="normal" 和可选 order，不使用 mode 或 value
- value 是当前实例内部元素的正文顺序，从 1 连续编号；同一实例的 group、order、mode 必须一致
- mode 只能是 together 或 split；标签可嵌套，但不能嵌套同一个动画实例
- <mg-title> 和 <emphasis> 的单个动画实例只能包裹一段文字`;

export type MgTemplateProvider = Readonly<{
  protocolVersion: 1;
  templates: readonly MgTemplateDescriptor[];
  runtimeEntryUrl: URL;
  getAnnotationInstructions(): string;
  getPlanningInstructions(): string;
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
  }): Promise<void>;
  copyRuntimeAssets(publicDir: string): Promise<void>;
}>;

const instanceKey = ({htmlTag, group, order}: Pick<MgProviderInstance, "htmlTag" | "group" | "order">): string =>
  `${htmlTag}::${group}::${order === undefined ? "one" : String(order).padStart(2, "0")}`;

const prepareLayerAssets = async (layer: MgRuntimeLayer, resolveImage: (source: string) => Promise<string>): Promise<void> => {
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

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));

export const mgTemplateProvider: MgTemplateProvider = Object.freeze({
  protocolVersion: 1,
  templates: descriptors,
  runtimeEntryUrl: new URL("../runtime/render-entry.tsx", import.meta.url),
  getAnnotationInstructions: annotationInstructions,
  getPlanningInstructions: () => planningInstructions,
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
        description: binding.definition.description,
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
    return Boolean(template && binding && binding.template === template && isMgStyleForTemplate(template, group));
  },
  validateAnnotatedInstance: ({htmlTag, tagCount}) => {
    const template = templateByHtmlTag.get(htmlTag);
    if (!template) throw new Error(`不支持的 MG 标签 <${htmlTag}>`);
    if (template === "sc-video" && tagCount !== 1) {
      throw new Error("<sc-video> 的单个动画实例只能出现一次");
    }
    if ((template === "title" || template === "emphasis") && tagCount !== 1) {
      throw new Error(`<${htmlTag}> 的单个动画实例只能出现一次`);
    }
  },
  prepareRuntimeAssets: async ({layers, resolveImage}) => {
    for (const layer of layers) await prepareLayerAssets(layer.render, resolveImage);
  },
  copyRuntimeAssets: async (targetPublicDir) => {
    await Promise.all([
      copyDirectoryIfPresent(path.join(publicRoot, "ai-company-logos"), path.join(targetPublicDir, "ai-company-logos")),
      copyDirectoryIfPresent(path.join(publicRoot, "audio"), path.join(targetPublicDir, "audio")),
    ]);
  },
});

export const getMgTemplateProvider = (): MgTemplateProvider => mgTemplateProvider;
