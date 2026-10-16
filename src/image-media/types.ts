/** A media value can be a URL/local asset path or an unexpanded image-generation prompt. */
export type ImageMediaItem = {
  image: string;
  label?: string;
  /** Scene-local second at which this item starts entering. */
  at: number;
};

export type ImageMediaSpec = {
  title?: string;
  images: ImageMediaItem[];
};

export type ImageMediaFunctionArgs = {
  group: string;
  order?: number | null;
  title: string;
  images: Array<{image: string; label?: string; at: number}>;
};

export type ImageSourceKind = "url" | "local" | "prompt";

export type ClassifiedImageSource = {
  kind: ImageSourceKind;
  value: string;
};

export type ImageMediaItemState = {
  progress: number;
  visible: boolean;
};

export type ImageItemState = ImageMediaItemState;

export type ImageStackSpec = ImageMediaSpec;
export type ImageGridSpec = ImageMediaSpec;
