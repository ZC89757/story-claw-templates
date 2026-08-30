export type MetricPoint = {
  id: string;
  label: string;
  value: string;
  /** Scene-local second at which this point begins entering. */
  at: number;
};

export type MetricSpec = {
  title?: string;
  points: MetricPoint[];
};

export type MetricFunctionArgs = {
  group: string;
  order?: number | null;
  at: number;
  title: string;
  points: Array<{label: string; value: string; at: number}>;
};
