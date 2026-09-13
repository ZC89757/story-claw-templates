export type RouteShiftSpec = {
  title: string;
  first: string;
  second: string;
  switchTime: number;
  switch: string;
};

export type RouteShiftFunctionArgs = RouteShiftSpec & {
  group: string;
  order?: number | null;
  at: number;
};
