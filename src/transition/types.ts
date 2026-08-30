export type TransitionSpec = {
  text: string;
  /** Scene-local second at which the transition begins. */
  at: number;
};

export type TransitionFunctionArgs = {
  group: string;
  order?: number | null;
  at: number;
  text: string;
};
