import {spawn, spawnSync, type ChildProcess} from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import WebSocket from "ws";
import type {
  WebNewsFocusCapture,
  WebNewsFocusCaptureHighlight,
} from "./types";
import type {WebPageFocusCapture} from "../web-page-focus/types";
import {isEligibleWebPageSource, isMajorNewsSource} from "./source-policy";
import {MAX_TRANSLATION_NODE_HTML_LENGTH, translateWebText, type WebTranslationText} from "./translate";

type CaptureRequest = Readonly<{
  url: string;
  highlights: readonly string[];
  applyHighlight?: boolean;
}>;

export type WebNewsFocusCaptureFiles = Readonly<{
  basePath: string;
  highlightedPath: string;
  metadata: Omit<WebNewsFocusCapture, "baseImage" | "highlightedImage">;
  temporaryDirectory: string;
}>;

type JsonTarget = {
  type: string;
  webSocketDebuggerUrl?: string;
};

type CdpMessage = {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: any;
  error?: {message?: string};
};

const DEFAULT_VIEWPORT = {width: 1400, height: 900, deviceScaleFactor: 1};
const BROWSER_METRICS = {...DEFAULT_VIEWPORT, mobile: false};
const MAX_FULL_PAGE_HEIGHT = 12000;

const sleep = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForExit = async (child: ChildProcess): Promise<void> => {
  if (child.exitCode !== null) return;
  await Promise.race([
    new Promise<void>((resolve) => child.once("exit", () => resolve())),
    sleep(1200),
  ]);
};

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const findChromeExecutable = async (): Promise<string> => {
  const candidates = [
    process.env.STORY_CLAW_CHROME_PATH,
    process.env.CHROME_PATH,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe") : undefined,
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "Google", "Chrome", "Application", "chrome.exe") : undefined,
    process.env["ProgramFiles(x86)"] ? path.join(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe") : undefined,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "Application", "msedge.exe") : undefined,
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "Microsoft", "Edge", "Application", "msedge.exe") : undefined,
  ].filter((candidate): candidate is string => Boolean(candidate));
  if (process.platform === "win32") {
    const result = spawnSync("where.exe", ["chrome.exe"], {encoding: "utf8", windowsHide: true});
    if (result.status === 0) candidates.push(...result.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean));
    const edgeResult = spawnSync("where.exe", ["msedge.exe"], {encoding: "utf8", windowsHide: true});
    if (edgeResult.status === 0) candidates.push(...edgeResult.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean));
  }
  for (const candidate of [...new Set(candidates)]) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return candidate;
    } catch {
      // Continue through the platform-specific candidates.
    }
  }
  throw new Error("找不到 Chrome 或 Edge。可设置 STORY_CLAW_CHROME_PATH 指向浏览器可执行文件。");
};

const getFreePort = async (): Promise<number> => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    server.close((error) => error ? reject(error) : resolve(port));
  });
});

const getJson = async (url: string): Promise<any> => {
  const response = await fetch(url, {signal: AbortSignal.timeout(1500)});
  if (!response.ok) throw new Error(`Chrome DevTools HTTP ${response.status}`);
  return response.json();
};

const waitForPageTarget = async (port: number, child: ChildProcess): Promise<JsonTarget> => {
  let lastError = "";
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error(`浏览器启动失败（退出码 ${child.exitCode}）`);
    try {
      const targets = await getJson(`http://127.0.0.1:${port}/json/list`) as JsonTarget[];
      const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page) return page;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(150);
  }
  throw new Error(`Chrome DevTools page endpoint did not start${lastError ? `: ${lastError}` : ""}`);
};

class CdpClient {
  private readonly socket: WebSocket;
  private sequence = 0;
  private readonly pending = new Map<number, {method: string; resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout}>();
  private readonly events = new Map<string, Set<(params: Record<string, unknown>) => void>>();

  public constructor(webSocketUrl: string) {
    this.socket = new WebSocket(webSocketUrl);
  }

