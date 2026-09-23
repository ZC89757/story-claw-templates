export const WEB_NEWS_FOCUS_GROUP = "focus" as const;

export const WEB_NEWS_FOCUS_ENTRANCES = ["fade", "slide-right", "cut"] as const;
export type WebNewsFocusEntrance = (typeof WEB_NEWS_FOCUS_ENTRANCES)[number];

export type WebNewsFocusRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WebNewsFocusHighlight = {
  text: string;
  /** Seconds relative to the start of this template instance. */
  at: number;
};

export type WebNewsFocusCaptureHighlight = {
  text: string;
  rects: WebNewsFocusRect[];
  unionRect: WebNewsFocusRect;
};

export type WebNewsFocusCapture = {
  url: string;
  title: string;
  /** Width and height of both screenshot files and their coordinate space. */
  viewport: {width: number; height: number; deviceScaleFactor: number};
  scroll: {x: number; y: number};
  highlights: WebNewsFocusCaptureHighlight[];
  baseImage: string;
  highlightedImage: string;
};

export type WebNewsFocusSpec = {
  /** Kept at zero by the resolver; the host owns the absolute start time. */
  at: number;
  url: string;
  entrance: WebNewsFocusEntrance;
  highlights: WebNewsFocusHighlight[];
  /** Filled by Provider asset preparation from a real browser capture. */
  capture?: WebNewsFocusCapture;
};
