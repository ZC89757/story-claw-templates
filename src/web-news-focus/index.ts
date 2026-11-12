export * from "./WebNewsFocusTemplate";
export {PaperFocusTemplate} from "./PaperFocusTemplate";
export {
  webNewsFocusFunctionDefinition,
  webNewsFocusParametersSchema,
  resolveWebNewsFocusFunctionArgs,
} from "./schema";
export type {
  WebNewsFocusCapture,
  WebNewsFocusCaptureHighlight,
  WebNewsFocusEntrance,
  WebNewsFocusHighlight,
  WebNewsFocusRect,
  WebNewsFocusSpec,
} from "./types";
export {assertWebNewsFocusGroup, assertWebNewsFocusSpec, validateWebNewsFocusSpec} from "./validate";
