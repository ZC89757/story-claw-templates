import {OriginalWordmark} from './original-wordmark';
import {type CSSProperties} from 'react';
import {Img, Sequence, useVideoConfig} from 'remotion';
import {PortraitMedia, asset, clamp} from './common';

export type FoldedThreePhotosSpec = Record<string, {at?: number; text?: string; source?: string; sourceStart?: number | null}>;
const fill: CSSProperties = {position: 'absolute', inset: 0};
const base = 'portrait-mg/restored-layouts/';
const at = (spec: FoldedThreePhotosSpec, key: string) => Math.round((spec[key]?.at ?? 0) * 30);
const content = (spec: FoldedThreePhotosSpec, key: string) => spec[key]?.text ?? '';
const position = ([left, top, width, height]: readonly number[]): CSSProperties => ({position:'absolute',left,top,width,height});

// Coordinates and keyframes are measured from V16_002 at 360x640, 30fps.
// Media projection is independent from the pointed silhouette; never squeeze an image into the tip.
function sample(values: readonly number[], frame: number) {
  const index = clamp(frame, 0, values.length - 1);
  const start = Math.floor(index);
  return values[start] + (values[Math.ceil(index)] - values[start]) * (index - start);
}

function Media({spec, name, style, continuous = false}: {
  spec: FoldedThreePhotosSpec; name: string; style?: CSSProperties; continuous?: boolean;
}) {
  const {fps} = useVideoConfig();
  const input = spec[name];
  if (!input?.source) return null;
  return <Sequence from={continuous ? 0 : Math.max(0, Math.round((input.at ?? 0) * fps))} layout="none">
    <PortraitMedia media={{source: input.source, sourceStart: input.sourceStart ?? null}} style={style}/>
  </Sequence>;
}

// Solve the four-corner projective map for the image itself.
function projection(points: number[][]) {
  const matrix: number[][] = [];
  const source = [[0, 0], [360, 0], [360, 240], [0, 240]];
  source.forEach(([x, y], i) => {
    const [u, v] = points[i];
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  });
  for (let i = 0; i < 8; i++) {
    let pivot = i;
    for (let j = i + 1; j < 8; j++) {
      if (Math.abs(matrix[j][i]) > Math.abs(matrix[pivot][i])) pivot = j;
    }
    [matrix[i], matrix[pivot]] = [matrix[pivot], matrix[i]];
    const divisor = matrix[i][i];
    for (let k = i; k < 9; k++) matrix[i][k] /= divisor;
    for (let j = 0; j < 8; j++) {
      if (i === j) continue;
      const factor = matrix[j][i];
      for (let k = i; k < 9; k++) matrix[j][k] -= factor * matrix[i][k];
    }
  }
  const [a, b, c, d, e, f, g, h] = matrix.map((row) => row[8]);
  return 'matrix3d(' + [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1].join(',') + ')';
}

const foldPlanes = [
  {
    key: 'top', cut: [[42, 170], [317, 104], [317, 236], [42, 171]],
    media: [[42, 132], [317, 104], [317, 246], [42, 224]],
    offsets: [306, 287, 269, 250, 231, 213, 194, 176, 158, 142, 125, 110, 95, 82, 69, 58, 48, 38, 30, 23, 18, 13, 8, 5, 3, 1, 0],
  },
  {
    key: 'middle', cut: [[43, 185], [317, 250], [317, 251], [43, 316]],
    media: [[43, 186], [317, 212], [317, 310], [43, 317]],
    offsets: [-306, -287, -268, -250, -231, -212, -194, -176, -158, -141, -125, -110, -95, -82, -69, -58, -48, -38, -31, -24, -18, -13, -8, -5, -3, -1, 0],
  },
  {
    key: 'bottom', cut: [[42, 337], [317, 272], [317, 403], [42, 338]],
    media: [[42, 301], [317, 273], [317, 403], [42, 381]],
    offsets: [306, 285, 266, 247, 228, 209, 190, 172, 154, 137, 120, 105, 90, 77, 64, 53, 43, 35, 27, 20, 15, 10, 7, 4, 2, 1, 0],
  },
] as const;

export function FoldedThreePhotos({spec, frame, duration}: {spec: FoldedThreePhotosSpec; frame: number; duration: number}) {
  const fade = sample([1, .985, .97, .86, .755, .655, .56, .47, .375, .285, .185, .14, .095, .048, 0], frame - (duration - 15));
  return <div style={{...fill, background: '#000'}}>
    <div style={position([0, 70, 360, 400])}><Media spec={spec} name="background" continuous/></div>
    <Img src={asset(base + 'gold-frame.png')} style={{...fill, clipPath:'inset(0 0 570px)'}}/>
    <Img src={asset(base + 'gold-frame.png')} style={{...fill, clipPath:'inset(470px 0 166px)'}}/>
    {foldPlanes.map(({key, cut, media, offsets}) => {
      const age = frame - at(spec, key);
      const planeFade = key === 'middle' ? sample([1,.995,.992,.865,.735,.61,.485,.37,.255,.14,.03,.022,.016,.008,0], frame - (duration - 15)) : fade;
      if (age < 0 || planeFade <= 0) return null;
      const transform = projection(media.map(([x, y]) => [x, y]));
      const clipPath = 'polygon(' + cut.map(([x, y]) => x + 'px ' + y + 'px').join(',') + ')';
      return <div key={key} style={{
        ...fill, opacity: planeFade, filter: 'drop-shadow(3px 2px 4px #000a)',
        transform: 'translateX(' + sample(offsets, age) + 'px)',
      }}>
        <div style={{...fill, clipPath}}>
          <div style={{...position([0, 0, 360, 240]), transformOrigin: '0 0', transform}}>
            <Media spec={spec} name={key}/>
          </div>
        </div>
      </div>;
    })}
    {spec.footerText === undefined
      ? <Img src={asset(base + 'gold-frame.png')} style={{...fill, clipPath:'inset(480px 0 119px)'}}/>
      : spec.footerText?.text && <div style={{...position([0,482,360,35]),color:'#fff',font:'italic 22px SimHei, sans-serif',textAlign:'center',whiteSpace:'nowrap'}}>{content(spec, 'footerText')}</div>}
    <OriginalWordmark content={spec.signature?.text === "Edward's Talk" ? undefined : spec.signature}
      original={base + 'original-wordmark.png'} box={[34,531,292,52]}
      style={{fontSize:38,transform:'scaleX(1.04) skewX(-8deg)'}}/>
  </div>;
}

