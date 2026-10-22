/** Prepare an independent production stage using Story Claw's existing API. */
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(templateRoot, "../story-claw");
process.env.STORY_CLAW_WORK_DIR = host;
process.env.STORY_CLAW_MG_TEMPLATES_DIR = path.join(templateRoot, "build/mg-template-pack");
const {prepareEssayAudioTimeline} = await import(pathToFileURL(path.join(host, "runner/render.ts")).href);
const {markStage} = await import(pathToFileURL(path.join(host, "utils/progress.ts")).href);
const name = "字节跳动的发展与决策_20261015";
const result = await prepareEssayAudioTimeline({novelName: name, sourcePath: path.join(host, "workspace", name, "source"),
  episode: 1, nextChapter: 1, ethnicity: "自动", aspectRatio: "16:9", imagesOnly: false, articleType: "essay"});
await fs.writeFile(path.join(templateRoot, "out/byte-essay-audio-result.json"), JSON.stringify(result, null, 2));
await import("./check-essay-audio");
const validation = JSON.parse(await fs.readFile(path.join(templateRoot, "out/byte-essay-audio-validation.json"), "utf8"));
await markStage(name, 1, "render", validation.ready ? "done" : "review", {invalidateStages: ["mgPlan", "mgRender", "finalize"]});
console.log(JSON.stringify(result));
