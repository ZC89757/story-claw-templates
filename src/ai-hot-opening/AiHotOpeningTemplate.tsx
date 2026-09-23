import type {CSSProperties, ReactNode} from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {layoutAiHotOpeningItems} from "./layout";
import type {AiHotOpeningSpec} from "./types";

type Props = {spec: AiHotOpeningSpec; style?: CSSProperties};

const WIDTH = 1920;
const HEIGHT = 1080;
const BASE_DURATION_SECONDS = 7;
const APERTURE_START = 8 / 30;
const APERTURE_END = 102 / 30;
const CURTAIN_START = 10 / 30;
const CURTAIN_END = 88 / 30;
const COLOR_START = 1;
const COLOR_END = 139 / 30;
const HERO_START = 22 / 30;
const HERO_END = 86 / 30;
const ITEMS_START = 64 / 30;
const ITEMS_END = 132 / 30;
const GLARE_START = 34 / 30;
const GLARE_END = 74 / 30;
const GLARE_FADE_LEAD_SECONDS = 32 / 30;
const VISUAL_FADE_LEAD_SECONDS = 12 / 30;
const LAST_FRAME_SECONDS = 1 / 30;

const clampOptions = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const progress = (
  value: number,
  from: number,
  to: number,
  easing: (input: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(value, [from, to], [0, 1], {...clampOptions, easing});

const SpectrumBackdrop = ({colorProgress}: {colorProgress: number}) => {
  const frame = useCurrentFrame();
  const drift = frame * 0.34;
  const breathe = 1 + Math.sin(frame / 22) * 0.018;
  const saturation = interpolate(colorProgress, [0, 1], [0, 1.32]);
  const brightness = interpolate(colorProgress, [0, 1], [0.72, 1.04]);

  return <AbsoluteFill style={{
    overflow: "hidden",
    background: "#050609",
    filter: `grayscale(${1 - colorProgress}) saturate(${saturation}) brightness(${brightness})`,
  }}>
    <AbsoluteFill style={{
      background: [
        "radial-gradient(circle at 50% 46%, rgba(255,255,255,.22) 0 3%, transparent 22%)",
        "radial-gradient(circle at 29% 35%, rgba(38,220,255,.72), transparent 31%)",
        "radial-gradient(circle at 73% 62%, rgba(255,43,126,.62), transparent 32%)",
        "radial-gradient(circle at 54% 91%, rgba(255,199,61,.44), transparent 28%)",
        "linear-gradient(135deg,#08111f 0%,#12111e 46%,#07090d 100%)",
      ].join(","),
      transform: `scale(${breathe}) translate3d(${Math.sin(frame / 34) * 10}px,${Math.cos(frame / 42) * 8}px,0)`,
    }} />

    <AbsoluteFill style={{
      opacity: 0.34,
      backgroundImage: "linear-gradient(rgba(255,255,255,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.09) 1px,transparent 1px)",
      backgroundSize: "76px 76px",
      transform: `perspective(900px) rotateX(66deg) scale(1.75) translateY(${160 + drift}px)`,
      transformOrigin: "50% 68%",
      maskImage: "linear-gradient(to bottom,transparent 12%,black 55%,transparent 100%)",
    }} />

    <div style={{
      position: "absolute",
      left: -240,
      right: -240,
      top: 385,
      height: 310,
      opacity: 0.82,
      background: "linear-gradient(90deg,transparent 4%,#2ad9ff 18%,#8a5cff 42%,#ff397f 66%,#ffc33d 84%,transparent 96%)",
      filter: "blur(42px)",
      transform: `rotate(-7deg) translateX(${Math.sin(frame / 30) * 24}px) scaleY(${0.86 + colorProgress * 0.16})`,
      mixBlendMode: "screen",
    }} />

    {Array.from({length: 28}).map((_, index) => {
      const x = (index * 193) % WIDTH;
      const y = (index * 347) % HEIGHT;
      const size = 2 + (index % 4) * 1.5;
      const twinkle = 0.28 + Math.max(0, Math.sin(frame / 12 + index * 1.7)) * 0.58;
      return <i key={index} style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        color: index % 3 === 0 ? "#ffdc8b" : "#d9f9ff",
        background: "currentColor",
        boxShadow: `0 0 ${10 + size * 3}px currentColor`,
        opacity: twinkle,
      }} />;
    })}
  </AbsoluteFill>;
};

