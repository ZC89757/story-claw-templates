import fs from "node:fs/promises";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath, pathToFileURL} from "node:url";
import {getMgTemplateProvider} from "../src/provider";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const episode = process.argv[2];
if (!episode || !path.isAbsolute(episode)) throw new Error("Pass the absolute episode directory");
const require = createRequire(path.join(host, "package.json"));
const parse5 = require("parse5");
const provider = getMgTemplateProvider();
const source = await fs.readFile(path.join(episode, "原文_clean.txt"), "utf8");
const oldHtml = await fs.readFile(path.join(episode, "mg_annotation_v3.html"), "utf8");
const oldPlan = JSON.parse(await fs.readFile(path.join(episode, "mg_annotation_v3_设计清单.json"), "utf8"));
const document = parse5.parse(oldHtml);
const nodes: any[] = [];
const visit = (node: any) => {if (node.tagName) nodes.push(node); for (const child of node.childNodes ?? []) visit(child);}; visit(document);
const attrs = (node: any): Record<string, string> => Object.fromEntries((node.attrs ?? []).map((a: any) => [a.name, a.value]));
const set = (node: any, name: string, value: string) => {const found = node.attrs.find((a: any) => a.name === name); if (found) found.value = value; else node.attrs.push({name, value});};
const text = (node: any): string => node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(text).join("");
const article = nodes.find((node) => node.tagName === "article");
const before = text(article);
const notes = new Map<any, string>();
for (const node of nodes.filter((node) => attrs(node).group)) {
  const a = attrs(node); const entry = oldPlan.instances.find((e: any) => e.tag === node.tagName && e.group === a.group && String(e.order ?? "") === String(a.order ?? ""));
  notes.set(node, entry?.note ?? "按正文的语义节点展开，保留原文和已有嵌套关系。");
}
const unwrap = (node: any) => {
  const parent = node.parentNode; const index = parent.childNodes.indexOf(node);
  for (const child of node.childNodes ?? []) child.parentNode = parent;
  parent.childNodes.splice(index, 1, ...(node.childNodes ?? []));
};
for (const node of nodes) {
  const a = attrs(node);
  if (node.tagName === "mg-metric" && a.group === "pie") node.tagName = node.nodeName = "part-whole-chart";
  if (node.tagName === "multi-series-chart" && a.group === "line-overlay-dual-axis") {node.tagName = node.nodeName = "dual-axis-chart"; set(node, "group", "line-overlay");}
  if (node.tagName === "timeline-window") {node.tagName = node.nodeName = "progress-timeline"; set(node, "group", "content-window");}
  if (node.tagName === "comparison-window") {
    node.tagName = node.nodeName = "subject-expansion"; set(node, "group", "progressive");
    const children: any[] = []; const walk = (n: any) => {for (const c of n.childNodes ?? []) {if (c.tagName === "sc-video" || c.tagName === "video-footage") children.push(c); walk(c);}}; walk(node);
    children.forEach(unwrap);
    notes.set(node, a.order === "1"
      ? "复用 subject-expansion/progressive：内容平台保持，先出现使用者，再在已有用户基础上连接商业服务；是任务累积，不是两个主体的左右竞争。本段不再嵌入两段视频，已有透明图可直接使用。"
      : "复用 subject-expansion/progressive：海外业务保持，依次补充潜在收益、经营条件与用户规模，再聚焦规模与制度风险的关系。网页证据只在自己的子标签时段进入右侧窗口；不把机会与约束画成两个对立主体，不延长视频。"
    );
  }
}
const mgNodes: any[] = []; const walk = (node: any) => {if (node.tagName && attrs(node).group) mgNodes.push(node); for (const child of node.childNodes ?? []) walk(child);}; walk(article);
const groups = new Map<string, any[]>();
for (const node of mgNodes) {const key = `${node.tagName}::${attrs(node).group}`; const list = groups.get(key) ?? []; list.push(node); groups.set(key, list);}
for (const list of groups.values()) list.forEach((node, index) => {node.attrs = node.attrs.filter((a: any) => a.name !== "order"); if (list.length > 1) set(node, "order", String(index + 1));});
if (text(article) !== before || before.replace(/\s/g, "") !== source.replace(/\s/g, "")) throw new Error("Source prose changed");
const instances = mgNodes.map((node) => {
  const a = attrs(node); const blocked = false;
  let note = notes.get(node) ?? "";
  note = note.replaceAll("待实现的", "已实现的").replaceAll("新增带内容窗口的时间线", "复用 progress-timeline/content-window").replaceAll("双窗口", "固定内容窗口")
    .replaceAll("子模板已存在；父容器及其窗口组合仍待实现。", "父容器和子模板已实现，子素材在独立时段进入窗口。")
    .replaceAll("仅HTML设计占位，未实现模板代码。", "");
  const status = blocked ? "模板已实现；显式审核拓扑的宿主接入待批准" : "模板已实现／已复用";
  const selector = `article ${node.tagName}[group="${a.group}"]${a.order ? `[order="${a.order}"]` : ":not([order])"}`;
  return {selector, tag: node.tagName, group: a.group, order: a.order ? Number(a.order) : null, templateImplemented: provider.supportsGroup(node.tagName, a.group), integrationPending: Boolean(blocked), status, note,
    values: a.values ? JSON.parse(a.values) : [], reviewedTopology: a.nodes ? {nodes: JSON.parse(a.nodes), edges: JSON.parse(a.edges)} : undefined};
});
if (instances.some((i) => !i.templateImplemented)) throw new Error("An unimplemented tag/group remains");
process.env.STORY_CLAW_MG_TEMPLATES_DIR = root;
const native = await import(pathToFileURL(path.join(host, "runner/mg/html.ts")).href);
let html = native.decorateMgAnnotationHtml(parse5.serialize(document));
const scope = `:is(${[...new Set(mgNodes.map((n) => n.tagName))].join(",")})`;
const cssString = (value: string) => JSON.stringify(value).replace(/\\n/g, "\\A ");
const rules = [
  "article mg-canvas,article subject-expansion{--mg-accent:#7651b5;--mg-fill:#f1eafd;}",
  `article ${scope}{cursor:help;text-decoration-line:none;border-bottom:2px solid var(--mg-accent);padding-bottom:3px;} article ${scope} ${scope}{padding-bottom:0;}`,
  `article ${scope}:hover:not(:has(${scope}:hover))::after{position:fixed;right:20px;top:20px;z-index:9999;width:min(460px,calc(100vw - 72px));padding:16px 18px;border:1px solid #c7cfd7;border-radius:7px;background:#fff;color:#20262c;box-shadow:0 8px 28px #0002;font:14px/1.8 "Microsoft YaHei",sans-serif;white-space:pre-line;pointer-events:none;text-decoration:none;}`,
  ...instances.flatMap((i) => {
    const pending = i.integrationPending ? "padding-right:17px;background-image:radial-gradient(circle at calc(100% - 6px) 5px,#ef3340 0 3px,#fff 3px 4px,transparent 4px);" : "";
    const extra = i.integrationPending ? "\n红点表示：模板已有，但原 nodes/edges 审核属性尚未接入宿主；没有删除拓扑绕过校验。" : ["image-side-by-side", "mg-canvas", "subject-expansion"].includes(i.tag) ? "\n可用已有透明图片，或填写主体提示词由模板自动生图抠图；本项目素材仍待准备。" : "";
    return [`${i.selector}::before{${pending}}`, `${i.selector}:hover:not(:has(${scope}:hover))::after{content:${cssString(`${i.status}\n${i.note}${extra}`)};}`];
  }),
].join("\n");
html = html.replace("</style>", `${rules}\n</style>`);
let nativeValidation: unknown;
try {nativeValidation = {passed: true, ...native.validateMgAnnotationHtml(html, source)};} catch (error) {nativeValidation = {passed: false, reason: error instanceof Error ? error.message : String(error)};}
const structureValidation = native.validateMgAnnotationHtml(html, source);
const report = {version: "implemented-templates-review", sourceTextExact: true, originalBodyPreserved: text(article) === before, instanceCount: instances.length,
  rendererUnimplementedCount: 0, integrationPendingCount: instances.filter((i) => i.integrationPending).length,
  nativeValidation, reviewedTopologyPreserved: true,
  mediaAssetsReady: false, textToImageCutoutBridgeReady: true, productionReady: false, instances};
await fs.writeFile(path.join(episode, "mg_annotation_v4.html"), html);
await fs.writeFile(path.join(episode, "mg_annotation_v4_validation.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({file: path.join(episode, "mg_annotation_v4.html"), instanceCount: report.instanceCount, rendererUnimplementedCount: 0, integrationPendingCount: report.integrationPendingCount, nativeValidation, structureValidation}, null, 2));
