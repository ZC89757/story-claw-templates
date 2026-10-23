import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import jpeg from 'jpeg-js';
import type {DocumentarySource} from './source';
import type {CutoutPreparationServices} from '../subject-expansion/assets';

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const CHROMA = '#00ff00';
const localImage = async (image: string, root: string): Promise<string> => {
  if (/^https?:\/\//i.test(image)) {
    const response = await fetch(image, {signal: AbortSignal.timeout(60000)});
    if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > 30 * 1024 * 1024) throw new Error('Image exceeds 30 MB');
    const dir = path.join(os.tmpdir(), 'story-claw-documentary-assets');
    await fs.mkdir(dir, {recursive: true});
    const ext = data[0] === 137 ? '.png' : '.jpg';
    const target = path.join(dir, hash(data) + ext); await fs.writeFile(target, data); return target;
  }
  const value = image.startsWith('file:') ? fileURLToPath(image) : image;
  const target = path.isAbsolute(value) ? value : path.resolve(root, value.replace(/^public[\\/]/, ''));
  await fs.access(target); return target;
};
export const inspectDocumentaryImage = async (file: string) => {
  const bytes = await fs.readFile(file);
  const bitmap = bytes[0] === 137 && bytes[1] === 80 ? PNG.sync.read(bytes) : bytes[0] === 255 && bytes[1] === 216 ? jpeg.decode(bytes, {useTArray: true, maxMemoryUsageInMB: 128, maxResolutionInMP: 25}) : null;
  if (!bitmap) throw new Error('Transparency inspection requires PNG or JPEG; convert other formats to PNG first');
  const {width: w, height: h, data} = bitmap;
  let clear = 0, opaque = 0;
  for (let i = 3; i < data.length; i += 4) {if (data[i] < 16) clear++; if (data[i] > 240) opaque++;}
  const transparent = clear / (w*h) > .005 && opaque / (w*h) > .01;
  const border: number[] = [];
  for (let x=0;x<w;x++) border.push(x*4, ((h-1)*w+x)*4);
  for (let y=1;y<h-1;y++) border.push(y*w*4, (y*w+w-1)*4);
  const rgb = [0,1,2].map(c => [...border].map(i=>data[i+c]).sort((a,b)=>a-b)[Math.floor(border.length/2)]);
  const uniform = border.filter(i=>rgb.every((v,c)=>Math.abs(data[i+c]-v)<22)).length / border.length > .96;
  const color = '#' + rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
  return {transparent, uniform, color, digest: hash(bytes)};
};

/** Only these two templates use the new action contract; older template schemas remain unchanged. */
export const prepareDocumentaryImages = async (sources: readonly (DocumentarySource | null)[], resolveImage: (source: string)=>Promise<string>, root: string, services: CutoutPreparationServices = {}) => {
  const cache = new Map<string, Promise<string>>();
  const reference = path.join(root, 'subject-expansion/style-reference.png');
  const prepare = async (source: DocumentarySource): Promise<string> => {
    let file: string;
    const generate = async (prompt: string, references: string[], key: string) => {
      if (!services.generateImageFromReferences) throw new Error('IMAGE_GENERATION_UNAVAILABLE');
      const result = await services.generateImageFromReferences({prompt, references, aspectRatio: '1:1', cacheKey: key});
      if (!path.isAbsolute(result)) throw new Error('Generator must return absolute image path');
      return result;
    };
    if (source.method === 'generate') {
      const styleHash = hash(await fs.readFile(reference));
      const prompt = `Create one complete isolated subject: ${source.prompt}. Use the reference only for matte editorial illustration style, restrained silver, blue and terracotta palette. No lettering, no frame. ${source.background.transparent ? `Use a perfectly flat ${CHROMA} background, no green on the subject or reflections, generous margins, no floor or cast shadow.` : 'Use a quiet neutral studio background.'}`;
      file = await generate(prompt, [reference], `documentary-source-v2:${styleHash}:${hash(prompt)}`);
    } else file = await localImage(source.image!, root);
    if (!source.background.transparent) return resolveImage(file);
    let inspection = await inspectDocumentaryImage(file);
    if (inspection.transparent) return resolveImage(file);
    if (!services.removeSolidBackground) throw new Error('BACKGROUND_REMOVAL_UNAVAILABLE');
    if (!inspection.uniform) {
      const prompt = `Extract the exact subject from the reference. Preserve its identity, silhouette, details, proportions and colors; change only the background to perfectly flat ${CHROMA}. No shadows, scenery, text or additional objects. Center the complete subject with margins.`;
      file = await generate(prompt, [file], `documentary-background-v2:${inspection.digest}`);
      inspection = await inspectDocumentaryImage(file);
      if (inspection.transparent) return resolveImage(file);
      if (!inspection.uniform) throw new Error('Background preparation did not produce a removable solid background');
    }
    const cutout = await services.removeSolidBackground({sourcePath: file, backgroundColor: inspection.color, cacheKey: `documentary-cutout-v2:${inspection.digest}:${inspection.color}`});
    if (!path.isAbsolute(cutout) || !(await inspectDocumentaryImage(cutout)).transparent) throw new Error('Background removal did not produce a valid transparent subject');
    return resolveImage(cutout);
  };
  const output: (string|null)[] = [];
  for (const source of sources) {
    if (!source) {output.push(null);continue;}
    const key = JSON.stringify(source);
    if (!cache.has(key)) cache.set(key, prepare(source));
    output.push(await cache.get(key)!);
  }
  return output;
};
