export type EffectItem = {
  text: string;
  /** Scene-local second at which this item is emphasized. */
  at: number;
};

export type EffectSpec = {
  text: string;
  /** The root cue is always zero inside a rendered scene. */
  at: number;
  /** The selected configurable asset for object-drop or glass-fracture. */
  image?: string;
  /** Scene-local second at which the falling object hits the ground. */
  impactAt?: number;
  /** Scene-local second at which the intact content cracks apart. */
  crackAt?: number;
  items?: EffectItem[];
};

export type EffectFunctionArgs = {
  group: string;
  order?: number | null;
  at: number;
  text: string;
  items?: Array<{text: string; at: number}>;
};

export type ConfigurableEffectFunctionArgs = {
  group: "object-drop" | "glass-fracture";
  order?: number | null;
  at: number;
  /** Exactly one image filename/path from the group's fixed asset directory. */
  image: string;
  /** Absolute episode second at which the falling object hits the ground. */
  impactAt?: number;
  /** Absolute episode second at which the intact content cracks apart. */
  crackAt?: number;
};
