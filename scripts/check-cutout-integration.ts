/** Exercise the installed pack through the existing Story Claw renderer. No host edits. */
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const pack = path.join(root, "build", "mg-template-pack");
const existingImage = process.argv[2];
if (existingImage && !path.isAbsolute(existingImage)) throw new Error("Existing illustration must use an absolute path");
const group = process.argv[3] ?? "progressive";
if (group !== "progressive" && group !== "impact") throw new Error("Group must be progressive or impact");
const duration = existingImage ? 12 : 5;
const existingItemSource = async (name: string) => {
  if (!existingImage) return null;
  const image = path.join(path.dirname(existingImage), name);
  try {await fs.access(image); return {mode: "transparent", image, prompt: null};} catch {return null;}
};
const scratch = process.env.TEMP;
if (!scratch || !path.isAbsolute(scratch)) throw new Error("Set TEMP to an absolute scratch directory");
await fs.mkdir(scratch, {recursive: true});
const before = new Set(await fs.readdir(scratch));
process.env.STORY_CLAW_MG_TEMPLATES_DIR = pack;
const {loadMgTemplateProvider} = await import(pathToFileURL(path.join(host, "utils/mg-template-runtime.ts")).href);
const provider = await loadMgTemplateProvider();
const {renderVisualTagTemplateClip} = await import(pathToFileURL(path.join(host, "runner/mg/renderer.ts")).href);
const timing = {start: 0, end: duration};
const call = provider.resolveCall({name: "create_subject_expansion", timing, arguments: {
  group, order: null,
  subject: {label: "内容平台 · 示意", source: existingImage
    ? {mode: "transparent", image: existingImage, prompt: null}
    : {mode: "generate", image: null, prompt: "一部展示无字短视频缩略卡片的普通智能手机，单个完整物体，轻微三分之四视角，无商标"}},
  items: [{id: "users", label: "使用者", relation: "使用产品", source: await existingItemSource("users.png"), at: 1.5}, {id: "business", label: "商业服务", relation: "连接需求", source: await existingItemSource("merchant.png"), at: existingImage ? 4.5 : 3}],
  highlights: existingImage ? [{targets: ["subject", "users", "business"], note: "在已有用户基础上，连接服务与商业需求", at: 7.5}] : [],
}});
const output = path.join(root, "out", existingImage ? `illustration-proof-${group}` : "cutout-integration");
const videoName = existingImage ? `${group}-transparent-subject.mp4` : "prompt-to-cutout.mp4";
await fs.mkdir(output, {recursive: true});
await renderVisualTagTemplateClip({
  novelName: "字节跳动的发展与决策_20261015", sourcePath: path.join(host, "workspace/字节跳动的发展与决策_20261015/source"),
  episode: 1, nextChapter: 1, ethnicity: "自动", aspectRatio: "16:9", imagesOnly: false, articleType: "essay",
}, call.instanceKey, call.render, 960, 540, duration * 30, 30, path.join(output, videoName));
const folders = (await fs.readdir(scratch)).filter((name) => !before.has(name) && name.startsWith("story-claw-mg-clip-"));
if (folders.length !== 1) throw new Error(`Expected one renderer directory, got ${folders.length}`);
const renderPublic = path.join(scratch, folders[0]);
const spec = call.render.spec as {prepared?: boolean; subject: {image: string}};
if (!spec.prepared || !spec.subject.image.startsWith("assets/")) throw new Error("Rendered spec was not prepared by the pack");
await fs.copyFile(path.join(renderPublic, spec.subject.image), path.join(output, "subject.png"));
const generated = existingImage ? [] : await fs.readdir(path.join(renderPublic, "assets/generated"));
if (!existingImage) {
  if (generated.length !== 1) throw new Error("Expected exactly one generated subject");
  await fs.copyFile(path.join(renderPublic, "assets/generated", generated[0]), path.join(output, "green.png"));
}
const {createRequire} = await import("node:module");
const sharp = createRequire(path.join(host, "package.json"))("sharp");
const {data, info} = await sharp(path.join(output, "subject.png")).ensureAlpha().raw().toBuffer({resolveWithObject: true});
let visible = 0, transparent = 0, border = 0, transparentBorder = 0;
for (let i = 0; i < info.width * info.height; i++) {
  const alpha = data[i * info.channels + 3];
  if (alpha >= 16) visible++; else transparent++;
  const x = i % info.width, y = Math.floor(i / info.width);
  if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) {border++; if (alpha < 16) transparentBorder++;}
}
if (visible === 0 || transparent === 0 || transparentBorder / border < .55) throw new Error("Cutout alpha validation failed");
const report = {pack, protocolVersion: provider.protocolVersion, group, duration, usedExistingHostCallbacks: true,
  promptOnlyInput: !existingImage, existingTransparentSource: existingImage ?? null, generatedSubjects: generated.length, prepared: spec.prepared,
  width: info.width, height: info.height, transparentBorderRatio: transparentBorder / border,
  transparentPixelRatio: transparent / (info.width * info.height), video: path.join(output, videoName)};
await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