const titleSizeFor = (title: string): number => {
  const units = Array.from(title).reduce(
    (total, character) => total + (/^[\u0000-\u00ff]$/.test(character) ? 0.58 : 1),
    0,
  );
  return Math.max(48, Math.min(82, 94 - units * 3));
};

const HeroMark = ({spec, reveal}: {spec: AiHotOpeningSpec; reveal: number}) => {
  const frame = useCurrentFrame();
  const float = Math.sin(frame / 23) * 6;
  const pulse = 1 + Math.sin(frame / 27) * 0.012;
  const hasSubtitle = Boolean(spec.subTitle);

  return <AbsoluteFill style={{display: "grid", placeItems: "center", zIndex: 4}}>
    <div style={{
      position: "absolute",
      width: 570,
      height: 570,
      borderRadius: "50%",
      border: "1px solid rgba(255,255,255,.26)",
      boxShadow: "inset 0 0 90px rgba(255,255,255,.05),0 0 90px rgba(99,229,255,.1)",
      opacity: reveal,
      transform: `translateY(${float}px) scale(${0.84 + reveal * 0.16})`,
    }}>
      {[0, 1, 2].map((index) => <span key={index} style={{
        position: "absolute",
        inset: 42 + index * 54,
        borderRadius: "50%",
        border: `1px solid rgba(255,255,255,${0.28 - index * 0.05})`,
        transform: `rotate(${frame * (index % 2 ? -0.16 : 0.13) + index * 28}deg)`,
      }}>
        <i style={{
          position: "absolute",
          left: "50%",
          top: -5,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: index === 0 ? "#64e8ff" : index === 1 ? "#ff4a97" : "#ffd06a",
          boxShadow: "0 0 22px currentColor",
        }} />
      </span>)}
    </div>

    <div style={{
      position: "relative",
      width: 380,
      height: 380,
      borderRadius: "50%",
      overflow: "hidden",
      display: "grid",
      placeItems: "center",
      opacity: reveal,
      transform: `translateY(${float}px) scale(${(0.72 + reveal * 0.28) * pulse})`,
      background: "radial-gradient(circle at 36% 27%,rgba(255,255,255,.58),rgba(115,226,255,.15) 22%,rgba(19,15,35,.82) 62%,rgba(3,5,9,.94) 100%)",
      border: "2px solid rgba(255,255,255,.46)",
      boxShadow: "inset -42px -44px 80px rgba(0,0,0,.46),inset 24px 20px 46px rgba(255,255,255,.12),0 42px 100px rgba(0,0,0,.48)",
      backdropFilter: "blur(26px) saturate(1.3)",
    }}>
      <div style={{
        position: "absolute",
        inset: -90,
        background: "conic-gradient(from 118deg,transparent 0 9%,rgba(36,221,255,.82) 16%,transparent 27%,rgba(255,48,135,.9) 42%,transparent 54%,rgba(255,203,72,.88) 68%,transparent 79%,rgba(119,83,255,.82) 91%,transparent)",
        filter: "blur(22px)",
        opacity: 0.7,
        transform: `rotate(${frame * 0.36}deg)`,
        mixBlendMode: "screen",
      }} />
      <div style={{
        position: "relative",
        width: 330,
        textAlign: "center",
        color: "white",
        transform: `translateY(${hasSubtitle ? -2 : 0}px)`,
      }}>
        {spec.subTitle ? <div style={{
          overflow: "hidden",
          fontFamily: "Segoe UI,Microsoft YaHei,sans-serif",
          fontSize: spec.subTitle.length > 20 ? 24 : 29,
          lineHeight: 1.1,
          fontWeight: 650,
          opacity: 0.76,
          letterSpacing: 0,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
        }}>{spec.subTitle}</div> : null}
        <div style={{
          marginTop: hasSubtitle ? 20 : 0,
          overflow: "hidden",
          fontFamily: "Microsoft YaHei,Segoe UI,sans-serif",
          fontSize: titleSizeFor(spec.title),
          lineHeight: 1.05,
          fontWeight: 850,
          letterSpacing: 0,
          overflowWrap: "anywhere",
          textShadow: "0 8px 40px rgba(0,0,0,.56),0 0 24px rgba(255,255,255,.12)",
        }}>{spec.title}</div>
      </div>
    </div>
  </AbsoluteFill>;
};

