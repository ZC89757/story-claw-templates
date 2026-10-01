import type {MgCompositionBounds, MgCompositionLayout, MgCompositionSlot, MgRuntimeCompositionNode} from "./runtime.js";
// This module is consumed by the Remotion runtime entry from the unpacked
// template source. Keep the runtime import extensionless so webpack can
// resolve the TypeScript source in both the installed pack and the workspace.
import {
  AI_HOT_FOCUS_STAGE_COMPOSITION_LAYOUT,
  resolveAiHotFocusStageCompositionSlots,
} from "./ai-hot-focus-stage/composition-layout";

export type MgCompositionNodeReference = Pick<MgRuntimeCompositionNode, "nodeId" | "parentNodeId" | "htmlTag">;
export type MgCompositionSlotResolver = (
  spec: unknown,
  fps: number,
  durationFrames: number,
) => readonly MgCompositionSlot[];

// Template-owned declarations live in the package; the compositor only resolves them generically by HTML tag.
const COMPOSITION_LAYOUTS_BY_HTML_TAG: Readonly<Record<string, MgCompositionLayout>> = Object.freeze({
  "ai-hot-focus-stage": AI_HOT_FOCUS_STAGE_COMPOSITION_LAYOUT,
});

// A template owns its readiness schedule; the compositor only consumes the generic slot contract.
const COMPOSITION_SLOT_RESOLVERS_BY_HTML_TAG: Readonly<Record<string, MgCompositionSlotResolver>> = Object.freeze({
  "ai-hot-focus-stage": resolveAiHotFocusStageCompositionSlots,
});

export const getCompositionLayoutForHtmlTag = (htmlTag: string): MgCompositionLayout | undefined =>
  COMPOSITION_LAYOUTS_BY_HTML_TAG[htmlTag];

export const getCompositionSlotResolverForHtmlTag = (htmlTag: string): MgCompositionSlotResolver | undefined =>
  COMPOSITION_SLOT_RESOLVERS_BY_HTML_TAG[htmlTag];

/** Resolve the nearest ancestor template that constrains all of its descendants. */
export const findInheritedCompositionBounds = (
  node: MgCompositionNodeReference,
  nodesById: ReadonlyMap<string, MgCompositionNodeReference>,
): MgCompositionBounds | undefined => {
  let parentNodeId = node.parentNodeId;
  const visited = new Set([node.nodeId]);
  let inheritedBounds: MgCompositionBounds | undefined;

  while (parentNodeId) {
    if (visited.has(parentNodeId)) {
      throw new Error(`MG 合成节点 ${node.nodeId} 的 parentNodeId 存在循环`);
    }
    visited.add(parentNodeId);

    const parent = nodesById.get(parentNodeId);
    if (!parent) throw new Error(`MG 合成节点 ${node.nodeId} 找不到父节点 ${parentNodeId}`);

    const bounds = parent.htmlTag
      ? getCompositionLayoutForHtmlTag(parent.htmlTag)?.bounds
      : undefined;
    if (!inheritedBounds && bounds) inheritedBounds = bounds;
    parentNodeId = parent.parentNodeId;
  }

  return inheritedBounds;
};
