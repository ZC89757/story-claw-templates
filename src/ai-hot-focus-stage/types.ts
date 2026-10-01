export const AI_HOT_FOCUS_STAGE_GROUP = "focus-stage" as const;
export const AI_HOT_FOCUS_STAGE_MAX_ITEMS = 6;
export const AI_HOT_FOCUS_STAGE_MIN_FIRST_DELAY_SECONDS = 5;
export const AI_HOT_FOCUS_STAGE_MIN_GAP_SECONDS = 2.5;

export type AiHotFocusStageItem = {
  title: string;
  /** Local chapter-switch trigger in seconds from the template start. */
  time: number;
};

export type AiHotFocusStageSpec = {
  title: string;
  subTitle: string | null;
  items: AiHotFocusStageItem[];
};
