export type MgTemplateName =
  | "production-chain"
  | "numeric-comparison"
  | "image-plate"
  | "cutout-cue"
  | "speaker-quote"
  | "mg-canvas"
  | "part-whole-chart"
  | "dual-axis-chart"
  | "mg-argument"
  | "image-side-by-side"
  | "image-directed-graph"
  | "subject-expansion"
  | "sc-video"
  | "sc-longtake"
  | "video-footage"
  | "ai-hot-opening"
  | "ai-hot-focus-stage"
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
  | "news-report"
  | "web-news-focus"
  | "web-page-focus"
  | "news-flashback"
  | "era-shift"
  | "mg-cutout"
  | "route-map"
  | "route-shift"
  | "showcase"
  | "metric"
  | "transition"
  | "rhythm"
  | "effect";

export type MgOverlayTemplateName = "title" | "emphasis" | "transition" | "rhythm" | "effect" | "ai-hot-opening" | "mg-cutout" | "cutout-cue" | "dual-axis-chart";

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

/** A normalized rectangular region in which descendant MG layers are composed. */
export type MgCompositionBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

/** A template-owned local frame window in which one nested composition slot is ready. */
export type MgCompositionSlot = Readonly<{
  slotId: string;
  openFrame: number;
  closeFrame: number;
}>;

/** Optional template-owned composition constraints for nested MG layers. */
export type MgCompositionLayout = Readonly<{
  bounds: MgCompositionBounds;
}>;

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

/** Minimal persistent composition-tree node owned by the host application. */
export type CompositionNode = {
  nodeId: string;
  parentNodeId?: string;
  videoPath: string;
  startFrame: number;
  endFrame: number;
  zIndex: number;
};

/** Persistent render bundle. Runtime-only placement data is deliberately excluded. */
export type MgCompositionBundle = {
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  nodes: CompositionNode[];
};

export type MgActiveWindow = {
  /** Local frame in the rendered clip. */
  startFrame: number;
  /** Exclusive local frame in the rendered clip. */
  endFrame: number;
};

/** Runtime-only enrichment used to render provider templates beside videos. */
export type MgRuntimeCompositionNode = CompositionNode & {
  instance?: string;
  htmlTag?: string;
  group?: string;
  order?: number;
  layerRole?: MgLayerRole;
  timelineOffsetFrames?: number;
  sourceText?: string;
  render?: MgRuntimeLayer;
  /** Local clip-frame windows in which the rendered template is visible. */
  activeWindows?: MgActiveWindow[];
  /** Template-owned readiness windows inherited from a parent composition slot. */
  compositionWindows?: MgActiveWindow[];
  /** Stable slot identifier assigned by the host runtime for diagnostics. */
  compositionSlotId?: string;
};

export type MgRuntimeEpisodeInput = {
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  /** Optional compatibility plate. New essay compositions may omit it. */
  baseFile?: string;
  /** Legacy provider placements. */
  layers?: MgRuntimeLayerPlacement[];
  /** Unified video composition nodes. */
  nodes?: MgRuntimeCompositionNode[];
  /** Transparent only for a standalone overlay clip render. */
  transparentBackground?: boolean;
};
