/** Prepare a separate D: production workspace; never change host source or source audio. */
import fs from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath, pathToFileURL} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const runtime = "D:/StoryClawByteDancePreview";
const name = "字节跳动的发展与决策_20261015";
const original = path.join(host, "workspace", name);
const project = path.join(runtime, "workspace", name);
await fs.mkdir(path.dirname(project), {recursive: true});
await fs.cp(original, project, {recursive: true, force: false, errorOnExist: false});
const episode = path.join(project, "ep01");
const sourceEpisode = path.join(original, "ep01");
// Update only production context, never the voice track or word timestamps.
const context = JSON.parse(await fs.readFile(path.join(sourceEpisode, "mg_production_context.json"), "utf8"));
const rewrite = (value: any): any => typeof value === "string"
  ? value.replaceAll(original, project).replaceAll(original.replaceAll("\\", "/"), project.replaceAll("\\", "/"))
  : Array.isArray(value) ? value.map(rewrite)
  : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child)]))
  : value;
await fs.writeFile(path.join(episode, "mg_production_context.json"), JSON.stringify(rewrite(context), null, 2));
const audio = "ep01_aligned_audio.wav";
const sha = async (file: string) => createHash("sha256").update(await fs.readFile(file)).digest("hex");
const originalAudioHash = await sha(path.join(sourceEpisode, audio));
if (originalAudioHash !== await sha(path.join(episode, audio))) throw new Error("Audio copy differs");
await fs.writeFile(path.join(runtime, "production-review.json"), JSON.stringify({
  sourceProject: original, runtimeProject: project, audioHash: originalAudioHash,
  timingCorrection: "Explicitly deferred by user; original audio and timeline unchanged",
  videoStatus: "not generated", activeHtmlStatus: "not adopted; remaining media choice pending",
}, null, 2));

process.env.STORY_CLAW_WORK_DIR = runtime;
process.env.STORY_CLAW_APP_ROOT = host;
const {searchWebTool} = await import(pathToFileURL(path.join(host, "tools/search-web.ts")).href);
const pages = [
  {key: "bytedance-history", url: "https://www.bytedance.com/zh/"},
  {key: "seed-models", url: "https://seed.bytedance.com/zh/"},
  {key: "subsidy-report", url: "https://capital.people.com.cn/n1/2017/0517/c405954-29280552.html"},
  {key: "court-opinion", url: "https://www.law.cornell.edu/supremecourt/text/24-656"},
];
const directory = path.join(episode, "assets", "source-texts");
await fs.mkdir(directory, {recursive: true});
const results = await Promise.all(pages.map(async ({key, url}) => {
  const result = await searchWebTool.execute(`prepare-${key}`, {url});
  const text = result.content.filter((item: any) => item.type === "text").map((item: any) => item.text).join("\n");
  await fs.writeFile(path.join(directory, `${key}.txt`), text);
  const ok = !text.startsWith("ERROR:");
  console.log(JSON.stringify({key, ok, characters: text.length, error: ok ? undefined : text}));
  return {key, url, ok, characters: text.length};
}));
await fs.writeFile(path.join(root, "out/byte-runtime-preparation.json"), JSON.stringify({runtime, project, originalAudioHash, pages: results}, null, 2));
