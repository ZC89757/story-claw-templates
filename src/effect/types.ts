export type EffectItem = {
  text: string;
  /** Scene-local second at which this item is emphasized. */
  at: number;
};

export type EffectSpec = {
  text: string;
  /** The root cue is always zero inside a rendered scene. */
  at: number;
  items?: EffectItem[];
};

export type EffectFunctionArgs = {
  group: string;
  order?: number | null;
  at: number;
  text: string;
  items?: Array<{text: string; at: number}>;
};
