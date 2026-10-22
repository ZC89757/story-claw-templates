import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {writePackReceipt} from "./pack-receipt.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const payloadRoot = path.join(projectRoot, "build", "mg-template-pack");
const scriptPath = path.join(projectRoot, "packaging", "mg-template-pack.nsi");
const manifestPath = path.join(payloadRoot, "manifest.json");
if (!fs.existsSync(manifestPath)) throw new Error("模板包 payload 不存在，请先运行 npm run build:pack");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const packVersion = String(manifest.version || "0.0.0");
const releaseRoot = process.env.MG_TEMPLATE_RELEASE_DIR?.trim()
  ? path.resolve(process.env.MG_TEMPLATE_RELEASE_DIR.trim())
  : path.join(projectRoot, "release");
const outputPath = path.join(releaseRoot, `Story-Claw-MG-Template-Pack-Setup-${packVersion}.exe`);
const pendingOutputPath = `${outputPath}.building.exe`;

const findRecursive = (root, fileName) => {
  if (!root || !fs.existsSync(root)) return null;
  const pending = [root];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, {withFileTypes: true})) {
      const candidate = path.join(current, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) return candidate;
      if (entry.isDirectory()) pending.push(candidate);
    }
  }
  return null;
};

const fromPath = spawnSync(process.platform === "win32" ? "where.exe" : "which", ["makensis"], {encoding: "utf8"});
const cacheRoot = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "electron-builder", "Cache")
  : "";
const candidates = [
  process.env.MAKENSIS?.trim(),
  fromPath.status === 0 ? fromPath.stdout.split(/\r?\n/).find(Boolean)?.trim() : "",
  process.env["ProgramFiles(x86)"] ? path.join(process.env["ProgramFiles(x86)"], "NSIS", "makensis.exe") : "",
  process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "NSIS", "makensis.exe") : "",
  findRecursive(cacheRoot, "makensis.exe"),
].filter(Boolean);
const makensis = candidates.find((candidate) => fs.existsSync(candidate));

if (!makensis) {
  throw new Error("找不到 makensis。请先安装 NSIS，或通过 MAKENSIS 环境变量指定 makensis.exe。" );
}
fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.rmSync(pendingOutputPath, {force: true});
const result = spawnSync(makensis, [
  `/DPAYLOAD_DIR=${payloadRoot}`,
  `/DOUTPUT_FILE=${pendingOutputPath}`,
  `/DPACK_VERSION=${packVersion}`,
  scriptPath,
], {stdio: "inherit"});
if (result.status !== 0) throw new Error(`makensis 失败，退出码 ${String(result.status)}`);
fs.renameSync(pendingOutputPath, outputPath);
await writePackReceipt({installer: outputPath, payloadRoot, compilerExitCode: result.status});
console.log(`[template-pack] installer: ${outputPath}`);
