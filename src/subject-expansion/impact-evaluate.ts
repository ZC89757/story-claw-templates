import {expansionEase} from "./evaluate";
import type {SubjectExpansionSpec} from "./types";

export const IMPACT_LEAD_SECONDS = 0.72;
export const IMPACT_LINK_DELAY_SECONDS = 0.18;
export const IMPACT_AUDIO_HIT_SECONDS = 0.72;

export const evaluateExpansionImpactCard = (seconds: number, at: number, index = 0) => {
  const start = Math.max(0, at - IMPACT_LEAD_SECONDS);
  const airborne = seconds >= start && seconds < at;
  const elapsed = seconds - at;
  const travel = at > start ? Math.max(0, Math.min(1, (seconds - start) / (at - start))) : 1;
  const fall = Math.pow(travel, 1.75);
  const settle = Math.max(0, elapsed);
  const bounce = elapsed >= 0 && elapsed < 0.30 ? Math.sin(settle / 0.30 * Math.PI) * Math.exp(-settle * 7) : 0;
  return {
    visible: seconds >= start,
    airborne,
    landed: seconds >= at,
    opacity: seconds < start ? 0 : expansionEase(seconds - start, Math.min(0.12, Math.max(0.001, at - start))),
    translateX: airborne ? (1 - fall) * (index % 2 ? 90 : -110) : 0,
    translateY: airborne ? -380 * (1 - fall) : bounce === 0 ? 0 : -bounce * 32,
    translateZ: airborne ? 200 * (1 - fall) : bounce * 12,
    rotateX: airborne ? -236 + 258 * fall : 22 + bounce * 9,
    rotateY: airborne ? 42 * (1 - fall) - 6 : -6,
    rotateZ: airborne ? (index % 2 ? -32 : 29) * (1 - fall) : (index % 2 ? 2 : -2),
    scaleY: elapsed >= 0 && elapsed < 0.1 ? 0.91 + 0.09 * expansionEase(elapsed, 0.1) : 1,
    contact: elapsed >= 0 && elapsed < 0.45 ? Math.exp(-elapsed * 9) : 0,
    link: expansionEase(seconds - at - IMPACT_LINK_DELAY_SECONDS, 0.48),
  };
};

export const evaluateExpansionImpactCamera = (spec: SubjectExpansionSpec, seconds: number) => {
  let x = 0; let y = 0;
  for (const item of spec.items) {
    const elapsed = seconds - item.at;
    if (elapsed < 0 || elapsed > 0.48) continue;
    const envelope = Math.exp(-elapsed * 13);
    x += Math.sin(elapsed * 102) * 7 * envelope;
    y += Math.cos(elapsed * 88) * 6 * envelope;
  }
  return {x: Math.max(-10, Math.min(10, x)), y: Math.max(-9, Math.min(9, y))};
};

/** Frames before instance start are trimmed from the roll, so audio and impact never drift. */
export const expansionImpactAudioWindow = (at: number, fps: number) => {
  const impactFrame = Math.round(at * fps);
  const leadFrames = Math.round(IMPACT_AUDIO_HIT_SECONDS * fps);
  return {from: Math.max(0, impactFrame - leadFrames), trimBefore: Math.max(0, leadFrames - impactFrame), impactFrame};
};
