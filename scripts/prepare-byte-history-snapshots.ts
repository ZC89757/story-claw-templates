/** Save the real site's selected carousel states, without changing site content. */
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {openBrowser} from "@remotion/renderer";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(root, "../story-claw");
const runtime = "D:/StoryClawByteDancePreview";
process.env.STORY_CLAW_WORK_DIR = runtime;
const {saveWebSnapshot, resolveWebSnapshot} = await import(pathToFileURL(path.join(host, "tools/web-snapshot.ts")).href);
const {searchWebTool} = await import(pathToFileURL(path.join(host, "tools/search-web.ts")).href);
const browser = await openBrowser("chrome");
const results = [];
try {
  const page = await browser.newPage({context: null, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined});
  await page.setViewport({width: 1400, height: 900, deviceScaleFactor: 1});
  for (const {year, phrase} of [{year: 2013, phrase: "今日头条获数千万美元B轮融资"}, {year: 2017, phrase: "火山小视频宣布10亿元补贴UGC小视频"}]) {
    const url = `https://www.bytedance.com/zh/?history=${year}`;
    await page.goto({url, timeout: 40000});
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1500)));
    const selection = await page.evaluate((target: string) => {
      const sliders = [...document.querySelectorAll("#history .slick-slider")];
      const slide = [...sliders[0].querySelectorAll(".slick-slide")].find((e) => e.textContent?.includes(target));
      if (!slide) throw new Error("Live history card not found");
      const index = slide.getAttribute("data-index");
      const control = sliders[1].querySelector(`.slick-slide[data-index="${index}"] li`) as HTMLElement | null;
      if (!control) throw new Error("Real carousel control not found");
      control.click();
      return {index};
    }, phrase);
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 700)));
    const state = await page.evaluate(() => {
      const slide = document.querySelector("#history .slick-slider .slick-current");
      const history = document.querySelector("#history")!;
      history.scrollIntoView({block: "center"});
      const snapshot = document.documentElement.cloneNode(true) as HTMLElement;
      // CSS-in-JS inserts rules into CSSOM without updating <style>.textContent.
      // Serialize those original rules too; never reconstruct the website's layout.
      const clonedStyles = [...snapshot.querySelectorAll("style")];
      [...document.querySelectorAll("style")].forEach((style, index) => {
        try { if (style.sheet) clonedStyles[index].textContent = [...style.sheet.cssRules].map(rule => rule.cssText).join("\n"); }
        catch { /* Retain the original style text when its sheet is not readable. */ }
      });
      const base = document.createElement("base"); base.href = location.href; snapshot.querySelector("head")!.prepend(base);
      return {selectedText: slide?.textContent, html: snapshot.outerHTML, url: location.href};
    });
    if (!state.selectedText?.includes(phrase)) throw new Error(`Wrong live carousel selection: ${state.selectedText}`);
    const previous = await resolveWebSnapshot(url);
    if (previous) await fs.rename(previous, `${previous}.before-cssom-${Date.now()}`);
    await saveWebSnapshot([url], state.html);
    const read = await searchWebTool.execute(`history-${year}`, {url});
    const text = read.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
    if (!text.includes(phrase)) throw new Error("Host cannot read the selected real history state");
    await fs.writeFile(path.join(runtime, `history-${year}-source.txt`), text);
    const screenshot = await page._client().send("Page.captureScreenshot", {format: "png"});
    await fs.writeFile(path.join(runtime, `history-${year}-source.png`), Buffer.from(screenshot.value.data, "base64"));
    results.push({year, url, phrase, selectedIndex: selection.index, selectedText: state.selectedText, changedPageContent: false});
    console.log(JSON.stringify(results.at(-1)));
  }
} finally {await browser.close({silent: true});}
const newsUrl = "https://www.news.cn/world/20250118/855078e1dd7b4acb8c898172f236bfdb/c.html";
const read = await searchWebTool.execute("court-chinese-report", {url: newsUrl});
const text = read.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
await fs.writeFile(path.join(runtime, "court-chinese-report.txt"), text);
results.push({url: newsUrl, ok: !text.startsWith("ERROR:"), characters: text.length});
await fs.writeFile(path.join(root, "out/byte-history-snapshots.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.at(-1)));
