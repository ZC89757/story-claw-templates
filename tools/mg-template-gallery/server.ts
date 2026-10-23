import {createReadStream} from "node:fs";
import {stat} from "node:fs/promises";
import http, {type ServerResponse} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {MG_STYLE_CATALOG, MG_TEMPLATE_USAGE, getMgTemplateProvider} from "../../src/index.ts";
const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../..");
const indexPath = path.join(here, "index.html");
const previewRoot = path.join(packageRoot, "public", "mg-previews");
const logoPath = path.join(packageRoot, "public", "storyclaw-logo-v6-ui.png");
const clientPath = path.join(here, "public", "app.js");
const cssPath = path.join(here, "gallery.css");

const sendJson = (response: ServerResponse, status: number, value: unknown) => {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(value));
};

const serveFile = async (request: http.IncomingMessage, response: ServerResponse, filePath: string, contentType: string) => {
  const info = await stat(filePath);
  const range = request.headers.range;
  response.setHeader("accept-ranges", "bytes");
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-type", contentType);
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      response.writeHead(416, {"content-range": `bytes */${info.size}`});
      response.end();
      return;
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) {
      response.writeHead(416, {"content-range": `bytes */${info.size}`});
      response.end();
      return;
    }
    response.writeHead(206, {
      "content-range": `bytes ${start}-${end}/${info.size}`,
      "content-length": end - start + 1,
    });
    createReadStream(filePath, {start, end}).pipe(response);
    return;
  }
  response.writeHead(200, {"content-length": info.size});
  createReadStream(filePath).pipe(response);
};

const readCurrentCatalog = async () => {
  const provider = getMgTemplateProvider();
  const usageByTemplate = new Map(MG_TEMPLATE_USAGE.map((item) => [item.template, item.useWhen]));
  return MG_STYLE_CATALOG.map((entry) => ({
    ...entry,
    useWhen: usageByTemplate.get(entry.template) ?? "原文存在适合该动画结构的明确语义",
    previewFile: `/previews/${entry.template}-${entry.style}.mp4`,
    examples: ["production-chain", "numeric-comparison"].includes(entry.template) ? [{label:"汽车",id:"automotive"},{label:"半导体",id:"semiconductor"},{label:"咖啡",id:"coffee"}].map(d=>({label:d.label,file:`/previews/documentary-demo-${d.id}.mp4`})) : [],
    layerRole: entry.renderMode === "overlay" ? "overlay" : "scene",
    planningTools: provider.getPlanningTools([entry.htmlTag]).map((tool) => ({
      name: tool.name,
      label: tool.label,
      description: tool.description,
      parameters: tool.parameters,
    })),
  }));
};

export const startMgTemplateGalleryServer = async (port = 0) => {
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname === "/api/catalog") {
        sendJson(response, 200, await readCurrentCatalog());
        return;
      }
      if (url.pathname === "/api/health") {
        sendJson(response, 200, {ok: true});
        return;
      }
      if (url.pathname === "/" || url.pathname === "/index.html") {
        await serveFile(request, response, indexPath, "text/html; charset=utf-8");
        return;
      }
      if (url.pathname === "/assets/logo.png") {
        await serveFile(request, response, logoPath, "image/png");
        return;
      }
      if (url.pathname === "/gallery/app.js") {
        await serveFile(request, response, clientPath, "text/javascript; charset=utf-8");
        return;
      }
      if (url.pathname === "/gallery/gallery.css") {
        await serveFile(request, response, cssPath, "text/css; charset=utf-8");
        return;
      }
      if (url.pathname.startsWith("/previews/")) {
        const fileName = path.basename(decodeURIComponent(url.pathname));
        if (!/^[A-Za-z0-9._-]+\.mp4$/.test(fileName)) throw new Error("invalid preview path");
        await serveFile(request, response, path.join(previewRoot, fileName), "video/mp4");
        return;
      }
      sendJson(response, 404, {error: "not found"});
    } catch (error) {
      sendJson(response, 500, {error: error instanceof Error ? error.message : String(error)});
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("无法取得 MG 预览服务端口");
  return {server, url: `http://127.0.0.1:${address.port}/`};
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const portArg = process.argv.find((value) => value.startsWith("--port="));
  const port = portArg ? Number(portArg.slice("--port=".length)) : 41731;
  startMgTemplateGalleryServer(Number.isInteger(port) ? port : 41731).then(({url}) => {
    console.log(`MG 模板实时预览服务：${url}`);
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
