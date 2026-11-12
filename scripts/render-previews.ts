import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";
import {MG_STYLE_CATALOG} from "../src/catalog-data.js";
import {referenceDemoFiles} from "../src/portrait-mg/reference-scene";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "mg-previews");
const manifestPath = path.join(outputDir, "manifest.json");
const entryPoint = path.join(root, "runtime", "preview-entry.tsx");
const force = process.argv.includes("--force");
const checkOnly = process.argv.includes("--check");
const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="))?.slice("--concurrency=".length);
const portraitConcurrency = concurrencyArg === undefined ? 2 : Number(concurrencyArg);
if (!Number.isInteger(portraitConcurrency) || portraitConcurrency < 1 || portraitConcurrency > 8) throw new Error("--concurrency must be an integer from 1 to 8");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length)
  ?? (() => {
    const index = process.argv.indexOf("--only");
    return index >= 0 ? process.argv[index + 1] : undefined;
  })();

const walk = async (directory: string, allFiles = false): Promise<string[]> => {
  // 目录可能不存在（例如旧展示稿已从仓库移除），此时按空集合处理。
  try { await fs.access(directory); } catch { return []; }
  const entries = await fs.readdir(directory, {withFileTypes: true});
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath, allFiles));
    else if (allFiles || /\.(?:ts|tsx|js|json|py)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
};

const externalPortraitFixtures = referenceDemoFiles.filter(file => !file.startsWith("portrait-mg/"));
const sourceFiles = [
  ...externalPortraitFixtures.map(file => path.join(root, "public", file)),
  ...(await walk(path.join(root, "src"))),
  ...(await walk(path.join(root, "examples"))),
  ...(await walk(path.join(root, "public", "portrait-mg"), true)),
  path.join(root, "runtime", "preview-entry.tsx"),
].sort();
const hash = crypto.createHash("sha256");
for (const filePath of sourceFiles) {
  hash.update(path.relative(root, filePath).replaceAll(path.sep, "/"));
  hash.update("\0");
  hash.update(await fs.readFile(filePath));
  hash.update("\0");
}
const sourceHash = hash.digest("hex");
const expectedFiles = MG_STYLE_CATALOG.map((item) => `${item.template}-${item.style}.mp4`);
const onlyNames = onlyArg
  ? new Set(onlyArg.split(",").map((name) => name.trim()).filter(Boolean))
  : null;
const renderItems = onlyNames
  ? MG_STYLE_CATALOG.filter((item) => {
    const fileName = `${item.template}-${item.style}.mp4`;
    return onlyNames.has(fileName)
      || (onlyNames.has("portrait-mg") && item.previewKind.startsWith("portrait-"))
      || onlyNames.has(`${item.template}:${item.style}`)
      || onlyNames.has(item.style);
  })
  : MG_STYLE_CATALOG;
if (onlyNames && renderItems.length === 0) {
  throw new Error(`--only 没有匹配到样式：${[...onlyNames].join(", ")}`);
}
let manifest: {sourceHash?: string; previews?: Record<string, string>} | null = null;
try {
  manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
} catch {
  // Missing manifest means previews need generation.
}
const requiredFiles = onlyNames
  ? expectedFiles.filter((fileName) => renderItems.some((item) => `${item.template}-${item.style}.mp4` === fileName))
  : expectedFiles;
const missingFiles: string[] = [];
for (const fileName of requiredFiles) {
  try { await fs.access(path.join(outputDir, fileName)); }
  catch { missingFiles.push(fileName); }
}
const staleEntries = requiredFiles.filter((fileName) => manifest?.previews?.[fileName] !== sourceHash);
const stale = force || missingFiles.length > 0 || staleEntries.length > 0;
if (checkOnly) {
  if (stale) {
    console.error(`[preview] stale or incomplete (hash=${sourceHash}, missing=${missingFiles.length}, stale=${staleEntries.length})`);
    process.exitCode = 1;
  } else {
    console.log(`[preview] up to date (hash=${sourceHash}${onlyNames ? ", selected" : ""})`);
  }
} else if (!stale) {
  console.log(`[preview] up to date (hash=${sourceHash}${onlyNames ? ", selected" : ""}); use --force to regenerate`);
} else {
  await fs.mkdir(outputDir, {recursive: true});
  console.log(`[preview] source changed or files missing; rendering ${renderItems.length}${onlyNames ? " selected" : ""} previews`);
  // A portrait-only pass must not copy the unrelated multi-gigabyte footage library.
  let bundlePublicDir = path.join(root, "public");
  if (renderItems.every((item) => item.previewKind.startsWith("portrait-"))) {
    bundlePublicDir = path.join(root, "scratch", "portrait-mg", "preview-public");
    await fs.mkdir(bundlePublicDir, {recursive:true});
    await fs.cp(path.join(root,"public","portrait-mg"), path.join(bundlePublicDir,"portrait-mg"), {recursive:true});
    for (const file of externalPortraitFixtures) {
      const target = path.join(bundlePublicDir, file);
      await fs.mkdir(path.dirname(target), {recursive:true});
      await fs.copyFile(path.join(root, "public", file), target);
    }
  }
  const serveUrl = await bundle({
    entryPoint,
    publicDir: bundlePublicDir,
    onProgress: (progress) => {
      if (progress === 1 || Math.round(progress * 100) % 20 === 0) console.log(`[preview] bundle ${Math.round(progress * 100)}%`);
    },
  });
  for (const item of renderItems) {
    const fileName = `${item.template}-${item.style}.mp4`;
    const outputPath = path.join(outputDir, fileName);
    const inputProps = {previewKind: item.previewKind, style: item.style};
    const composition = await selectComposition({serveUrl, id: "MgStylePreview", inputProps});
    console.log(`[preview] render ${fileName}`);
    await renderMedia({
      composition,
      serveUrl,
      inputProps,
      codec: "h264",
      outputLocation: outputPath,
      crf: 20,
      x264Preset: "veryfast",
      pixelFormat: "yuv420p",
      concurrency: renderItems.every((candidate) => candidate.previewKind.startsWith("portrait-")) ? portraitConcurrency : undefined,
      logLevel: "warn",
    });
  }
  const previews = {...(manifest?.previews ?? {})};
  for (const item of renderItems) previews[`${item.template}-${item.style}.mp4`] = sourceHash;
  await fs.writeFile(manifestPath, `${JSON.stringify({version: 1, sourceHash, generatedAt: new Date().toISOString(), files: sourceFiles.map((filePath) => path.relative(root, filePath).replaceAll(path.sep, "/")), previews}, null, 2)}\n`, "utf8");
  console.log(`[preview] complete: ${renderItems.length} styles${onlyNames ? " (selected)" : ""} (hash=${sourceHash})`);
}