const NewsOrbit = ({items, reveal}: {items: readonly string[]; reveal: number}) => {
  const frame = useCurrentFrame();
  const layout = layoutAiHotOpeningItems(items);

  return <AbsoluteFill style={{zIndex: 3, pointerEvents: "none"}}>
    {layout.map((item, index) => {
      const itemReveal = progress(reveal, index * 0.075, 0.55 + index * 0.075, Easing.out(Easing.back(1.04)));
      const floatX = Math.sin(frame / (30 + index * 2.2) + index * 1.31) * (4 + index % 2 * 2);
      const floatY = Math.cos(frame / (27 + index * 2.4) + index * 1.67) * (5 + index % 3);
      const tilt = Math.sin(frame / 48 + index) * 0.55;
      const enterX = (item.side === "left" ? -1 : 1) * (1 - itemReveal) * 72;
      const units = Array.from(item.text).reduce(
        (total, character) => total + (/^[\u0000-\u00ff]$/.test(character) ? 0.58 : 1),
        0,
      );

      return <div key={`${item.text}-${index}`} style={{
        position: "absolute",
        left: item.left,
        top: item.top,
        width: item.width,
        height: 96,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        padding: "0 30px 0 34px",
        borderRadius: 28,
        overflow: "hidden",
        color: "#fff",
        background: "linear-gradient(135deg,rgba(255,255,255,.19),rgba(255,255,255,.075) 48%,rgba(255,255,255,.035))",
        border: "1px solid rgba(255,255,255,.32)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(255,255,255,.06),0 18px 44px rgba(0,0,0,.28),0 0 30px rgba(92,220,255,.07)",
        backdropFilter: "blur(25px) saturate(1.4)",
        WebkitBackdropFilter: "blur(25px) saturate(1.4)",
        opacity: itemReveal,
        transform: `translate3d(${enterX + floatX}px,${(1 - itemReveal) * 18 + floatY}px,0) rotate(${tilt}deg) scale(${0.93 + itemReveal * 0.07})`,
        transformOrigin: item.side === "left" ? "right center" : "left center",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(105deg,rgba(255,255,255,.18),transparent 26% 73%,rgba(255,255,255,.08))",
          opacity: 0.62,
        }} />
        <div style={{
          position: "absolute",
          left: 0,
          top: 18,
          bottom: 18,
          width: 4,
          borderRadius: 4,
          background: item.accent,
          boxShadow: `0 0 18px ${item.accent}`,
        }} />
        <span style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          color: "#fff",
          fontFamily: "Microsoft YaHei,Segoe UI,sans-serif",
          fontSize: units > 19 ? 25 : 28,
          lineHeight: 1.25,
          fontWeight: 650,
          letterSpacing: 0,
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          textShadow: "0 2px 16px rgba(0,0,0,.58)",
        }}>{item.text}</span>
      </div>;
    })}
  </AbsoluteFill>;
};

