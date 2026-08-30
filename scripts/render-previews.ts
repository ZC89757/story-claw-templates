import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";
import {MG_STYLE_CATALOG} from "../src/catalog-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "mg-previews");
const manifestPath = path.join(outputDir, "manifest.json");
const entryPoint = path.join(root, "runtime", "preview-entry.tsx");
const force = process.argv.includes("--force");
const checkOnly = process.argv.includes("--check");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length)
  ?? (() => {
    const index = process.argv.indexOf("--only");
    return index >= 0 ? process.argv[index + 1] : undefined;
  })();

const walk = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, {withFileTypes: true});
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (/\.(?:ts|tsx|js|json)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
};

const sourceFiles = [
  ...(await walk(path.join(root, "src"))),
  ...(await walk(path.join(root, "examples"))),
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
  const serveUrl = await bundle({
    entryPoint,
    publicDir: path.join(root, "public"),
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
      logLevel: "warn",
    });
  }
  const previews = {...(manifest?.previews ?? {})};
  for (const item of renderItems) previews[`${item.template}-${item.style}.mp4`] = sourceHash;
  await fs.writeFile(manifestPath, `${JSON.stringify({version: 1, sourceHash, generatedAt: new Date().toISOString(), files: sourceFiles.map((filePath) => path.relative(root, filePath).replaceAll(path.sep, "/")), previews}, null, 2)}\n`, "utf8");
  console.log(`[preview] complete: ${renderItems.length} styles${onlyNames ? " (selected)" : ""} (hash=${sourceHash})`);
}
