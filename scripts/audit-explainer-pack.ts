import fs from "node:fs/promises";
import path from "node:path";
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {fileURLToPath, pathToFileURL} from "node:url";
import {fileSha256, payloadFingerprint} from "./pack-receipt.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const pack = path.join(root, "build/mg-template-pack");
const manifest = JSON.parse(await fs.readFile(path.join(pack, "manifest.json"), "utf8"));
const {getMgTemplateProvider} = await import(pathToFileURL(path.join(pack, manifest.provider)).href);
const provider = getMgTemplateProvider();
const parse5 = createRequire(path.join(host, "package.json"))("parse5");
const episode = path.join(host, "workspace/字节跳动的发展与决策_20261015/ep01");
const annotationFile = "mg_annotation_v6.html";
const document = parse5.parse(await fs.readFile(path.join(episode, annotationFile), "utf8"));
const instances: {tag: string; group: string; supported: boolean; functions: string[]}[] = [];
let body = "";
const visit = (node: any, insideArticle = false) => {
  const inside = insideArticle || node.tagName === "article";
  if (inside && node.nodeName === "#text") body += node.value;
  if (inside && node.tagName) {
    const attrs = Object.fromEntries((node.attrs ?? []).map((a: any) => [a.name, a.value]));
    if (attrs.group) instances.push({tag: node.tagName, group: attrs.group, supported: provider.supportsGroup(node.tagName, attrs.group), functions: provider.getPlanningTools([node.tagName]).map((tool: any) => tool.name)});
  }
  for (const child of node.childNodes ?? []) visit(child, inside);
}; visit(document);
const original = await fs.readFile(path.join(episode, "原文_clean.txt"), "utf8");
process.env.STORY_CLAW_MG_TEMPLATES_DIR = pack;
const {validateMgAnnotationHtml} = await import(pathToFileURL(path.join(host, "runner/mg/html.ts")).href);
const nativeValidation = validateMgAnnotationHtml(await fs.readFile(path.join(episode, annotationFile), "utf8"), original);
const sourceTextExact = body.replace(/\s/g, "") === original.replace(/\s/g, "");
const unknown = instances.filter((instance) => !instance.supported);
const functionsMissing = instances.filter((instance) => !["sc-video", "sc-longtake"].includes(instance.tag) && !instance.functions.length);
if (!sourceTextExact || unknown.length || functionsMissing.length) throw new Error(JSON.stringify({sourceTextExact, unknown, functionsMissing}));
await fs.access(fileURLToPath(provider.runtimeEntryUrl));
const styleReference = await fs.readFile(path.join(pack, "public/subject-expansion/style-reference.png"));
if (!styleReference.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("Generation style board must be a genuine PNG");
const installer = path.join(process.env.MG_TEMPLATE_RELEASE_DIR?.trim() || path.join(root, "release"), `Story-Claw-MG-Template-Pack-Setup-${manifest.version}.exe`);
const installerInfo = await fs.stat(installer);
if (installerInfo.size < 1_000_000) throw new Error("Installer is incomplete");
const receipt = JSON.parse(await fs.readFile(`${installer}.receipt.json`, "utf8"));
const installerHash = await fileSha256(installer);
const payloadHash = await payloadFingerprint(pack);
if (receipt.compilerExitCode !== 0 || receipt.version !== manifest.version || receipt.installerBytes !== installerInfo.size
  || receipt.installerSha256 !== installerHash || receipt.payload.sha256 !== payloadHash.sha256
  || receipt.payload.files !== payloadHash.files) throw new Error("Completed installer receipt does not match this payload");
const baseline: {path: string; hash: string}[] = JSON.parse((await fs.readFile(path.join(root, "out/continuation-host-baseline.json"), "utf8")).replace(/^\uFEFF/, ""));
const changedHostSources: string[] = [];
for (const file of baseline) {
  const hash = createHash("sha256").update(await fs.readFile(file.path)).digest("hex").toUpperCase();
  if (hash !== file.hash) changedHostSources.push(file.path);
}
if (changedHostSources.length) throw new Error(`Host source changed during this continuation: ${changedHostSources.join(", ")}`);
const runtimeEpisode = "D:/StoryClawByteDancePreview/workspace/字节跳动的发展与决策_20261015/ep01";
const records: any[] = JSON.parse(await fs.readFile(path.join(runtimeEpisode, "mg/function_calls.json"), "utf8"));
const calls = JSON.parse(await fs.readFile(path.join(runtimeEpisode, "mg/codex_parameters_v6.json"), "utf8"));
const timeline = JSON.parse(await fs.readFile(path.join(runtimeEpisode, "article_timeline.json"), "utf8"));
const {locateMgInstances} = await import(pathToFileURL(path.join(host, "runner/mg/html.ts")).href);
const {validateProvidedMgCalls} = await import(pathToFileURL(path.join(host, "runner/mg/planner.ts")).href);
validateProvidedMgCalls(calls, locateMgInstances(await fs.readFile(path.join(episode, annotationFile), "utf8"), timeline, original), {width: 1280, height: 720, fps: 24, duration: 840.672018, durationFrames: 20177});
const missingClips = records.filter(record => record.status !== "completed").map(record => record.instanceKey);
const report = {version: manifest.version, protocolVersion: provider.protocolVersion, workingTreeDirty: manifest.workingTreeDirty,
  installer, installerBytes: installerInfo.size, installerSha256: installerHash, payloadFingerprint: payloadHash, receiptVerified: true,
  annotationFile, reviewedInstances: instances.length, validatedFunctionCalls: calls.length, sourceTextExact, unknownTemplateGroups: unknown, missingFunctions: functionsMissing,
  nativeValidation,
  hostBaselineScope: "start of this continuation", hostSourcesChecked: baseline.length, changedHostSources,
  pieFunction: provider.getPlanningTools(["part-whole-chart"])[0].name,
  dualAxisFunction: provider.getPlanningTools(["dual-axis-chart"])[0].name,
  genericTopologyHostIntegration: "implemented and tested; user approved; not committed",
  imageGenerationFallback: "Codex built-in imagegen produced six transparent illustrations and two scene references",
  templateImageGeneration: "prompt-only sources use the package's PNG style board and existing protocol-4 generation/cutout callbacks; no new host interface",
  audioTiming: "user explicitly deferred correction; preserve review status",
  completedClips: records.length - missingClips.length, missingClips,
  remainingGates: [...(missingClips.length ? ["H3 generated clips remain pending"] : []), "full episode assembly and playback review"],
  productionReady: false};
await fs.writeFile(path.join(root, "out/explainer-pack-audit.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