const RotatingGlare = ({seconds, visibility}: {seconds: number; visibility: number}) => {
  const size = HEIGHT * 0.5;
  const angle = 100 + seconds * (180 / BASE_DURATION_SECONDS);
  const flarePulse = 0.82 + Math.sin(seconds * 30 / 16) * 0.18;

  return <AbsoluteFill style={{display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 2}}>
    <div style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      opacity: visibility * flarePulse * 0.72,
      transform: `rotate(${angle}deg) scale(${0.94 + flarePulse * 0.06})`,
      background: "conic-gradient(from 0deg,transparent 0 21%,rgba(118,235,255,.85) 24%,rgba(255,255,255,.96) 25%,transparent 28% 49%,rgba(255,91,161,.72) 51%,transparent 54% 75%,rgba(255,226,143,.8) 77%,transparent 80%)",
      filter: "blur(16px)",
      mixBlendMode: "screen",
      maskImage: "radial-gradient(circle,black 0 18%,rgba(0,0,0,.92) 32%,transparent 71%)",
    }} />
    <div style={{
      position: "absolute",
      width: size * 1.82,
      height: 5,
      opacity: visibility * 0.52,
      transform: `rotate(${angle}deg)`,
      background: "linear-gradient(90deg,transparent,rgba(83,218,255,.18) 20%,white 50%,rgba(255,89,156,.2) 80%,transparent)",
      filter: "blur(3px)",
      boxShadow: "0 0 18px rgba(255,255,255,.85)",
      mixBlendMode: "screen",
    }} />
    {[0.19, 0.32, 0.68, 0.81].map((offset, index) => <span key={offset} style={{
      position: "absolute",
      left: `${offset * 100}%`,
      top: "50%",
      width: 28 + index * 15,
      height: 28 + index * 15,
      borderRadius: "50%",
      border: `2px solid ${index % 2 ? "rgba(255,92,160,.48)" : "rgba(100,231,255,.48)"}`,
      opacity: visibility * (0.42 + index * 0.08),
      filter: "blur(1px)",
      transform: `translate(-50%,-50%) rotate(${angle}deg)`,
      mixBlendMode: "screen",
    }} />)}
  </AbsoluteFill>;
};

const ApertureBloom = ({value}: {value: number}) => {
  const ringSize = interpolate(value, [0, 1], [120, 1540], clampOptions);
  const wash = interpolate(value, [0, 0.42, 1], [0, 0.54, 0], clampOptions);
  const ringOpacity = interpolate(value, [0, 0.22, 1], [0, 1, 0], clampOptions);

  return <AbsoluteFill style={{display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 5}}>
    <div style={{
      position: "absolute",
      width: ringSize,
      height: ringSize,
      borderRadius: "50%",
      border: `${interpolate(value, [0, 1], [22, 3], clampOptions)}px solid rgba(255,255,255,.95)`,
      opacity: ringOpacity,
      boxShadow: "0 0 34px 12px rgba(114,231,255,.72),0 0 96px 34px rgba(255,74,151,.34),inset 0 0 42px rgba(255,222,126,.5)",
      filter: `blur(${interpolate(value, [0, 1], [1, 11], clampOptions)}px)`,
      mixBlendMode: "screen",
    }} />
    <AbsoluteFill style={{
      opacity: wash,
      background: "radial-gradient(circle at center,rgba(255,255,255,.92),rgba(105,229,255,.22) 22%,rgba(255,78,153,.12) 43%,transparent 68%)",
      mixBlendMode: "screen",
    }} />
    <AbsoluteFill style={{
      background: `radial-gradient(circle at center,transparent 0 ${Math.max(0, ringSize * 0.42)}px,rgba(0,0,0,${interpolate(value, [0, 1], [0.96, 0], clampOptions)}) ${Math.max(1, ringSize * 0.58)}px)`,
    }} />
  </AbsoluteFill>;
};

const CurtainPanel = ({side, value, children}: {side: "top" | "bottom"; value: number; children?: ReactNode}) => {
  const isTop = side === "top";
  const translate = (isTop ? -1 : 1) * value * 104;
  return <div style={{
    position: "absolute",
    left: 0,
    right: 0,
    [isTop ? "top" : "bottom"]: 0,
    height: "50.5%",
    overflow: "hidden",
    transform: `translateY(${translate}%)`,
    background: isTop
      ? "linear-gradient(180deg,#020306 0%,#090d14 70%,#151d27 100%)"
      : "linear-gradient(0deg,#020306 0%,#090d14 70%,#151d27 100%)",
    boxShadow: isTop
      ? "0 18px 46px rgba(0,0,0,.7),0 2px 0 rgba(255,255,255,.18)"
      : "0 -18px 46px rgba(0,0,0,.7),0 -2px 0 rgba(255,255,255,.18)",
  } as CSSProperties}>
    {children}
  </div>;
};

