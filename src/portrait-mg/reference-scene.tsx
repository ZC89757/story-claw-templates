import type {CSSProperties} from "react";
import {Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import {PortraitMedia, clamp, ease, type PortraitDemo} from "./common";
import {ReferenceArtwork} from "./reference-artwork";
import {getReferenceProfile, referenceProfiles, type Profile, type Track} from "./reference-profiles";

type Value = {at?: number; text?: string; source?: string; sourceStart?: number | null};
type ReferenceSpec = Record<string, Value>;

const clips = {
  torn: "polygon(0% 5%,5% 4%,12% 5%,19% 2%,26% 4%,33% 3%,40% 6%,47% 3%,54% 5%,61% 3%,68% 5%,75% 3%,82% 4%,89% 2%,96% 4%,100% 3%,100% 97%,93% 98%,86% 95%,79% 98%,72% 97%,65% 100%,58% 96%,51% 98%,44% 95%,37% 97%,30% 96%,23% 98%,16% 96%,9% 99%,0% 96%)",
  diagonal: "polygon(0% 2%,100% 13%,100% 100%,0% 89%)",
  "top-fold": "polygon(0% 34%,100% 0%,100% 100%,0% 76%)",
  "bottom-fold": "polygon(0% 0%,100% 30%,100% 74%,0% 100%)",
} as const;

function enter(track: Track, phase: number) {
  const t = ease(phase);
  const missing = 1 - t;
  let x = 0, y = 0, scale = 1, scaleX = 1, opacity = 1, blur = 0;
  let clipPath: string | undefined = track.clip ? clips[track.clip] : undefined;
  switch (track.motion) {
    case "fade": opacity = t; break;
    case "up": y = 65 * missing; opacity = t; break;
    case "down": y = -64 * missing; opacity = t; break;
    case "right": x = -116 * missing; opacity = t; break;
    case "left": x = 116 * missing; opacity = t; break;
    case "pop": scale = .77 + .23 * t + Math.sin(t * Math.PI) * .045; opacity = t; break;
    case "drop": y = -266 * missing + Math.sin(t * Math.PI) * 23; break;
    case "streak": x = -72 * missing; scaleX = 1 + .28 * missing; blur = 18 * missing; opacity = clamp(t * 2.4); break;
    case "exit-down": y = 560 * t * t; opacity = 1 - t; break;
    case "unroll": scaleX = t; clipPath = `inset(0 0 0 0 round ${14 * missing}px)`; break;
    case "wipe": clipPath = `inset(0 ${100 * missing}% 0 0)`; break;
  }
  const transform = `translate(${x}px,${y}px) perspective(580px) rotateY(${track.perspective ?? 0}deg) rotate(${track.tilt ?? 0}deg) scale(${scale * scaleX},${scale})`;
  return {opacity, clipPath, transform, filter: blur > .1 ? `blur(${blur}px)` : undefined};
}

const full: CSSProperties = {position: "absolute", inset: 0};

function MovingText({value, track, age, phase, end}: {value: string; track: Track; age: number; phase: number; end: number}) {
  const t = ease(phase);
  const isAssemble = track.motion === "assemble";
  const isScan = track.motion === "scan";
  const isShutter = track.motion === "shutter";
  const units = Array.from(value).reduce((sum, c) => sum + (/^[\x00-\x7F]$/.test(c) ? .56 : 1), 0);
  const longest = track.scroll ? Math.max(...value.split("\n").map(line => Array.from(line).length), 1) : units;
  const fontSize = Math.min(track.size ?? 32, (track.css?.writingMode ? track.box[3] : track.box[2] - 12) / Math.max(1, longest));
  const lineHeight = fontSize * 1.3;
  const scroll = track.scroll ? Math.max(0, value.split("\n").length * lineHeight - track.box[3] + 48) * clamp(age / Math.max(.2, end)) * track.scroll : 0;
  const styles: CSSProperties = {
    fontFamily: "Microsoft YaHei, Noto Sans CJK SC, sans-serif",
    fontWeight: 800,
    fontSize,
    lineHeight: "1.3",
    textAlign: "center",
    letterSpacing: ".02em",
    writingMode: track.css?.writingMode,
    whiteSpace: track.scroll ? "pre-line" : "pre",
    clipPath: isScan ? `inset(0 ${100 * (1 - t)}% 0 0)` : isShutter ? `inset(${100 * (1 - t)}% 0 0 0)` : undefined,
    transform: track.scroll ? `translateY(${-scroll}px)` : undefined,
  };
  return <div style={styles}>
    {isAssemble && t < 1 ? Array.from(value).map((character, index) => {
      const offset = (1 - t) * (11 + index % 4 * 11);
      return <span key={index} style={{display: "inline-block", opacity: clamp(t * 1.5),
        transform: `translate(${(index % 2 ? 1 : -1) * offset}px,${(index % 3 - 1) * offset}px) rotate(${(index % 4 - 2) * offset / 2}deg)`,
        filter: `blur(${(1 - t) * 2}px)`}}>{character}</span>;
    }) : value}
  </div>;
}

function SlottedMedia({value, track, elapsed, duration}: {
  value: Value; track: Track; elapsed: number; duration: number;
}) {
  const media = {source: value.source!, sourceStart: value.sourceStart ?? null};
  const scrollable = !!track.scroll;
  const image: CSSProperties = scrollable ? {width: "100%", height: "auto", display: "block"}
    : {objectFit: track.fit ?? "cover", ...track.image};
  if (track.motion === "slide-window") {
    const left = (1 - ease(elapsed / (track.seconds ?? .37))) * 100;
    return <div style={{...full, transform: `translateX(${left}%)`}}><PortraitMedia media={media} style={image}/></div>;
  }
  if (track.motion !== "strip-join") {
    return <PortraitMedia media={media} style={scrollable ? {...image, transform:
      `translateY(calc(${-100 * clamp(elapsed / duration) * track.scroll!}% + ${track.box[3] * clamp(elapsed / duration) * track.scroll!}px))`} : image} />;
  }

  return <PortraitMedia media={media} style={{...image, position: "absolute", inset: 0}}/>;
}

function TrackLayer({track, spec, time, duration}: {track: Track; spec: ReferenceSpec; time: number; duration: number}) {
  const {fps} = useVideoConfig();
  const value = track.slot ? spec[track.slot] : undefined;
  const start = track.from ? spec[track.from].at! : value?.at ?? 0;
  const stop = track.until ? spec[track.until].at! + (track.overlap ?? 0) : duration;
  const age = time - start;
  const phase = clamp(age / (track.seconds ?? .37));
  if (age < -1e-7 || time >= stop || ((track.motion === "exit-down" || track.graphic === "flash") && phase >= 1)) return null;

  const [left, top, width, height] = track.box;
  const entering = enter(track, phase);
  const outgoing = track.fadeOut && track.until ? ease((stop - time) / track.fadeOut) : 1;
  const style: CSSProperties = {
    position: "absolute", left, top, width, height, overflow: "hidden", boxSizing: "border-box",
    color: "white", display: value?.text ? "grid" : undefined, placeItems: track.scroll ? "start center" : "center", ...track.css,
    ...entering, opacity: entering.opacity * outgoing * Number(track.css?.opacity ?? 1),
    filter: [track.css?.filter, entering.filter].filter(Boolean).join(" ") || undefined,
    clipPath: entering.clipPath,
  };

  let content;
  if (track.graphic) {
    content = <ReferenceArtwork kind={track.graphic} width={width} height={height}
      time={age} phase={clamp(age / (track.seconds ?? .5))}/>;
  } else if (value?.source) {
    const from = Math.ceil((value.at ?? 0) * fps - 1e-6);
    const layer = <SlottedMedia value={value} track={track} elapsed={age} duration={stop - start}/>;
    content = <Sequence from={from} layout="none">{layer}</Sequence>;
    if (track.motion === "strip-join") {
      content = Array.from({length: 6}, (_, index) => {
        const strip = 100 / 6;
        const delay = index * .034;
        const drift = (1 - ease((age - delay) / Math.max(.1, (track.seconds ?? .76) - .18))) * width * .62;
        return <div key={index} style={{...full, transform: `translateX(${index % 2 ? drift : -drift}px)`,
          clipPath: `inset(${index * strip}% 0 ${(5 - index) * strip}% 0)`}}>
          <Sequence from={from} layout="none">{layer}</Sequence>
        </div>;
      });
    }
  } else if (value?.text) {
    content = <MovingText value={value.text} track={track} age={age} phase={phase} end={stop - start}/>;
  }
  return <div style={style}>{content}</div>;
}

export function ReferenceScene({profile, spec}: {profile: Profile; spec: ReferenceSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const duration = Number(spec._duration ?? profile.duration);
  return <div style={{...full, background: "#05080d"}}>
    {profile.tracks.map((track, index) => <TrackLayer key={index} track={track} spec={spec} time={time} duration={duration}/>)}
  </div>;
}

export const referenceRenderers = Object.fromEntries(Object.entries(referenceProfiles).map(([id, profile]) =>
  [id, ({spec}: {spec: ReferenceSpec}) => <ReferenceScene profile={profile} spec={spec}/>]));

const demoVideo = [
  "video-footage/sources/stepfun-step5-preview-demo.mp4",
  "video-footage/sources/stepfun-step5-preview-news.mp4",
  "video-footage/sources/nvidia-dgx-spark-arrived.mp4",
];
const demoImage = ["web-news/accelerated-clean.png", "web-news/nvidia-newsroom-clean.png", "portrait-mg/V04_002/fixture-page.png", "web-news/nvidia-arch.png"];
const demoCutout = ["portrait-mg/V10_005/subject.png", "portrait-mg/reference/subject-alt.png"];

export const referenceDemoFiles = [...new Set([...demoVideo, ...demoImage, ...demoCutout])];

export function getReferenceDemo(id: string): PortraitDemo | undefined {
  const profile = getReferenceProfile(id);
  if (!profile) return undefined;
  const slots = Object.fromEntries(Object.entries(profile.slots).map(([key, slot]) => {
    const timed = slot.at === undefined ? {} : {at: slot.at};
    if (slot.type === "cue") return [key, timed];
    if (slot.type === "text") return [key, {...timed, text: slot.demo}];
    const sources = slot.type === "video" ? demoVideo : slot.type === "cutout" ? demoCutout : demoImage;
    return [key, {...timed, source: sources[Number(slot.demo)], sourceStart: slot.type === "video" ? 0 : null}];
  }));
  return {
    spec: {...slots, _duration: profile.duration},
    durationInFrames: Math.ceil(profile.duration * 30),
    fps: 30 as const,
    reference: "eshuocaijing:" + id,
  };
}
