import {spawn} from "node:child_process";
import {mkdir, writeFile} from "node:fs/promises";
import {request} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import WebSocket from "ws";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(scriptDir);
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.join(projectRoot, "public", "web-news", "dom-demo");
const manifestDir = path.join(scriptDir, "dom-capture");
const profileDir = path.join(scriptDir, "chrome-dom-profile");
const url = process.argv[2] ?? "https://tokenstead.ai/guides/zcode-silent-git-history-upload";
const targetText = process.argv[3] ?? "313MB encrypted archive";
const port = 9241;
const viewport = {width: 1400, height: 900};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJson = (pathname) => new Promise((resolve, reject) => {
  const req = request({hostname: "127.0.0.1", port, path: pathname, timeout: 1500}, (res) => {
    let body = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => body += chunk);
    res.on("end", () => {
      try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
    });
  });
  req.on("timeout", () => req.destroy(new Error("HTTP timeout")));
  req.on("error", reject);
  req.end();
});

const waitForEndpoint = async () => {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const targets = await getJson("/json/list");
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome DevTools page endpoint did not start");
};

class CdpClient {
  constructor(wsUrl) {
    this.socket = new WebSocket(wsUrl);
    this.sequence = 0;
    this.pending = new Map();
    this.events = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.once("open", resolve);
      this.socket.once("error", reject);
    });
    this.socket.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (message.id && this.pending.has(message.id)) {
        const {resolve, reject, timer} = this.pending.get(message.id);
        clearTimeout(timer);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      const listeners = this.events.get(message.method) ?? [];
      listeners.forEach((listener) => listener(message.params));
    });
  }

  call(method, params = {}, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {resolve, reject, timer});
      this.socket.send(JSON.stringify({id, method, params}));
    });
  }

  waitFor(method, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const handler = (params) => {
        clearTimeout(timer);
        const listeners = this.events.get(method) ?? [];
        this.events.set(method, listeners.filter((listener) => listener !== handler));
        resolve(params);
      };
      const timer = setTimeout(() => {
        const listeners = this.events.get(method) ?? [];
        this.events.set(method, listeners.filter((listener) => listener !== handler));
        reject(new Error(`CDP event timeout: ${method}`));
      }, timeoutMs);
      this.events.set(method, [...(this.events.get(method) ?? []), handler]);
    });
  }

  close() {
    this.socket.close();
  }
}

await mkdir(outputDir, {recursive: true});
await mkdir(manifestDir, {recursive: true});
await mkdir(profileDir, {recursive: true});

const chromeProcess = spawn(chrome, [
  `--remote-debugging-port=${port}`,
  "--remote-debugging-address=127.0.0.1",
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--window-size=${viewport.width},${viewport.height}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], {stdio: ["ignore", "ignore", "pipe"]});

let chromeErrors = "";
chromeProcess.stderr.on("data", (data) => chromeErrors += data.toString());
let client;

try {
  const pageTarget = await waitForEndpoint();
  client = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await client.open();
  await client.call("Page.enable");
  await client.call("Runtime.enable");
  await client.call("Network.enable");
  await client.call("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const loaded = client.waitFor("Page.loadEventFired", 30000);
  await client.call("Page.navigate", {url});
  await loaded;
  await sleep(1200);

  const setupExpression = `(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete ? null : new Promise((resolve) => {
      image.addEventListener('load', resolve, {once: true});
      image.addEventListener('error', resolve, {once: true});
      setTimeout(resolve, 3000);
    })));

    const style = document.createElement('style');
    style.id = 'ai-hot-capture-style';
    style.textContent = \`
      html { scroll-behavior: auto !important; background: #080b0e !important; }
      *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
      ::highlight(ai-hot-focus) { background: rgba(48, 231, 145, .72); color: inherit; }
    \`;
    document.head.appendChild(style);

    const root = document.querySelector('article') || document.querySelector('main') || document.body;
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return node.data.length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let combined = '';
    while (walker.nextNode()) {
      const node = walker.currentNode;
      nodes.push({node, start: combined.length, end: combined.length + node.data.length});
      combined += node.data;
    }
    const target = ${JSON.stringify(targetText)};
    const start = combined.indexOf(target);
    if (start < 0) return {ok: false, reason: 'text-not-found', sample: combined.slice(0, 500)};
    const end = start + target.length;
    const startEntry = nodes.find((entry) => start >= entry.start && start < entry.end);
    const endEntry = nodes.find((entry) => end > entry.start && end <= entry.end);
    if (!startEntry || !endEntry) return {ok: false, reason: 'range-boundary-not-found'};

    const range = document.createRange();
    range.setStart(startEntry.node, start - startEntry.start);
    range.setEnd(endEntry.node, end - endEntry.start);
    window.__aiHotRange = range;
    (range.startContainer.parentElement || root).scrollIntoView({block: 'center', inline: 'nearest'});
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 250));

    const rects = [...range.getClientRects()]
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({x: rect.x, y: rect.y, width: rect.width, height: rect.height}));
    const union = rects.reduce((result, rect) => ({
      x: Math.min(result.x, rect.x),
      y: Math.min(result.y, rect.y),
      right: Math.max(result.right, rect.x + rect.width),
      bottom: Math.max(result.bottom, rect.y + rect.height),
    }), {x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity});
    return {
      ok: rects.length > 0,
      title: document.title,
      text: range.toString(),
      rects,
      unionRect: {x: union.x, y: union.y, width: union.right - union.x, height: union.bottom - union.y},
      viewport: {width: innerWidth, height: innerHeight, deviceScaleFactor: devicePixelRatio},
      scroll: {x: scrollX, y: scrollY},
    };
  })()`;

  const setup = await client.call("Runtime.evaluate", {
    expression: setupExpression,
    awaitPromise: true,
    returnByValue: true,
  }, 30000);
  const geometry = setup.result.value;
  if (!geometry?.ok) throw new Error(`DOM highlight lookup failed: ${JSON.stringify(geometry)}`);
  if (geometry.text !== targetText) throw new Error(`DOM range mismatch: ${JSON.stringify(geometry.text)}`);

  const capture = async (filename) => {
    const result = await client.call("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    await writeFile(path.join(outputDir, filename), Buffer.from(result.data, "base64"));
  };

  await capture("base.png");
  const highlightResult = await client.call("Runtime.evaluate", {
    expression: `(() => {
      if (!window.__aiHotRange || !CSS.highlights || typeof Highlight === 'undefined') return false;
      CSS.highlights.set('ai-hot-focus', new Highlight(window.__aiHotRange));
      return true;
    })()`,
    returnByValue: true,
  });
  if (!highlightResult.result.value) throw new Error("CSS Highlight API is unavailable");
  await sleep(250);
  await capture("highlighted.png");

  const manifest = {
    url,
    title: geometry.title,
    text: targetText,
    viewport: geometry.viewport,
    scroll: geometry.scroll,
    rects: geometry.rects,
    unionRect: geometry.unionRect,
    baseImage: "web-news/dom-demo/base.png",
    highlightedImage: "web-news/dom-demo/highlighted.png",
  };
  await writeFile(path.join(manifestDir, "capture.json"), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
} catch (error) {
  if (chromeErrors.trim()) console.error(chromeErrors.trim());
  throw error;
} finally {
  client?.close();
  chromeProcess.kill();
}