const VerticalCurtain = ({value}: {value: number}) => {
  const frame = useCurrentFrame();
  const seamOpacity = interpolate(value, [0, 0.72, 1], [0.82, 0.42, 0], clampOptions);
  const texture: CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: 0.28,
    backgroundImage: "repeating-linear-gradient(90deg,transparent 0 116px,rgba(255,255,255,.08) 117px,transparent 119px)",
    transform: `translateX(${(frame * 0.25) % 119}px)`,
  };

  return <AbsoluteFill style={{pointerEvents: "none", zIndex: 6}}>
    <CurtainPanel side="top" value={value}><div style={texture} /></CurtainPanel>
    <CurtainPanel side="bottom" value={value}><div style={texture} /></CurtainPanel>
    <div style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: "50%",
      height: 4,
      opacity: seamOpacity,
      transform: `translateY(-50%) scaleX(${0.35 + value * 0.65})`,
      background: "linear-gradient(90deg,transparent,#5de8ff 22%,white 50%,#ff4b96 78%,transparent)",
      boxShadow: "0 0 26px 7px rgba(103,230,255,.45),0 0 56px 18px rgba(255,69,145,.22)",
      mixBlendMode: "screen",
    }} />
  </AbsoluteFill>;
};

export const AiHotOpeningTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const holdExtension = Math.max(0, spec.durationSeconds - BASE_DURATION_SECONDS);
  const glareFadeStart = BASE_DURATION_SECONDS - GLARE_FADE_LEAD_SECONDS + holdExtension;
  const fadeStart = BASE_DURATION_SECONDS - VISUAL_FADE_LEAD_SECONDS + holdExtension;
  const fadeEnd = BASE_DURATION_SECONDS - LAST_FRAME_SECONDS + holdExtension;
  const visualOpacity = interpolate(seconds, [fadeStart, fadeEnd], [1, 0], clampOptions);
  const aperture = progress(seconds, APERTURE_START, APERTURE_END, Easing.out(Easing.cubic));
  const curtain = progress(seconds, CURTAIN_START, CURTAIN_END, Easing.inOut(Easing.quad));
  const color = progress(seconds, COLOR_START, COLOR_END, Easing.inOut(Easing.cubic));
  const heroReveal = progress(seconds, HERO_START, HERO_END, Easing.out(Easing.back(1.2)));
  const itemsReveal = progress(seconds, ITEMS_START, ITEMS_END, Easing.out(Easing.cubic));
  const glareIn = progress(seconds, GLARE_START, GLARE_END, Easing.out(Easing.cubic));
  const glareOut = interpolate(seconds, [glareFadeStart, fadeEnd], [1, 0], clampOptions);

  return <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none", ...style}}>
    <AbsoluteFill style={{background: "#020306", opacity: visualOpacity}}>
      <SpectrumBackdrop colorProgress={color} />
      <RotatingGlare seconds={seconds} visibility={glareIn * glareOut} />
      <NewsOrbit items={spec.items} reveal={itemsReveal} />
      <HeroMark spec={spec} reveal={heroReveal} />
      <ApertureBloom value={aperture} />
      <VerticalCurtain value={curtain} />
      <AbsoluteFill style={{
        zIndex: 7,
        opacity: 0.16,
        backgroundImage: "repeating-radial-gradient(circle at 20% 30%,rgba(255,255,255,.48) 0 1px,transparent 1px 4px)",
        backgroundSize: "9px 9px",
        mixBlendMode: "soft-light",
      }} />
    </AbsoluteFill>
    <Sequence from={0} durationInFrames={Math.max(1, Math.round(spec.durationSeconds * fps))} layout="none">
      <Audio src={staticFile("audio/riser-cine.mp3")} volume={0.18} />
    </Sequence>
  </AbsoluteFill>;
};
