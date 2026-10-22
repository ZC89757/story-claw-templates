import fs from "node:fs/promises";
import path from "node:path";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const name = "字节跳动的发展与决策_20261015";
const episode = path.join(host, "workspace", name, "ep01");
const source = await fs.readFile(path.join(episode, "原文_clean.txt"), "utf8");
const timeline: {char: string; start: number; end: number}[] = JSON.parse(await fs.readFile(path.join(episode, "article_timeline.json"), "utf8"));
const {stdout} = await promisify(execFile)("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path.join(episode, "ep01_aligned_audio.wav")]);
const audioDuration = Number(stdout.trim());
const clean = (s: string) => s.replace(/\s/g, "");
const sourceTextExact = clean(timeline.map((entry) => entry.char).join("")) === clean(source);
const finalCharacterEnd = Math.max(...timeline.map((entry) => entry.end));
const intervalsValid = timeline.every((entry) => Number.isFinite(entry.start) && Number.isFinite(entry.end) && entry.start >= 0 && entry.end >= entry.start);
const withinAudio = intervalsValid && finalCharacterEnd <= audioDuration + .001;
const report = {sourceTextExact, audioDuration, finalCharacterEnd, endOverrun: finalCharacterEnd - audioDuration, intervalsValid, withinAudio, ready: sourceTextExact && withinAudio};
await fs.writeFile(path.join(root, "out/byte-essay-audio-validation.json"), JSON.stringify(report, null, 2));
if (!report.ready && process.argv.includes("--mark-review")) {
  process.env.STORY_CLAW_WORK_DIR = host;
  const {markStage} = await import(pathToFileURL(path.join(host, "utils/progress.ts")).href);
  await markStage(name, 1, "render", "review");
}
console.log(JSON.stringify(report));
if (!report.ready) process.exitCode = 1;
