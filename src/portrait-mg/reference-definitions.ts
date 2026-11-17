import {contentTimingIds, finiteDecorationSeconds, referenceMinimumSeconds} from "./content-timing";
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
    const shape = object({text: {type: "string", minLength: 1, maxLength: slot.max, ...(slot.pattern ? {pattern: slot.pattern} : {}), ...(slot.maxUnits ? {description: slot.maxLines || slot.asciiUnits ? `固定字号；每行最多 ${slot.maxUnits} 个字宽单位，最多${slot.maxLines??1}行，ASCII每字按${slot.asciiUnits??.75}单位。超长须缩短内容，禁止缩字。` : `固定字号；最多 ${slot.maxUnits} 个全角字宽（ASCII按0.75、W/M/@按1.1计算）。超出须缩短文案，禁止缩字。`} : {})}, ...timing}, slot.label);
    return slot.optional ? {anyOf: [shape, {type: "null"}], description: "原有文字槽。新规划应填写对应内容；null 仅兼容旧调用。"} : shape;
  }
  return object({
    source: {type: "string", minLength: 1, description: slot.type === "cutout" ? "真实的带 Alpha 本地 PNG 路径。" : "已准备的本地素材路径。"},
    sourceStart: slot.type === "video" ? {type: "number", minimum: 0, description: "真实视频的素材内入点秒数。"} : {type: "null"},
    ...timing,
  }, slot.label);
}

// Content and timing only. Text slots retain editable wording, never typography.
function contentSlotSchema(slot: Slot) {
  if (slot.type === "text") return slotSchema({...slot, optional: false});
  if (slot.type === "cue") return slotSchema(slot);
  return object({
    source: {type: "string", minLength: 1, description: slot.type === "cutout" ? "带有效Alpha的本地PNG路径。" : "已准备好的本地素材路径。"},
    ...(slot.type === "video" ? {
      sourceStart: {type: "number", minimum: 0, description: "源视频取用起点（秒）。"},
      sourceEnd: {type: "number", minimum: 0, description: "源视频取用终点（秒），区间长度须等于此视频槽的实际播放时长。"},
    } : {}),
    ...(slot.at === undefined ? {} : {at: {...at, description: "此元素开始原版入场或换镜的口播绝对时间。"}}),
  }, slot.label);
}
export const REFERENCE_FUNCTIONS = Object.entries(referenceProfiles).map(([id, profile]) => ({
  type: "function" as const,
  name: "create_portrait_" + profile.tag.slice("mg-v-".length).replaceAll("-", "_"),
  strict: true,
  description: profile.hint + (referenceMinimumSeconds[id] ? " 此模板实例至少需"+referenceMinimumSeconds[id]+"秒，并为各元素保留完整固定动作。" : "") + " 整段时间由宿主提供。素材类型固定，文字只填指定字位，不增加说明。" + (finiteDecorationSeconds[id] ? " 本版固定装饰最长支持"+finiteDecorationSeconds[id]+"秒；超过须另分场景，禁止冻帧或反向循环补时长。" : ""),
  parameters: object({group, order, ...Object.fromEntries(Object.entries(profile.slots).map(([key, slot]) => [key, contentTimingIds.has(id) ? contentSlotSchema(slot) : slotSchema(slot)]))}),
}));
