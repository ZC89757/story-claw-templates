import type {MgCompositionLayout, MgCompositionSlot} from "../runtime";
import type {CanvasSpec} from "./schema";
export const CANVAS_LAYOUT: MgCompositionLayout = {bounds: {x: 0.36, y: 0.18, width: 0.62, height: 0.62}};
export const CANVAS_MOVE_SECONDS = 0.5;
export const resolveCanvasSlots = (value: unknown, fps: number, durationFrames: number): readonly MgCompositionSlot[] => {
  if (!(fps > 0) || !Number.isInteger(durationFrames) || durationFrames < 1) throw new Error("invalid canvas slot timing");
  const spec = value as CanvasSpec;
  return spec.steps.flatMap((step, i) => {
    const openFrame = Math.ceil((step.at + (i ? CANVAS_MOVE_SECONDS : 0)) * fps);
    const closeFrame = Math.min(durationFrames, spec.steps[i + 1] ? Math.round(spec.steps[i + 1].at * fps) : durationFrames);
    return openFrame < closeFrame ? [{slotId: `step-${i + 1}-${step.nodeId}`, openFrame, closeFrame}] : [];
  });
};
