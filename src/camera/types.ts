export type CameraItem = {
  text: string;
  /** Scene-local second at which this camera beat begins. */
  at: number;
};

export type CameraSpec = {
  text: string;
  at: number;
  items?: CameraItem[];
};

export type CameraFunctionArgs = {
  group: string;
  order?: number | null;
  at: number;
  text: string;
  items?: Array<{text: string; at: number}>;
};
