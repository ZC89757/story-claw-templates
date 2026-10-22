/** Adopt the user's single approved footage-to-web-page substitution. */
import fs from "node:fs/promises";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath, pathToFileURL} from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const originalEpisode = path.join(host, "workspace/字节跳动的发展与决策_20261015/ep01");
const runtimeEpisode = "D:/StoryClawByteDancePreview/workspace/字节跳动的发展与决策_20261015/ep01";
process.env.STORY_CLAW_MG_TEMPLATES_DIR = path.join(root, "build/mg-template-pack");
const parse5 = createRequire(path.join(host, "package.json"))("parse5");
const native = await import(pathToFileURL(path.join(host, "runner/mg/html.ts")).href);
const source = await fs.readFile(path.join(originalEpisode, "原文_clean.txt"), "utf8");
const old = await fs.readFile(path.join(originalEpisode, "mg_annotation_v4.html"), "utf8");
const oldReport = JSON.parse(await fs.readFile(path.join(originalEpisode, "mg_annotation_v4_validation.json"), "utf8"));
const document = parse5.parse(old);
const nodes: any[] = [];
const visit = (node: any) => {if (node.tagName) nodes.push(node); for (const child of node.childNodes ?? []) visit(child);}; visit(document);
const attr = (node: any, name: string) => node.attrs.find((a: any) => a.name === name)?.value;
const set = (node: any, name: string, value: string) => {node.attrs = node.attrs.filter((a: any) => a.name !== name); node.attrs.push({name, value});};
const text = (node: any): string => node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(text).join("");
const article = nodes.find((node) => node.tagName === "article");
const before = text(article);
const mgNodes = nodes.filter((node) => attr(node, "group"));
const notes = new Map(mgNodes.map((node) => [node, oldReport.instances.find((entry: any) => entry.tag === node.tagName && entry.group === attr(node, "group") && String(entry.order ?? "") === String(attr(node, "order") ?? ""))?.note ?? "按正文语义展开。"]));
const target = mgNodes.find((node) => node.tagName === "video-footage" && attr(node, "order") === "4");
if (!target) throw new Error("Approved subsidy instance is missing");
target.tagName = target.nodeName = "web-page-focus"; set(target, "group", "focus");
notes.set(target, "2017节点窗口：采用人民网2017年5月17日报道，聚焦“未来12个月”“10亿元聚焦补贴小视频内容”。只表示宣布的补贴计划，不能写成实际支出。网页按本句自己的时段出现，外层时间线保持。此替换已获用户同意。");
for (const tag of ["video-footage", "web-page-focus"]) mgNodes.filter((node) => node.tagName === tag).forEach((node, index) => set(node, "order", String(index + 1)));
if (before !== text(article) || before.replace(/\s/g, "") !== source.replace(/\s/g, "")) throw new Error("Article text changed");
let html = native.decorateMgAnnotationHtml(parse5.serialize(document));
const scope = `:is(${[...new Set(mgNodes.map((node) => node.tagName))].join(",")})`;
const cssText = (value: string) => JSON.stringify(value).replace(/\\n/g, "\\A ");
const rules = [
  "article mg-canvas,article subject-expansion{--mg-accent:#7651b5;--mg-fill:#f1eafd;}",
  `article ${scope}{cursor:help;text-decoration-line:none;border-bottom:2px solid var(--mg-accent);padding-bottom:3px;} article ${scope} ${scope}{padding-bottom:0;}`,
  `article ${scope}:hover:not(:has(${scope}:hover))::after{position:fixed;right:20px;top:20px;z-index:9999;width:min(460px,calc(100vw - 72px));padding:16px 18px;border:1px solid #c7cfd7;border-radius:7px;background:#fff;color:#20262c;box-shadow:0 8px 28px #0002;font:14px/1.8 "Microsoft YaHei",sans-serif;white-space:pre-line;pointer-events:none;text-decoration:none;}`,
  ...mgNodes.map((node) => {
    const selector = `article ${node.tagName}[group="${attr(node, "group")}"]${attr(node, "order") ? `[order="${attr(node, "order")}"]` : ":not([order])"}`;
    return `${selector}:hover:not(:has(${scope}:hover))::after{content:${cssText(`模板已实现／已复用\n${notes.get(node)}`)};}`;
  }),
].join("\n");
html = html.replace("</style>", `${rules}\n</style>`);
const validation = native.validateMgAnnotationHtml(html, source);
const report = {version: "approved-media-v5", sourceTextExact: true, ...validation, approvedChange: {from: "video-footage::full-bleed::04", to: "web-page-focus::focus::05", description: notes.get(target)}, sourceAssetsReady: true, generatedScVideoReady: false, audioTimingCorrection: "deferred by user; unchanged", requestedVideoBackend: "h3", hostH3Integration: "requires consent; current essay path remains LTX", productionReady: false,
  instances: mgNodes.map((node) => ({tag: node.tagName, group: attr(node, "group"), order: attr(node, "order") ? Number(attr(node, "order")) : null, note: notes.get(node)}))};
for (const episode of [originalEpisode, runtimeEpisode]) {
  const active = path.join(episode, "mg_annotation.html");
  const backup = path.join(episode, "mg_annotation.before-approved-v5.html");
  try {await fs.copyFile(active, backup, fs.constants.COPYFILE_EXCL);} catch (error: any) {if (error.code !== "EEXIST") throw error;}
  await fs.writeFile(path.join(episode, "mg_annotation_v5.html"), html);
  await fs.writeFile(active, html);
  await fs.writeFile(path.join(episode, "mg_annotation_v5_validation.json"), JSON.stringify(report, null, 2));
}
const evidencePath = path.join(originalEpisode, "production_sources.json");
const evidence = JSON.parse(await fs.readFile(evidencePath, "utf8"));
evidence.reviewHtml = "mg_annotation_v5.html";
evidence.userDecisions.fourHistoricalFootageReplacements = "approved only the 2017 subsidy recap; adopted in v5";
evidence.userDecisions.videoBackend = "user requested H3; current story route uses H3, essay MG route still LTX; host adaptation proposal pending";
await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({html: path.join(originalEpisode, "mg_annotation_v5.html"), validation, sourceTextExact: true, approvedOnlyOneVisualSubstitution: true}));
