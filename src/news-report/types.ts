export type NewsReportPage = {
  image: string;
  source?: string;
  title?: string;
};

export type NewsReportSpec = {
  /** Scene-local second at which the first paper enters. */
  at: number;
  pages: NewsReportPage[];
};
