/** Candidate full preview through Story Claw stages with the approved unified H3 backend. */
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const runtime = "D:/StoryClawByteDancePreview";
const name = "字节跳动的发展与决策_20261015";
const project = path.join(runtime, "workspace", name);
const episode = path.join(project, "ep01");
process.env.STORY_CLAW_WORK_DIR = runtime;
process.env.STORY_CLAW_APP_ROOT = host;
process.env.STORY_CLAW_MG_TEMPLATES_DIR = path.join(root, "build/mg-template-pack");
const revision6 = process.argv.includes("--v6");
const htmlFile = revision6 ? "mg_annotation_v6.html" : "mg_annotation_v5.html";
const html = await fs.readFile(path.join(episode, htmlFile), "utf8");
const article = await fs.readFile(path.join(episode, "原文_clean.txt"), "utf8");
const timeline = JSON.parse(await fs.readFile(path.join(episode, "article_timeline.json"), "utf8"));
const {validateMgAnnotationHtml, locateMgInstances} = await import(pathToFileURL(path.join(host, "runner/mg/html.ts")).href);
const validation = validateMgAnnotationHtml(html, article);
const instances = [...locateMgInstances(html, timeline, article).values()];
const {getMediaDuration} = await import(pathToFileURL(path.join(host, "runner/render.ts")).href);
const duration = await getMediaDuration(path.join(episode, "ep01_aligned_audio.wav"));
const anchorsPastAudio = instances.flatMap((instance: any) => instance.tags.flatMap((tag: any) => (tag.valueAnchors ?? []).filter((a: any) => a.start >= duration).map((anchor: any) => ({instance: instance.instanceKey, ...anchor}))));
if (anchorsPastAudio.length) throw new Error(`Deferred timing issue prevents native planning: ${JSON.stringify(anchorsPastAudio)}`);
await fs.writeFile(path.join(episode, "mg_annotation_preview_candidate.html"), html);
await fs.writeFile(path.join(episode, "mg_annotation.html"), html);
const context = JSON.parse(await fs.readFile(path.join(episode, "mg_production_context.json"), "utf8"));
context.mediaSelectionPending = false;
context.approvedMediaChange = "User approved the single 2017 subsidy recap substitution on 2026-10-17; adopted into v5 and the active project HTML.";
context.registeredFootage = {
  "video-footage::full-bleed::01": {source: "byte-douyin-2020-creator-brandfilm.mp4", sourceStart: 74, sourceEnd: 84, note: "2020年大会品牌片；非台上发言。原片脚注截至2020年9月、含火山版DAU；正文8月口径另有已核验报道。"},
  "video-footage::full-bleed::02": {source: "byte-lark-product-demo.mp4", sourceStart: 0, sourceEnd: 17.24, note: "官网现行聊天审批演示；不是2019年发布现场。"},
  "video-footage::full-bleed::03": {source: "byte-doubao-2024-multisubject.mp4", sourceStart: 0, sourceEnd: 9.96, note: "2024年9月模型生成结果示意；不是产品界面或发布会现场。"},
  "video-footage::full-bleed::04": {source: "byte-douyin-2020-creator-brandfilm.mp4", sourceStart: 75.4, sourceEnd: 81, note: "重用已核验的2020年大会品牌片6亿文字片段，非5月补贴事件。"},
};
context.pendingFootage = [];
context.webSources = [
  {order: 1, url: "https://www.bytedance.com/zh/?history=2013", focusText: ["2013年5月", "今日头条获数千万美元B轮融资"], note: "真实官网在大事记中点击融资卡后的归档状态；已用同一search_web读取。"},
  {order: 2, url: "https://www.bytedance.com/zh/?history=2017", focusText: ["2017年5月", "火山小视频宣布10亿元补贴UGC小视频"], note: "真实官网在大事记中点击补贴卡后的归档状态。"},
  {order: 3, url: "https://www.news.cn/world/20250118/855078e1dd7b4acb8c898172f236bfdb/c.html", focusText: ["美国联邦最高法院17日裁定", "要求TikTok母公司字节跳动在270天内将TikTok出售给非中国企业"], note: "新华社2025年1月18日对1月17日裁决的同期报道。只说明本段经营条件，不呈现为法院原站或判断政府主张已获证实。"},
  {order: 4, url: "https://seed.bytedance.com/zh/", focusText: ["探索 AI 产品与服务", "了解由 Seed 模型驱动的多元 AI 服务及应用"], note: "当前官网应用列表；模型/服务名称不得编造。"},
  {order: 5, url: "http://capital.people.com.cn/n1/2017/0517/c405954-29280552.html", focusText: ["未来12个月", "10亿元聚焦补贴小视频内容"], note: "人民网真实报道，原始GB2312正确解码后保存为UTF-8快照；正文未改，8秒正式模板样片已核验。仅预览候选。"},
];
context.scopeDesigns = context.scopeDesigns.map((entry: any) => entry.tag === "video-footage" && entry.order === 4
  ? {...entry, tag: "web-page-focus", group: "focus", order: 5, note: "预览候选采用人民网真实报道聚焦未来12个月和10亿元补贴；外层时间线和正文不变。"}
  : entry.tag === "video-footage" && entry.order === 5 ? {...entry, order: 4} : entry);
