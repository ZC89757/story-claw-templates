export type PreviewOrientation = "landscape" | "portrait";

/** Match MgStylePreview's portrait compositions and the vertical episode demo. */
export function previewOrientation({previewKind}: {previewKind: string}): PreviewOrientation {
  return previewKind.startsWith("portrait-") || previewKind === "sc-longtake-relay"
    ? "portrait"
    : "landscape";
}
