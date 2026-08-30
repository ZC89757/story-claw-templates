import {ClassifiedImageSource, ImageSourceKind} from "./types";

const URL_PATTERN = /^(?:https?:|data:|blob:|file:)/i;
const WINDOWS_PATH_PATTERN = /^[A-Za-z]:[\\/]/;
const LOCAL_PREFIX_PATTERN = /^(?:\.{0,2}[\\/]|[\\/]|(?:public|assets|images?)[\\/])/i;
const IMAGE_FILE_PATTERN = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

/** Classify without guessing whether a natural-language prompt is a file name. */
export const classifyImageSource = (value: string): ImageSourceKind => {
  const image = value.trim();
  if (URL_PATTERN.test(image)) return "url";
  if (WINDOWS_PATH_PATTERN.test(image) || LOCAL_PREFIX_PATTERN.test(image) || IMAGE_FILE_PATTERN.test(image)) return "local";
  return "prompt";
};

export const resolveImageSource = (value: string): ClassifiedImageSource => ({
  kind: classifyImageSource(value),
  value: value.trim(),
});

/** Remove a leading public/ marker before passing a relative asset to Remotion staticFile(). */
export const normalizePublicImagePath = (value: string): string => value
  .trim()
  .replace(/^public[\\/]/i, "")
  .replaceAll("\\", "/");
