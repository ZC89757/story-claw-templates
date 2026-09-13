import {CSSProperties} from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {routeShiftEaseInOut, routeShiftProgress} from "./evaluate";
import type {RouteShiftSpec} from "./types";

type Props = {spec: RouteShiftSpec; style?: CSSProperties};
type RoadCurve = {top: number; bottom: number};

const W = 1920;
const H = 1080;
const FIRST: RoadCurve = {top: 790, bottom: 390};
const SECOND: RoadCurve = {top: 1130, bottom: 730};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const roadCenterX = (road: RoadCurve, y: number) => lerp(road.top, road.bottom, clamp01((y - 84) / 920));

const roadPath = (road: RoadCurve) => `M ${road.top - 92} 84 L ${road.top + 92} 84 L ${road.bottom + 210} 1004 L ${road.bottom - 210} 1004 Z`;
const lanePath = (road: RoadCurve, offset: number) => `M ${road.top + offset} 84 L ${road.bottom + offset} 1004`;
const guardPath = (road: RoadCurve, offset: number) => `M ${road.top + offset} 84 L ${road.bottom + offset} 1004`;

const Road = ({road, accent, opacity}: {road: RoadCurve; accent: string; opacity: number}) => <g opacity={opacity}>
  <path d={roadPath(road)} fill="#151d21" stroke="#05080a" strokeWidth="28" />
  <path d={roadPath({...road, top: road.top - 16, bottom: road.bottom - 18})} fill="#394247" opacity=".62" />
  <path d={lanePath(road, -34)} stroke="#f3f4eb" strokeWidth="9" strokeDasharray="38 32" opacity=".92" />
  <path d={lanePath(road, 34)} stroke="#f3f4eb" strokeWidth="9" strokeDasharray="38 32" opacity=".92" />
  <path d={lanePath(road, -86)} stroke="#e7c45e" strokeWidth="11" opacity=".98" />
  <path d={lanePath(road, 86)} stroke="#e7c45e" strokeWidth="11" opacity=".98" />
  <path d={guardPath(road, -108)} stroke="#9ba7a8" strokeWidth="7" opacity=".8" />
  <path d={guardPath(road, 108)} stroke="#9ba7a8" strokeWidth="7" opacity=".8" />
  <path d={guardPath(road, -116)} stroke="#263136" strokeWidth="18" opacity=".9" />
  <path d={guardPath(road, 116)} stroke="#263136" strokeWidth="18" opacity=".9" />
  <path d={lanePath(road, 0)} stroke={accent} strokeWidth="3" strokeDasharray="9 28" opacity=".45" />
</g>;

const Marker = ({progress}: {progress: number}) => {
  const p = clamp01(progress);
  const phase = p < 0.48 ? 0 : p < 0.66 ? 1 : 2;
  const local = phase === 0 ? p / 0.48 : phase === 1 ? (p - 0.48) / 0.18 : (p - 0.66) / 0.34;
  const firstY = lerp(930, 440, local);
  const secondY = lerp(440, 150, local);
  const firstX = roadCenterX(FIRST, firstY);
  const secondX = roadCenterX(SECOND, secondY);
  const switchFirstX = roadCenterX(FIRST, 440);
  const switchSecondX = roadCenterX(SECOND, 440);
  const x = phase === 0 ? firstX : phase === 1 ? lerp(switchFirstX, switchSecondX, local) : secondX;
  const y = phase === 0 ? firstY : phase === 1 ? 440 : secondY;
  return <g transform={`translate(${x} ${y})`}>
    <circle r="34" fill="#f7d96e" opacity=".2" />
    <circle r="21" fill="#f7d96e" stroke="#fff4b2" strokeWidth="5" />
    <circle r="8" fill="#152126" />
  </g>;
};

export const RouteShiftTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const switchAt = Math.max(1.05, spec.switchTime);
  const reveal = routeShiftEaseInOut(routeShiftProgress(0.04, seconds, 0.7));
  const firstLabel = routeShiftEaseInOut(routeShiftProgress(0.28, seconds, 0.45));
  const secondLabel = routeShiftEaseInOut(routeShiftProgress(0.5, seconds, 0.45));
  const marker = routeShiftEaseInOut(routeShiftProgress(switchAt, seconds, 2.6));
  return <AbsoluteFill style={{background: "#101719", color: "#eef2e8", overflow: "hidden", fontFamily: '"Microsoft YaHei", "Noto Sans SC", Arial, sans-serif', ...style}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0}}>
      <defs>
        <linearGradient id="route-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#45585b" /><stop offset=".48" stopColor="#1c292b" /><stop offset="1" stopColor="#0c1214" /></linearGradient>
        <linearGradient id="route-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#26372f" /><stop offset="1" stopColor="#0a1112" /></linearGradient>
        <filter id="route-fog"><feGaussianBlur stdDeviation="28" /></filter>
        <filter id="route-soft"><feGaussianBlur stdDeviation="9" /></filter>
        <radialGradient id="route-vignette"><stop offset=".35" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".72" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#route-sky)" />
      <path d="M0 250 Q 950 190 1920 250 L1920 1080 L0 1080 Z" fill="url(#route-ground)" />
      <path d="M0 405 Q950 330 1920 405" fill="none" stroke="#829092" strokeWidth="4" opacity=".38" />
      <g transform={`translate(0 ${Math.round((1 - reveal) * 90)})`}>
        <Road road={FIRST} accent="#86c6df" opacity={reveal} />
        <Road road={SECOND} accent="#8bd8a7" opacity={reveal} />
        <path d="M 930 84 L 930 1004" stroke="#8d9b88" strokeWidth="26" opacity=".35" strokeDasharray="12 26" />
        <path d="M 930 84 L 930 1004" stroke="#202c2b" strokeWidth="44" opacity=".5" />
        <Marker progress={marker} />
      </g>
      <g opacity={firstLabel}>
        <text x="620" y="488" fill="#d9eff5" fontSize="42" fontWeight="800" textAnchor="middle" style={{paintOrder: "stroke", stroke: "#091013", strokeWidth: 10}}>{spec.first}</text>
      </g>
      <g opacity={secondLabel}>
        <text x="1040" y="488" fill="#d9f2df" fontSize="42" fontWeight="800" textAnchor="middle" style={{paintOrder: "stroke", stroke: "#091013", strokeWidth: 10}}>{spec.second}</text>
      </g>
      <rect width={W} height={H} fill="url(#route-vignette)" pointerEvents="none" />
      <path d="M0 0 H560 Q420 540 560 1080 H0 Z" fill="#020405" opacity=".64" filter="url(#route-fog)" />
      <path d="M1920 0 H1360 Q1500 540 1360 1080 H1920 Z" fill="#020405" opacity=".64" filter="url(#route-fog)" />
    </svg>
  </AbsoluteFill>;
};
