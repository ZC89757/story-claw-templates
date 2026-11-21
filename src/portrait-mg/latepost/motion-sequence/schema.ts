export const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
export const rootFields = {
  group: {type: "string", enum: ["portrait"]},
  order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
};
export const line = (maxLength: number, description: string) => ({
  type: "string", minLength: 1, maxLength, pattern: "^[^\\r\\n]+$", description,
});
export const at = (description: string) => ({
  type: "number", minimum: 0, description: description + "，填写绝对秒数",
});
