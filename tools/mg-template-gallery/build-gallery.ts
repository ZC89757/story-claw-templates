import {cp, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {
  MG_STYLE_CATALOG,
  MG_TEMPLATE_USAGE,
  getMgTemplateProvider,
} from "@story-claw/mg-templates";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const templatesRoot = repoRoot;
const defaultOutputDir = path.join(repoRoot, "out", "mg-template-gallery");

type CatalogEntry = (typeof MG_STYLE_CATALOG)[number];

export type GenerateMgTemplateGalleryOptions = Readonly<{
  /** Directory that receives the local index.html. */
  outputDir?: string;
  /** Copy MP4 previews into outputDir/previews so the result can be moved elsewhere. */
  portable?: boolean;
  /** Refresh the source page in the template package as well. */
  writeSource?: boolean;
}>;

export type GeneratedMgTemplateGallery = Readonly<{
  outputDir: string;
  indexPath: string;
  previewDirectory: string;
  portable: boolean;
  styleCount: number;
}>;

export type SyncedMgTemplateGallerySource = Readonly<{
  indexPath: string;
  previewDirectory: string;
  styleCount: number;
}>;

const escapeForInlineJson = (value: unknown): string => JSON.stringify(value)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

const asRelativeBrowserUrl = (fromDirectory: string, targetDirectory: string): string => {
  const relative = path.relative(fromDirectory, targetDirectory).split(path.sep).join("/");
  if (!relative) return ".";
  return relative.startsWith(".") ? relative : `./${relative}`;
};

const makeCatalog = (previewBase: string) => {
  const provider = getMgTemplateProvider();
  const usageByTemplate = new Map(MG_TEMPLATE_USAGE.map((item) => [item.template, item.useWhen]));
  return MG_STYLE_CATALOG.map((entry: CatalogEntry) => ({
    ...entry,
    useWhen: usageByTemplate.get(entry.template) ?? "原文存在适合该动画结构的明确语义",
    previewFile: `${previewBase}/${entry.template}-${entry.style}.mp4`,
    layerRole: entry.renderMode === "overlay" ? "overlay" : "scene",
    planningTools: provider.getPlanningTools([entry.htmlTag]).map((tool) => ({
      name: tool.name,
      label: tool.label,
      description: tool.description,
      parameters: tool.parameters,
    })),
  }));
};

/**
 * Inline data for a file:// page.  Support both the initial placeholder and
 * an already inlined catalog so the source page can be refreshed repeatedly.
 */
const inlineCatalog = (html: string, catalog: unknown): string => {
  const encoded = escapeForInlineJson(catalog);
  if (html.includes("__MG_GALLERY_CATALOG__")) return html.replace("__MG_GALLERY_CATALOG__", encoded);
  const scriptPattern = /(<script\s+id=["']mg-gallery-data["'][^>]*>)[\s\S]*?(<\/script>)/i;
  if (scriptPattern.test(html)) return html.replace(scriptPattern, `$1${encoded}$2`);
  throw new Error("MG 模板预览页缺少 mg-gallery-data 数据脚本");
};

/** Refresh the checked-in source page without creating an output directory. */
export const syncMgTemplateGallerySource = async (): Promise<SyncedMgTemplateGallerySource> => {
  const htmlSource = path.join(here, "index.html");
  const previewsSource = path.join(templatesRoot, "public", "mg-previews");
  const html = await readFile(htmlSource, "utf8");
  const catalog = makeCatalog(asRelativeBrowserUrl(here, previewsSource));
  if (!catalog.length) throw new Error("MG 模板目录为空");
  await writeFile(htmlSource, inlineCatalog(html, catalog), "utf8");
  return {indexPath: htmlSource, previewDirectory: previewsSource, styleCount: catalog.length};
};

/**
 * Generate a browser-only MG gallery. It has no Electron dependency and can be
 * opened with file://. Normal mode writes only index.html and points back to the
 * local template package; --portable is the explicit opt-in to copy all MP4s.
 */
export const generateMgTemplateGallery = async (
  options: GenerateMgTemplateGalleryOptions = {},
): Promise<GeneratedMgTemplateGallery> => {
  const outputDir = path.resolve(options.outputDir ?? defaultOutputDir);
  const portable = options.portable === true;
  const htmlSource = path.join(here, "index.html");
  const previewsSource = path.join(templatesRoot, "public", "mg-previews");
  const html = await readFile(htmlSource, "utf8");
  const previewBase = portable ? "./previews" : asRelativeBrowserUrl(outputDir, previewsSource);
  const catalog = makeCatalog(previewBase);

  if (!catalog.length) throw new Error("MG 模板目录为空");

  // Deliberately avoid clearing outputDir: regenerating a preview must not erase
  // unrelated local files a user may have placed next to a previous export.
  await mkdir(outputDir, {recursive: true});
  const indexPath = path.join(outputDir, "index.html");
  await writeFile(indexPath, inlineCatalog(html, catalog), "utf8");

  if (options.writeSource) {
    const sourcePreviewBase = asRelativeBrowserUrl(here, previewsSource);
    await writeFile(htmlSource, inlineCatalog(html, makeCatalog(sourcePreviewBase)), "utf8");
  }

  if (portable) {
    await cp(previewsSource, path.join(outputDir, "previews"), {recursive: true, force: true});
  }

  return {
    outputDir,
    indexPath,
    previewDirectory: portable ? path.join(outputDir, "previews") : previewsSource,
    portable,
    styleCount: catalog.length,
  };
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const args = process.argv.slice(2);
  const outputArg = args.find((arg) => !arg.startsWith("-"));
  const writeSource = args.includes("--source") || args.includes("--sync-source");
  const task = writeSource && !outputArg && !args.includes("--portable")
    ? syncMgTemplateGallerySource()
    : generateMgTemplateGallery({outputDir: outputArg, portable: args.includes("--portable"), writeSource});
  task.then((result) => {
    console.log(`MG 模板预览页已更新：${result.indexPath}`);
    const portableLabel = "portable" in result && result.portable ? "预览视频已复制，可独立移动" : "预览视频使用模板包相对路径";
    console.log(`样式：${result.styleCount} 个；${portableLabel}`);
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}


