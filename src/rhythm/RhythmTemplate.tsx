import type {CSSProperties, ReactNode} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {RhythmSpec} from "./types";

type Props = {spec: RhythmSpec; style?: string; css?: CSSProperties};

const W = 1920;
const H = 1080;
const ACCENT = "#ef6b42";
const CYAN = "#8ad3df";
const INK = "#f2f5f6";
const CUE_SECONDS = 1.28;

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const easeOut = (value: number): number => 1 - Math.pow(1 - clamp(value), 3);
const easeInOut = (value: number): number => {
  const t = clamp(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const segment = (value: number, start: number, end: number): number => clamp((value - start) / Math.max(0.001, end - start));
const ping = (value: number, at: number, width = 0.09): number => {
  const local = Math.abs(value - at) / width;
  return local >= 1 ? 0 : 1 - local;
};
const wave = (value: number, speed = 4): number => Math.pow(Math.max(0, Math.sin(value * Math.PI * speed)), 8);

const RhythmSfx = ({style}: {style: string}) => {
  const {fps} = useVideoConfig();
  const files: Record<string, string> = {
    "paparazzi-flash": "click-shutter.mp3",
    "drop-blackout-slam": "impact-cine.mp3",
    "domino-cascade": "impact-cine.mp3",
    "comic-panel-split": "impact-cine.mp3",
    "strobe-black-frames": "impact-cine.mp3",
    "smash-cut": "impact-cine.mp3",
    "smear-multiples": "whoosh-big.mp3",
    "speed-ramp": "whoosh-big.mp3",
    "sakuga-timing-shift": "whoosh-fast.mp3",
    "flip-grid-reflow": "whoosh-fast.mp3",
    "beat-step-list-theme-cycle": "pop.mp3",
  };
  const file = files[style] ?? "transition-snap.mp3";
  return <Sequence from={Math.round(0.06 * fps)} durationInFrames={Math.max(1, Math.round(0.55 * fps))} layout="none"><Audio src={staticFile(`audio/${file}`)} volume={0.2} /></Sequence>;
};

const MainText = ({text, opacity = 1, scale = 1, x = 0, y = 0, color = INK, blur = 0}: {text: string; opacity?: number; scale?: number; x?: number; y?: number; color?: string; blur?: number}) => <div style={{position: "absolute", left: 170, right: 170, top: H / 2 - 82, textAlign: "center", color, fontFamily: '"Microsoft YaHei", Arial, sans-serif', fontSize: 94, lineHeight: 1.08, fontWeight: 950, letterSpacing: "0.015em", opacity, transform: `translate3d(${x}px,${y}px,0) scale(${scale})`, filter: `blur(${blur}px)`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{text.slice(0, 24)}</div>;

const Frame = ({children, style}: {children?: ReactNode; style?: CSSProperties}) => <div style={{position: "absolute", left: 236, right: 236, top: 190, bottom: 190, border: `3px solid rgba(138,211,223,.72)`, borderRadius: 18, background: "rgba(9,16,20,.16)", overflow: "hidden", ...style}}>{children}</div>;

const MiniCard = ({index, p, x, y, width = 260, height = 154, label}: {index: number; p: number; x: number; y: number; width?: number; height?: number; label?: string}) => <div style={{position: "absolute", left: x, top: y, width, height, borderRadius: 14, border: `2px solid ${index % 2 ? "rgba(138,211,223,.86)" : "rgba(239,107,66,.9)"}`, background: index % 2 ? "rgba(20,42,50,.78)" : "rgba(48,27,24,.76)", boxSizing: "border-box", opacity: p}}><div style={{position: "absolute", left: 18, top: 18, width: 54, height: 8, borderRadius: 4, background: index % 2 ? CYAN : ACCENT}} /><div style={{position: "absolute", left: 18, right: 18, top: 48, height: 8, borderRadius: 4, background: "rgba(240,245,246,.44)"}} /><div style={{position: "absolute", left: 18, right: 48, top: 70, height: 8, borderRadius: 4, background: "rgba(240,245,246,.25)"}} />{label ? <span style={{position: "absolute", right: 18, bottom: 16, color: INK, fontSize: 18, fontWeight: 900}}>{label}</span> : null}</div>;

const BeatPump = ({p, text}: {p: number; text: string}) => {
  const beat = wave(p, 4);
  return <><div style={{position: "absolute", left: 120, right: 120, top: 530, height: 8, borderRadius: 8, background: `${ACCENT}55`, transform: `scaleX(${easeOut(p)})`, transformOrigin: "left center"}} /><div style={{position: "absolute", left: W / 2 - 16, top: H / 2 - 16, width: 32, height: 32, borderRadius: "50%", border: `6px solid ${ACCENT}`, opacity: .75 - p * .35, transform: `scale(${1 + beat * 13})`}} /><MainText text={text} opacity={.15 + easeOut(p) * .8} scale={1 + beat * .09} /></>;
};

const Accelerando = ({p, text}: {p: number; text: string}) => {
  const cuts = [.04, .27, .47, .64, .78, .89];
  const active = cuts.reduce((last, at, index) => p >= at ? index : last, 0);
  return <>{cuts.map((at, index) => {const q = easeOut(segment(p, at, Math.min(1, at + .12))); const width = 170 + index * 95; return <div key={at} style={{position: "absolute", left: W / 2 - width / 2, top: 192 + index * 110, width, height: 74, borderRadius: 10, background: index === active ? ACCENT : "rgba(138,211,223,.22)", border: `2px solid ${index === active ? "#fff" : CYAN}`, opacity: q, transform: `translateX(${(1 - q) * (index % 2 ? 420 : -420)}px) scale(${.86 + q * .14})`}} />;})}<MainText text={text} opacity={.14 + easeOut(p) * .72} y={-250} scale={.72} /></>;
};

const Paparazzi = ({p, text}: {p: number; text: string}) => {
  const flashes = [.25, .5, .74];
  const white = flashes.reduce((sum, at) => Math.max(sum, ping(p, at, .035)), 0);
  const stage = p < flashes[0] ? 0 : p < flashes[1] ? 1 : p < flashes[2] ? 2 : 3;
  const zoom = [1.02, 1.3, 1.72, 2.16][stage];
  return <><Frame style={{transform: `scale(${zoom})`, transformOrigin: stage < 2 ? "50% 50%" : "67% 43%", filter: `brightness(${1 - white * .4})`}}><MiniCard index={0} p={1} x={220} y={130} width={420} height={250} label="84,213" /><MiniCard index={1} p={1} x={720} y={310} width={430} height={230} label="LIVE" /></Frame><div style={{position: "absolute", inset: 0, background: "#fff", opacity: white * .92}} /><MainText text={text} opacity={.36 + p * .55} scale={1.04 - ping(p, .74, .09) * .06} /></>;
};

const ThemeStepper = ({p, text}: {p: number; text: string}) => {
  const step = Math.min(3, Math.floor(Math.max(0, p - .15) / .2));
  const themes = [{bg: "#251c14", pill: "#d8d8d4", ink: "#1d1b18"}, {bg: "#1d2a1d", pill: "#59b66e", ink: "#152e1b"}, {bg: "#251d3b", pill: "#9273dd", ink: "#20173c"}, {bg: "#17233b", pill: "#df5b63", ink: "#351a25"}][step];
  return <div style={{position: "absolute", inset: 0, background: themes.bg}}>{["清晰", "轻快", "有力", "收束", "行动"].map((word, index) => {const y = 268 + (index - step) * 112; return <div key={word} style={{position: "absolute", left: 550, top: y, width: 820, height: 84, padding: "0 30px", display: "flex", alignItems: "center", borderRadius: 44, color: index === step ? themes.ink : "rgba(255,255,255,.48)", background: index === step ? themes.pill : "transparent", fontSize: 44, fontWeight: 900, transform: `scale(${index === step ? 1.04 : .9})`, opacity: Math.max(.18, 1 - Math.abs(index - step) * .27)}}>{word}{index === step ? <span style={{marginLeft: "auto", fontSize: 20}}>{text.slice(0, 8)}</span> : null}</div>;})}</div>;
};

const BlackoutSlam = ({p, text}: {p: number; text: string}) => {
  const black = p >= .38 && p < .52;
  const slam = easeOut(segment(p, .52, .68));
  const shake = (1 - slam) * 18 * Math.sin((p - .52) * 180);
  return <><div style={{position: "absolute", inset: 0, background: black ? "#050607" : `rgba(7,13,16,${.25 + p * .28})`}} />{!black ? <><div style={{position: "absolute", inset: 0, transform: `translate(${shake}px,${shake * .4}px)`}}><MainText text={slam > 0 ? text : "准备落拍"} opacity={p < .52 ? .35 : 1} scale={p < .52 ? 1 + Math.sin(p * 18) * .025 : 1.34 - slam * .34} /></div>{slam > 0 ? <div style={{position: "absolute", left: W / 2, top: H / 2, width: 40, height: 40, borderRadius: "50%", border: "10px solid #fff", opacity: 1 - slam, transform: `translate(-50%,-50%) scale(${1 + slam * 28})`}} /> : null}</> : null}</>;
};

const WrightTriple = ({p, text}: {p: number; text: string}) => {
  const cuts = [.25, .43, .61];
  const active = cuts.reduce((last, at, index) => p >= at ? index + 1 : last, 0);
  return <><Frame>{[0, 1, 2].map((index) => <MiniCard key={index} index={index} p={active >= index + 1 ? 1 : .3} x={120 + index * 390} y={218} width={330} height={210} label={String(index + 1)} />)}</Frame><div style={{position: "absolute", left: 290 + Math.min(2, active) * 390, top: 392, width: 330, height: 210, border: `8px solid ${ACCENT}`, opacity: active ? .92 : 0, transform: `scale(${active ? 1 : 1.18})`}} /><MainText text={text} opacity={.22 + p * .68} y={-320} scale={.62} /></>;
};

const Domino = ({p, text}: {p: number; text: string}) => {
  const drop = easeOut(segment(p, .18, .36)); const impact = ping(p, .36, .08); const side = easeOut(segment(p, .64, .83));
  return <><MainText text={text} opacity={drop} y={(1 - drop) * -310} scale={.82 + drop * .18} /><div style={{position: "absolute", left: 320, right: 320, top: 685, height: 180, transform: `translateY(${impact * 14 * Math.sin(p * 190)}px)`}}>{[0, 1, 2, 3].map((index) => {const q = easeOut(segment(p, .36 + index * .06, .55 + index * .06)); return <MiniCard key={index} index={index} p={q} x={index * 320} y={(1 - q) * 65} width={278} height={150} label={`0${index + 1}`} />;})}</div><div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: 250, background: "rgba(138,211,223,.17)", borderRight: `3px solid ${CYAN}`, transform: `translateX(${(1 - side) * -270}px)`}} /></>;
};

const Mosaic = ({p, mode}: {p: number; mode: "flash" | "reflow"}) => <div style={{position: "absolute", inset: 100, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gridTemplateRows: "repeat(2,1fr)", gap: 16}}>{Array.from({length: 8}).map((_, index) => {const row = Math.floor(index / 4); const col = index % 4; const reflow = easeInOut(segment(p, .26, .72)); const stagger = clamp((p - index * .045) / .38); const targetX = mode === "reflow" ? (index % 3 - col) * 170 * reflow : 0; const targetY = mode === "reflow" ? (Math.floor(index / 3) - row) * 250 * reflow : 0; const flash = mode === "flash" ? ping(p, .12 + index * .09, .065) : 0; return <div key={index} style={{border: `3px solid ${index % 2 ? CYAN : ACCENT}`, background: flash ? "#fff" : index % 2 ? "rgba(138,211,223,.18)" : "rgba(239,107,66,.16)", opacity: .2 + stagger * .72, transform: `translate(${targetX}px,${targetY}px) rotate(${mode === "reflow" ? (1 - reflow) * (index % 2 ? -16 : 16) : 0}deg) scale(${.72 + stagger * .28})`}} />;})}</div>;

const ComicPanels = ({p, text}: {p: number; text: string}) => <>{Array.from({length: 3}).map((_, index) => {const q = easeOut(segment(p, .16 + index * .09, .38 + index * .09)); const left = index * 33.333; const expand = index === 2 ? easeOut(segment(p, .68, .95)) : 0; return <div key={index} style={{position: "absolute", left: `${left - expand * 33.333}%`, top: 0, width: `${33.7 + expand * 66.3}%`, height: "100%", clipPath: "polygon(13% 0,100% 0,87% 100%,0 100%)", background: index % 2 ? "rgba(138,211,223,.32)" : "rgba(239,107,66,.32)", borderLeft: "8px solid rgba(255,255,255,.85)", opacity: q, transform: `scale(${.82 + q * .18})`, transformOrigin: index === 2 ? "right center" : "center"}}><div style={{position: "absolute", inset: 0, background: `repeating-linear-gradient(${index % 2 ? 30 : -30}deg,transparent,transparent 28px,rgba(255,255,255,.1) 29px)`}} /></div>;})}<MainText text={text} opacity={.45 + p * .5} scale={.8} /></>;

const JumpPunch = ({p, text}: {p: number; text: string}) => {const level = p < .35 ? 0 : p < .65 ? 1 : 2; const scales = [1, 1.56, 2.35]; const tick = ping(p, .35, .04) + ping(p, .65, .04); return <><Frame style={{transform: `scale(${scales[level]})`, transformOrigin: "62% 72%", filter: `brightness(${1 - tick * .28})`}}><MiniCard index={0} p={1} x={310} y={260} width={590} height={280} label={String(level + 1)} /></Frame><MainText text={text} opacity={.35 + p * .55} scale={.78} y={-312} /></>;};

const Strobe = ({p, text}: {p: number; text: string}) => {const flashAt = [.18, .31, .43, .54, .64, .72, .79]; const black = flashAt.some((at) => ping(p, at, .022) > .35); const final = easeOut(segment(p, .84, 1)); return <><Frame style={{transform: `scale(${1 + final * .42})`, transformOrigin: "61% 70%"}}><MiniCard index={0} p={1} x={310} y={250} width={620} height={300} /></Frame><MainText text={text} opacity={.35 + p * .6} scale={.75 + final * .1} />{black ? <div style={{position: "absolute", inset: 0, background: "#050607"}} /> : null}</>;};

const Sakuga = ({p, text}: {p: number; text: string}) => {const onThrees = p < .52; const stepped = Math.floor(p * 18) / 18; const travel = onThrees ? stepped : easeOut(segment(p, .52, .82)); const x = onThrees ? 160 + travel * 1260 : 1420 - travel * 480; const ghost = !onThrees ? clamp((.76 - p) / .18) : 0; return <>{[4, 3, 2, 1].map((offset) => <MiniCard key={offset} index={offset} p={ghost * (1 - offset / 5)} x={x - offset * 82} y={420 + offset * 7} width={420} height={230} />)}<MiniCard index={0} p={1} x={x} y={420} width={420} height={230} label={onThrees ? "ON 3s" : "ON 1s"} /><MainText text={text} opacity={.5} y={-315} scale={.58} /></>;};

const Smear = ({p, text}: {p: number; text: string}) => {const move = easeInOut(segment(p, .2, .62)); const settle = easeOut(segment(p, .62, .78)); const x = 210 + move * 990 - settle * 28; return <>{[4, 3, 2, 1].map((index) => <MiniCard key={index} index={index} p={clamp((move - index * .09) * 1.8) * .32} x={x - index * 98} y={420} width={420} height={230} />)}<MiniCard index={0} p={1} x={x} y={420} width={420} height={230} /><MainText text={text} opacity={.4 + p * .5} y={-300} scale={.64} /></>;};

const Spectrum = ({p, text}: {p: number; text: string}) => {const grow = easeOut(segment(p, .18, .32)); const collapse = easeInOut(segment(p, .78, .96)); const live = grow * (1 - collapse); return <><MainText text={text} opacity={.62} y={-128} scale={.78} /><div style={{position: "absolute", left: 530, right: 530, top: 654, height: 8, borderRadius: 8, background: INK}} /><div style={{position: "absolute", left: 530, right: 530, top: 440, height: 214, display: "flex", alignItems: "end", gap: 7}}>{Array.from({length: 28}).map((_, index) => {const envelope = .4 + .6 * Math.pow(1 - index / 27, 1.1); const jitter = .35 + .65 * Math.abs(Math.sin(p * 36 + index * 2.4)); const h = 12 + 158 * envelope * jitter * live; return <div key={index} style={{flex: 1, height: h, borderRadius: 5, background: index % 3 ? CYAN : ACCENT, transform: `scaleX(${.25 + live * .75})`}} />;})}</div></>;};

const SpeedRamp = ({p, text}: {p: number; text: string}) => {const slow = p >= .36 && p <= .67; const speed = slow ? .18 : p < .36 ? 1.9 : 2.35; const shift = p < .36 ? p * 1250 : p < .67 ? 450 + (p - .36) * 190 : 520 + (p - .67) * 1480; return <><div style={{position: "absolute", inset: 0, overflow: "hidden", filter: slow ? "none" : "blur(5px)"}}>{Array.from({length: 9}).map((_, index) => <MiniCard key={index} index={index} p={.88} x={-120 + index * 370 - shift} y={360 + (index % 2) * 68} width={330} height={210} />)}</div><div style={{position: "absolute", left: W / 2 - 265, top: 325, width: 530, height: 405, border: `4px solid ${slow ? ACCENT : CYAN}`, opacity: slow ? 1 : .28, boxShadow: slow ? `0 0 40px ${ACCENT}` : "none"}} /><MainText text={text} opacity={.36 + p * .54} y={-330} scale={.58} /><div style={{position: "absolute", right: 90, bottom: 76, color: INK, fontSize: 26, fontWeight: 900, opacity: .65}}>RATE ×{speed.toFixed(1)}</div></>;};

const FreezeAnnotate = ({p, text}: {p: number; text: string}) => {const frozen = p >= .33 && p <= .75; const draw = easeOut(segment(p, .4, .57)); const fade = 1 - easeOut(segment(p, .75, .9)); return <><Frame style={{transform: `translateX(${frozen ? -26 : p < .33 ? p * -78 : -26 + (p - .75) * 200}px)`}}><MiniCard index={0} p={1} x={400} y={260} width={480} height={260} /></Frame>{frozen || draw > 0 ? <><div style={{position: "absolute", left: 670, top: 335, width: 610, height: 370, border: `12px solid ${ACCENT}`, borderRadius: "48%", opacity: draw * fade, transform: `rotate(-6deg) scale(${.84 + draw * .16})`}} /><div style={{position: "absolute", left: 1220, top: 276, width: 250, height: 5, background: ACCENT, transform: `rotate(145deg) scaleX(${draw})`, transformOrigin: "left center", opacity: fade}} /><MainText text={text} opacity={draw * fade} y={-285} scale={.58} color={ACCENT} /></> : null}</>;};

const Trailer = ({p, text}: {p: number; text: string}) => {const cut = Math.min(2, Math.floor(p / .15)); const black = p >= .45 && p < .58; const title = easeOut(segment(p, .58, .82)); return <>{p < .45 ? <Frame style={{transform: `scale(${[1, 1.3, 1.8][cut]})`, transformOrigin: ["50% 50%", "35% 55%", "70% 35%"][cut]}}><MiniCard index={cut} p={1} x={260} y={230} width={580} height={310} /></Frame> : null}{black ? <div style={{position: "absolute", inset: 0, background: "#050607"}} /> : null}{title > 0 ? <div style={{position: "absolute", inset: 0, background: "#0d1115", opacity: .8}}><MainText text={text} opacity={title} y={(1 - title) * 65} scale={.92 + title * .08} /></div> : null}</>;};

const Cadence = ({p, text}: {p: number; text: string}) => {const phase = p < .22 ? 0 : p < .38 ? 1 : p < .62 ? 2 : p < .78 ? 3 : 4; const words = ["BUILD", "SHIP", "FASTER", "TODAY", text]; const title = phase % 2 === 1 || phase === 4; return <>{!title ? <Frame style={{transform: `scale(${phase === 2 ? 1.5 : 1.04})`, transformOrigin: phase === 2 ? "65% 43%" : "50% 50%"}}><MiniCard index={phase} p={1} x={290} y={244} width={580} height={300} /></Frame> : null}{title ? <div style={{position: "absolute", inset: 0, background: "#0a0c0e", display: "flex", alignItems: "center", justifyContent: "center"}}><MainText text={words[phase].slice(0, 24)} opacity={1} scale={1.06 - wave(p * 1.3, 1) * .06} color={phase === 3 ? ACCENT : INK} /></div> : null}</>;};

const Smash = ({p, text}: {p: number; text: string}) => {const hit = easeOut(segment(p, .18, .35)); return <><div style={{position: "absolute", inset: 0, background: "#10090b", opacity: .45 + hit * .38}} /><div style={{position: "absolute", left: -80, right: -80, top: H / 2 - 28, height: 56, background: ACCENT, transform: `skewY(-8deg) scaleX(${hit})`, boxShadow: `0 0 42px ${ACCENT}`}} /><MainText text={text} opacity={hit} scale={1.4 - hit * .4} y={(1 - hit) * 70} color="#fff" /><div style={{position: "absolute", inset: 72, border: `8px solid rgba(255,255,255,${.18 + hit * .55})`, transform: `rotate(${(1 - hit) * -8}deg)`}} /></>;};

const QuadSplit = ({p, text}: {p: number; text: string}) => <div style={{position: "absolute", inset: 64, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 14}}>{Array.from({length: 4}).map((_, index) => {const q = easeOut(segment(p, .08 + index * .075, .3 + index * .075)); const scan = (p * 2.3 + index * .21) % 1; return <div key={index} style={{position: "relative", overflow: "hidden", border: `3px solid ${index % 2 ? CYAN : ACCENT}`, background: index % 2 ? "rgba(26,49,58,.78)" : "rgba(57,30,28,.75)", opacity: q, transform: `scale(${.72 + q * .28}) translate(${(1 - q) * (index % 2 ? 90 : -90)}px,${(1 - q) * (index > 1 ? 70 : -70)}px)`}}><div style={{position: "absolute", left: 28, top: 30, width: `${18 + scan * 62}%`, height: 14, borderRadius: 8, background: INK, opacity: .75}} /><div style={{position: "absolute", left: 28, top: 68, width: `${34 + ((index + 2) * 13) % 48}%`, height: 10, borderRadius: 8, background: index % 2 ? CYAN : ACCENT, opacity: .8}} /><div style={{position: "absolute", right: 34, bottom: 28, color: INK, fontSize: 28, fontWeight: 900}}>{index === 3 ? text.slice(0, 10) : `0${index + 1}`}</div></div>;})}</div>;

// Each catalog group is intentionally explicit. Avoid substring matching here:
// a different group name must keep a different movement recipe.
const RhythmBody = ({style, p, text}: {style: string; p: number; text: string}) => {
  switch (style) {
    case "beat-pump": return <BeatPump p={p} text={text} />;
    case "beat-cut-accelerando": return <Accelerando p={p} text={text} />;
    case "paparazzi-flash": return <Paparazzi p={p} text={text} />;
    case "beat-step-list-theme-cycle": return <ThemeStepper p={p} text={text} />;
    case "drop-blackout-slam": return <BlackoutSlam p={p} text={text} />;
    case "wright-triple-cut": return <WrightTriple p={p} text={text} />;
    case "domino-cascade": return <Domino p={p} text={text} />;
    case "grid-flash-mosaic": return <Mosaic p={p} mode="flash" />;
    case "flip-grid-reflow": return <Mosaic p={p} mode="reflow" />;
    case "comic-panel-split": return <ComicPanels p={p} text={text} />;
    case "jump-cut-punch-in": return <JumpPunch p={p} text={text} />;
    case "strobe-black-frames": return <Strobe p={p} text={text} />;
    case "sakuga-timing-shift": return <Sakuga p={p} text={text} />;
    case "smear-multiples": return <Smear p={p} text={text} />;
    case "spectrum-morph-ui": return <Spectrum p={p} text={text} />;
    case "speed-ramp": return <SpeedRamp p={p} text={text} />;
    case "freeze-annotate": return <FreezeAnnotate p={p} text={text} />;
    case "trailer-bumper": return <Trailer p={p} text={text} />;
    case "card-footage-cadence": return <Cadence p={p} text={text} />;
    case "smash-cut": return <Smash p={p} text={text} />;
    case "quad-split-parallel-scenes": return <QuadSplit p={p} text={text} />;
    default: return <BeatPump p={p} text={text} />;
  }
};

export const RhythmTemplate = ({spec, style = "beat-pump", css}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const elapsed = frame / fps - spec.at;
  if (elapsed < 0 || elapsed > CUE_SECONDS) return null;
  const p = clamp(elapsed / CUE_SECONDS);
  return <AbsoluteFill style={{background: "transparent", overflow: "hidden", pointerEvents: "none", ...css}}><RhythmBody style={style} p={p} text={spec.text} /><RhythmSfx style={style} /></AbsoluteFill>;
};
