export const WEB_PAGE_FOCUS_GROUP = "focus" as const;

export const WEB_PAGE_FOCUS_ENTRANCES = ["fade", "slide-right", "cut"] as const;
export type WebPageFocusEntrance = (typeof WEB_PAGE_FOCUS_ENTRANCES)[number];

export type WebPageFocusRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WebPageFocusAnchor = {
  text: string;
  /** Seconds relative to the start of this template instance. */
  at: number;
};

export type WebPageFocusCaptureAnchor = {
  text: string;
  rects: WebPageFocusRect[];
  unionRect: WebPageFocusRect;
};

export type WebPageFocusCapture = {
  url: string;
  title: string;
  viewport: {width: number; height: number; deviceScaleFactor: number};
  scroll: {x: number; y: number};
  focus: WebPageFocusCaptureAnchor[];
  baseImage: string;
};

export type WebPageFocusSpec = {
  /** Kept at zero by the resolver; the host owns the absolute start time. */
  at: number;
  url: string;
  entrance: WebPageFocusEntrance;
  focus: WebPageFocusAnchor[];
  /** Filled by Provider asset preparation from a real browser capture. */
  capture?: WebPageFocusCapture;
};
