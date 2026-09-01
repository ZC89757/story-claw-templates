export type MgTemplateName =
  | "progress-timeline"
  | "timed-table"
  | "directed-graph"
  | "title"
  | "emphasis"
  | "xy-chart"
  | "multi-series-chart"
  | "containment"
  | "decomposition"
  | "weighted-comparison"
  | "side-by-side-comparison"
  | "collage-network"
  | "image-stack"
  | "image-grid"
  | "showcase"
  | "metric"
  | "transition"
  | "rhythm"
  | "effect"
  | "camera";

export type MgOverlayTemplateName = "title" | "emphasis" | "transition" | "rhythm" | "effect";

export const mgInstanceKey = (template: MgTemplateName, order?: number): string =>
  `${template}-${String(order ?? 1).padStart(2, "0")}`;

export type MgRuntimeOverlay = {
  instance: string;
  group: string;
  order?: number;
  template: MgOverlayTemplateName;
  spec: unknown;
  fromFrame: number;
  durationFrames: number;
  timelineOffsetFrames: number;
};

export type MgRuntimeScene = {
  id: string;
  instance: string;
  group: string;
  order?: number;
  template: MgTemplateName | "raw-overlay";
  renderMode: "replace" | "overlay";
  durationFrames: number;
  timelineOffsetFrames: number;
  background: string;
  baseFile?: string;
  spec?: unknown;
  overlays: MgRuntimeOverlay[];
};

export type MgRenderInput = {
  width: number;
  height: number;
  fps: number;
  scene: MgRuntimeScene;
};

/**
 * Stable runtime payload used by the host application.
 *
 * `kind` is deliberately opaque to Story Claw: only this template package's
 * runtime knows how to turn it into a Remotion component.  Keeping the
 * renderer selector here lets templates add new internal components without
 * teaching the host their names.
 */
export type MgLayerRole = "scene" | "overlay";

export type MgRuntimeLayer = {
  kind: string;
  group: string;
  spec: unknown;
  layerRole: MgLayerRole;
  /** Internal presentation data consumed by runtime/render-entry.tsx only. */
  canvas: "safe" | "full";
  background: string;
  overlayBackdrop?: string;
};

export type MgRuntimeLayerPlacement = {
  id: string;
  instance: string;
  htmlTag: string;
  group: string;
  order?: number;
  layerRole: MgLayerRole;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  timelineOffsetFrames: number;
  sourceText: string;
  render: MgRuntimeLayer;
};

export type MgRuntimeEpisodeInput = {
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  /** A file copied to the Remotion public directory by the host. */
  baseFile: string;
  layers: MgRuntimeLayerPlacement[];
};
