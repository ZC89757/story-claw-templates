export type EraShiftItem = {
  text: string;
  /** Optional filename from a fixed package logo directory; Provider fills a match when omitted. */
  logo?: string;
};

/**
 * The foreground selection made by the planning call.
 *
 * `existing` points at one of the package-owned transparent assets.  `generate`
 * asks the host to use the supplied reference images to make a portrait on the
 * template's fixed chroma background and then remove that background.
 */
export type EraShiftForeground = {
  mode: "existing" | "generate";
  image: string | null;
  person: string | null;
  references: string[];
};

export type EraShiftSpec = {
  /** Resolved foreground image path, usually copied to the render bundle. */
  image: string;
  /** Original foreground selection retained for runtime preparation and caching. */
  foreground?: EraShiftForeground;
  /** Local seconds from the scene root at which the background changes. */
  switchAt: number;
  startItems: EraShiftItem[];
  endItems: EraShiftItem[];
};

export type EraShiftFunctionArgs = {
  group: string;
  order?: number | null;
  at: number;
  /** Preferred foreground selection. */
  foreground?: EraShiftForeground;
  /** Legacy fixed foreground field; accepted while older plans are replayed. */
  image?: string;
  /** Absolute episode timestamp for the background A -> B transition. */
  switchAt: number;
  startItems: EraShiftItem[];
  endItems: EraShiftItem[];
};

export type EraShiftItemState = {
  progress: number;
  visible: boolean;
};
