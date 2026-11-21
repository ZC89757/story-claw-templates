export const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
export const text = (maxLength: number, description?: string) => ({
  type: "string", minLength: 1, maxLength, ...(description ? {description} : {}),
});
export const cue = (description: string) => closed({
  at: {type: "number", minimum: 0, description},
});
export const envelope = {
  group: {type: "string", enum: ["portrait"]},
  order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
};
export const fixedLine = (value: string, limit: number, label: string) => {
  const units = Array.from(value).reduce((total, char) => total + (/^[\x20-\x7E]$/.test(char) ? .57 : 1), 0);
  if (/[\r\n]/.test(value) || units > limit) throw new Error(`${label}放不进固定字位，请缩短文案`);
};
