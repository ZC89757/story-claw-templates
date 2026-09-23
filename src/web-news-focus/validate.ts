import {
  WEB_NEWS_FOCUS_ENTRANCES,
  WEB_NEWS_FOCUS_GROUP,
  type WebNewsFocusSpec,
} from "./types";

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

export const validateWebNewsFocusSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (typeof input.at !== "number" || !Number.isFinite(input.at) || input.at < 0) {
    errors.push("at must be a non-negative number");
  }
  if (typeof input.url !== "string" || !input.url.trim() || !isHttpUrl(input.url)) {
    errors.push("url must be a valid http(s) URL");
  }
  if (input.entrance !== undefined && !WEB_NEWS_FOCUS_ENTRANCES.includes(input.entrance as never)) {
    errors.push(`entrance must be one of ${WEB_NEWS_FOCUS_ENTRANCES.join(", ")}`);
  }
  if (!Array.isArray(input.highlights) || input.highlights.length < 1 || input.highlights.length > 8) {
    errors.push("highlights must contain 1-8 items");
  } else {
    let previousAt = -Infinity;
    input.highlights.forEach((highlight, index) => {
      if (!isRecord(highlight)) {
        errors.push(`highlights[${index}] must be an object`);
        return;
      }
      if (typeof highlight.text !== "string" || !highlight.text.trim() || highlight.text.length > 240) {
        errors.push(`highlights[${index}].text must be a non-empty string of at most 240 characters`);
      }
      if (typeof highlight.at !== "number" || !Number.isFinite(highlight.at) || highlight.at < 0) {
        errors.push(`highlights[${index}].at must be a non-negative number`);
      } else {
        if (highlight.at < previousAt) errors.push(`highlights[${index}].at must not precede the previous highlight`);
        previousAt = highlight.at;
      }
    });
  }
  if (input.capture !== undefined) {
    if (!isRecord(input.capture)) errors.push("capture must be an object when supplied");
    else {
      if (typeof input.capture.baseImage !== "string" || !input.capture.baseImage.trim()) errors.push("capture.baseImage is required");
      if (typeof input.capture.highlightedImage !== "string" || !input.capture.highlightedImage.trim()) errors.push("capture.highlightedImage is required");
      if (!isRecord(input.capture.viewport)) errors.push("capture.viewport is required");
      if (!Array.isArray(input.capture.highlights)) errors.push("capture.highlights must be an array");
    }
  }
  return errors;
};

export const assertWebNewsFocusSpec = (input: unknown): WebNewsFocusSpec => {
  const errors = validateWebNewsFocusSpec(input);
  if (errors.length) throw new Error(`Invalid WebNewsFocusSpec:\n- ${errors.join("\n- ")}`);
  const spec = input as WebNewsFocusSpec;
  if (spec.entrance === undefined) spec.entrance = "fade";
  if (!spec.capture) return spec;
  if (spec.capture.highlights.length !== spec.highlights.length) {
    throw new Error(`capture.highlights must contain ${spec.highlights.length} items`);
  }
  for (const [index, captureHighlight] of spec.capture.highlights.entries()) {
    if (captureHighlight.text !== spec.highlights[index].text) {
      throw new Error(`capture.highlights[${index}] does not match highlights[${index}]`);
    }
    if (!Array.isArray(captureHighlight.rects) || captureHighlight.rects.length === 0) {
      throw new Error(`capture.highlights[${index}].rects must not be empty`);
    }
  }
  return spec;
};

export const assertWebNewsFocusGroup = (group: string): void => {
  if (group !== WEB_NEWS_FOCUS_GROUP) throw new Error(`web-news-focus group must be ${WEB_NEWS_FOCUS_GROUP}`);
};
