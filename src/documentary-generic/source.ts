import {closedObject, nullableField, textField, recordOf, readText} from '../authoring-contract';
export type DocumentarySource = {method: 'existing' | 'generate'; image: string | null; prompt: string | null; background: {transparent: boolean}};
export const sourceSchema = closedObject({method: {type: 'string', enum: ['existing', 'generate']}, image: nullableField(textField(2048)), prompt: nullableField(textField(600)), background: closedObject({transparent: {type: 'boolean'}})});
export const readSource = (raw: unknown): DocumentarySource => {
  const r = recordOf(raw, ['method', 'image', 'prompt', 'background'], 'source');
  const b = recordOf(r.background, ['transparent'], 'background');
  if (typeof b.transparent !== 'boolean') throw new Error('background.transparent must be boolean');
  if (r.method === 'existing' && r.prompt === null) return {method: r.method, image: readText(r.image, 'image', 2048), prompt: null, background: {transparent: b.transparent}};
  if (r.method === 'generate' && r.image === null) return {method: r.method, prompt: readText(r.prompt, 'prompt', 600), image: null, background: {transparent: b.transparent}};
  throw new Error('existing requires image and null prompt; generate requires prompt and null image');
};
