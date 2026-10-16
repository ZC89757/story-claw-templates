export const AI_HOT_OPENING_GROUP = "color-orb" as const;
export const AI_HOT_OPENING_MIN_DURATION_SECONDS = 7;
export const AI_HOT_OPENING_MAX_ITEMS = 6;

export type AiHotOpeningSpec = {
  title: string;
  subTitle: string | null;
  items: string[];
  /** Local display duration derived from the host annotation window. */
  durationSeconds: number;
};

export type AiHotOpeningFunctionArgs = {
  title: string;
  /** Optional small line above title. Pass null or an empty string when absent. */
  sub_title?: string | null;
  items: string[];
};
