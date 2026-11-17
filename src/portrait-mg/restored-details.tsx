import {OriginalWordmark} from './original-wordmark';
import {useId, type CSSProperties, type ReactNode} from 'react';
import {Img, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {PortraitMedia, asset} from './common';

type Value = {at?: number; text?: string; source?: string; sourceStart?: number | null};
type DetailSpec = Record<string, Value | undefined>;

const full: CSSProperties = {position: 'absolute', inset: 0};
const linearClamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const decor = (name: string) => asset(`portrait-mg/restored-details/${name}`);
const imageFrame = (frame: number) => String(Math.floor(frame)).padStart(3, '0');
const atReferenceFrame = (time: number) => Math.round(time * 30 * 1e6) / 1e6;
const frames = (value: number[]) => value.map((_, index) => index);
const sample = (time: number, values: number[]) => interpolate(time, frames(values), values, linearClamp);

// Measurements from the 30 fps, 360 × 640 reference.
const ovalUpperShift = [0, -6, -12, -18, -24, -29, -35, -41, -48, -54, -60, -66, -72, -78, -84, -90, -96, -102, -108, -113, -119, -125];
const ovalLowerShift = [296, 260, 226, 193, 160, 128, 101, 75, 54, 38, 20, 0];
const sweepUpperShift = [65, 62, 58, 55, 52, 49, 45, 42, 39, 36, 32, 29, 26, 23, 19, 16, 13, 10, 6, 3, 0];

function Media({value, box, style}: {value?: Value; box?: CSSProperties; style?: CSSProperties}) {
  const {fps} = useVideoConfig();
  if (!value?.source) return null;
  const {source, sourceStart, at} = value;
  return <div style={{...full, overflow: 'hidden', ...box}}>
    <Sequence from={Math.round((at ?? 0) * fps)} layout="none">
      <PortraitMedia media={{source, sourceStart: sourceStart ?? null}} style={style} />
    </Sequence>
  </div>;
}

function Artwork({name, style}: {name: string; style?: CSSProperties}) {
  return <Img src={decor(name)} style={{...full, width: '100%', height: '100%', ...style}} />;
}

function PaperWindow({name, transform, filter, seamFade, children}: {name: string; transform?: string; filter?: string; seamFade?: number; children: ReactNode}) {
  return <div style={{...full, transform, filter}}>
    <div style={{...full, maskImage: `url("${decor(name + '-mask.png')}")`, maskSize: '100% 100%'}}>
      {children}
    </div>
    <Artwork name={name + '-paper.png'} style={seamFade === undefined ? undefined : {opacity: seamFade}} />
  </div>;
}

function ReportScene({spec, time}: {spec: DetailSpec; time: number}) {
  const doc = spec.document;
  const elapsed = time - (doc?.at ?? 0);
  return <div style={{...full, background: '#000'}}>
    <Artwork name="report/ribbon.png" style={{height: 70}} />
    <Media value={spec.background} box={{top: 70, bottom: 170}} />
    <Artwork name="report/bottom-rule.png" style={{top: 468, height: 6}} />
    {doc?.source && elapsed >= 0 && <div style={{
      position: 'absolute', left: 34, top: 151, width: 292, height: 193, overflow: 'hidden',
      borderRadius: 35, background: 'white', boxShadow: '0 1px 3px #0009',
    }}>
      <Img src={asset(doc.source)} style={{
        display: 'block', width: 292, height: 'auto', transform: `translateY(${-60 * elapsed}px)`,
      }} />
    </div>}
    <OriginalWordmark content={spec.signature} original="portrait-mg/restored-details/report/signature.png" box={[35,526,288,55]}/>
  </div>;
}


// The first frame has a second, much broader image of the incoming oval at both canvas edges.
function OvalEdgeStreak({value}: {value?: Value}) {
  const strip: CSSProperties = {position: 'absolute', left: -24, right: -24, overflow: 'hidden'};
  return <>
    <div style={{
      ...strip, top: 0, height: 103,
      maskImage: 'linear-gradient(#0005, #0009 17%, #000d 36%, #000a 56%, #0005 76%, transparent 96%)',
    }}>
      <Media value={value} box={{top: -22, bottom: -25}} style={{
        filter: 'blur(11px) brightness(.92) saturate(.77)', transform: 'scaleX(1.12) scaleY(-1)',
      }} />
    </div>
    <div style={{
      ...strip, bottom: 0, height: 96,
      maskImage: 'linear-gradient(transparent 3%, #0004 27%, #000a 52%, #000f 79%, #000c 92%, #0009 100%)',
    }}>
      <Media value={value} box={{top: -30, bottom: -25}} style={{
        filter: 'blur(13px) brightness(.59) saturate(.77)', transform: 'scaleX(1.13) scaleY(-1)',
      }} />
    </div>
  </>;
}

function OvalJointBlend({value, strength, tailStrength}: {value?: Value; strength: number; tailStrength: number}) {
  return <>
  <div style={{
    ...full, top: 331, bottom: 253, opacity: strength,
    maskImage: 'linear-gradient(transparent 0%, #0005 22%, #000c 42%, #000a 71%, #0003 91%, transparent 100%)',
  }}>
    <Media value={value} box={{top: 0, bottom: -244}} style={{
      filter: 'blur(2.5px) saturate(.93)',
    }} />
  </div>
  <div style={{
    ...full, top: 369, bottom: 226, opacity: tailStrength,
    maskImage: 'linear-gradient(transparent, #0007 25%, #0005 54%, #0003 75%, transparent 100%)',
  }}>
    <Media value={value} box={{top: -8, bottom: -255, overflow: 'visible'}} style={{
      filter: 'blur(2px) saturate(.91)', transform: 'scaleY(1.30)', transformOrigin: 'center top',
    }} />
  </div>
  </>;
}

function TornOvalScene({spec, time}: {spec: DetailSpec; time: number}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const upperOffset = sample(time * 30, ovalUpperShift);
  const lowerFrame = atReferenceFrame(time - (spec.lower?.at ?? 0));
  const ovalFrame = atReferenceFrame(time - (spec.oval?.at ?? 0));
  const lowerOffset = sample(lowerFrame, ovalLowerShift);
  const entry = Math.round(ovalFrame);
  const entryAsset = entry < 11 ? `torn-oval/entry-${String(entry).padStart(2, '0')}` : undefined;
  const blur = sample(ovalFrame, [3.7, 3.3, 2.5, 1.75, 1.32, 1.05, .85, .7, .45, .22, 0]);
  const seamFade = ovalFrame < 0 ? 1 : sample(ovalFrame, [0, .02, .18, .54, .81, 1]);
  const rimSoftness = ovalFrame >= 0 ? sample(ovalFrame, [1.7, 1.65, 1.25, .5, .18, 0]) : 0;

  return <div style={{...full, background: '#000'}}>
    {lowerFrame >= 0 && <div style={{...full, transform: `translateY(${lowerOffset}px)`}}>
      <Media value={spec.lower} box={{top: 340}} style={{
        maskImage: 'linear-gradient(transparent, black 26px)', objectPosition: 'center',
      }} />
    </div>}
    <PaperWindow name="torn-oval/upper" transform={`translateY(${upperOffset}px)`} seamFade={seamFade}>
      <Media value={spec.upper} box={{top: 47, bottom: 168}} />
    </PaperWindow>
    {ovalFrame >= 0 && <>
      {ovalFrame < 4 && <OvalJointBlend value={spec.lower} strength={sample(ovalFrame, [1, .89, .68, .20, 0])}
        tailStrength={sample(ovalFrame, [.22, .72, .71, .13, 0])} />}
      {entry === 0 && <OvalEdgeStreak value={spec.oval} />}
      {entryAsset && <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
        <defs>
          <filter id={id} x="0" y="0" width="360" height="640" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={decor(entryAsset + '-map.png')} x="0" y="0" width="360" height="640" preserveAspectRatio="none" result="coordinates" />
            <feDisplacementMap in="SourceGraphic" in2="coordinates" scale="111" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation={`${blur * 1.55} ${blur * (entry <= 2 ? .88 : .56)}`} />
          </filter>
        </defs>
      </svg>}
      <PaperWindow name={entryAsset ?? 'torn-oval/oval'} filter={rimSoftness > 0 ? `blur(${rimSoftness}px)` : undefined}>
        <div style={{...full, filter: entryAsset ? `url(#${id})` : undefined}}>
          <Media value={spec.oval} box={{top: 222, bottom: 247}} />
        </div>
      </PaperWindow>
    </>}
  </div>;
}

function SweepCaption({content, oldText, firstAlpha, afterFrame}: {content: string; oldText: boolean; firstAlpha: number; afterFrame: number}) {
  const cut = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const front = interpolate(afterFrame, [3, 4, 5, 6, 7, 8, 9, 11], [31, 86, 124, 173, 223, 266, 306, 350], linearClamp);
  const glow = interpolate(afterFrame, [3, 7, 12, 19], [.60, 1, .75, 0], linearClamp);
  const particleAge = Math.floor(afterFrame + 1e-6);
  const inSweep = !oldText && particleAge >= 3 && particleAge <= 9;
  const layerMask = (name: string): CSSProperties => ({
    maskImage: inSweep ? `url("${decor(`sweep/${name}/${imageFrame(particleAge)}.png`)}")` : undefined,
    maskSize: '360px 640px', maskPosition: '-10px -458px', maskRepeat: 'no-repeat',
  });
  const glyphs = Array.from(content);
  const width = Math.min(1, 4.90 / glyphs.length);
  const position: CSSProperties = {
    ...full, fontFamily: 'Microsoft YaHei, Noto Sans SC, sans-serif', fontSize: 53, fontWeight: 700,
    letterSpacing: 4.35, textAlign: 'center', whiteSpace: 'pre', lineHeight: '88px',
    transform: `translate(2.3px, -.2px) scale(${width}, 1.045)`,
  };
  const reveal: CSSProperties = {
    position: 'absolute', left: 10, top: 458, width: 340, height: 90,
    maskImage: oldText ? undefined : `linear-gradient(to right, black ${front - 28}px, #000c ${front - 6}px, transparent ${front + 15}px)`,
  };
  return <>
    <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
      <defs>
        <filter id={cut} x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceGraphic" operator="erode" radius=".12 .36" result="fineHorizontals" />
          <feTurbulence type="fractalNoise" baseFrequency=".065 .17" numOctaves="2" seed="29" result="bevel" />
          <feDisplacementMap in="fineHorizontals" in2="bevel" scale="1.3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    <div style={{...reveal, opacity: oldText ? firstAlpha : 1}}>
      <div style={{...position, transform: `translate(5.7px, 2px) scale(${width}, 1.045)`, color: '#8bb5d4',
        opacity: .63, textShadow: '1px 1px 1px #9ab6d880, 4px 2px 2px #7698bb85',
      }}>{content}</div>
      {!oldText && glow > 0 && <div style={{
        ...position, color: '#ffe69b', textShadow: '0 0 7px #ffdf65, 0 0 16px #ffd553', opacity: glow,
      }}>{content}</div>}
      <div style={{...full, ...layerMask('letter-mask')}}>
        <div style={{...position, filter: `url(#${cut})`}}>
          {glyphs.map((glyph, index) => <span key={index} style={{
            display: 'inline-block', color: 'transparent', backgroundClip: 'text',
            backgroundImage: 'linear-gradient(98deg,#fff 20%,#f9ffff 58%,#dbedf8 76%,#94bad3 99%)',
          }}>{glyph}</span>)}
        </div>
      </div>
    </div>
    {inSweep && <div style={{...reveal, zIndex: 2}}>
      <div style={{...full, ...layerMask('letter-spark')}}>
        <div style={{...position, filter: `url(#${cut})`, color: '#fff6c9', textShadow: '0 0 1.1px #ffe788'}}>{content}</div>
      </div>
    </div>}
  </>;
}

function SweepScene({spec, time}: {spec: DetailSpec; time: number}) {
  const globalFrame = atReferenceFrame(time);
  const beforeFrame = atReferenceFrame(time - (spec.before?.at ?? 0));
  const afterFrame = atReferenceFrame(time - (spec.after?.at ?? 0));
  const upper = sample(globalFrame, sweepUpperShift);
  const firstAlpha = interpolate(beforeFrame, [0, 1, 4, 10, 18], [0, .02, .48, .88, 1], linearClamp);
  const oldText = afterFrame < 0;
  const content = oldText ? spec.before?.text : spec.after?.text;

  return <div style={{...full, background: '#03090c'}}>
    <Artwork name={`sweep/background/${imageFrame(globalFrame)}.png`} />
    <div style={{position: 'absolute', top: upper, width: 360, height: 408, overflow: 'hidden'}}>
      <Media value={spec.upper} box={{top: 3, bottom: 3}} />
      <div style={{...full, borderBlock: '3px solid #eef5f5'}} />
    </div>
    {beforeFrame >= 0 && <Artwork name="sweep/card.png" style={{left: 10, top: 453, width: 340, height: 102}} />}
    {beforeFrame >= 0 && content && (oldText || afterFrame >= 3) &&
      <SweepCaption content={content} oldText={oldText} firstAlpha={firstAlpha} afterFrame={afterFrame} />}
    {afterFrame >= 1 && afterFrame < 19 && <Artwork name={`sweep/gold/${imageFrame(afterFrame - 1)}.png`} style={{zIndex: 1}} />}
  </div>;
}

// The reference's numeric glyphs have chamfered corners and narrow square counters.
const titleNumbers: Record<string, string> = {
  '0': 'M5 0H25L30 5V42L25 47H5L0 42V5ZM11 12V35H19V12Z',
  '1': 'M10 0H22V47H9V15H1V7Z',
  '2': 'M5 0H25L30 5V22L25 27H12V35H30V47H0V23L5 18H18V12H11V15H0V5Z',
  '3': 'M5 0H25L30 5V18L26 23L30 27V42L25 47H5L0 42V33H11V36H19V29H8V18H19V11H11V14H0V5Z',
  '4': 'M0 0H11V19H19V0H30V47H19V31H4L0 27Z',
  '5': 'M0 0H30V12H12V17H25L30 22V42L25 47H5L0 42V34H11V36H19V29H0Z',
  '6': 'M5 0H27V12H12V17H25L30 22V42L25 47H5L0 42V5ZM12 29V36H19V29Z',
  '7': 'M0 0H30V12L18 47H5L17 12H0Z',
  '8': 'M5 0H25L30 5V18L26 23L30 28V42L25 47H5L0 42V28L4 23L0 18V5ZM11 11V18H19V11ZM11 29V36H19V29Z',
  '9': 'M5 0H25L30 5V42L25 47H3V36H19V30H5L0 25V5ZM11 12V19H19V12Z',
};

function OpeningTitle({text, time}: {text?: string; time: number}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!text || time < 0) return null;
  const frame = atReferenceFrame(time);
  const glyphs = Array.from(text);
  const titleWidth = glyphs.reduce((width, char) => width + (titleNumbers[char] ? 38 : 48), 0);
  return <div style={{
    ...full, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 39,
    transform: `scaleX(${Math.min(1, 316 / titleWidth)})`,
  }}>
    <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
      <defs>
        {[10, 8, 6, 4, 2].map((blur, i) => <filter key={i} id={`${id}-${i}`} x="-90%" y="-30%" width="280%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${blur} .85`} />
        </filter>)}
      </defs>
    </svg>
    {glyphs.map((char, index) => {
      const age = frame - index * (glyphs.length === 1 ? 0 : 9 / (glyphs.length - 1));
      const alpha = interpolate(age, [0, 1, 3, 5, 7], [0, .19, .62, .89, 1], linearClamp);
      const offset = interpolate(age, [0, 2, 5, 7], [11, 8, 4, 0], linearClamp);
      const blur = Math.min(5, Math.max(0, Math.floor(age * .72)));
      const number = titleNumbers[char];
      const shape = number ? <svg width="30" height="47" viewBox="0 0 30 47" aria-hidden>
        <path d={number} fill="#fff" fillRule="evenodd" />
      </svg> : <span style={{
        fontFamily: 'Microsoft YaHei, Noto Sans SC, sans-serif', fontWeight: 900,
        fontSize: 51, lineHeight: '47px', WebkitTextStroke: '2.6px white',
      }}>{char}</span>;
      return <div key={index} style={{
        width: number ? 38 : 48, height: 48, display: 'flex', justifyContent: 'center',
        alignItems: 'center', color: 'white', transform: `translateX(${offset}px)`, opacity: alpha,
        filter: blur < 5 ? `url(#${id}-${blur})` : 'drop-shadow(1px 2px 1px #000) drop-shadow(2px 4px 3px #0009)',
      }}>{shape}</div>;
    })}
  </div>;
}

