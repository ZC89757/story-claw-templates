import type {MgCompositionLayout, MgCompositionSlot} from "../runtime";

/** Fixed normalized evidence area. Subject and bottom relation note remain outside it. */
export const SUBJECT_EXPANSION_COMPOSITION_LAYOUT: MgCompositionLayout = Object.freeze({
  bounds: Object.freeze({x: 0.36, y: 0.18, width: 0.62, height: 0.62}),
});

export const resolveSubjectExpansionCompositionSlots = (_spec: unknown, fps: number, durationFrames: number): readonly MgCompositionSlot[] => {
  if (!Number.isFinite(fps) || fps <= 0 || !Number.isInteger(durationFrames) || durationFrames <= 0) throw new Error("subject-expansion: invalid composition duration or fps");
  return [{slotId: "evidence", openFrame: 0, closeFrame: durationFrames}];
};
