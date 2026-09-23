export const AI_HOT_OPENING_GROUP = "color-orb" as const;
export const AI_HOT_OPENING_MIN_DURATION_SECONDS = 7;
export const AI_HOT_OPENING_MAX_ITEMS = 6;

export type AiHotOpeningSpec = {
  title: string;
  subTitle: string | null;
  items: string[];
  /** Local display duration derived from absolute endTime - at. */
  durationSeconds: number;
};

export type AiHotOpeningFunctionArgs = {
  /** Absolute episode second at which the opening begins. */
  at: number;
  /** Absolute episode second at which the opening is fully transparent. */
  endTime: number;
  title: string;
  /** Optional small line above title. Pass null or an empty string when absent. */
  sub_title?: string | null;
  items: string[];
};
