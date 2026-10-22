import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {renderMedia, renderStill, selectComposition} from "@remotion/renderer";
import {getMgTemplateProvider} from "../src/provider";
import type {MgRuntimeEpisodeInput, MgRuntimeLayer} from "../src/runtime";
import {subjectExpansionOverseasArgs} from "../examples/subject-expansion";

// Production-renderer proof, with a real rendered child clip and independent lifetime.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "out", "subject-expansion-proof");
const publicDir = path.join(output, "public");
await fs.mkdir(publicDir, {recursive: true});
await fs.cp(path.join(root, "public", "subject-expansion"), path.join(publicDir, "subject-expansion"), {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, "runtime", "render-entry.tsx"), publicDir});
await fs.mkdir(path.join(serveUrl, "public", "clips"), {recursive: true});
const provider = getMgTemplateProvider();
const parent = provider.resolveCall({name: "create_subject_expansion", arguments: subjectExpansionOverseasArgs, timing: {start: 0, end: 18}});
const base = {width: 960, height: 540, fps: 30, durationFrames: 540};
const makeScene = (render: MgRuntimeLayer, durationFrames: number): MgRuntimeEpisodeInput => ({...base, durationFrames, nodes: [{nodeId: "standalone", startFrame: 0, endFrame: durationFrames, zIndex: 0, videoPath: "", render}]});
const render = async (episode: MgRuntimeEpisodeInput, destination: string) => {
  const inputProps = {episode};
  const composition = await selectComposition({serveUrl, id: "StoryClawMgEpisode", inputProps});
  await renderMedia({serveUrl, composition, inputProps, outputLocation: destination, codec: "h264", crf: 18, x264Preset: "veryfast", logLevel: "warn"});
};
console.log("[proof] rendering formal subject component");
await render(makeScene(parent.render, 540), path.join(serveUrl, "public", "clips", "parent.mp4"));
const table: MgRuntimeLayer = {
  kind: "timed-table", group: "grid", canvas: "safe", background: "#171c20", layerRole: "scene",
  spec: {size: {rows: 3, columns: 2}, cells: [
    {at: 0, text: "本地合规"}, {at: 0.2, text: "持续投入"},
    {at: 0.6, text: "法律争议"}, {at: 0.8, text: "应对成本"},
    {at: 1.2, text: "业务调整"}, {at: 1.4, text: "经营成本"},
  ]},
};
console.log("[proof] rendering a four-second child clip");
await render(makeScene(table, 120), path.join(serveUrl, "public", "clips", "child.mp4"));
const episode: MgRuntimeEpisodeInput = {...base, nodes: [
  {nodeId: "parent", htmlTag: "subject-expansion", startFrame: 0, endFrame: 540, zIndex: 0, videoPath: "clips/parent.mp4", layerRole: "scene"},
  {nodeId: "child", parentNodeId: "parent", htmlTag: "timed-table", startFrame: 180, endFrame: 300, zIndex: 1, videoPath: "clips/child.mp4", layerRole: "scene", compositionWindows: [{startFrame: 0, endFrame: 120}], compositionSlotId: "evidence"},
]};
console.log("[proof] composing parent with child only at 6-10 seconds");
await render(episode, path.join(output, "overseas-with-window.mp4"));
const still = async (value: MgRuntimeEpisodeInput, frame: number, name: string) => {
  const inputProps = {episode: value};
  const composition = await selectComposition({serveUrl, id: "StoryClawMgEpisode", inputProps});
  const destination = path.join(output, `${name}.png`);
  await renderStill({serveUrl, composition, inputProps, frame, output: destination, imageFormat: "png", logLevel: "warn"});
  return fs.readFile(destination);
};
await still(episode, 240, "during-child");
const after = await still(episode, 360, "after-child");
const parentOnly = await still({...base, nodes: [episode.nodes![0]]}, 360, "parent-at-same-frame");
if (!after.equals(parentOnly)) throw new Error("Child exit check failed: frame differs from parent-only rendering");
await fs.writeFile(path.join(output, "verification.json"), JSON.stringify({runtimeEntry: "runtime/render-entry.tsx", fps: 30, durationFrames: 540, childWindowFrames: [180, 300], afterChildFrame: 360, afterEqualsParent: true}, null, 2));
console.log(`[proof] PASS: child exits at 10s; frame 360 exactly equals parent-only. ${output}`);