  public async open(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const onOpen = () => { cleanup(); resolve(); };
      const onError = (error: Error) => { cleanup(); reject(error); };
      const cleanup = () => {
        this.socket.off("open", onOpen);
        this.socket.off("error", onError);
      };
      this.socket.once("open", onOpen);
      this.socket.once("error", onError);
    });
    this.socket.on("message", (data) => {
      const message = JSON.parse(data.toString()) as CdpMessage;
      if (message.id !== undefined && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id)!;
        clearTimeout(pending.timer);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message ?? "Chrome DevTools command failed"}`));
        else pending.resolve(message.result);
        return;
      }
      if (!message.method) return;
      for (const listener of this.events.get(message.method) ?? []) listener(message.params ?? {});
    });
  }

  public call(method: string, params: Record<string, unknown> = {}, timeoutMs = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {method, resolve, reject, timer});
      this.socket.send(JSON.stringify({id, method, params}));
    });
  }

  public waitFor(method: string, timeoutMs = 30000): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const listener = (params: Record<string, unknown>) => {
        clearTimeout(timer);
        this.events.get(method)?.delete(listener);
        resolve(params);
      };
      const timer = setTimeout(() => {
        this.events.get(method)?.delete(listener);
        reject(new Error(`CDP event timeout: ${method}`));
      }, timeoutMs);
      const listeners = this.events.get(method) ?? new Set();
      listeners.add(listener);
      this.events.set(method, listeners);
    });
  }

  public close(): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Chrome DevTools connection closed"));
    }
    this.pending.clear();
    this.socket.close();
  }
}

const settlePage = async (client: CdpClient): Promise<void> => {
  await client.call("Runtime.evaluate", {
    expression: "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    awaitPromise: true,
    returnByValue: true,
  }, 10000);
  await sleep(180);
};

const preparePage = async (client: CdpClient, request: CaptureRequest): Promise<WebTranslationText[]> => {
  const targets = JSON.stringify(request.highlights);
  const expression = `(async (targets) => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete ? null : new Promise((resolve) => {
      image.addEventListener('load', resolve, {once: true});
      image.addEventListener('error', resolve, {once: true});
      setTimeout(resolve, 4000);
    })));
    const contentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
    if (contentHeight > ${MAX_FULL_PAGE_HEIGHT}) {
      return {ok: false, reason: 'page-too-long', contentHeight, maxHeight: ${MAX_FULL_PAGE_HEIGHT}, title: document.title};
    }
    for (const block of document.querySelectorAll('p, h1, h2, h3, h4, li, blockquote')) {
      const language = block.getAttribute('lang');
      if (language && !document.documentElement.lang.toLowerCase().startsWith(language.toLowerCase())) continue;
      if (block.querySelector('a, img, svg, br, code, em, strong')) continue;
      const spans = [...block.querySelectorAll('span')];
      if (spans.length < 20 || !spans.every((span) => !span.children.length && (span.textContent || '').length <= 3)) continue;
      block.replaceChildren(document.createTextNode(block.textContent || ''));
    }
    const primaryRoot = document.querySelector('article') || document.querySelector('[role="main"]') || document.querySelector('main') || document.body;
    const collectText = (root) => {
      const nodes = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (parent.closest('nav, footer, aside, [aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
          if (!node.data.length || parent.getClientRects().length === 0) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let combined = '';
      while (walker.nextNode()) {
        const node = walker.currentNode;
        nodes.push({node, start: combined.length, end: combined.length + node.data.length});
        combined += node.data;
      }
      return {nodes, combined};
    };
    const primaryText = collectText(primaryRoot);
    const bodyText = primaryRoot === document.body ? primaryText : collectText(document.body);
    const locateTargets = (textIndex) => {
      const {nodes, combined} = textIndex;
      const used = [];
      const ranges = [];
      for (const target of targets) {
        let start = -1;
        let searchFrom = 0;
        while (searchFrom <= combined.length) {
          const candidate = combined.indexOf(target, searchFrom);
          if (candidate < 0) break;
          const candidateEnd = candidate + target.length;
          if (!used.some((span) => candidate < span.end && candidateEnd > span.start)) { start = candidate; break; }
          searchFrom = candidate + 1;
        }
        if (start < 0) return {error: {ok: false, reason: 'text-not-found', target, sample: combined.slice(0, 800), title: document.title}};
        const end = start + target.length;
        const startEntry = nodes.find((entry) => start >= entry.start && start < entry.end);
        const endEntry = nodes.find((entry) => end > entry.start && end <= entry.end);
        if (!startEntry || !endEntry) return {error: {ok: false, reason: 'range-boundary-not-found', target}};
        const range = document.createRange();
        range.setStart(startEntry.node, start - startEntry.start);
        range.setEnd(endEntry.node, end - endEntry.start);
        ranges.push({target, range});
        used.push({start, end});
      }
      return {ranges};
    };
    const primaryLocated = locateTargets(primaryText);
    const located = primaryLocated.error ? locateTargets(bodyText) : primaryLocated;
    if (located.error) return located.error;
    for (let index = located.ranges.length - 1; index >= 0; index--) {
      const range = located.ranges[index].range;
      const startRange = range.cloneRange();
      startRange.collapse(true);
      const endRange = range.cloneRange();
      endRange.collapse(false);
      const end = document.createElement('span');
      end.dataset.scFocusEnd = String(index);
      endRange.insertNode(end);
      const start = document.createElement('span');
      start.dataset.scFocusStart = String(index);
      startRange.insertNode(start);
    }
    const candidates = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, noscript, template, svg, code, pre, kbd, textarea, option, [aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
        if (!node.data.trim() || parent.getClientRects().length === 0 || !/[A-Za-z]{2}|[\u3040-\u30ff\uac00-\ud7af]/.test(node.data)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) candidates.push(walker.currentNode);
    const nodes = [];
    const escapedLength = (text) => text.replace(/[&<>"']/g, (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character])).length;
    for (const candidate of candidates) {
      let node = candidate;
      while (node.data.length > 600 || escapedLength(node.data) > ${MAX_TRANSLATION_NODE_HTML_LENGTH}) {
        let low = 1;
        let high = Math.min(600, node.data.length - 1);
        while (low < high) {
          const middle = Math.ceil((low + high) / 2);
          if (escapedLength(node.data.slice(0, middle)) <= ${MAX_TRANSLATION_NODE_HTML_LENGTH}) low = middle;
          else high = middle - 1;
        }
        const codeUnit = node.data.charCodeAt(low - 1);
        const boundary = low > 1 && codeUnit >= 0xD800 && codeUnit <= 0xDBFF ? low - 1 : low;
        const rest = node.splitText(boundary);
        nodes.push(node);
        node = rest;
      }
      nodes.push(node);
    }
    if (nodes.length > 1200 || nodes.reduce((length, node) => length + node.data.length, 0) > 100000) {
      return {ok: false, reason: 'page-text-too-large', textNodes: nodes.length};
    }
    window.__storyClawWebFocusTranslationNodes = nodes;
    const texts = nodes.map((node, id) => ({id, text: node.data}));
    if (/[A-Za-z]{2}|[\u3040-\u30ff\uac00-\ud7af]/.test(document.title)
      && escapedLength(document.title) <= ${MAX_TRANSLATION_NODE_HTML_LENGTH}) texts.push({id: -1, text: document.title});
    return {ok: true, texts};
  })(${targets})`;
  const result = await client.call("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true}, 45000);
  const prepared = result?.result?.value;
  if (!prepared?.ok) throw new Error(`网页 DOM 原文定位失败: ${JSON.stringify(prepared)}`);
  return prepared.texts as WebTranslationText[];
};

const applyPageTranslation = async (client: CdpClient, texts: readonly WebTranslationText[], htmlBatches: readonly string[]): Promise<void> => {
  if (!texts.length) return;
  const expression = `(() => {
    const expected = ${JSON.stringify(texts)};
    const htmlBatches = ${JSON.stringify(htmlBatches)};
    const translations = new Map();
    for (const html of htmlBatches) {
      const template = document.createElement('template');
      template.innerHTML = html;
      for (const element of template.content.querySelectorAll('span[data-sc-id]')) {
        const id = Number(element.getAttribute('data-sc-id'));
        if (!Number.isInteger(id) || translations.has(id)) return {ok: false, reason: 'duplicate-or-invalid-translation-id', id};
        translations.set(id, element.textContent || '');
      }
    }
    if (translations.size !== expected.length || expected.some((item) => !translations.has(item.id))) {
      return {ok: false, reason: 'missing-translated-text', expected: expected.length, actual: translations.size};
    }
    const sourceLatin = expected.reduce((count, item) => count + (item.text.match(/[A-Za-z]/g) || []).length, 0);
    const translatedHan = [...translations.values()].reduce((count, value) => count + (value.match(/[\u4e00-\u9fff]/g) || []).length, 0);
    if (sourceLatin > 200 && translatedHan < 15) return {ok: false, reason: 'translation-did-not-produce-chinese'};
    const nodes = window.__storyClawWebFocusTranslationNodes;
    if (!Array.isArray(nodes)) return {ok: false, reason: 'translation-nodes-lost'};
    for (const item of expected) {
      if (item.id === -1) continue;
      const node = nodes[item.id];
      if (!node?.isConnected) return {ok: false, reason: 'translation-node-detached', id: item.id};
      node.data = translations.get(item.id);
    }
    if (translations.has(-1)) document.title = translations.get(-1);
    document.documentElement.lang = 'zh-CN';
    return {ok: true};
  })()`;
  const result = await client.call("Runtime.evaluate", {expression, returnByValue: true}, 45000);
  if (!result?.result?.value?.ok) throw new Error(`网页翻译应用失败: ${JSON.stringify(result?.result?.value)}`);
};

const measurePage = async (client: CdpClient, request: CaptureRequest) => {
  const targets = JSON.stringify(request.highlights);
  const expression = `(async (targets) => {
    await document.fonts.ready;
    let style = document.getElementById('story-claw-web-news-focus-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'story-claw-web-news-focus-style';
      style.textContent = 'html { scroll-behavior: auto !important; } *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; } ::highlight(story-claw-web-news-focus) { background: rgba(255, 209, 55, .82); color: inherit; text-decoration: underline; text-decoration-color: rgba(255, 180, 0, .92); text-decoration-thickness: 2px; text-underline-offset: 2px; }';
      document.head.appendChild(style);
    }
    const ranges = targets.map((target, index) => {
      const start = document.querySelector('[data-sc-focus-start="' + index + '"]');
      const end = document.querySelector('[data-sc-focus-end="' + index + '"]');
      if (!start || !end) return null;
      const range = document.createRange();
      range.setStartAfter(start);
      range.setEndBefore(end);
      return range;
    });
    if (ranges.some((range) => !range)) return {ok: false, reason: 'translated-anchor-lost'};
    for (let index = 0; index < ranges.length; index++) {
      if ((targets[index].match(/[A-Za-z]/g) || []).length < 20) continue;
      if (!/[\u4e00-\u9fff]/.test(ranges[index].toString())) {
        return {ok: false, reason: 'anchor-was-not-translated', target: targets[index]};
      }
    }
    window.__storyClawWebNewsFocusRanges = ranges;
    window.scrollTo(0, 0);
    const documentRects = ranges.map((range) => [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => ({x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height})));
    if (documentRects.some((rects) => !rects.length)) return {ok: false, reason: 'translated-anchor-empty'};
    const contentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
    if (contentHeight > ${MAX_FULL_PAGE_HEIGHT}) return {ok: false, reason: 'translated-page-too-long', contentHeight, maxHeight: ${MAX_FULL_PAGE_HEIGHT}};
    const makeUnion = (items) => {
      const left = Math.min(...items.map((rect) => rect.x));
      const top = Math.min(...items.map((rect) => rect.y));
      const right = Math.max(...items.map((rect) => rect.x + rect.width));
      const bottom = Math.max(...items.map((rect) => rect.y + rect.height));
      return {x: left, y: top, width: right - left, height: bottom - top};
    };
    return {
      ok: true,
      title: document.title,
      mode: 'full-page',
      screenshotWidth: innerWidth,
      screenshotHeight: Math.ceil(contentHeight),
      scroll: {x: 0, y: 0},
      highlights: ranges.map((range, index) => ({text: targets[index], rects: documentRects[index], unionRect: makeUnion(documentRects[index])})),
    };
  })(${targets})`;
  const result = await client.call("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true}, 45000);
  const geometry = result?.result?.value;
  if (!geometry?.ok) throw new Error(`网页译后重点定位失败: ${JSON.stringify(geometry)}`);
  return geometry as {
    title: string;
    mode: "viewport" | "full-page";
    screenshotWidth: number;
    screenshotHeight: number;
    scroll: {x: number; y: number};
    highlights: WebNewsFocusCaptureHighlight[];
  };
};

const captureScreenshot = async (client: CdpClient, geometry: {mode: "viewport" | "full-page"; screenshotWidth: number; screenshotHeight: number}): Promise<Buffer> => {
  const result = await client.call("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: geometry.mode === "full-page",
    ...(geometry.mode === "full-page" ? {clip: {x: 0, y: 0, width: geometry.screenshotWidth, height: geometry.screenshotHeight, scale: 1}} : {}),
  }, 60000);
  return Buffer.from(result.data, "base64");
};

const applyHighlights = async (client: CdpClient): Promise<void> => {
  const result = await client.call("Runtime.evaluate", {
    expression: `(() => {
      const ranges = window.__storyClawWebNewsFocusRanges;
      if (!Array.isArray(ranges) || !globalThis.CSS?.highlights || typeof globalThis.Highlight === 'undefined') return false;
      globalThis.CSS.highlights.set('story-claw-web-news-focus', new globalThis.Highlight(...ranges));
      return true;
    })()`,
    returnByValue: true,
  });
  if (!result?.result?.value) throw new Error("当前浏览器不支持 CSS Highlight API");
};

const captureWebFocus = async (request: CaptureRequest): Promise<WebNewsFocusCaptureFiles> => {
  if (!isHttpUrl(request.url)) throw new Error(`网页 URL 必须是 http(s): ${request.url}`);
  if (!request.highlights.length) throw new Error("网页重点模板至少需要一个定位原文");
  const sourceIsAllowed = request.applyHighlight === false ? isEligibleWebPageSource : isMajorNewsSource;
  if (!sourceIsAllowed(request.url)) throw new Error(`网页来源不符合模板要求: ${request.url}`);
  const executable = await findChromeExecutable();
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "story-claw-web-news-"));
  const profileDirectory = path.join(temporaryDirectory, "profile");
  await fs.mkdir(profileDirectory, {recursive: true});
  const port = await getFreePort();
  const child = spawn(executable, [
    `--remote-debugging-port=${port}`,
    "--remote-debugging-address=127.0.0.1",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${DEFAULT_VIEWPORT.width},${DEFAULT_VIEWPORT.height}`,
    `--user-data-dir=${profileDirectory}`,
    "about:blank",
  ], {stdio: ["ignore", "ignore", "pipe"], windowsHide: true});
  let chromeErrors = "";
  child.stderr?.on("data", (data) => { chromeErrors += data.toString(); });
  let client: CdpClient | undefined;
  let completed = false;
  try {
    const target = await waitForPageTarget(port, child);
    if (!target.webSocketDebuggerUrl) throw new Error("Chrome DevTools 没有返回页面 WebSocket 地址");
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.open();
    await client.call("Page.enable");
    await client.call("Runtime.enable");
    await client.call("Network.enable");
    await client.call("Emulation.setDeviceMetricsOverride", BROWSER_METRICS);
    const loadEvent = client.waitFor("Page.loadEventFired", 30000).catch(() => undefined);
    await client.call("Page.navigate", {url: request.url}, 30000);
    await loadEvent;
    await sleep(1200);
    await settlePage(client);
    const locationResult = await client.call("Runtime.evaluate", {expression: "location.href", returnByValue: true});
    const finalUrl = locationResult?.result?.value;
    if (typeof finalUrl !== "string" || !sourceIsAllowed(finalUrl)) {
      throw new Error(`网页跳转后来源不符合模板要求: ${String(finalUrl)}`);
    }
    const texts = await preparePage(client, request);
    const translatedHtml = await translateWebText(texts);
    await applyPageTranslation(client, texts, translatedHtml);
    await settlePage(client);
    const geometry = await measurePage(client, request);
    const base = await captureScreenshot(client, geometry);
    const basePath = path.join(temporaryDirectory, "base.png");
    const highlightedPath = request.applyHighlight === false ? basePath : path.join(temporaryDirectory, "highlighted.png");
    await fs.writeFile(basePath, base);
    if (request.applyHighlight !== false) {
      await applyHighlights(client);
      await sleep(220);
      const highlighted = await captureScreenshot(client, geometry);
      await fs.writeFile(highlightedPath, highlighted);
    }
    const metadata: Omit<WebNewsFocusCapture, "baseImage" | "highlightedImage"> = {
      url: finalUrl,
      title: geometry.title,
      viewport: {
        width: geometry.screenshotWidth,
        height: geometry.screenshotHeight,
        deviceScaleFactor: DEFAULT_VIEWPORT.deviceScaleFactor,
      },
      scroll: geometry.scroll,
      highlights: geometry.highlights,
    };
    completed = true;
    return {basePath, highlightedPath, metadata, temporaryDirectory};
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${detail}${chromeErrors.trim() ? `\nChrome: ${chromeErrors.trim()}` : ""}`);
  } finally {
    client?.close();
    if (!child.killed) child.kill();
    await waitForExit(child);
    if (!completed) await fs.rm(temporaryDirectory, {recursive: true, force: true, maxRetries: 12, retryDelay: 250}).catch(() => undefined);
  }
};

export const captureWebNewsFocus = async (request: Omit<CaptureRequest, "applyHighlight">): Promise<WebNewsFocusCaptureFiles> =>
  captureWebFocus({...request, applyHighlight: true});

export type WebPageFocusCaptureFiles = Readonly<{
  basePath: string;
  metadata: Omit<WebPageFocusCapture, "baseImage">;
  temporaryDirectory: string;
}>;

export const captureWebPageFocus = async (request: {url: string; focus: readonly string[]}): Promise<WebPageFocusCaptureFiles> => {
  const captured = await captureWebFocus({url: request.url, highlights: request.focus, applyHighlight: false});
  return {
    basePath: captured.basePath,
    metadata: {
      url: captured.metadata.url,
      title: captured.metadata.title,
      viewport: captured.metadata.viewport,
      scroll: captured.metadata.scroll,
      focus: captured.metadata.highlights,
    },
    temporaryDirectory: captured.temporaryDirectory,
  };
};
