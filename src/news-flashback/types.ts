export type NewsFlashbackPage = {
  image: string;
  source?: string;
  title?: string;
};

export type NewsFlashbackSpec = {
  /** 中央那句被资料支撑的文字，逐字来自 HTML 标签内容。 */
  text: string;
  /** Scene-local second at which the projector starts. */
  at: number;
  /** 2-12 张真实网页截图，翻页展示。 */
  pages: NewsFlashbackPage[];
};
