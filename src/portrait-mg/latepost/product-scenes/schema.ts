export const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
export const rootFields = {
  group: {type: "string", enum: ["portrait"]},
  order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
};
export const line = (maxLength: number, description: string) => ({
  type: "string", minLength: 1, maxLength, pattern: "^[^\\r\\n]+$", description,
});
export const image = (description: string) => ({type: "string", minLength: 1, description});
export const at = (description: string) => ({type: "number", minimum: 0, description: description + "，填写绝对秒数"});
export const cue = (description: string) => closed({at: at(description)});
export const cutout = (...path: (string | number)[]) => ({type: "cutout" as const, path});
export function requireSpacing(times: readonly number[], intervals: readonly number[], message: string) {
  if (intervals.some((interval, index) => times[index + 1] - times[index] + 1e-6 < interval)) throw new Error(message);
}
