/** Render a review sample only. Does not adopt the proposed HTML change. */
import fs from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath, pathToFileURL} from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const runtime = "D:/StoryClawByteDancePreview";
process.env.STORY_CLAW_WORK_DIR = runtime;
process.env.STORY_CLAW_APP_ROOT = host;
process.env.STORY_CLAW_MG_TEMPLATES_DIR = path.join(root, "build/mg-template-pack");
const {saveWebSnapshot, webSnapshotPathForUrl} = await import(pathToFileURL(path.join(host, "tools/web-snapshot.ts")).href);
const {searchWebTool} = await import(pathToFileURL(path.join(host, "tools/search-web.ts")).href);
const url = "http://capital.people.com.cn/n1/2017/0517/c405954-29280552.html";
let html = await fs.readFile(path.join(runtime, "people-subsidy-original.html"), "utf8");
if (!html.includes("未来12个月") || !html.includes("10亿元聚焦补贴小视频内容")) throw new Error("Original source is missing verified text");
// UTF-8 serialization requires the matching charset declaration. Text, layout,
// styles and links are otherwise preserved from the downloaded source.
html = html.replace(/charset\s*=\s*GB2312/gi, "charset=UTF-8").replace(/<head([^>]*)>/i, `<head$1><base href="${url}">`);
const oldPath = webSnapshotPathForUrl(url);
try {await fs.rename(oldPath, `${oldPath}.before-charset-correction`);} catch (error: any) {if (error.code !== "ENOENT") throw error;}
await saveWebSnapshot([url], html);
const result = await searchWebTool.execute("subsidy-correct-charset", {url});
const text = result.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
if (!text.includes("未来12个月") || !text.includes("10亿元")) throw new Error("Host cannot read source correctly");
await fs.writeFile(path.join(runtime, "subsidy-correct-source.txt"), text);
const {loadMgTemplateProvider} = await import(pathToFileURL(path.join(host, "utils/mg-template-runtime.ts")).href);
const provider = await loadMgTemplateProvider();
const {renderVisualTagTemplateClip} = await import(pathToFileURL(path.join(host, "runner/mg/renderer.ts")).href);
const call = provider.resolveCall({name: "create_web_page_focus", timing: {start: 0, end: 8}, arguments: {
  group: "focus", order: null, url, entrance: "fade",
  focus: [{text: "未来12个月", at: 0}, {text: "10亿元聚焦补贴小视频内容", at: 3}],
}});
const output = path.join(runtime, "subsidy-page-proposal.mp4");
await renderVisualTagTemplateClip({novelName: "字节跳动的发展与决策_20261015", sourcePath: path.join(runtime, "workspace/字节跳动的发展与决策_20261015/source"), episode: 1, nextChapter: 1, ethnicity: "自动", aspectRatio: "16:9", imagesOnly: false, articleType: "essay"}, call.instanceKey, call.render, 960, 540, 240, 30, output);
await fs.writeFile(path.join(runtime, "subsidy-page-proposal.json"), JSON.stringify({url, sourceEncoding: "GB2312", snapshotEncoding: "UTF-8", textChanged: false, snapshotHash: createHash("sha256").update(html).digest("hex"), adoptedIntoEpisode: false, output}, null, 2));
console.log(JSON.stringify({output, adoptedIntoEpisode: false}));
