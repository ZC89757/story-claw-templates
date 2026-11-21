export type Clip = {source: string; sourceStart: number};

export const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});

export const identity = {
  group: {type: "string", enum: ["portrait"]},
  order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
};

export const text = (maxLength: number) => ({type: "string", minLength: 1, maxLength, pattern: "^[^\\r\\n]+$"});
export const at = (description: string) => ({type: "number", minimum: 0, description});
export const image = (description: string) => ({type: "string", minLength: 1, description});
export const clip = (description: string) => ({
  ...closed({source: image("连续视频素材路径"), sourceStart: {type: "number", minimum: 0}}), description,
});

export function checkSpacing(points: readonly number[], gaps: readonly number[], message: string) {
  if (gaps.some((gap, index) => points[index + 1] - points[index] < gap - 1e-6)) throw new Error(message);
}
