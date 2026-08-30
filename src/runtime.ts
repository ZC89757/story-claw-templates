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
