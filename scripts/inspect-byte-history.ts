import fs from "node:fs/promises";
import {openBrowser} from "@remotion/renderer";
const browser = await openBrowser("chrome");
try {
  const page = await browser.newPage({context: null, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined});
  await page.setViewport({width: 1440, height: 1000, deviceScaleFactor: 1});
  await page.goto({url: "https://www.bytedance.com/zh/", timeout: 40000});
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 2000)));
  const state = await page.evaluate(() => ({
    title: document.title,
    controls: [...document.querySelectorAll("#history button,#history a,#history li,#history [role=button]")].map((e) => ({tag: e.tagName, class: e.className, text: e.textContent})),
    history: document.querySelector("#history")?.outerHTML.slice(-14000),
  }));
  await fs.writeFile("D:/StoryClawByteDancePreview/history-interaction-inspection.json", JSON.stringify(state, null, 2));
  console.log(JSON.stringify(state));
} finally {await browser.close({silent: true});}
