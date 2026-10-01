import {execFile} from "node:child_process";
import {promisify} from "node:util";

export type WebTranslationText = Readonly<{id: number; text: string}>;

type BingSession = Readonly<{ig: string; key: string; token: string}>;

const TRANSLATOR_PAGE = "https://www.bing.com/translator";
const MAX_BATCH_LENGTH = 850;
export const MAX_TRANSLATION_NODE_HTML_LENGTH = 800;
const TRANSLATION_CONCURRENCY = 3;
const execFileAsync = promisify(execFile);
const curl = process.platform === "win32" ? "curl.exe" : "curl";

const requestText = async (args: string[]): Promise<string> => {
  const {stdout} = await execFileAsync(curl, ["-L", "--max-time", "25", "-sS", "--fail", ...args], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (!stdout.trim()) throw new Error("网页翻译服务返回了空响应");
  return stdout;
};

const escapeHtml = (text: string): string => text
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

export const buildTranslationBatches = (texts: readonly WebTranslationText[]): string[] => {
  const batches: string[] = [];
  let batch = "";
  for (const {id, text} of texts) {
    const fragment = `<span data-sc-id="${id}">${escapeHtml(text)}</span>`;
    if (fragment.length > MAX_BATCH_LENGTH) throw new Error(`网页翻译文本节点过长: ${id}`);
    if (batch && batch.length + fragment.length > MAX_BATCH_LENGTH) {
      batches.push(batch);
      batch = "";
    }
    batch += fragment;
  }
  if (batch) batches.push(batch);
  return batches;
};

export const parseBingSession = (html: string): BingSession => {
  const ig = /\bIG:"([A-F0-9]+)"/.exec(html)?.[1];
  const credentials = /params_AbusePreventionHelper\s*=\s*\[(\d+),"([^"]+)"/.exec(html);
  if (!ig || !credentials) throw new Error("网页翻译服务没有返回有效会话");
  return {ig, key: credentials[1], token: credentials[2]};
};

const openBingSession = async (): Promise<BingSession> => {
  return parseBingSession(await requestText([TRANSLATOR_PAGE]));
};

const translateBatch = async (html: string, session: BingSession): Promise<string> => {
  const url = new URL("https://www.bing.com/ttranslatev3");
  url.searchParams.set("isVertical", "1");
  url.searchParams.set("IG", session.ig);
  url.searchParams.set("IID", "translator.5023");
  const body = {
    text: html,
    fromLang: "auto-detect",
    to: "zh-Hans",
    textType: "html",
    key: session.key,
    token: session.token,
  };
  const raw = await requestText(["-X", "POST", ...Object.entries(body).flatMap(([key, value]) => ["--data-urlencode", `${key}=${value}`]), url.href]);
  const data = JSON.parse(raw) as Array<{translations?: Array<{text?: unknown}>}>;
  const translated = data?.[0]?.translations?.[0]?.text;
  if (typeof translated !== "string" || !translated.trim()) throw new Error("网页翻译服务返回了空译文");
  return translated;
};

export const translateWebText = async (texts: readonly WebTranslationText[]): Promise<string[]> => {
  const batches = buildTranslationBatches(texts);
  if (!batches.length) return [];
  let session = await openBingSession();
  const translated = new Array<string>(batches.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < batches.length) {
      const index = next++;
      try {
        translated[index] = await translateBatch(batches[index], session);
      } catch {
        session = await openBingSession();
        translated[index] = await translateBatch(batches[index], session);
      }
    }
  };
  await Promise.all(Array.from({length: Math.min(TRANSLATION_CONCURRENCY, batches.length)}, worker));
  return translated;
};
