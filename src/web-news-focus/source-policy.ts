export const MAJOR_NEWS_HOSTS = new Set([
  "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "techcrunch.com",
  "theverge.com", "arstechnica.com", "technologyreview.com", "bloomberg.com",
  "ft.com", "wsj.com", "nytimes.com", "washingtonpost.com", "theguardian.com",
  "cnbc.com", "wired.com", "axios.com", "scmp.com", "nikkei.com",
  "news.cn", "xinhuanet.com", "people.com.cn", "cctv.com", "cnr.cn",
  "gmw.cn", "chinanews.com.cn", "chinanews.com", "caixin.com", "yicai.com", "stcn.com",
  "thepaper.cn", "jiemian.com", "36kr.com",
]);

const DISALLOWED_PAGE_HOSTS = new Set([
  "weibo.com", "medium.com", "substack.com", "zhihu.com", "toutiao.com",
  "reddit.com", "quora.com", "juejin.cn", "bilibili.com", "feedly.com",
  "ground.news", "news.google.com", "duckduckgo.com", "bing.com", "weibo.cn",
  "baijiahao.baidu.com", "mp.weixin.qq.com", "blog.sina.com.cn", "blog.csdn.net",
]);

const hostMatches = (hostname: string, domain: string): boolean =>
  hostname === domain || hostname.endsWith(`.${domain}`);

const parsedWebUrl = (value: string): URL | undefined => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (url.username || url.password) return undefined;
    return url;
  } catch {
    return undefined;
  }
};

const isSearchResultsPage = (url: URL, hostname: string): boolean =>
  /^(?:www\.)?google\.[a-z.]+$/.test(hostname)
  || (hostMatches(hostname, "baidu.com") && /^\/(?:s|sf|from)(?:\/|$)/.test(url.pathname))
  || hostname === "search.yahoo.com";

const isPersonalMediaSection = (url: URL, hostname: string): boolean =>
  /^(?:blog|blogs|forum|forums)\./.test(hostname)
  || (hostMatches(hostname, "thepaper.cn") && /^\/newsDetail_forward_/.test(url.pathname) && url.searchParams.get("channel") === "baijia")
  || (hostMatches(hostname, "people.com.cn") && /^(?:blog|bbs|t)\./.test(hostname));

export const isMajorNewsSource = (value: string): boolean => {
  const url = parsedWebUrl(value);
  if (!url) return false;
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (isSearchResultsPage(url, hostname) || isPersonalMediaSection(url, hostname)) return false;
  return [...MAJOR_NEWS_HOSTS].some((domain) => hostMatches(hostname, domain));
};

export const isEligibleWebPageSource = (value: string): boolean => {
  const url = parsedWebUrl(value);
  if (!url) return false;
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (isSearchResultsPage(url, hostname)) return false;
  if ([...DISALLOWED_PAGE_HOSTS].some((domain) => hostMatches(hostname, domain))) return false;
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")
    || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith("[")) return false;
  if (/(?:^|\.)blogspot\./.test(hostname) || /(?:^|\.)wordpress\./.test(hostname)) return false;
  if (hostMatches(hostname, "x.com") || hostMatches(hostname, "twitter.com")) {
    return /^\/[A-Za-z0-9_]+\/status\/\d+(?:\/|$)/.test(url.pathname);
  }
  return true;
};
