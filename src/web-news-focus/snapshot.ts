import {createHash} from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Shared storage convention with Story Claw: SHA-256 of URL.href without its fragment. */
export const requireWebSnapshot = async (url: string, directory?: string): Promise<string> => {
  if (!directory) throw new Error("未配置 Story Claw 网页快照目录");
  const normalized = new URL(url.trim());
  normalized.hash = "";
  const digest = createHash("sha256").update(normalized.href).digest("hex");
  const target = path.join(directory, `${digest}.html`);
  const stat = await fs.stat(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!stat?.isFile() || stat.size === 0) {
    throw new Error(`WEB_SNAPSHOT_NOT_FOUND 找不到网页快照，请先调用 search_web({url: ${JSON.stringify(url)}}) 读取最终正文，再逐字填写定位文字`);
  }
  return target;
};
