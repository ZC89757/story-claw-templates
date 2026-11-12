import type {CSSProperties} from "react";

type Kind = "question" | "vs" | "pointer" | "grid" | "sphere" | "sparkles" | "rays" |
  "electric" | "electric-line" | "wave" | "dash" | "flash" | "smoke" | "net" | "letterbox";
const fill: CSSProperties = {position: "absolute", inset: 0};
const noise = (index: number) => {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const dots = Array.from({length: 620}, (_, i) => [noise(i * 4), noise(i * 4 + 1), noise(i * 4 + 2), noise(i * 4 + 3)] as const);

export function ReferenceArtwork({kind, width, height, time, phase}: {
  kind: Kind; width: number; height: number; time: number; phase: number;
}) {
  const tick = Math.floor(time * 16);
  if (kind === "question" || kind === "vs") {
    const question = kind === "question";
    const glow = question ? "#4ce8ff" : "#efc359";
    return <div style={{...fill, display: "grid", placeItems: "center", fontFamily: "Arial Black, Arial, sans-serif", fontWeight: 900,
      color: question ? "#eaffff" : "#fff0bb", fontSize: question ? height * .92 : height * .62, lineHeight: 1,
      textShadow: `0 0 3px ${glow}, 0 0 13px ${glow}, 1px 4px 1px #142734`,
      opacity: question && noise(tick) > .94 ? .76 : 1}}>{question ? "?" : "VS"}</div>;
  }

  if (kind === "flash") return <div style={{...fill, background: "#ffffff", opacity: .8 * (1 - phase) ** 1.6}}/>;

  if (kind === "letterbox") return <div style={{...fill,
    background: "radial-gradient(ellipse at 34% -48%,transparent 62%,#b68d3540 63%,transparent 65%),linear-gradient(#12121a,#08090a 25%,#050607)"}}/>;

  if (kind === "grid") return <div style={{...fill, overflow: "hidden", background: "linear-gradient(#0008,transparent 35% 61%,#0009)"}}>
    {[0, 1].map(i => <div key={i} style={{position: "absolute", left: "-37%", width: "174%", height: "49%", [i ? "bottom" : "top"]: "-12%",
      transform: `perspective(185px) rotateX(${i ? 51 : -51}deg)`, opacity: .23,
      backgroundImage: "repeating-linear-gradient(90deg,#c6a87870 0 1px,transparent 1px 26px),repeating-linear-gradient(#b9a99755 0 1px,transparent 1px 26px)"}}/>)}
  </div>;

  if (kind === "smoke") return <div style={{...fill, filter: "blur(12px)", opacity: .64}}>
    {dots.slice(0, 24).map(([x, y, r], i) =>
      <span key={i} style={{position: "absolute", left: x * width + Math.sin(time * .8 + i) * 14 - 36,
        top: y * height - 28, width: 48 + 81 * r, height: 26 + 53 * r, borderRadius: "50%",
        background: "radial-gradient(ellipse,#e0e3e0a8,transparent 73%)"}}/>)}
  </div>;

  if (kind === "sphere" || kind === "sparkles") {
    const sphere = kind === "sphere";
    return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      {sphere && <ellipse cx={width / 2} cy={height / 2} rx={width * .43} ry={height * .43}
        fill="#14212c26" stroke="#dee9ee50" strokeWidth=".6"/>}
      {dots.slice(0, sphere ? 620 : 225).map(([u, v, r, light], i) => {
        const az = u * 2 * Math.PI + time * .22;
        const polar = v * Math.PI;
        const x = sphere ? .5 + Math.cos(az) * Math.sin(polar) * .45 : (u + time * (.018 + r * .016)) % 1;
        const y = sphere ? .5 + Math.cos(polar) * .43 : .2 + v * .74 + .042 * Math.sin(x * 9 + time);
        return <circle key={i} cx={x * width} cy={y * height} r={sphere ? .35 + r * .7 : .4 + r * r * 2.3}
          fill={sphere ? "#f6fcff" : light > .82 ? "#d2f6ff" : "#4ab6fc"} opacity={.13 + .64 * light * (.63 + .37 * noise(tick + i))}/>;
      })}
    </svg>;
  }

  if (kind === "pointer") return <svg viewBox="0 0 50 55" width={width} height={height} style={{filter: "drop-shadow(1px 1px 2px #000)"}}>
    <path d="M8 4 L43 34 L27 35 L36 48 L28 52 L19 39 L10 48 Z" fill="white" stroke="#263041" strokeWidth="1.5"/>
  </svg>;

  if (kind === "dash") return <svg viewBox="0 0 100 30" width={width} height={height}>
    <path d="M1 15 H89" fill="none" stroke="#ede3b8" strokeWidth="2" strokeDasharray="3 4"/>
    <path d="M89 10 L99 15 L89 20 Z" fill="#ede3b8"/>
  </svg>;

  if (kind === "net") return <div style={{...fill, opacity: .52,
    backgroundImage: "radial-gradient(#c0dde149 .65px,transparent .9px),linear-gradient(26deg,transparent 54%,#9bb7c224 54.5% 55%,transparent 55.5%)",
    backgroundSize: "4px 4px, 88px 102px"}}/>;

  if (kind === "wave") return <div style={{...fill, background: "linear-gradient(155deg,#1b2533,#06080f 73%)"}}>
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      {dots.slice(0, 31).map((_, i) => {
        const y = height * .47 + i * .75;
        return <path key={i} d={`M0 ${y + 30} Q90 ${y - 36},180 ${y - 12} T360 ${y - 35}`} fill="none" stroke="#88c2ec" strokeWidth=".7" opacity={.14 + .11 * Math.sin(i * .19 + time * 2)}/>;
      })}
    </svg>
  </div>;

  if (kind === "rays") return <div style={{...fill, background: "radial-gradient(ellipse at 50% 49%,#47bdff,#14458d 37%,#06274e 62%,#04122c)"}}>
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      {dots.slice(0, 150).map(([angle, start, end], i) => {
        const a = angle * 2 * Math.PI, r = start * height * .55;
        const strength = .24 + .43 * noise(tick + i);
        return <line key={i} x1={width / 2 + Math.cos(a) * r * .29} y1={height / 2 + Math.sin(a) * r * .29}
          x2={width / 2 + Math.cos(a) * r} y2={height / 2 + Math.sin(a) * r}
          stroke={end > .5 ? "#76d9ff" : "#1e81e5"} opacity={strength} strokeWidth={.2 + end * 1.6}/>;
      })}
    </svg>
  </div>;

  const frame = kind === "electric";
  const line = Array.from({length: frame ? 87 : 37}, (_, i) => {
    if (!frame) return [i * width / 36, height * (.44 + .26 * (noise(i + tick) - .5))];
    const edge = Math.min(3, Math.floor(i / 22));
    const step = (i % 22) / 21;
    const n = noise(i + tick) * 3;
    return [[step * width, n], [width - n, step * height], [(1 - step) * width, height - n], [n, (1 - step) * height]][edge];
  });
  const points = line.map(([x, y]) => `${x},${y}`).join(" ");
  return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{filter: "drop-shadow(0 0 4px #4bbdff)"}}>
    <polyline points={points} fill="none" stroke="#1799ff" strokeWidth={frame ? "3" : "5.5"} opacity=".62"/>
    <polyline points={points} fill="none" stroke="#d9faff" strokeWidth={frame ? ".75" : "1.45"}/>
  </svg>;
}
