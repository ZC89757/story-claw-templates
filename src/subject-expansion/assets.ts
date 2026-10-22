import {assertSubjectExpansionSpec} from "./validate";
import type {SubjectExpansionSource, SubjectExpansionSpec} from "./types";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {subjectExpansionGenerationPrompt, SUBJECT_EXPANSION_CHROMA_COLOR} from "./prompt";
import type {MgReferenceImageGenerationRequest, MgSolidBackgroundRemovalRequest} from "../provider";

/** Internal services reuse the existing protocol-4 asset callbacks verbatim. */
export type CutoutPreparationServices = {
  generateImageFromReferences?: (input: MgReferenceImageGenerationRequest) => Promise<string>;
  removeSolidBackground?: (input: MgSolidBackgroundRemovalRequest) => Promise<string>;
};

const requireImageLocation = async (source: string, publicRoot: string): Promise<string> => {
  if (/^https?:\/\//i.test(source)) return source;
  const local = /^file:\/\//i.test(source) ? fileURLToPath(source) : source;
  const absolute = path.isAbsolute(local) ? local : path.resolve(publicRoot, local.replace(/^public[\\/]/, ""));
  if (!/\.(png|webp|svg)$/i.test(absolute)) throw new Error("subject-expansion: transparent local image must be PNG, WebP or SVG");
  const stat = await fs.stat(absolute).catch(() => null);
  if (!stat?.isFile() || stat.size === 0) throw new Error(`subject-expansion: transparent image file does not exist: ${absolute}; project images must use absolute paths`);
  return absolute;
};

/** The template supplies its own art direction; callers only describe the subject. */
export const prepareSubjectExpansionAssets = async (value: unknown, resolveImage: (source: string) => Promise<string>, packagePublicRoot: string, services: CutoutPreparationServices = {}): Promise<SubjectExpansionSpec> => {
  const spec = assertSubjectExpansionSpec(value);
  if (spec.prepared) return spec;
  const sources = [spec.subject.source, ...spec.items.map((item) => item.source)];
  // Commit only after all assets resolve, so a failure cannot leave a half-prepared spec.
  const images = await prepareCutoutImages(sources, resolveImage, packagePublicRoot, services);
  const items = spec.items.map((item, index) => ({...item, image: images[index + 1]}));
  return assertSubjectExpansionSpec({...spec, subject: {...spec.subject, image: images[0]!}, items, prepared: true});
};

export const prepareCutoutImages = async (sources: readonly (SubjectExpansionSource | null)[], resolveImage: (source: string) => Promise<string>, packagePublicRoot: string, services: CutoutPreparationServices = {}): Promise<(string | null)[]> => {
  const needsGeneration = sources.some((source) => source?.mode === "generate");
  if (needsGeneration && (!services.generateImageFromReferences || !services.removeSolidBackground)) {
    throw new Error("CUTOUT_GENERATION_UNAVAILABLE: generate 需要现有 protocol-4 生图与纯色抠图能力，请检查模板运行环境。");
  }
  // This is a genuine, package-owned style reference, not a fabricated identity
  // reference or a blank image used to bypass the generator's requirements.
  const reference = path.join(packagePublicRoot, "subject-expansion", "style-reference.png");
  const referenceHash = needsGeneration ? createHash("sha256").update(await fs.readFile(reference)).digest("hex") : "";
  const cache = new Map<string, Promise<string>>();
  // Keep generation bounded; existing callbacks provide persistent caching.
  let generationQueue: Promise<unknown> = Promise.resolve();
  const generate = (prompt: string): Promise<string> => {
    const pending = generationQueue.then(async () => {
      const cacheKey = `template-cutout-v1:${referenceHash}:${prompt}`;
      const generated = await services.generateImageFromReferences!({
        prompt: subjectExpansionGenerationPrompt(prompt), references: [reference], aspectRatio: "1:1", cacheKey,
      });
      if (!path.isAbsolute(generated)) throw new Error("cutout generator must return an absolute local image path");
      const cutout = await services.removeSolidBackground!({sourcePath: generated, backgroundColor: SUBJECT_EXPANSION_CHROMA_COLOR, cacheKey});
      if (!path.isAbsolute(cutout)) throw new Error("background remover must return an absolute local image path");
      return resolveImage(await requireImageLocation(cutout, packagePublicRoot));
    });
    generationQueue = pending;
    return pending;
  };
  return Promise.all(sources.map((source) => {
    if (!source) return null;
    const key = JSON.stringify(source);
    if (!cache.has(key)) cache.set(key, source.mode === "generate"
      ? generate(source.prompt)
      : requireImageLocation(source.image, packagePublicRoot).then(resolveImage));
    return cache.get(key)!;
  }));
};
