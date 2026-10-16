export type MgCutoutSource =
  | {mode: "transparent"; image: string; subject: null; references: []}
  | {mode: "chroma"; image: string; subject: null; references: []}
  | {mode: "generate"; image: null; subject: string; references: string[]};

export type MgCutoutRiseSpec = {
  /** Package-relative transparent image path after Provider asset preparation. */
  image: string;
  /** Original source choice retained for generation/cutout preparation. */
  source: MgCutoutSource;
  /** Template-local start; the Function Calling timestamp positions the layer. */
  at: number;
  /** Internal marker that keeps repeated preparation idempotent. */
  prepared?: boolean;
};
export type MgCutoutRiseFunctionArgs = {
  group: string;
  order?: number | null;
  source: MgCutoutSource;
};
