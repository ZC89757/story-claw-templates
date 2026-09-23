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
import {layoutAiHotOpeningItems, type AiHotOpeningItemLayout} from "../ai-hot-opening/layout";
import type {AiHotFocusStageSpec} from "./types";

const WIDTH = 1920;
const HEIGHT = 1080;
const BUTTON_HEIGHT = 96;
const CENTER_BUTTON = {left: 650, top: 492, width: 620, height: BUTTON_HEIGHT};

type Props = {spec: AiHotFocusStageSpec; style?: CSSProperties};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

const progress = (
  value: number,
  from: number,
  to: number,
  easing: (input: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(value, [from, to], [0, 1], {...clamp, easing});

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
        "radial-gradient(circle at 50% 46%,rgba(255,255,255,.22) 0 3%,transparent 22%)",
        "radial-gradient(circle at 29% 35%,rgba(38,220,255,.72),transparent 31%)",
        "radial-gradient(circle at 73% 62%,rgba(255,43,126,.62),transparent 32%)",
        "radial-gradient(circle at 54% 91%,rgba(255,199,61,.44),transparent 28%)",
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

const HeroMark = ({spec, reveal}: {spec: AiHotFocusStageSpec; reveal: number}) => {
  const frame = useCurrentFrame();
  const float = Math.sin(frame / 23) * 6;
  const pulse = 1 + Math.sin(frame / 27) * 0.012;

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
          color: index === 0 ? "#64e8ff" : index === 1 ? "#ff4a97" : "#ffd06a",
          background: "currentColor",
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
      <div style={{position: "relative", width: 330, textAlign: "center", color: "white"}}>
        {spec.subTitle ? <div style={{
          fontFamily: "Segoe UI,Microsoft YaHei,sans-serif",
          fontSize: 29,
          lineHeight: 1.1,
          fontWeight: 650,
          opacity: 0.76,
          letterSpacing: 0,
        }}>{spec.subTitle}</div> : null}
        <div style={{
          marginTop: spec.subTitle ? 20 : 0,
          fontFamily: "Microsoft YaHei,Segoe UI,sans-serif",
          fontSize: 78,
          lineHeight: 1.05,
          fontWeight: 850,
          letterSpacing: 0,
          textShadow: "0 8px 40px rgba(0,0,0,.56)",
        }}>{spec.title}</div>
      </div>
    </div>
  </AbsoluteFill>;
};

const RotatingGlare = ({visibility}: {visibility: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const size = HEIGHT * 0.5;
  const angle = 100 + frame / fps * (180 / 7);
  const flarePulse = 0.82 + Math.sin(frame / 16) * 0.18;

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
  </AbsoluteFill>;
};

const GlassButton = ({
  layout,
  opacity,
  index,
}: {
  layout: AiHotOpeningItemLayout;
  opacity: number;
  index: number;
}) => {
  const frame = useCurrentFrame();
  const floatX = Math.sin(frame / (30 + index * 2.2) + index * 1.31) * (4 + index % 2 * 2);
  const floatY = Math.cos(frame / (27 + index * 2.4) + index * 1.67) * (5 + index % 3);
  const tilt = Math.sin(frame / 48 + index) * 0.55;

  return <div style={{
    position: "absolute",
    left: layout.left,
    top: layout.top,
    width: layout.width,
    height: BUTTON_HEIGHT,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    padding: "0 30px 0 34px",
    borderRadius: 28,
    overflow: "hidden",
    color: "#fff",
    background: "linear-gradient(135deg,rgba(255,255,255,.19),rgba(255,255,255,.075) 48%,rgba(255,255,255,.035))",
    border: "1px solid rgba(255,255,255,.32)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.34),0 18px 44px rgba(0,0,0,.28)",
    backdropFilter: "blur(25px) saturate(1.4)",
    WebkitBackdropFilter: "blur(25px) saturate(1.4)",
    opacity,
    transform: `translate3d(${floatX}px,${floatY}px,0) rotate(${tilt}deg)`,
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
      background: layout.accent,
      boxShadow: `0 0 18px ${layout.accent}`,
    }} />
    <span style={{
      position: "relative",
      width: "100%",
      overflow: "hidden",
      color: "#fff",
      fontFamily: "Microsoft YaHei,Segoe UI,sans-serif",
      fontSize: 28,
      lineHeight: 1.25,
      fontWeight: 650,
      letterSpacing: 0,
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      textShadow: "0 2px 16px rgba(0,0,0,.58)",
    }}>{layout.text}</span>
  </div>;
};

const morphForItem = (seconds: number, items: AiHotFocusStageSpec["items"], index: number): number => {
  const item = items[index];
  const enterStart = item.time + (index === 0 ? 0 : 0.42);
  const enter = progress(seconds, enterStart, enterStart + 1.3, Easing.inOut(Easing.cubic));
  const next = items[index + 1];
  const exit = next
    ? progress(seconds, next.time, next.time + 0.78, Easing.inOut(Easing.cubic))
    : 0;
  return enter * (1 - exit);
};

const MorphingChapter = ({
  layout,
  morph,
  index,
  total,
}: {
  layout: AiHotOpeningItemLayout;
  morph: number;
  index: number;
  total: number;
}) => {
  const frame = useCurrentFrame();
  const travel = progress(morph, 0, 0.34, Easing.inOut(Easing.cubic));
  const expand = progress(morph, 0.28, 1, Easing.inOut(Easing.cubic));
  const moveLeft = mix(layout.left, CENTER_BUTTON.left, travel);
  const moveTop = mix(layout.top, CENTER_BUTTON.top, travel);
  const moveWidth = mix(layout.width, CENTER_BUTTON.width, travel);
  const left = mix(moveLeft, 0, expand);
  const top = mix(moveTop, 0, expand);
  const width = mix(moveWidth, WIDTH, expand);
  const height = mix(BUTTON_HEIGHT, HEIGHT, expand);
  const titleWidthAtButton = mix(layout.width - 68, CENTER_BUTTON.width - 68, travel);
  const fullOpacity = progress(morph, 0.1, 0.42, Easing.out(Easing.cubic));
  const detailOpacity = progress(expand, 0.52, 0.92, Easing.out(Easing.cubic));
  const sequence = String(index + 1).padStart(2, "0");

  if (morph <= 0.001) return null;

  return <div style={{
    position: "absolute",
    left,
    top,
    width,
    height,
    zIndex: 20 + index,
    overflow: "hidden",
    boxSizing: "border-box",
    borderRadius: mix(28, 0, expand),
    color: "#fff",
    background: "linear-gradient(135deg,rgba(255,255,255,.19),rgba(255,255,255,.075) 48%,rgba(255,255,255,.035))",
    border: `${mix(1, 0, expand)}px solid rgba(255,255,255,.34)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,.3),0 ${mix(18, 0, expand)}px ${mix(44, 100, expand)}px rgba(0,0,0,.42)`,
    backdropFilter: `blur(${mix(25, 54, expand)}px) saturate(${mix(1.4, 1.16, expand)})`,
    WebkitBackdropFilter: `blur(${mix(25, 54, expand)}px) saturate(${mix(1.4, 1.16, expand)})`,
    opacity: progress(morph, 0, 0.08, Easing.out(Easing.cubic)),
  }}>
    <div style={{
      position: "absolute",
      inset: 0,
      opacity: fullOpacity,
      background: [
        `radial-gradient(circle at 0% 0%,${layout.accent}38,transparent 34%)`,
        "radial-gradient(circle at 100% 88%,rgba(255,66,145,.22),transparent 38%)",
        "radial-gradient(circle at 46% 52%,rgba(61,103,145,.11),transparent 42%)",
        "linear-gradient(145deg,rgba(5,9,17,.965),rgba(12,14,25,.94) 50%,rgba(4,7,13,.975))",
      ].join(","),
    }} />
    <div style={{
      position: "absolute",
      inset: 0,
      opacity: expand * 0.15,
      backgroundImage: "linear-gradient(rgba(255,255,255,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.09) 1px,transparent 1px)",
      backgroundSize: "88px 88px",
      maskImage: "linear-gradient(to bottom,black,transparent 78%)",
      transform: `translate(${frame * 0.05}px,${frame * 0.03}px)`,
    }} />
    <div style={{
      position: "absolute",
      left: mix(0, 54, expand),
      top: mix(18, 66, expand),
      width: mix(4, 6, expand),
      height: mix(60, 74, expand),
      borderRadius: 6,
      background: layout.accent,
      boxShadow: `0 0 ${mix(18, 34, expand)}px ${layout.accent}`,
    }} />
    <div style={{
      position: "absolute",
      left: mix(34, 86, expand),
      top: mix(0, 58, expand),
      width: mix(titleWidthAtButton, 1300, expand),
      height: mix(BUTTON_HEIGHT, 92, expand),
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      fontFamily: "Microsoft YaHei,Segoe UI,sans-serif",
      fontSize: mix(28, 48, expand),
      lineHeight: 1.18,
      fontWeight: mix(650, 760, expand),
      letterSpacing: 0,
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      textShadow: "0 4px 26px rgba(0,0,0,.62)",
    }}>{layout.text}</div>
    <div style={{
      position: "absolute",
      left: 86,
      top: 168,
      width: 450,
      height: 1,
      opacity: detailOpacity * 0.7,
      background: `linear-gradient(90deg,${layout.accent},transparent)`,
      boxShadow: `0 0 14px ${layout.accent}`,
    }} />
    <div style={{
      position: "absolute",
      right: 72,
      top: 61,
      opacity: detailOpacity * 0.48,
      fontFamily: "Segoe UI,Microsoft YaHei,sans-serif",
      fontSize: 20,
      lineHeight: 1,
      fontWeight: 650,
      color: "rgba(255,255,255,.76)",
      letterSpacing: 0,
      fontVariantNumeric: "tabular-nums",
    }}>{sequence} / {String(total).padStart(2, "0")}</div>
    <div style={{
      position: "absolute",
      right: -24,
      bottom: -78,
      opacity: detailOpacity * 0.035,
      fontFamily: "Segoe UI,sans-serif",
      fontSize: 440,
      lineHeight: 1,
      fontWeight: 900,
      letterSpacing: 0,
      color: "#fff",
    }}>{sequence}</div>
    <div style={{
      position: "absolute",
      left: -160,
      right: -160,
      bottom: -180,
      height: 360,
      opacity: detailOpacity * 0.22,
      background: `radial-gradient(ellipse at center,${layout.accent},transparent 67%)`,
      filter: "blur(54px)",
    }} />
  </div>;
};

const ApertureBloom = ({value}: {value: number}) => {
  const ringSize = interpolate(value, [0, 1], [120, 1540], clamp);
  const wash = interpolate(value, [0, 0.42, 1], [0, 0.54, 0], clamp);
  const ringOpacity = interpolate(value, [0, 0.22, 1], [0, 1, 0], clamp);

  return <AbsoluteFill style={{display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 30}}>
    <div style={{
      position: "absolute",
      width: ringSize,
      height: ringSize,
      borderRadius: "50%",
      border: `${interpolate(value, [0, 1], [22, 3], clamp)}px solid rgba(255,255,255,.95)`,
      opacity: ringOpacity,
      boxShadow: "0 0 34px 12px rgba(114,231,255,.72),0 0 96px 34px rgba(255,74,151,.34)",
      filter: `blur(${interpolate(value, [0, 1], [1, 11], clamp)}px)`,
      mixBlendMode: "screen",
    }} />
    <AbsoluteFill style={{
      opacity: wash,
      background: "radial-gradient(circle at center,rgba(255,255,255,.92),rgba(105,229,255,.22) 22%,rgba(255,78,153,.12) 43%,transparent 68%)",
      mixBlendMode: "screen",
    }} />
    <AbsoluteFill style={{
      background: `radial-gradient(circle at center,transparent 0 ${Math.max(0, ringSize * 0.42)}px,rgba(0,0,0,${interpolate(value, [0, 1], [0.96, 0], clamp)}) ${Math.max(1, ringSize * 0.58)}px)`,
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
  } as CSSProperties}>{children}</div>;
};

const VerticalCurtain = ({value}: {value: number}) => {
  const frame = useCurrentFrame();
  const seamOpacity = interpolate(value, [0, 0.72, 1], [0.82, 0.42, 0], clamp);
  const texture: CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: 0.28,
    backgroundImage: "repeating-linear-gradient(90deg,transparent 0 116px,rgba(255,255,255,.08) 117px,transparent 119px)",
    transform: `translateX(${(frame * 0.25) % 119}px)`,
  };

  return <AbsoluteFill style={{pointerEvents: "none", zIndex: 31}}>
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

export const AiHotFocusStageTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const layouts = layoutAiHotOpeningItems(spec.items.map((item) => item.title));
  const aperture = progress(seconds, 8 / 30, 102 / 30, Easing.out(Easing.cubic));
  const curtain = progress(seconds, 10 / 30, 88 / 30, Easing.inOut(Easing.quad));
  const color = progress(seconds, 1, 139 / 30, Easing.inOut(Easing.cubic));
  const heroReveal = progress(seconds, 22 / 30, 86 / 30, Easing.out(Easing.back(1.2)));
  const itemsReveal = progress(seconds, 64 / 30, 132 / 30, Easing.out(Easing.cubic));
  const glareIn = progress(seconds, 34 / 30, 74 / 30, Easing.out(Easing.cubic));
  const morphs = spec.items.map((_, index) => morphForItem(seconds, spec.items, index));

  return <AbsoluteFill style={{background: "#020306", overflow: "hidden", pointerEvents: "none", ...style}}>
    <SpectrumBackdrop colorProgress={color} />
    <RotatingGlare visibility={glareIn} />
    <AbsoluteFill style={{zIndex: 3, pointerEvents: "none"}}>
      {layouts.map((layout, index) => {
        const itemReveal = progress(itemsReveal, index * 0.075, 0.55 + index * 0.075, Easing.out(Easing.back(1.04)));
        const morphVisibility = progress(morphs[index], 0, 0.18, Easing.out(Easing.cubic));
        return <GlassButton
          key={layout.text}
          layout={layout}
          index={index}
          opacity={itemReveal * (1 - morphVisibility)}
        />;
      })}
    </AbsoluteFill>
    <HeroMark spec={spec} reveal={heroReveal} />
    {layouts.map((layout, index) => <MorphingChapter
      key={`chapter-${layout.text}`}
      layout={layout}
      morph={morphs[index]}
      index={index}
      total={layouts.length}
    />)}
    <ApertureBloom value={aperture} />
    <VerticalCurtain value={curtain} />
    <AbsoluteFill style={{
      zIndex: 40,
      pointerEvents: "none",
      opacity: 0.15,
      backgroundImage: "repeating-radial-gradient(circle at 20% 30%,rgba(255,255,255,.48) 0 1px,transparent 1px 4px)",
      backgroundSize: "9px 9px",
      mixBlendMode: "soft-light",
    }} />
    <Audio src={staticFile("audio/riser-cine.mp3")} volume={0.18} />
    {spec.items.map((item) => <Sequence
      key={`audio-${item.title}`}
      from={Math.round(item.time * fps)}
      layout="none"
    >
      <Audio src={staticFile("audio/whoosh-fast.mp3")} volume={0.14} />
    </Sequence>)}
  </AbsoluteFill>;
};
