import {referenceProfiles, type Slot} from "./reference-profiles";

const at = {type: "number", minimum: 0, description: "已核验口播字级时间轴上的绝对秒数。"} as const;
const group = {type: "string", enum: ["portrait"]} as const;
const order = {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]} as const;

function object(properties: Record<string, unknown>, description?: string) {
  return {type: "object", additionalProperties: false, required: Object.keys(properties), properties, ...(description ? {description} : {})};
}

function slotSchema(slot: Slot) {
  const timing = slot.at === undefined ? {} : {at};
  if (slot.type === "cue") return object({at}, slot.label);
  if (slot.type === "text") {
    return object({text: {type: "string", minLength: 1, maxLength: slot.max}, ...timing}, slot.label);
  }
  return object({
    source: {type: "string", minLength: 1, description: slot.type === "cutout" ? "真实的带 Alpha 本地 PNG 路径。" : "已准备的本地素材路径。"},
    sourceStart: slot.type === "video" ? {type: "number", minimum: 0, description: "真实视频的素材内入点秒数。"} : {type: "null"},
    ...timing,
  }, slot.label);
}

export const REFERENCE_FUNCTIONS = Object.values(referenceProfiles).map(profile => ({
  type: "function" as const,
  name: "create_portrait_" + profile.tag.slice("mg-v-".length).replaceAll("-", "_"),
  strict: true,
  description: profile.hint + " 整段时间由宿主提供。素材类型固定，文字只填指定字位，不增加说明。",
  parameters: object({group, order, ...Object.fromEntries(Object.entries(profile.slots).map(([key, slot]) => [key, slotSchema(slot)]))}),
}));