function ClosingTitle({text, frame}: {text?: string; frame: number}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!text || frame < 0) return null;
  const opacity = interpolate(frame, [0, 2, 5, 8], [0, .40, .8, 1], linearClamp);
  const scale = interpolate(frame, [0, 2, 4, 6, 8, 10, 13], [.60, .71, .81, .88, .94, .98, 1], linearClamp);
  const sheenFrame = (frame - 18) % 15;
  const sheenX = interpolate(sheenFrame, [0, 1, 2, 3, 4, 5, 6, 7, 8, 10], [30, 43, 71, 123, 153, 213, 248, 298, 316, 345], linearClamp);
  const sheenAlpha = frame < 18 ? 0 : interpolate(sheenFrame, [0, 1, 7, 8, 9, 10], [.46, 1, 1, .67, .35, 0], linearClamp);
  const sheenWidth = interpolate(sheenFrame, [0, 1, 3, 5, 7, 8, 10], [.67, 1.12, 1.17, .72, 1.19, 1.10, .66], linearClamp);
  const lettering: CSSProperties = {
    ...full, fontFamily: 'STXinwei, DetailBrush, STXingkai, cursive', fontSize: 78, fontWeight: 400, lineHeight: '100px',
    textAlign: 'center', whiteSpace: 'pre', letterSpacing: 5.5,
  };
  return <div style={{
    position: 'absolute', left: 8, top: 260, width: 344, height: 100, opacity,
    transform: `scale(${scale * Math.min(1, 4 / Array.from(text).length)}, ${scale * 1.067})`,
  }}>
    <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
      <defs>
        <filter id={id} x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".039 .079" numOctaves="2" seed="31" result="pressure" />
          <feDisplacementMap in="SourceGraphic" in2="pressure" scale="7.1" xChannelSelector="R" yChannelSelector="G" result="bone" />
          <feMorphology in="bone" operator="erode" radius="1.24 1.1" result="interior" />
          <feComposite in="bone" in2="interior" operator="out" result="edge" />
          <feTurbulence type="fractalNoise" baseFrequency=".15 .20" numOctaves="3" seed="17" result="bristles" />
          <feDisplacementMap in="edge" in2="bristles" scale="6.8" xChannelSelector="R" yChannelSelector="G" result="tornEdge" />
          <feDisplacementMap in="interior" in2="bristles" scale="2.9" xChannelSelector="R" yChannelSelector="G" result="ink" />
          <feTurbulence type="fractalNoise" baseFrequency=".31 .097" numOctaves="2" seed="47" result="dryBrush" />
          <feColorMatrix in="dryBrush" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.5 0 0 0 1.15" result="cuts" />
          <feComposite in="tornEdge" in2="cuts" operator="out" result="bristleTips" />
          <feMerge>
            <feMergeNode in="bristleTips" />
            <feMergeNode in="ink" />
          </feMerge>
        </filter>
      </defs>
    </svg>
    <div style={{...full, filter: `url(#${id})`}}>
      <div style={{
        ...lettering, transform: 'translate(1.25px, 2.0px)', color: '#780703',
        WebkitTextStroke: '3.8px #7d0602', textShadow: '1px 1px 1px #350401',
      }}>{text}</div>
      <div style={{
        ...lettering, color: 'transparent', WebkitTextStroke: '3.1px #ae0904',
        background: 'linear-gradient(#9e0502 21%, #f41b0b 36%, #ed1409 52%, #960602 72%, #6f0703 88%)',
        backgroundClip: 'text',
      }}>{text}</div>
      {sheenAlpha > 0 && <div style={{
        ...lettering, color: 'transparent', backgroundClip: 'text', opacity: sheenAlpha,
        filter: 'drop-shadow(0 0 2.6px #ff7b6075) drop-shadow(0 0 3.3px #f060583b)',
        backgroundImage: `linear-gradient(105deg,transparent ${sheenX - 68 * sheenWidth}px,#ff625f60 ${sheenX - 53 * sheenWidth}px,#ff827bb3 ${sheenX - 32 * sheenWidth}px,#fa8e84df ${sheenX - 14 * sheenWidth}px,#f9a398f5 ${sheenX + 2 * sheenWidth}px,#f88c83df ${sheenX + 21 * sheenWidth}px,#fc6d62a0 ${sheenX + 40 * sheenWidth}px,transparent ${sheenX + 68 * sheenWidth}px)`,
        WebkitTextStroke: '1.7px #ff85703f',
        maskImage: `linear-gradient(105deg,transparent ${sheenX - 58 * sheenWidth}px,#000 ${sheenX - 24 * sheenWidth}px,#000 ${sheenX + 28 * sheenWidth}px,transparent ${sheenX + 58 * sheenWidth}px)`,
      }}>{text}</div>}
    </div>
  </div>;
}

