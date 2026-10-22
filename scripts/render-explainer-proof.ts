import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {bundle} from "@remotion/bundler";
import {renderMedia, renderStill, selectComposition} from "@remotion/renderer";
import {getMgTemplateProvider} from "../src/provider";
import type {MgRuntimeEpisodeInput, MgRuntimeLayer} from "../src/runtime";
import {canvasPreviewArgs, dualAxisPreviewArgs, timelineWindowPreviewSpec} from "../src/explainer-previews";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "out", "explainer-proof");
const publicDir = path.join(output, "public");
await fs.mkdir(publicDir, {recursive: true});
await fs.cp(path.join(root, "public", "subject-expansion"), path.join(publicDir, "subject-expansion"), {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, "runtime", "render-entry.tsx"), publicDir});
const clips = path.join(serveUrl, "public", "clips"); await fs.mkdir(clips, {recursive: true});
const provider = getMgTemplateProvider();
const base = {width: 960, height: 540, fps: 30, durationFrames: 360};
const scene = (layer: MgRuntimeLayer, frames = 360): MgRuntimeEpisodeInput => ({...base, durationFrames: frames, nodes: [{nodeId: "standalone", startFrame: 0, endFrame: frames, videoPath: "", zIndex: 0, render: layer}]});
const media = async (episode: MgRuntimeEpisodeInput, outputLocation: string) => {
  const inputProps = {episode}; const composition = await selectComposition({serveUrl, id: "StoryClawMgEpisode", inputProps});
  await renderMedia({serveUrl, composition, inputProps, codec: "h264", outputLocation, crf: 20, x264Preset: "veryfast", concurrency: 2, logLevel: "warn"});
};
const still = async (episode: MgRuntimeEpisodeInput, frame: number, name: string) => {
  const inputProps = {episode}; const composition = await selectComposition({serveUrl, id: "StoryClawMgEpisode", inputProps});
  const destination = path.join(output, `${name}.png`);
  await renderStill({serveUrl, composition, inputProps, frame, output: destination, imageFormat: "png", logLevel: "warn"});
  return fs.readFile(destination);
};
const table: MgRuntimeLayer = {kind: "timed-table", group: "grid", layerRole: "scene", canvas: "safe", background: "#171c20", spec: {size: {rows: 2, columns: 2}, cells: [{text: "对象", at: 0}, {text: "投入", at: 0}, {text: "创作者", at: 0.1}, {text: "内容生产", at: 0.2}]}};
console.log("[proof] render actual nested child");
await media(scene(table, 45), path.join(clips, "table.mp4"));
const canvas = provider.resolveCall({name: "create_continuous_canvas", arguments: canvasPreviewArgs, timing: {start: 0, end: 12}});
const timeline: MgRuntimeLayer = {kind: "progress-timeline", group: "content-window", layerRole: "scene", canvas: "full", background: "#e8eee8", spec: timelineWindowPreviewSpec};
const results: Record<string, unknown> = {};
for (const [tag, group, layer, key] of [
  ["mg-canvas", "path-follow", canvas.render, canvas.instanceKey],
  ["progress-timeline", "content-window", timeline, "progress-timeline::content-window::one"],
] as const) {
  console.log(`[proof] render formal ${tag}/${group}`);
  const file = `${tag}.mp4`; await media(scene(layer), path.join(clips, file));
  const slots = provider.resolveCompositionSlots({htmlTag: tag, spec: layer.spec, fps: 30, durationFrames: 360});
  if (!slots.some((slot) => slot.openFrame <= 120 && slot.closeFrame >= 165)) throw new Error(`${tag} child outside ready slot`);
  const parent = {nodeId: key, htmlTag: tag, startFrame: 0, endFrame: 360, zIndex: 0, videoPath: `clips/${file}`, layerRole: "scene" as const};
  // Intentionally omit group, like the current host's persisted composition nodes.
  const episode: MgRuntimeEpisodeInput = {...base, nodes: [parent, {nodeId: "table-child", parentNodeId: key, htmlTag: "timed-table", startFrame: 120, endFrame: 165, zIndex: 1, videoPath: "clips/table.mp4", layerRole: "scene"}]};
  await media(episode, path.join(output, `${tag}-nested-window.mp4`));
  await still(episode, 145, `${tag}-during`);
  const after = await still(episode, 240, `${tag}-after`);
  const alone = await still({...base, nodes: [parent]}, 240, `${tag}-parent-only`);
  if (!after.equals(alone)) throw new Error(`${tag} child persists after its own end`);
  results[tag] = {childStart: 120, childEnd: 165, afterFrame: 240, afterExactlyEqualsParent: true};
}
const chart = provider.resolveCall({name: "create_dual_axis_chart", arguments: dualAxisPreviewArgs, timing: {start: 0, end: 12}});
await still({...scene(chart.render), transparentBackground: true}, 240, "dual-axis-alpha");
const pixel = execFileSync("ffmpeg", ["-v", "error", "-i", path.join(output, "dual-axis-alpha.png"), "-vf", "format=rgba,crop=1:1:10:520", "-frames:v", "1", "-f", "rawvideo", "pipe:1"]);
if (pixel[3] !== 0) throw new Error(`outside-chart alpha must be zero, got ${pixel[3]}`);
results.dualAxisOutsideAlpha = pixel[3];
await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(results, null, 2));
console.log(`[proof] PASS: nested children exit; dual-axis outside alpha=0. ${output}`);
