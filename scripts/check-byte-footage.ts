import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {getMgTemplateProvider} from "../src/provider";
import {scanVideoFootageLibrary} from "../src/video-footage/library";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const episode = path.join(host, "workspace/字节跳动的发展与决策_20261015/ep01");
process.env.STORY_CLAW_MG_TEMPLATES_DIR = root;
const {locateMgInstances} = await import(pathToFileURL(path.join(host, "runner/mg/html.ts")).href);
const [html, timeline, article] = await Promise.all([
  fs.readFile(path.join(episode, "mg_annotation_v4.html"), "utf8"),
  fs.readFile(path.join(episode, "article_timeline.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(episode, "原文_clean.txt"), "utf8"),
]);
const instances = locateMgInstances(html, timeline, article);
const provider = getMgTemplateProvider();
const library = scanVideoFootageLibrary();
const selections = [
  {order: 1, source: "byte-douyin-2020-creator-brandfilm.mp4", sourceStart: 74, sourceEnd: 84},
  {order: 2, source: "byte-lark-product-demo.mp4", sourceStart: 0, sourceEnd: 17.24},
  {order: 3, source: "byte-doubao-2024-multisubject.mp4", sourceStart: 0, sourceEnd: 9.96},
  {order: 5, source: "byte-douyin-2020-creator-brandfilm.mp4", sourceStart: 75.4, sourceEnd: 81},
];
const verified = selections.map(({order, source, sourceStart, sourceEnd}) => {
  const target = [...instances.values()].find((instance: any) => instance.tag === "video-footage" && instance.group === "full-bleed" && instance.order === order);
  if (!target) throw new Error(`Video instance ${order} was not found`);
  const timing = {start: target.tags[0].start, end: target.tags.at(-1)!.end};
  if (!library.assets.some((asset) => asset.source === source)) throw new Error(`Source is not selectable: ${source}`);
  provider.resolveCall({name: "use_video_footage", timing, arguments: {group: "full-bleed", order, source, sourceStart, sourceEnd}});
  return {instance: target.instanceKey, timing, requiredSeconds: timing.end - timing.start, source, sourceStart, sourceEnd, validForFullAnnotationWindow: true};
});
const report = {verified,
  missingHistoricalInstances: [...instances.values()].filter((instance: any) => instance.tag === "video-footage" && !selections.some(({order}) => order === instance.order)).map((instance: any) => instance.instanceKey),
  note: "The four new source files are included in installer 0.1.1-preview.20261017.3; the 2017 subsidy recap still has a separate news-page candidate."};
await fs.writeFile(path.join(root, "out/byte-footage-validation.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
