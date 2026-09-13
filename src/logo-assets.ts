import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

/** Fixed package-owned logo locations. The era-shift folder is canonical; the
 * older ai-company-logos folder remains a compatibility source for existing
 * examples and installed render bundles. */
export const LOGO_ASSET_DIRECTORIES = Object.freeze({
  eraShift: Object.freeze({disk: "era-shift/logos", runtime: "era-shift/logos"}),
  shared: Object.freeze({disk: "ai-company-logos", runtime: "ai-company-logos"}),
} as const);

export type LogoAssetScope = "era-shift" | "shared" | "any";

export type LogoAsset = Readonly<{
  fileName: string;
  runtimePath: string;
  diskPath: string;
  scope: Exclude<LogoAssetScope, "any">;
}>;

export type LogoLookupInput = {
  id?: string;
  label?: string;
  text?: string;
  role?: string;
};

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
const IMAGE_FILE = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i;

// These are localization/abbreviation aliases, not a list of supported
// brands. Any newly added logo is discovered from its filename automatically.
const NAME_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  "微软": "microsoft",
  "谷歌": "google",
  "亚马逊": "amazon",
  "英伟达": "nvidia",
  aws: "amazon",
  azure: "microsoft",
});

const directoryEntries = (scope: LogoAssetScope) => {
  if (scope === "era-shift") return [["era-shift", LOGO_ASSET_DIRECTORIES.eraShift]] as const;
  if (scope === "shared") return [["shared", LOGO_ASSET_DIRECTORIES.shared]] as const;
  // Keep era-shift first so both templates converge on the same canonical path
  // when a logo exists in both compatibility directories.
  return [
    ["era-shift", LOGO_ASSET_DIRECTORIES.eraShift],
    ["shared", LOGO_ASSET_DIRECTORIES.shared],
  ] as const;
};

const normalizeLogoText = (value: string): string =>
  value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

const fileStem = (fileName: string): string => fileName.replace(/\.[^.]+$/, "");

const logoKeysForStem = (stem: string): Set<string> => {
  const normalized = normalizeLogoText(stem);
  const keys = new Set<string>([normalized]);
  // `acme-logo.svg` and `acme-icon.svg` should still match an `acme` entity.
  const withoutSuffix = normalized.replace(/(?:logo|icon|mark|brand)$/i, "");
  if (withoutSuffix) keys.add(withoutSuffix);
  return keys;
};

const lookupKeys = (value: string): Set<string> => {
  const normalized = normalizeLogoText(value);
  const keys = new Set<string>();
  const tokens = new Set<string>();
  if (normalized) keys.add(normalized);

  // Match both complete labels and their punctuation-separated tokens. The
  // complete form handles Chinese labels; tokens handle "OpenAI Cloud".
  for (const token of value.normalize("NFKC").toLocaleLowerCase().split(/[^\p{L}\p{N}]+/gu)) {
    const key = normalizeLogoText(token);
    if (key) {
      keys.add(key);
      tokens.add(key);
    }
  }

  for (const [alias, canonical] of Object.entries(NAME_ALIASES)) {
    const aliasKey = normalizeLogoText(alias);
    const matchesAlias = Boolean(aliasKey && (
      tokens.has(aliasKey)
      || (aliasKey.length >= 4 && normalized.includes(aliasKey))
      || (/^[\u4e00-\u9fff]+$/u.test(aliasKey) && normalized.includes(aliasKey))
    ));
    const matchesCanonical = Boolean(canonical && normalized.includes(normalizeLogoText(canonical)));
    if (matchesAlias || matchesCanonical) {
      keys.add(canonical);
      keys.add(aliasKey);
    }
  }
  return keys;
};

/** Scan the current package directories on every call so newly added assets
 * become available without a generated catalog or a process restart. */
