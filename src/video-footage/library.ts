import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import type {VideoFootageAsset, VideoFootageSubtitle} from "./types";

export const VIDEO_FOOTAGE_SOURCES_DIR = "public/video-footage/sources/";
export const VIDEO_FOOTAGE_METADATA_DIR = "public/video-footage/metadata/";

const publicRoot = fileURLToPath(new URL("../../public/", import.meta.url));
const sourcesRoot = path.join(publicRoot, "video-footage", "sources");
const metadataRoot = path.join(publicRoot, "video-footage", "metadata");
const videoExtension = /\.(?:m4v|mov|mp4|webm)$/i;

export type VideoFootageLibrary = Readonly<{
  assets: readonly VideoFootageAsset[];
  issues: readonly string[];
}>;

const roundMillis = (value: number): number => Math.round(value * 1000) / 1000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isPathInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === ""
    || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

const walkFiles = (root: string, accept: (file: string) => boolean): string[] => {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && accept(entry.name)) files.push(absolute);
    }
  };
  visit(root);
  return files.sort((left, right) => left.localeCompare(right, "zh-CN"));
};

export const normalizeVideoFootageSource = (input: string): string => {
  let value = input.trim().replace(/^(?:["'])(.*)(?:["'])$/, "$1").replaceAll("\\", "/");
  value = value.replace(/^public\/video-footage\/sources\//i, "");
  value = value.replace(/^video-footage\/sources\//i, "");
  value = value.replace(/^sources\//i, "");
  if (!value || /^(?:[a-z]+:|\/)/i.test(value) || /^[A-Za-z]:\//.test(value)) {
    throw new Error("video-footage source 必须是固定 sources 目录下的相对路径");
  }
  const parts = value.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error("video-footage source 不能包含空路径段或目录穿越");
  }
  if (!videoExtension.test(value)) {
    throw new Error("video-footage source 只支持 mp4、mov、m4v 或 webm 视频");
  }
  return parts.join("/");
};

const parseSubtitle = (value: unknown, index: number, duration: number): VideoFootageSubtitle => {
  if (!isRecord(value)) throw new Error(`subtitles[${index}] 必须是对象`);
  const start = Number(value.start);
  const end = Number(value.end);
  const text = String(value.text ?? "").trim().replace(/\s+/g, " ");
  if (!Number.isFinite(start) || start < 0) throw new Error(`subtitles[${index}].start 无效`);
  if (!Number.isFinite(end) || end <= start) throw new Error(`subtitles[${index}].end 必须大于 start`);
  if (end > duration + 0.001) throw new Error(`subtitles[${index}].end 超过视频时长`);
  if (!text) throw new Error(`subtitles[${index}].text 不能为空`);
  return {start: roundMillis(start), end: roundMillis(end), text};
};

const parseMetadata = (metadataPath: string): VideoFootageAsset => {
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isRecord(raw)) throw new Error("元数据根节点必须是对象");

  const source = normalizeVideoFootageSource(String(raw.source ?? ""));
  const duration = Number(raw.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("duration 必须是正数秒");
  if (!Array.isArray(raw.subtitles)) throw new Error("subtitles 必须是数组");

  const metadataRelative = path.relative(metadataRoot, metadataPath).replaceAll(path.sep, "/");
  const metadataStem = metadataRelative.replace(/\.json$/i, "");
  const sourceStem = source.replace(/\.[^.]+$/, "");
  if (metadataStem !== sourceStem) {
    throw new Error(`元数据必须与视频同名且保持相同子目录: ${metadataStem}.json != ${source}`);
  }

  const absoluteSource = path.resolve(sourcesRoot, source.replaceAll("/", path.sep));
  if (!isPathInside(sourcesRoot, absoluteSource) || !fs.existsSync(absoluteSource)) {
    throw new Error(`找不到对应视频: ${source}`);
  }
  const sourceStat = fs.statSync(absoluteSource);
  if (!sourceStat.isFile()) throw new Error(`source 不是文件: ${source}`);

  const roundedDuration = roundMillis(duration);
  const subtitles = raw.subtitles
    .map((item, index) => parseSubtitle(item, index, roundedDuration))
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const metadataStat = fs.statSync(metadataPath);

  return Object.freeze({
    source,
    runtimeSource: `video-footage/sources/${source}`,
    duration: roundedDuration,
    subtitles: Object.freeze(subtitles),
    metadataFile: metadataRelative,
    assetVersion: `${sourceStat.size}:${Math.trunc(sourceStat.mtimeMs)}:${metadataStat.size}:${Math.trunc(metadataStat.mtimeMs)}`,
  });
};

export const scanVideoFootageLibrary = (): VideoFootageLibrary => {
  const assets: VideoFootageAsset[] = [];
  const issues: string[] = [];
  const metadataFiles = walkFiles(metadataRoot, (file) => /\.json$/i.test(file));
  const indexedSources = new Set<string>();

  for (const metadataPath of metadataFiles) {
    const relative = path.relative(metadataRoot, metadataPath).replaceAll(path.sep, "/");
    try {
      const asset = parseMetadata(metadataPath);
      if (indexedSources.has(asset.source)) throw new Error(`source 重复登记: ${asset.source}`);
      indexedSources.add(asset.source);
      assets.push(asset);
    } catch (error) {
      issues.push(`${relative}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const sourcePath of walkFiles(sourcesRoot, (file) => videoExtension.test(file))) {
    const relative = path.relative(sourcesRoot, sourcePath).replaceAll(path.sep, "/");
    if (!indexedSources.has(relative)) issues.push(`${relative}: 缺少同名 metadata JSON，不可选`);
  }

  assets.sort((left, right) => left.source.localeCompare(right.source, "zh-CN"));
  return Object.freeze({assets: Object.freeze(assets), issues: Object.freeze(issues)});
};

export const resolveVideoFootageAsset = (input: string): VideoFootageAsset => {
  const source = normalizeVideoFootageSource(input);
  const library = scanVideoFootageLibrary();
  const asset = library.assets.find((candidate) => candidate.source === source);
  if (asset) return asset;
  const details = library.issues.length ? `；索引问题：${library.issues.join("；")}` : "";
  throw new Error(`video-footage source 不在可用素材清单中: ${source}${details}`);
};

const formatTime = (seconds: number): string => seconds.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");

export const formatVideoFootageLibraryForAgent = (): string => {
  const library = scanVideoFootageLibrary();
  const lines = [
    `固定视频目录：${VIDEO_FOOTAGE_SOURCES_DIR}`,
    `固定元数据目录：${VIDEO_FOOTAGE_METADATA_DIR}`,
    "调用前必须先阅读下列素材的字幕及时间戳，按标签语义选择真正匹配的连续区间。source 只填候选中列出的相对路径。",
    "当前可用素材：",
  ];
  if (!library.assets.length) lines.push("- 无。请先放入视频及其同名 metadata JSON，不得编造 source。");
  for (const asset of library.assets) {
    lines.push(`- source=${JSON.stringify(asset.source)} | duration=${formatTime(asset.duration)}s | metadata=${asset.metadataFile}`);
    // Visual notes are evidence about the footage, never replacement subtitles.
    try {
      const raw: unknown = JSON.parse(fs.readFileSync(path.join(metadataRoot, asset.metadataFile), "utf8"));
      if (isRecord(raw)) {
        if (typeof raw.visual_notes === "string") lines.push(`  画面资料说明（不是字幕）：${JSON.stringify(raw.visual_notes.slice(0, 2400))}`);
        if (typeof raw.provenance_page === "string") lines.push(`  来源：${JSON.stringify(raw.provenance_page.slice(0, 2000))}`);
        if (Array.isArray(raw.shotlist)) for (const shot of raw.shotlist.slice(0, 30)) {
          if (!isRecord(shot) || typeof shot.start !== "number" || typeof shot.end !== "number"
            || !Number.isFinite(shot.start) || !Number.isFinite(shot.end) || shot.start < 0
            || shot.end <= shot.start || shot.end > asset.duration + .001 || typeof shot.description !== "string") continue;
          lines.push(`  画面候选 [${formatTime(shot.start)}-${formatTime(shot.end)}] ${JSON.stringify(shot.description.slice(0, 500))}`);
        }
      }
    } catch { /* Optional descriptive metadata must not hide a valid indexed source. */ }
    if (!asset.subtitles.length) {
      lines.push("  [无字幕时间轴]");
      continue;
    }
    for (const subtitle of asset.subtitles) {
      lines.push(`  [${formatTime(subtitle.start)}-${formatTime(subtitle.end)}] ${subtitle.text}`);
    }
  }
  if (library.issues.length) {
    lines.push("不可选素材/索引问题：");
    for (const issue of library.issues) lines.push(`- ${issue}`);
  }
  return lines.join("\n");
};

