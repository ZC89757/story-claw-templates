import {FoldedThreePhotos} from './folded-three-photos';
import {useId, type CSSProperties} from 'react';
import {Img, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {PortraitMedia, asset, clamp} from './common';
import type {Profile} from './reference-profiles';

type Value = {at?: number; text?: string; source?: string; sourceStart?: number | null};
export type RestoredLayoutSpec = Record<string, Value>;

const fill: CSSProperties = {position: 'absolute', inset: 0};
const base = 'portrait-mg/restored-layouts/';
const wovenAtlasFiles = Array.from({length: 18}, (_, i) => 'woven-' + String(i).padStart(2, '0') + '.webp');
export const restoredLayoutAssets = [
  'torn-background.png', 'torn-mask.png', 'torn-rim.png', 'torn-first.png', 'torn-second.png',
  'torn-final-top.png', 'torn-final-middle.png', 'torn-final-bottom.png', 'documents-plate.png',
  'documents-heavy.woff2', 'torn-label.woff2', 'torn-label-OFL.txt', 'gold-frame.png', 'original-wordmark.png',
  ...wovenAtlasFiles,
].map((file) => base + file);

const at = (spec: RestoredLayoutSpec, key: string) => Math.round((spec[key]?.at ?? 0) * 30);
const content = (spec: RestoredLayoutSpec, key: string) => spec[key]?.text ?? '';
const position = ([left, top, width, height]: readonly number[]): CSSProperties => ({
  position: 'absolute', left, top, width, height,
});

function sample(values: readonly number[], frame: number) {
  const index = clamp(frame, 0, values.length - 1);
  const start = Math.floor(index);
  return values[start] + (values[Math.ceil(index)] - values[start]) * (index - start);
}

function Media({spec, name, style, continuous = false}: {
  spec: RestoredLayoutSpec; name: string; style?: CSSProperties; continuous?: boolean;
}) {
  const {fps} = useVideoConfig();
  const input = spec[name];
  if (!input?.source) return null;
  return <Sequence from={continuous ? 0 : Math.max(0, Math.round((input.at ?? 0) * fps))} layout="none">
    <PortraitMedia media={{source: input.source, sourceStart: input.sourceStart ?? null}} style={style}/>
  </Sequence>;
}

const TORN_WINDOW_TOP = [149, 155, 162, 168, 175, 181, 187, 194, 200, 206, 212, 219, 225, 231, 237, 244];
const FIRST_CENTER_X = [162, 185, 184, 189, 190, 192, 192, 190, 185, 182, 180, 178, 176, 175, 175, 175];
const FIRST_CENTER_Y = [-34, -15, 0, 13, 31, 47, 54, 62, 69, 75, 80, 83, 86, 88, 89, 90];
const FIRST_SCALE_X = [1.49, 1.46, 1.49, 1.43, 1.36, 1.325, 1.22, 1.17, 1.13, 1.12, 1.10, 1.08, 1.07, 1.05, 1.03, 1];
const FIRST_BLUE_LIGHT = [0, 0, .78, 1, .98, .31, .23, .43, .40, .28, .16, .08, 0];
const SECOND_CENTER_X = [-123, 42, 76, 104, 154, 180, 188, 190, 187, 184, 182, 179, 178, 176, 175, 175, 175];
const SECOND_CENTER_Y = [66, 90, 97, 106, 114, 123, 132, 139, 146, 151, 155, 159, 162, 165, 166, 167, 168];
const SECOND_SCALE_X = [1.76, 1.59, 1.55, 1.52, 1.43, 1.37, 1.32, 1.27, 1.23, 1.19, 1.15, 1.1, 1.07, 1.04, 1.02, 1, 1];
const SECOND_SCALE_Y = [1.69, 1.66, 1.62, 1.59, 1.53, 1.47, 1.42, 1.36, 1.31, 1.26, 1.21, 1.16, 1.11, 1.07, 1.04, 1.02, 1];
const FIRST_SCATTER = [.15, .42, .65, 1, .79, .08, 0];
const SECOND_TRAIL = [0, .82, 1, .91, .58, .37, .24, .16, .12, .08, .05, .03, 0];
const LABEL_REVEAL = {
  finalTop: [40, 40, 40, 40, 32.5, 25, 24.5, 17, 16, 9, 8.5, 4, 0],
  finalMiddle: [40, 40, 40, 40, 40, 34, 27, 26, 20, 16, 12, 8, 6, 4, 0],
  finalBottom: [40, 40, 40, 40, 40, 35, 30, 26, 22, 18, 14, 10, 6, 3, 0],
} as const;

const tornCards = [
  {key: 'first', box: [99, 70, 152, 41], plate: 'torn-first.png', lettering: [7.3, .1, .79, .88, -5.2]},
  {key: 'second', box: [99, 148, 152, 41], plate: 'torn-second.png', lettering: [8.0, -2.0, .79, .89, -4.5]},
  {key: 'finalTop', box: [151, 31, 151, 40], plate: 'torn-final-top.png', lettering: [2.7, -.9, .875, .91, -5.8]},
  {key: 'finalMiddle', box: [34, 108, 151, 40], plate: 'torn-final-middle.png', lettering: [-2.0, 1.7, .89, .91, -4.7]},
  {key: 'finalBottom', box: [149, 181, 152, 40], plate: 'torn-final-bottom.png', lettering: [-2.35, 1.5, .89, .91, -4.7]},
] as const;

function WovenBacking({frame}: {frame: number}) {
  const sourceFrame = Math.floor(clamp(frame, 0, 286));
  const cell = sourceFrame % 16;
  const atlas = wovenAtlasFiles[Math.floor(sourceFrame / 16)];
  return <div style={{...fill, overflow: 'hidden'}}>
    <Img src={asset(base + atlas)} style={{
      position: 'absolute', width: 1440, height: 2560,
      left: -(cell % 4) * 360, top: -Math.floor(cell / 4) * 640,
    }}/>
  </div>;
}

function TornLabels({spec, frame}: {spec: RestoredLayoutSpec; frame: number}) {
  const blurId = useId().replace(/[^a-zA-Z0-9_-]/g, '') + 'torn-flight';
  const trailing = frame >= at(spec, 'finalTop');
  const windowTop = sample(TORN_WINDOW_TOP, frame);
  const windowBottom = 623 + 90 * (1 - clamp(frame / 15));
  const stretch = (windowBottom - windowTop) / 379;
  const windowOpacity = sample([0, .31, .64, 1], frame);
  const mask = 'url(' + asset(base + 'torn-mask.png') + ')';
  const firstAge = frame - at(spec, 'first');
  const secondAge = frame - at(spec, 'second');
  const firstBlur = 1 - clamp(firstAge / 15);
  const secondBlur = sample([13, 14, 12, 10, 8, 7, 6, 4.5, 3.5, 2.5, 2, 1.3, .7, 0], secondAge);
  const trailAmount = sample(SECOND_TRAIL, secondAge);
  const scatterAmount = sample(FIRST_SCATTER, firstAge);
  const firstBlueLight = sample(FIRST_BLUE_LIGHT, firstAge);
  const scatterPeak = sample([0, 0, .23, .63, .43, 0], firstAge);
  return <div style={{...fill, background: '#111b20'}}>
    <style>{"@font-face{font-family:PortraitTornLabel;src:url('" + asset(base + 'torn-label.woff2') + "') format('woff2');font-display:block;}"}</style>
    <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
      <defs>
        <filter id={blurId + '-first'} x="-30%" y="-40%" width="160%" height="180%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={5.8 * firstBlur + ' ' + 3.4 * firstBlur}/>
        </filter>
        <filter id={blurId + '-scatter'} x="-32%" y="-52%" width="172%" height="204%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="7.2 4.5"/>
        </filter>
        <filter id={blurId + '-second'} x="-45%" y="-30%" width="190%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={secondBlur + ' ' + secondBlur * .32}/>
        </filter>
        <filter id={blurId + '-trail'} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={17 + trailAmount * 13 + ' ' + (2 + trailAmount * 2)}/>
          <feComponentTransfer>
            <feFuncR type="linear" slope={1.07} intercept={.11}/>
            <feFuncG type="linear" slope={.98} intercept={.15}/>
            <feFuncB type="linear" slope={1.05} intercept={.11}/>
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
    <WovenBacking frame={frame}/>
    <div style={{
      ...fill, opacity: windowOpacity, transformOrigin: '0 0',
      transform: 'translateY(' + (windowTop - 244 * stretch) + 'px) scaleY(' + stretch + ')',
    }}>
      <div style={{...fill, maskImage: mask, maskSize: '360px 640px', maskRepeat: 'no-repeat'}}>
        <div style={position([0, 234, 360, 399])}>
          <Media spec={spec} name="clip" continuous/>
        </div>
      </div>
      <Img src={asset(base + 'torn-rim.png')} style={fill}/>
    </div>
    {(trailing ? tornCards.slice(2) : tornCards.slice(0, 2)).map(({key, box, plate, lettering}) => {
      const age = frame - at(spec, key);
      if (age < 0) return null;
      let transform: string | undefined;
      let filter: string | undefined;
      let trailTransform: string | undefined;
      let scatterTransform: string | undefined;
      if (key === 'first' || key === 'second') {
        const first = key === 'first';
        const x = sample(first ? FIRST_CENTER_X : SECOND_CENTER_X, age) - 175;
        const y = sample(first ? FIRST_CENTER_Y : SECOND_CENTER_Y, age) - (first ? 90 : 168);
        const amount = 1 - clamp(age / (first ? 15 : 17));
        const scaleX = first ? sample(FIRST_SCALE_X, age) : sample(SECOND_SCALE_X, age);
        const scaleY = first ? 1 + amount * .42 : sample(SECOND_SCALE_Y, age);
        const angle = (first ? 10 : 2) * amount;
        transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + angle + 'deg) scale(' + scaleX + ',' + scaleY + ')';
        if (amount > 0) filter = 'url(#' + blurId + '-' + key + ')';
        if (first && scatterAmount > 0) {
          scatterTransform = 'translate(' + (x + 4) + 'px,' + (y + 4) + 'px) rotate(' + (angle + 1)
            + 'deg) scale(' + (scaleX + .015) + ',' + (scaleY + .028) + ')';
        }
        if (!first && trailAmount > 0) {
          const trailX = x - 16 * trailAmount;
          const trailY = y - 5 * trailAmount;
          trailTransform = 'translate(' + trailX + 'px,' + trailY + 'px) rotate(' + (angle + trailAmount * 4)
            + 'deg) scale(' + (scaleX + trailAmount * .23) + ',' + scaleY + ')';
        }
      }
      const reveal = key in LABEL_REVEAL ? sample(LABEL_REVEAL[key as keyof typeof LABEL_REVEAL], age) : 0;
      const yellow = key === 'finalBottom';
      const [labelX, labelY, labelScaleX, labelScaleY, labelSkew] = lettering;
      const label = (trail = false) => <>
        <Img src={asset(base + plate)} style={fill}/>
        {key === 'first' && firstBlueLight > 0 && <div aria-hidden style={{
          ...fill, opacity: firstBlueLight, mixBlendMode: 'screen',
          background: 'linear-gradient(90deg, transparent 17%, #345c8a33 45%, #125bde91 78%, #1261edb0 100%)',
        }}/>}
        {key === 'first' && scatterPeak > 0 && <div aria-hidden style={{
          ...fill, opacity: scatterPeak, mixBlendMode: 'screen',
          background: 'linear-gradient(90deg, transparent 72%, #44a7ed28 83%, #048deeab 91%, #138fe6f0 96%, #138fe6 100%)',
        }}/>}
        <div style={{...fill, display: 'grid', placeItems: 'center', clipPath: 'inset(' + reveal + 'px 0 0)'}}>
          <span style={{
            color: trail ? '#fff6ff' : key === 'finalBottom' ? '#ffffff' : '#fffefb', whiteSpace: 'nowrap',
            fontFamily: 'PortraitTornLabel, SimHei, 黑体, "Microsoft YaHei", sans-serif',
            fontWeight: 400, fontSize: 33, lineHeight: '40px', letterSpacing: 8,
            filter: 'blur(.24px)',
            WebkitTextStroke: yellow ? '.32px currentColor' : '.18px currentColor',
            transform: 'translate(' + labelX + 'px,' + labelY + 'px) scale(' + labelScaleX + ',' + labelScaleY + ') skewX(' + labelSkew + 'deg)',
            textShadow: yellow
              ? '0 0 .90px #655e46f0, .96px .28px .52px #746d57ec, 1.78px .65px 1.28px #77705ad9'
              : '.50px .54px .45px #eef2f9ba, 1.25px 1.10px .9px #182230ab',
          }}>{content(spec, key)}</span>
        </div>
      </>;
      return <div key={key} style={fill}>
        {scatterTransform && <div aria-hidden style={{
          ...position(box), transform: scatterTransform, opacity: scatterAmount * .82,
          filter: 'url(#' + blurId + '-scatter)',
          background: 'linear-gradient(90deg, transparent 36%, #2ac7ea44 56%, #1d9fee91 77%, #218cebcf 93%, #247ac3a6 100%)',
        }}/>}
        {trailTransform && <div aria-hidden style={{
          ...position(box), transform: trailTransform, opacity: trailAmount * .70,
          filter: 'url(#' + blurId + '-trail)',
        }}>{label(true)}</div>}
        <div style={{...position(box), transform, filter}}>{label()}</div>
      </div>;
    })}
  </div>;
}

const DOCUMENT_ENTER = [-343, -286, -247, -210, -176, -141, -110, -82, -58, -38, -23, -13, -5, -1, 0];
const DOCUMENT_EXIT = [0, 2, 7, 16, 29, 46, 67, 90, 118, 150, 185, 221, 258, 303, 345];
const DOCUMENT_REPLACE = [287, 249, 213, 176, 142, 110, 82, 58, 38, 24, 13, 5, 1, 0];
const DOCUMENT_TITLE = [-86, -67, -47, -34, -21, -11, -5, -1, 0];
const documentsBackdrop: CSSProperties = {
  filter: 'grayscale(1) blur(7px) contrast(1.06) brightness(1.25)', transform: 'scale(1.06)',
};
const documentsGridFine = 'repeating-linear-gradient(180deg, #cfd6ff09 0px, #e6e8ff13 .65px, #d5d8ff09 1.5px, transparent 2.5px 20.06px),'
  + 'repeating-linear-gradient(90deg, #cfd6ff08 0px, #e3e6ff11 .65px, #d5d8ff08 1.25px, transparent 2.3px 11.25px)';
const documentsGridGlow = 'repeating-linear-gradient(180deg, transparent 0px, #000b .55px, #000 2px, #000b 3.5px, transparent 5.35px 20.06px),'
  + 'repeating-linear-gradient(90deg, transparent 0px, #000a .75px, #000 1.7px, #000a 2.75px, transparent 4.2px 11.25px)';

function Documents({spec, frame}: {spec: RestoredLayoutSpec; frame: number}) {
  const gridFilter = useId().replace(/[^a-zA-Z0-9_-]/g, '') + 'document-grid';
  const titleAge = frame - at(spec, 'title');
  const firstAge = frame - at(spec, 'first');
  const secondAge = frame - at(spec, 'second');
  const firstExit = secondAge + 17;
  const firstX = sample(DOCUMENT_ENTER, firstAge) + sample(DOCUMENT_EXIT, firstExit);
  const secondX = sample(DOCUMENT_REPLACE, secondAge);
  const gridOpacity = sample([0, 0, 0, 0, .18, .37, .56, .78, 1], frame);
  return <div style={{...fill, background: '#b5b8d4'}}>
    <style>{"@font-face{font-family:PortraitDocumentHeavy;src:url('" + asset(base + 'documents-heavy.woff2') + "') format('woff2');font-display:block;}"}</style>
    <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
      <defs>
        <filter id={gridFilter} colorInterpolationFilters="sRGB">
          <feColorMatrix values="0 0 0 0 .84  0 0 0 0 .87  0 0 0 0 1  .2126 .7152 .0722 0 0"/>
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 .015 .087 .202 .279 .36 .58 .80"/>
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
    <Media spec={spec} name="background" continuous style={documentsBackdrop}/>
    <div style={{...fill, background: '#aab0ea', mixBlendMode: 'color', opacity: .67}}/>
    <div style={{...fill, background: '#b0b5e5', opacity: .13}}/>
    <div style={{
      ...fill, opacity: gridOpacity, mixBlendMode: 'screen', backgroundImage: documentsGridFine,
      backgroundPosition: '0 -2px, -1px 0',
    }}/>
    {gridOpacity > 0 && <div style={{
      ...fill, opacity: gridOpacity, mixBlendMode: 'screen', maskImage: documentsGridGlow,
      maskPosition: '0 -3.55px, -2px 0',
    }}>
      <div style={{...fill, filter: 'url(#' + gridFilter + ')'}}>
        <Media spec={spec} name="background" continuous style={documentsBackdrop}/>
      </div>
    </div>}
    {titleAge >= 0 && <div style={{
      ...position([28, 35 + sample(DOCUMENT_TITLE, titleAge), 304, 89]), display: 'grid', placeItems: 'center',
      filter: 'drop-shadow(0 2px 4px #411624ed) drop-shadow(0 2px 9px #541823b8)',
    }}>
      <Img src={asset(base + 'documents-plate.png')} style={{...fill, clipPath: 'inset(1px 2px 2px round 7px)'}}/>
      <svg viewBox="0 0 304 89" style={{...fill, width: '100%', height: '100%', overflow: 'visible'}} aria-label={content(spec, 'title')}>
        <g transform="translate(147.1 69) skewX(-11.15) scale(1.01 .979)" style={{fontFamily: 'PortraitDocumentHeavy, Microsoft YaHei, sans-serif'}}>
          <text textAnchor="middle" fontSize="61" fill="#fffef9" stroke="#fffef9" strokeWidth="9.3" strokeLinejoin="round"
            style={{filter: 'drop-shadow(1.1px 1.7px 1px #45101e)'}}>{content(spec, 'title')}</text>
          <text textAnchor="middle" fontSize="61" fill="#74141b" stroke="#74141b" strokeWidth=".75" strokeLinejoin="round">{content(spec, 'title')}</text>
        </g>
      </svg>
    </div>}
    {firstAge >= 0 && firstExit < DOCUMENT_EXIT.length - 1 && <div style={{
      ...position([18 + firstX, 168, 328, 235]), overflow: 'hidden', borderRadius: 38,
      background: '#fdfdfd', boxShadow: '0 4px 7px #161a2adc, 0 4px 13px #171d32a8',
    }}><Media spec={spec} name="first"/></div>}
    {secondAge >= 0 && <div style={{
      ...position([37 + secondX, 159, 288, 283]), overflow: 'hidden', borderRadius: 24,
      background: '#fdfdfd', boxShadow: '0 4px 7px #161a2ad6, 0 4px 12px #171d32a1',
    }}><Media spec={spec} name="second"/></div>}
  </div>;
}

const diagonalSlots = [
  {key: 'upper', box: [0, 0, 360, 250]},
  {key: 'middle', box: [0, 174, 360, 294]},
  {key: 'lower', box: [0, 345, 360, 295]},
] as const;

const DIAGONAL_WIPES = [
  {
    lead: 0, mainX: [363, 363, 348, 308, 252, 190, 142, 84, 53, 31, 8, 0],
    backX: [-367, -367, -356, -326, -280, -221, -177, -110, -44, -15, 0, 0],
    mainBlur: [0, 0, 12, 20, 23, 22, 18, 16, 11, 7, 3, 0],
    backBlur: [0, 0, 10, 14, 20, 23, 22, 17, 12, 7, 3, 0],
  },
  {
    lead: 25, mainX: [365, 365, 365, 305, 255, 176, 89, 41, 29, 23, 18, 15, 12, 9, 7, 5, 4, 2, 1, 1, 0],
    backX: [-365, -365, -329, -258, -174, -89, -49, -35, -34, -29, -22, -16, -12, -9, -7, -5, -3, -2, -1, 0],
    mainBlur: [0, 0, 0, 18, 25, 28, 25, 16, 2, .5, 0],
    backBlur: [0, 0, 16, 27, 27, 21, 16, 9, 2, 0],
    strip: [74, 210],
  },
  {
    lead: 22, mainX: [365, 365, 318, 231, 150, 78, 14, 0],
    backX: [-365, -365, -278, -180, -73, -5, 0],
    mainBlur: [0, 0, 8, 15, 13, 9, 5, 0],
    backBlur: [0, 0, 11, 17, 15, 10, 5, 0],
    strip: [76, 215],
  },
] as const;

const flashStrength = [
  [0, .23, .95, 1, .98, .83, .15, 0],
  [0, .56, 1, .99, .53, 0],
  [0, .12, 1, 1, .46, 0],
] as const;
const flashLead = [3, 2, 2];
const peakExposure = [
  [0, .26, .61, .82, .94, .974, .986, .993, .998],
  [.31, .64, .85, .95, .978, .984, .99, .993, .995],
  [.85, .914, .947, .964, .974, .983, .988, .992, .997],
] as const;
const flashBloom = [.87, .94, .82];
const flashRadius = [19, 30, 11];
const middleEchoOffset = [16, 15, 13, 11, 10, 8, 7, 6, 5, 4, 3, 2, 0];
const middleEchoOpacity = [.17, .17, .16, .16, .15, .14, .13, .12, .10, .08, .06, .04, 0];
const slotClip = (topLeft: number, topRight: number, bottomLeft: number, bottomRight: number) =>
  'polygon(0 ' + topLeft + 'px,100% ' + topRight + 'px,100% ' + bottomRight + 'px,0 ' + bottomLeft + 'px)';

function exposureCurve(slot: number, strength: number) {
  return peakExposure[slot].map((peak, i) => i / 8 + (peak - i / 8) * strength).join(' ');
}

function filmSpecks(frame: number) {
  const grainFrame = Math.floor(frame);
  const rand = (n: number) => {
    const raw = Math.sin(n * 127.1 + grainFrame * 311.7) * 43758.5453;
    return raw - Math.floor(raw);
  };
  return Array.from({length: 9}, (_, i) => {
    const k = i * 7;
    return {
      x: rand(k + 1) * 360, y: rand(k + 2) * 640,
      width: .6 + rand(k + 3) * (i === 0 ? 6 : 1.6),
      height: .55 + rand(k + 4) * (i === 0 ? 7 : 2.3),
      angle: -70 + rand(k + 5) * 140, alpha: .1 + rand(k + 6) * .43,
      light: i % 4 === 0,
    };
  });
}
const glitchSamples = [
  {red: [0, 0], green: [3, -6], blue: [0, 0], tears: [[477, 38, -3]], edge: [634, 640, '#af21c2', .63]},
  {red: [0, 0], green: [-5, 15], blue: [-5, 15], tears: [[202, 144, 18]], edge: [0, 16, '#a31724', .62]},
  {red: [0, 0], green: [0, 0], blue: [10, -20], tears: [[80, 142, 24], [338, 145, 14], [513, 65, 16]], edge: [620, 640, 'linear-gradient(#a6b32924 0px, #a6b32985 3px, #a6b32988 20px)', .85]},
  {red: [0, 0], green: [0, 0], blue: [-7, -2], tears: [[110, 63, -46], [383, 45, 40], [500, 90, -38]], edge: null},
  {red: [0, 0], green: [13, -23], blue: [0, 0], tears: [[184, 40, -55], [324, 140, -54]], edge: [616, 640, '#ac17ba', .58]},
] as const;

// The larger fixed dust marks have independent, short lifetimes on each source transition.
const diagonalDust = [
  {slot: 'middle', age: 10, points: [[30, 359, 1.5]], shape: 'M0 -2L1.5 -1 2 1 .5 2 -1.7 1.2 -1.3 -.8Z', alpha: .68},
  {slot: 'middle', age: 11, points: [[49, 372, 1.3], [50, 370, 1.2]], shape: 'M-.5 -4L.5 -4 0 -1 2.5 1 1 4 -1.8 3 -1.5 1Z', alpha: .72},
  {slot: 'lower', age: 20, points: [[64, 533, 1.5]], shape: 'M0 -6L1 -3 2 -2 .8 .5 2 2 1 5 -1 3 -2 0 -1 -2 -1.5 -4Z', alpha: .79},
  {slot: 'lower', age: 41, points: [[337, 516, 1.1]], shape: 'M0 -2L1.5 -1 2 1 .5 2 -1.7 1.2 -1.3 -.8Z', alpha: .56},
] as const;

function Diagonal({spec, frame, duration}: {spec: RestoredLayoutSpec; frame: number; duration: number}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const glitchFrame = frame - duration + glitchSamples.length;
  const glitch = glitchFrame >= 0 ? glitchSamples[Math.min(glitchSamples.length - 1, Math.floor(glitchFrame))] : null;
  const middleWipeAge = frame - at(spec, 'middleHit') + DIAGONAL_WIPES[1].lead;
  const lowerWipeAge = frame - at(spec, 'lowerHit') + DIAGONAL_WIPES[2].lead;
  const middleReflection = middleWipeAge >= 8 && frame < at(spec, 'middleHit') + 3;
  const upperBoundaryL = sample([174, 174, 174, 188, 210, 228, 242, 247], frame);
  const upperBoundaryR = sample([174, 174, 175, 179, 183, 186, 187], frame);
  const lowerBoundaryL = lowerWipeAge < 0 ? 445 : sample([466, 466, 466, 466, 466, 466, 463, 456, 449, 447, 445], lowerWipeAge);
  const lowerBoundaryR = lowerWipeAge < 0 ? 389 : sample([466, 466, 456, 451, 435, 420, 408, 398, 393, 390, 389], lowerWipeAge);
  const layouts = diagonalSlots.map(({key, box}, i) => {
    const hit = at(spec, key + 'Hit');
    const age = frame - hit + flashLead[i];
    const wipe = DIAGONAL_WIPES[i];
    const wipeAge = i === 0 ? frame : frame - hit + wipe.lead;
    const strength = sample(flashStrength[i], age);
    const active = wipeAge >= 0;
    const shift = active ? sample(wipe.mainX, wipeAge) : 0;
    const backgroundShift = active ? sample(wipe.backX, wipeAge) : 0;
    const mainBlur = active ? sample(wipe.mainBlur, wipeAge) : 0;
    const backBlur = active ? sample(wipe.backBlur, wipeAge) : 0;
    const echoAge = wipeAge - 8;
    const echoAlpha = i === 1 && echoAge >= 0 ? sample(middleEchoOpacity, echoAge) : 0;
    const echoOffset = sample(middleEchoOffset, echoAge);
    const dim = lowerWipeAge >= 0 ? [.50, .63, 1.14][i] : i === 1 && middleWipeAge >= 0 ? 1 : [.65, .77, .66][i];
    const y = box[1];
    const cut = [
      slotClip(0, 0, upperBoundaryL - 1, upperBoundaryR - 1),
      slotClip(upperBoundaryL - y, upperBoundaryR - y, lowerBoundaryL - y - 1, lowerBoundaryR - y - 1),
      slotClip(lowerBoundaryL - y, lowerBoundaryR - y, 640 - y, 640 - y),
    ][i];
    const strip = 'strip' in wipe ? wipe.strip : undefined;
    const showStrip = strip && active && frame < hit + (i === 1 ? 3 : 4);
    const stripRelease = showStrip ? clamp((frame - hit + 1) / 5) : 1;
    const keepMiddleEdges = i === 1 && middleReflection;
    const stripTop = keepMiddleEdges ? 75 : strip?.[0] ?? 0;
    const stripBottom = keepMiddleEdges ? 85 : box[3] - (strip?.[1] ?? box[3]);
    const mainCut = strip ? 'inset(' + stripTop * (1 - stripRelease) + 'px 0 '
      + stripBottom * (1 - stripRelease) + 'px ' + (keepMiddleEdges ? -shift : 0) + 'px)' : undefined;
    const middleTop = stripTop * (1 - stripRelease);
    return {key, box, i, wipeAge, active, shift, backgroundShift, strength, mainBlur, backBlur, dim, cut, showStrip, strip, stripRelease, mainCut, echoAlpha, echoOffset, middleTop};
  });
  return <div style={{...fill, background: '#000'}}>
    <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
      <defs>
        <filter id={uid + 'frost'} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feComponentTransfer><feFuncR type="table" tableValues="0 .10 .21 .34 .48 .63 .77 .89 .99"/>
            <feFuncG type="table" tableValues=".025 .14 .27 .41 .55 .69 .82 .93 1"/>
            <feFuncB type="table" tableValues=".05 .19 .34 .49 .62 .75 .87 .96 1"/>
          </feComponentTransfer>
        </filter>
        {layouts.map(({key, i, strength, mainBlur, backBlur, echoAlpha, echoOffset}) => [
          <filter key={key + '-main'} id={uid + key + '-main'} x="-32%" y="-10%" width="164%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={mainBlur + ' .48'}/>
          </filter>,
          <filter key={key + '-back'} id={uid + key + '-back'} x="-32%" y="-10%" width="164%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={backBlur + ' .54'}/>
          </filter>,
          ...(echoAlpha > 0 ? [
            <filter key={key + '-echo'} id={uid + key + '-echo'} x="-20%" y="-5%" width="140%" height="110%" colorInterpolationFilters="sRGB">
              <feOffset in="SourceGraphic" dx={echoOffset} result="offset"/>
              <feGaussianBlur in="offset" stdDeviation="4.1 .24"/>
              <feComponentTransfer><feFuncA type="linear" slope={echoAlpha}/></feComponentTransfer>
              <feBlend in2="SourceGraphic" mode="normal"/>
            </filter>,
          ] : []),
          <filter key={key + '-exposure'} id={uid + key + '-exposure'} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="table" tableValues={exposureCurve(i, strength)}/>
              <feFuncG type="table" tableValues={exposureCurve(i, strength)}/>
              <feFuncB type="table" tableValues={exposureCurve(i, strength)}/>
            </feComponentTransfer>
          </filter>,
        ])}
        {glitch && <filter id={uid + 'rgb'} x="-10%" y="-10%" width="120%" height="120%" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>
          <feOffset in="red" dx={glitch.red[0]} dy={glitch.red[1]} result="shiftedRed"/>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>
          <feOffset in="green" dx={glitch.green[0]} dy={glitch.green[1]} result="shiftedGreen"/>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>
          <feOffset in="blue" dx={glitch.blue[0]} dy={glitch.blue[1]} result="shiftedBlue"/>
          <feBlend in="shiftedRed" in2="shiftedGreen" mode="screen" result="yellow"/>
          <feBlend in="yellow" in2="shiftedBlue" mode="screen" result="rgb"/>
          {glitch.tears.flatMap(([y, height, x], i) => [
            <feFlood x="0" y={y} width="360" height={height} floodColor="#fff" result={'slice' + i} key={'slice' + i}/>,
            <feOffset in="rgb" dx={x} result={'offset' + i} key={'offset' + i}/>,
            <feOffset in="rgb" dx={x > 0 ? x - 360 : x + 360} result={'wrap' + i} key={'wrap' + i}/>,
            <feMerge result={'shift' + i} key={'shift' + i}><feMergeNode in={'wrap' + i}/><feMergeNode in={'offset' + i}/></feMerge>,
            <feComposite in={'shift' + i} in2={'slice' + i} operator="in" result={'tear' + i} key={'tear' + i}/>,
          ])}
          <feMerge><feMergeNode in="rgb"/>{glitch.tears.map((_, i) => <feMergeNode key={i} in={'tear' + i}/>)}</feMerge>
        </filter>}
      </defs>
    </svg>
    <div style={{...fill, filter: glitch ? 'url(#' + uid + 'rgb)' : undefined}}>
      {layouts.map(({key, box, i, wipeAge, active, shift, backgroundShift, strength, mainBlur, backBlur, dim, cut, showStrip, strip, stripRelease, mainCut, echoAlpha, middleTop}) => {
        const motionFilter = (part: string, blur: number) => blur > .5 ? ' url(#' + uid + key + '-' + part + ')' : '';
        const exposure = strength > 0 ? ' url(#' + uid + key + '-exposure)' : '';
        const stripGain = showStrip && i ? sample([1, 1, 1.02, 1.1, 1.14, 1.17, 1.20, 1.23, 1.26], wipeAge) : 1;
        const coolLower = i === 2 && active && wipeAge >= 5 && strength < .5;
        const saturation = i === 0 && strength > 0 ? ' saturate(' + (1 - .95 * strength) + ')' : coolLower ? ' saturate(.68)' : '';
        const frost = coolLower ? ' url(#' + uid + 'frost)' : '';
        const shade = 'brightness(' + dim * stripGain + ')' + saturation + frost;
        const backShade = 'grayscale(' + (i ? .82 : .1) + ') brightness(' + (i ? dim * .64 : dim * .89) + ')'
          + (coolLower ? ' contrast(.76)' : '') + frost;
        const lowerOvershoot = i === 2 && wipeAge >= 2 && wipeAge < 8;
        const overshootCut = lowerOvershoot
          ? slotClip(sample([4, 13, 37, 64, 86, 99, 104], wipeAge - 2), sample([-18, -12, 12, 34, 54, 69, 76], wipeAge - 2), box[3], box[3])
          : cut;
        const showBack = active && (i === 0 ? wipeAge < 10 : Boolean(showStrip));
        const splitReflection = i === 1 && middleReflection;
        return <div key={key} style={position(box)}>
          <div style={{...fill, clipPath: cut, background: '#000'}}/>
          {splitReflection && <div style={{...fill, clipPath: cut}}>
            <div style={{...fill, clipPath: 'inset(0 0 74% 0)', filter: 'grayscale(.86) brightness(.57) blur(.65px)'}}>
              <Media spec={spec} name={key} continuous/>
            </div>
            <div style={{...fill, clipPath: 'inset(71% 0 0 0)'}}>
              <div style={{...fill, left: -40, width: 440, transform: 'translateX(' + backgroundShift + 'px)',
                filter: 'grayscale(.83) brightness(.65)' + motionFilter('back', backBlur)}}>
                <div style={{...fill, left: 40, width: 360}}>
                  <Media spec={spec} name={key} continuous/>
                </div>
              </div>
            </div>
          </div>}
          {showBack && !splitReflection && backgroundShift > -360 && <div style={{...fill, clipPath: overshootCut}}>
            <div style={{
              ...fill, transform: 'translateX(' + backgroundShift + 'px)',
              filter: backShade + motionFilter('back', backBlur) + exposure,
            }}>
              <Media spec={spec} name={key} continuous style={{transform: i ? 'scale(1.37) translate(' + (i === 1 ? -11 : 8) + 'px,' + (i === 1 ? 15 : 12) + 'px)' : undefined}}/>
            </div>
          </div>}
          {shift < 360 && <div style={{
            ...fill, clipPath: cut,
            maskImage: splitReflection && middleTop > 2
              ? 'linear-gradient(transparent ' + (middleTop - 1) + 'px, #000 ' + (middleTop + 1.8) + 'px)' : undefined,
          }}>
            <div style={{
              ...fill, transform: 'translateX(' + shift + 'px)',
              filter: shade + motionFilter('main', mainBlur) + exposure + (echoAlpha ? ' url(#' + uid + key + '-echo)' : ''),
            }}>
              <div style={{
                ...fill, clipPath: mainCut,
              }}>
                <Media spec={spec} name={key} continuous/>
                {splitReflection && shift > 0 && <div style={{
                  ...fill, left: -shift, width: shift + 1, right: 'auto', overflow: 'hidden',
                }}>
                  <div style={{...fill, width: 360, transform: 'translateX(' + shift + 'px) scaleX(-1)', transformOrigin: '0 50%'}}>
                    <Media spec={spec} name={key} continuous/>
                  </div>
                </div>}
              </div>
            </div>
          </div>}
          {showStrip && strip && shift < 360 && <div style={{...fill, clipPath: cut, opacity: 1 - stripRelease}}>
            <div style={{position: 'absolute', left: shift, right: 0, top: box[3] - (box[3] - strip[1]) * (1 - stripRelease) - 4,
              height: 10, background: 'linear-gradient(transparent, #080e18c9 39%, #090d16b0 52%, #14192144 70%, transparent)',
              filter: 'blur(' + (1.1 + mainBlur * .13) + 'px)'}}/>
          </div>}
        </div>;
      })}
      {layouts.filter(({strength}) => strength > .03).map(({key, box, i, strength, cut}) => <div key={key + '-bloom'} style={{
        ...position(box), pointerEvents: 'none', mixBlendMode: 'screen',
        opacity: strength * flashBloom[i], filter: 'blur(' + flashRadius[i] + 'px)',
      }}>
        <div style={{...fill, clipPath: cut, filter: (i === 0 ? 'saturate(' + (1 - .95 * strength) + ') ' : '') + 'url(#' + uid + key + '-exposure)'}}>
          <Media spec={spec} name={key} continuous/>
        </div>
      </div>)}
      <svg width="360" height="640" viewBox="0 0 360 640" style={{...fill, pointerEvents: 'none'}} aria-hidden>
        {filmSpecks(frame).map(({x, y, width, height, angle, alpha, light}, i) =>
          <ellipse key={i} cx={x} cy={y} rx={width} ry={height} fill={light ? '#e5e8ec' : '#141312'} opacity={alpha}
            transform={'rotate(' + angle + ' ' + x + ' ' + y + ')'}/>)}
        {diagonalDust.map(({slot, age, points, shape, alpha}, i) => {
          const index = Math.round(slot === 'middle' ? middleWipeAge : lowerWipeAge) - age;
          const point = points[index];
          if (!point) return null;
          const [x, y, size] = point;
          return <path key={i} d={shape} fill="#17141c" opacity={alpha} transform={'translate(' + x + ' ' + y + ') scale(' + size + ')'}/>;
        })}
        {glitchFrame >= 0 && glitchFrame < 2 &&
          <path d="M0 -5L2 -3 4 -1 2 3 -3 3 -4 0 -2 -2Z" fill="#28292a" opacity={.66}
            transform={'translate(' + (119 + glitchFrame * 2) + ' ' + (628 + glitchFrame * 2) + ') scale(1.25)'}/>}
        {lowerWipeAge >= 2 && lowerWipeAge < 26 && Math.floor(frame) % 7 < 4 &&
          <path d="M6 365L8 638 M322 368L323 512" stroke="#171817" strokeWidth="1.2" opacity=".24"/>}
      </svg>
    </div>
    {glitch?.edge && <div style={{
      position: 'absolute', left: 0, right: 0, top: glitch.edge[0], height: glitch.edge[1] - glitch.edge[0],
      background: glitch.edge[2], opacity: glitch.edge[3], pointerEvents: 'none',
    }}/>}
  </div>;
}

export function RestoredLayouts({profile, spec}: {profile: Profile; spec: RestoredLayoutSpec}) {
  const videoFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frame = videoFrame * 30 / fps;
  const duration = Number(spec._duration ?? profile.duration) * 30;
  switch (profile.tag) {
    case 'mg-v-torn-label-stages': return <TornLabels spec={spec} frame={frame}/>;
    case 'mg-v-sliding-document-pair': return <Documents spec={spec} frame={frame}/>;
    case 'mg-v-folded-three-photos': return <FoldedThreePhotos spec={spec} frame={frame} duration={duration}/>;
    case 'mg-v-three-diagonal-clips': return <Diagonal spec={spec} frame={frame} duration={duration}/>;
    default: return null;
  }
}

const restoredTags = ['mg-v-torn-label-stages', 'mg-v-sliding-document-pair', 'mg-v-folded-three-photos', 'mg-v-three-diagonal-clips'];
export const hasRestoredLayout = (tag: string) => restoredTags.includes(tag);
