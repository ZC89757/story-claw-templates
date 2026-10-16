export type RhythmSpec = {
  text: string;
  /** Scene-local second at which the beat treatment begins. */
  at: number;
};

export type RhythmFunctionArgs = {
  group: string;
  order?: number | null;
  text: string;
};