export const listLogoAssets = (scope: LogoAssetScope = "any"): LogoAsset[] => {
  const assets: LogoAsset[] = [];
  for (const [scopeName, directory] of directoryEntries(scope)) {
    const diskDirectory = path.join(publicRoot, directory.disk);
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(diskDirectory, {withFileTypes: true});
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !IMAGE_FILE.test(entry.name)) continue;
      const diskPath = path.join(diskDirectory, entry.name);
      assets.push({
        fileName: entry.name,
        runtimePath: `${directory.runtime}/${entry.name}`,
        diskPath,
        scope: scopeName as Exclude<LogoAssetScope, "any">,
      });
    }
  }
  return assets.sort((left, right) => {
    const leftPriority = left.scope === "era-shift" ? 0 : 1;
    const rightPriority = right.scope === "era-shift" ? 0 : 1;
    return leftPriority - rightPriority || left.runtimePath.localeCompare(right.runtimePath, "zh-CN");
  });
};

/** Find the best package logo for an entity without requiring the model to
 * emit an asset path. Exact id/filename matches outrank fuzzy label matches. */
export const findLogoAsset = (
  input: LogoLookupInput,
  options: {scope?: LogoAssetScope} = {},
): LogoAsset | undefined => {
  const fields: Array<[string | undefined, number]> = [
    [input.id, 1200],
    [input.label ?? input.text, 1000],
    [input.text, 950],
    [input.role, 700],
  ];
  const assets = listLogoAssets(options.scope ?? "any");
  let best: {asset: LogoAsset; score: number; index: number} | undefined;

  assets.forEach((asset, index) => {
    const assetKeys = logoKeysForStem(fileStem(asset.fileName));
    let score = 0;
    for (const [value, weight] of fields) {
      if (!value?.trim()) continue;
      const fullKey = normalizeLogoText(value);
      const keys = lookupKeys(value);
      if (fullKey && assetKeys.has(fullKey)) {
        score = Math.max(score, weight + 300);
      }
      for (const key of keys) {
        if (!key || key.length < 2) continue;
        if (assetKeys.has(key)) {
          score = Math.max(score, weight + 100);
          continue;
        }
        // Safe containment is useful for `google-cloud.svg` and similar
        // descriptive filenames, but never lets one-character labels match.
        if (key.length >= 3 && [...assetKeys].some((assetKey) => assetKey.includes(key) || key.includes(assetKey))) {
          score = Math.max(score, weight + 20);
        }
      }
    }
    if (!score) return;
    if (!best || score > best.score || (score === best.score && index < best.index)) {
      best = {asset, score, index};
    }
  });
  return best?.asset;
};

/** Resolve a model-provided filename/path while keeping it inside the fixed
 * package directory selected by the caller. */
export const resolveLogoAssetSource = (
  source: string,
  scope: LogoAssetScope = "any",
): LogoAsset | undefined => {
  const value = source.trim().replace(/^(['"])(.*)\1$/, "$2");
  if (!value || /^(?:https?:|data:|blob:)/i.test(value)) return undefined;
  const assets = listLogoAssets(scope);
  const hasPath = /[\\/]/.test(value) || path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value);
  if (!hasPath) {
    return assets.find((asset) => asset.fileName.toLocaleLowerCase() === value.toLocaleLowerCase());
  }

  let normalized = value.replaceAll("/", path.sep).replace(/^public[\\/]+/i, "");
  const candidate = path.resolve(path.isAbsolute(normalized) ? normalized : path.join(publicRoot, normalized));
  return assets.find((asset) => path.resolve(asset.diskPath).toLocaleLowerCase() === candidate.toLocaleLowerCase());
};

export const formatLogoAssetInventory = (scope: LogoAssetScope = "any"): string => {
  const directories = directoryEntries(scope).map(([, directory]) => `public/${directory.disk}/`);
  const assets = listLogoAssets(scope).map((asset) => asset.runtimePath);
  return [
    `固定 Logo 目录：${directories.join("、")}`,
    `当前扫描到的 Logo：${assets.join("、") || "无"}`,
    "无需输出 assetDir；代码会按节点 id/label/text 与文件名自动匹配，未命中时显示文字卡片。",
  ].join("\n");
};

export {normalizeLogoText};
