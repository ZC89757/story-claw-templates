export type ShowcaseItem = {
  id: string;
  text: string;
  /** Scene-local second at which this item begins entering. */
  at: number;
};

export type ShowcaseSpec = {
  title?: string;
  items: ShowcaseItem[];
};

export type ShowcaseFunctionArgs = {
  group: string;
  order?: number | null;
  title: string;
  items: Array<{text: string; at: number}>;
};
