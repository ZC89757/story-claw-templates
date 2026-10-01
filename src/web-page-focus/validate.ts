import {
  WEB_PAGE_FOCUS_ENTRANCES,
  WEB_PAGE_FOCUS_GROUP,
  type WebPageFocusSpec,
} from "./types";
import {isEligibleWebPageSource} from "../web-news-focus/source-policy";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateWebPageFocusSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (typeof input.at !== "number" || !Number.isFinite(input.at) || input.at < 0) errors.push("at must be a non-negative number");
  if (typeof input.url !== "string" || !input.url.trim() || !isHttpUrl(input.url)) errors.push("url must be a valid http(s) URL");
  else if (!isEligibleWebPageSource(input.url)) errors.push("url must be an eligible original webpage or event-related X post");
  if (input.entrance !== undefined && !WEB_PAGE_FOCUS_ENTRANCES.includes(input.entrance as never)) {
    errors.push(`entrance must be one of ${WEB_PAGE_FOCUS_ENTRANCES.join(", ")}`);
  }
  if (!Array.isArray(input.focus) || input.focus.length < 1 || input.focus.length > 8) {
    errors.push("focus must contain 1-8 items");
  } else {
    let previousAt = -Infinity;
    input.focus.forEach((anchor, index) => {
      if (!isRecord(anchor)) {
        errors.push(`focus[${index}] must be an object`);
        return;
      }
      if (typeof anchor.text !== "string" || !anchor.text.trim() || anchor.text.length > 240) {
        errors.push(`focus[${index}].text must be a non-empty string of at most 240 characters`);
      }
      if (typeof anchor.at !== "number" || !Number.isFinite(anchor.at) || anchor.at < 0) {
        errors.push(`focus[${index}].at must be a non-negative number`);
      } else {
        if (anchor.at < previousAt) errors.push(`focus[${index}].at must not precede the previous focus anchor`);
        previousAt = anchor.at;
      }
    });
  }
  if (input.capture !== undefined) {
    if (!isRecord(input.capture)) errors.push("capture must be an object when supplied");
    else {
      if (typeof input.capture.baseImage !== "string" || !input.capture.baseImage.trim()) errors.push("capture.baseImage is required");
      if (!isRecord(input.capture.viewport)) errors.push("capture.viewport is required");
      if (!Array.isArray(input.capture.focus)) errors.push("capture.focus must be an array");
    }
  }
  return errors;
};

export const assertWebPageFocusSpec = (input: unknown): WebPageFocusSpec => {
  const errors = validateWebPageFocusSpec(input);
  if (errors.length) throw new Error(`Invalid WebPageFocusSpec:\n- ${errors.join("\n- ")}`);
  const spec = input as WebPageFocusSpec;
  if (spec.entrance === undefined) spec.entrance = "fade";
  if (!spec.capture) return spec;
  if (spec.capture.focus.length !== spec.focus.length) {
    throw new Error(`capture.focus must contain ${spec.focus.length} items`);
  }
  for (const [index, captureFocus] of spec.capture.focus.entries()) {
    if (captureFocus.text !== spec.focus[index].text) throw new Error(`capture.focus[${index}] does not match focus[${index}]`);
    if (!Array.isArray(captureFocus.rects) || captureFocus.rects.length === 0) throw new Error(`capture.focus[${index}].rects must not be empty`);
  }
  return spec;
};

export const assertWebPageFocusGroup = (group: string): void => {
  if (group !== WEB_PAGE_FOCUS_GROUP) throw new Error(`web-page-focus group must be ${WEB_PAGE_FOCUS_GROUP}`);
};
