import type {SubjectExpansionSpec} from "./types";

export const expansionEase = (elapsed: number, duration = 0.75): number => {
  const t = Math.max(0, Math.min(1, elapsed / duration));
  return 1 - Math.pow(1 - t, 3);
};

export const evaluateSubjectExpansion = (spec: SubjectExpansionSpec, seconds: number) => {
  const highlight = [...spec.highlights].reverse().find((event) => event.at <= seconds);
  const latestItem = [...spec.items].reverse().find((item) => item.at <= seconds);
  // A later reveal takes focus naturally; old highlight text does not linger over a new topic.
  const activeHighlight = highlight && (!latestItem || highlight.at >= latestItem.at) ? highlight : undefined;
  const targets = activeHighlight?.targets ?? (latestItem ? [latestItem.id] : ["subject"]);
  const focusAt = activeHighlight?.at ?? latestItem?.at ?? 0;
  const focus = expansionEase(seconds - focusAt, 0.45);
  return {
    subjectProgress: expansionEase(seconds, 1.05),
    subjectOpacity: targets.includes("subject") ? 1 : 1 - focus * 0.12,
    note: activeHighlight?.note ?? null,
    noteProgress: activeHighlight ? focus : 0,
    items: spec.items.map((item) => ({
      id: item.id,
      progress: expansionEase(seconds - item.at),
      focus: targets.includes(item.id) ? focus : 0,
      opacity: targets.includes(item.id) ? 1 : 1 - focus * 0.26,
    })),
  };
};
