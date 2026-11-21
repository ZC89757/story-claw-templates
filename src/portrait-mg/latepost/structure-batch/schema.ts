export const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
export const rootFields = {
  group: {type: "string", enum: ["portrait"]},
  order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
};
export const lineText = (maxLength: number) => ({type: "string", minLength: 1, maxLength, pattern: "^[^\\r\\n]+$"});
export const stillImage = (description: string) => ({type: "string", minLength: 1, description});
export const cue = (description: string) => closed({at: {type: "number", minimum: 0, description}});
export const chineseWidth = (value: string) => [...value].reduce((size, char) => size + (/^[\x20-\x7e]$/.test(char) ? .58 : 1), 0);

export function checkCueSpacing(cues: readonly number[], minimumSpacing: readonly number[], error: string) {
  if (cues.some((value, index) => index > 0 && value + 1e-6 < cues[index - 1] + minimumSpacing[index - 1])) {
    throw new Error(error);
  }
}
