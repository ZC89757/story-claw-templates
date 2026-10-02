export type NewsEntrance = "fade" | "slide-right" | "cut";

export type NewsWebHighlight = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  at: number;
};

export type NewsWebSpec = {
  url: string;
  screenshot: string;
  viewport: {width: number; height: number};
  highlights: NewsWebHighlight[];
  entrance: NewsEntrance;
};

export const demoSpecs: NewsWebSpec[] = [
  {
    url: "https://tokenstead.ai/guides/zcode-silent-git-history-upload",
    screenshot: "web-news/zcode-real.png",
    viewport: {width: 1280, height: 1800},
    entrance: "fade",
    highlights: [{text: "313MB encrypted archive", x: 560, y: 700, width: 420, height: 35, at: 1.4}],
  },
  {
    url: "https://tokenstead.ai/guides/zcode-silent-git-history-upload",
    screenshot: "web-news/zcode-real.png",
    viewport: {width: 1280, height: 1800},
    entrance: "slide-right",
    highlights: [{text: "313MB encrypted archive", x: 560, y: 700, width: 420, height: 35, at: 1.4}],
  },
  {
    url: "https://tokenstead.ai/guides/zcode-silent-git-history-upload",
    screenshot: "web-news/zcode-real.png",
    viewport: {width: 1280, height: 1800},
    entrance: "cut",
    highlights: [{text: "313MB encrypted archive", x: 560, y: 700, width: 420, height: 35, at: 1.4}],
  },
];