function TornTitleScene({spec, time}: {spec: DetailSpec; time: number}) {
  const closingFrame = atReferenceFrame(time - (spec.closing?.at ?? 0));
  const currentShot = time >= (spec.nextClip?.at ?? Infinity) ? 1 : 0;
  return <div style={{...full, background: '#172126'}}>
    <style>{`@font-face { font-family: DetailBrush; src: url("${asset('portrait-mg/V11_002/brush.ttf')}"); font-display: block; }`}</style>
    <Media value={spec.background} style={{filter: closingFrame < 0 ? 'brightness(.58) saturate(.59) blur(2px)' : 'brightness(.44) saturate(.67)'}} />
    {closingFrame < -1e-6 ? <>
      <PaperWindow name={`torn-title/window-${currentShot}`}>
        <Media value={currentShot ? spec.nextClip : spec.clip} box={{top: currentShot ? 109 : 126, bottom: 161}} />
      </PaperWindow>
      <OpeningTitle text={spec.opening?.text} time={time - (spec.opening?.at ?? 0)} />
    </> : <>
      {closingFrame >= 5 && closingFrame < 47 && <Artwork name={`torn-title/smoke/${imageFrame(closingFrame - 5)}.png`} />}
      <ClosingTitle text={spec.closing?.text} frame={Math.max(0, closingFrame)} />
    </>}
  </div>;
}

export function RestoredDetails({id, spec}: {id: string; spec: DetailSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  if (id === 'V13_003') return <ReportScene spec={spec} time={time} />;
  if (id === 'V20_006') return <TornOvalScene spec={spec} time={time} />;
  if (id === 'V20_009') return <SweepScene spec={spec} time={time} />;
  if (id === 'V24_001') return <TornTitleScene spec={spec} time={time} />;
  return null;
}
