import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {openBrowser} from "@remotion/renderer";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = process.argv[2]; if (!episode || !path.isAbsolute(episode)) throw new Error("Pass the absolute episode directory");
const htmlFile = process.argv[3] ?? "mg_annotation_v4.html";
const output = path.join(root, "out", "explainer-review"); await fs.mkdir(output, {recursive: true});
const browser = await openBrowser("chrome");
const results: unknown[] = [];
try {
  const page = await browser.newPage({context: null, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined});
  for (const width of [1440, 960]) {
    await page.setViewport({width, height: 900, deviceScaleFactor: 1});
    await page.goto({url: pathToFileURL(path.join(episode, htmlFile)).href, timeout: 30000});
    const check = await page.evaluate(() => {
      const article = document.querySelector("article")!;
      const tags = [...article.querySelectorAll("[group]")];
      const redDots = tags.filter((tag) => getComputedStyle(tag, "::before").backgroundImage.includes("radial-gradient")).length;
      const issues: string[] = [];
      let uncoveredCharacters = 0;
      const textWalker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
      let textNode: Node | null;
      while ((textNode = textWalker.nextNode())) {
        if (!textNode.parentElement?.closest("[group]")) uncoveredCharacters += (textNode.textContent ?? "").replace(/\s/g, "").length;
      }
      if (uncoveredCharacters) issues.push("uncovered narration text");
      if (tags.length !== 64) issues.push("instance count changed");
      if (redDots !== 0) issues.push("implemented templates still show pending red dots");
      for (const tag of tags) {
        const css = getComputedStyle(tag);
        if (css.borderBottomStyle !== "solid" || css.borderBottomWidth !== "2px") issues.push(`underline missing: ${tag.tagName}`);
        if (getComputedStyle(tag, "::before").content === "none") issues.push(`badge missing: ${tag.tagName}`);
      }
      return {width: window.innerWidth, instances: tags.length, redDots, uncoveredCharacters, horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth, body: article.textContent, issues};
    });
    const source = await fs.readFile(path.join(episode, "原文_clean.txt"), "utf8");
    const {body, ...report} = check; const sourceTextExact = body.replace(/\s/g, "") === source.replace(/\s/g, "");
    if (!sourceTextExact || check.issues.length || check.horizontalOverflow) throw new Error(JSON.stringify(report));
    const screenshot = await page._client().send("Page.captureScreenshot", {format: "png"});
    await fs.writeFile(path.join(output, `review-${width}.png`), Buffer.from(screenshot.value.data, "base64"));
    const hoverChecks: Record<string, string> = {};
    for (const selector of ["article mg-canvas", "article image-directed-graph"]) {
      const position = await page.evaluate((target: string) => {const element = document.querySelector(target)!; element.scrollIntoView({block: "center"}); const r = element.getClientRects()[0]; return {x: r.x + 3, y: r.y + 3};}, selector);
      await page._client().send("Input.dispatchMouseEvent", {type: "mouseMoved", x: position.x, y: position.y});
      const tooltip = await page.evaluate((target: string) => getComputedStyle(document.querySelector(target)!, "::after").content, selector);
      if (tooltip === "none" || tooltip === '""') throw new Error(`Tooltip missing: ${selector}`);
      hoverChecks[selector] = tooltip.slice(0, 100);
    }
    results.push({htmlFile, ...report, sourceTextExact, hoverChecks});
  }
} finally {await browser.close({silent: true});}
await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