context.rules = context.rules.filter((rule: string) => !rule.includes("另四个视频实例尚待核验") && !rule.includes("视频 order1/5"));
context.rules.push("当前候选HTML的video-footage一共4个实例。必须按registeredFootage锁定的相对源名和源时间调用，不从其他素材挑选。旧稿第5个视频在候选稿中已编号为4。",
  "所有web-page-focus仅使用webSources提供的已归档URL。先search_web({url})读取同一正文再逐字选择焦点；官网历史卡已通过真实点击激活并保存，禁止换成首页默认当前年份。",
  "所有图片输入都使用已列出的6张透明PNG，按其真实含义选用。员工、创作者、商家、股东等角色可用人物示意加短标签；功能图若用概念示意必须标签注明示意。不要再次触发远程生图，不能生成假产品UI或假新闻图。",
  "SC Video参考图必须严格复制scVideoReferences对应实例的现有绝对路径，reference_image_state=existing，按当前白名单核对。只让人物手机屏幕和小动作自然运动，镜头稳。",
  "这是可供整片审阅的候选版本，配音累计时间问题仍由用户要求保留待核验；不修改任何音轨或字级时间数据。");
await fs.writeFile(path.join(episode, "mg_production_context_preview.json"), JSON.stringify(context, null, 2));
const report = {validation, duration, anchorsPastAudio, candidateOnly: true, annotationHtml: htmlFile, approvedSingleMediaChangeAdopted: true, originalTimingUnchanged: true, stage: "prepared"};
const reportPath = path.join(runtime, "full-preview-status.json");
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (!process.argv.includes("--run")) process.exit(0);
const sel = {novelName: name, sourcePath: path.join(project, "source"), episode: 1, nextChapter: 1, ethnicity: "自动", aspectRatio: "16:9", imagesOnly: false, articleType: "essay" as const};
const {startGpu, stopGpu} = await import(pathToFileURL(path.join(host, "utils/gpu-lifecycle.ts")).href);
let gpuAttempted = false;
try {
  await fs.writeFile(reportPath, JSON.stringify({...report, stage: "planning-and-rendering-local-clips", requestedBackend: "h3", h3HostIntegrationApproved: true}, null, 2));
  const {planEssayMg} = await import(pathToFileURL(path.join(host, "runner/mg/planner.ts")).href);
  const functionCalls = await fs.readFile(path.join(episode, revision6 ? "mg/codex_parameters_v6.json" : "mg/codex_parameters.json"), "utf8").then(JSON.parse);
  const preparedCandidates = [
    ...await fs.readFile(path.join(episode, "mg/codex-render-checkpoints.json"), "utf8").then(JSON.parse).catch(() => []),
    ...(revision6 ? await fs.readFile(path.join(episode, "mg/codex_prepared_v6.json"), "utf8").then(JSON.parse) : []),
  ];
  const canonical = (value: any): string => JSON.stringify(value, (_key, item) =>
    item && !Array.isArray(item) && typeof item === "object"
      ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
  // Superseded previews stay on disk; only exact current parameters may enter the native cache.
  const preparedClips = preparedCandidates.filter((clip: any) => functionCalls.some((call: any) =>
    call.name === clip.name && canonical(call.arguments) === canonical(clip.arguments)));
  const {searchWebTool} = await import(pathToFileURL(path.join(host, "tools/search-web.ts")).href);
  for (const source of context.webSources) {
    const read = await searchWebTool.execute(`codex-read-${source.order}`, {url: source.url});
    const text = read.content.filter((item: any) => item.type === "text").map((item: any) => item.text).join("\n");
    if (text.startsWith("ERROR:")) throw new Error(`Prepared web source cannot be read: ${source.url}: ${text}`);
  }
  console.log(`[Codex planning] Import ${functionCalls.length} calls and ${preparedClips.length} completed clips; planning API disabled.`);
  await planEssayMg(sel, {functionCalls, preparedClips, planningContext: JSON.stringify(context), beforeGeneratedVideo: async () => {
    const records = JSON.parse(await fs.readFile(path.join(episode, "mg/function_calls.json"), "utf8"));
    const local = records.filter((record: any) => !["sc-video", "sc-longtake"].includes(record.htmlTag));
    await fs.writeFile(reportPath, JSON.stringify({...report, stage: "starting-h3-after-local-clips", localClipsCompleted: local.filter((record: any) => record.status === "completed").length,
      localClipsTotal: local.length, requestedBackend: "h3", h3HostIntegrationApproved: true}, null, 2));
    gpuAttempted = true;
    await startGpu("h3");
    await fs.writeFile(reportPath, JSON.stringify({...report, stage: "generating-h3-clips", localClipsCompleted: local.length, requestedBackend: "h3", warmupPassed: true}, null, 2));
  }});
} catch (error) {
  const records = await fs.readFile(path.join(episode, "mg/function_calls.json"), "utf8").then(JSON.parse).catch(() => []);
  await fs.writeFile(reportPath, JSON.stringify({...report, stage: gpuAttempted ? "h3-generation-blocked" : "local-clips-blocked", completedClips: records.filter((record: any) => record.status === "completed").length,
    requestedBackend: "h3", h3HostIntegrationApproved: true, fullVideoGenerated: false, error: error instanceof Error ? error.message : String(error)}, null, 2));
  throw error;
} finally {if (gpuAttempted) await stopGpu();}
await fs.writeFile(reportPath, JSON.stringify({...report, stage: "assembling"}, null, 2));
const {renderAndAssembleEssayMg} = await import(pathToFileURL(path.join(host, "runner/mg/assembler.ts")).href);
const {finalizeEpisodeMedia} = await import(pathToFileURL(path.join(host, "runner/render.ts")).href);
const {novelPaths} = await import(pathToFileURL(path.join(host, "utils/paths.ts")).href);
await renderAndAssembleEssayMg(sel);
// A newly assembled master must receive its own postprocess pass, including on a visual revision.
await fs.rm(novelPaths.postprocessMarker(name, 1), {force: true});
await finalizeEpisodeMedia(novelPaths.episodeMgRawVideo(name, 1), novelPaths.episodeAlignedAudio(name, 1), novelPaths.episodeVideo(name, 1), novelPaths.globalSubtitlesAss(name, 1));
await fs.writeFile(reportPath, JSON.stringify({...report, stage: "postprocessing"}, null, 2));
const {postprocessEpisodeVideo} = await import(pathToFileURL(path.join(host, "runner/postprocess.ts")).href);
await postprocessEpisodeVideo(sel);
await fs.writeFile(reportPath, JSON.stringify({...report, stage: "rendered-pending-qa", video: novelPaths.episodeVideo(name, 1)}, null, 2));
console.log(`[full-preview] ${novelPaths.episodeVideo(name, 1)}`);
