import type {ReactNode} from "react";
import {Easing, useCurrentFrame, useVideoConfig} from "remotion";
import {PortraitMedia, clamp, type PortraitDemo} from "../../common";
import {paybackContract, paybackTotals, type PaybackSpec} from "./payback-contract";

const red = "#e00912";
const serif = '"SimSun", "Songti SC", "Noto Serif CJK SC", serif';
const sans = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';

function Label({children, y, reveal = 1}: {children: ReactNode; y: number; reveal?: number}) {
  return <div style={{
    position: "absolute", left: 32, top: y, width: 68, height: 55,
    background: red, color: "#fff", font: `bold 36px/55px ${serif}`,
    display: "grid", placeItems: "center", whiteSpace: "nowrap",
    clipPath: `inset(0 ${100 - reveal * 100}% 0 0)`,
  }}><div style={{transform: "scaleX(.72) scaleY(1.17)"}}>{children}</div></div>;
}

function NumberText({children}: {children: ReactNode}) {
  return <span style={{
    display: "inline-block", font: 'italic 26px/1 "Times New Roman", serif',
    transform: "scaleX(.83) scaleY(1.06)", transformOrigin: "left bottom",
  }}>{children}</span>;
}

function Slot({x, y, children}: {x: number; y: number; children: ReactNode}) {
  return <div style={{
    position: "absolute", left: x, top: y, color: "white", whiteSpace: "nowrap",
    font: `18px/25px ${sans}`,
  }}>{children}</div>;
}

function RisingNumber({at, seconds, children}: {at: number; seconds: number; children: ReactNode}) {
  if (seconds < at) return null;
  const progress = Easing.out(Easing.cubic)(clamp((seconds - at) / .27));
  return <div style={{transform: `translateY(${(1 - progress) * 29}px)`}}>
    <NumberText>{children}</NumberText>
  </div>;
}

function Payback({spec}: {spec: PaybackSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const total = paybackTotals(spec);
  const incomeReveal = clamp((seconds - spec.income.at) / .24);
  const highlight = clamp((seconds - spec.months.at - .06) / .23);
  const monthUnitX = spec.months.value < 10 ? 260 : 270;

  return <>
    <PortraitMedia media={spec.background} style={{position: "absolute", inset: 0, filter: "grayscale(1)"}} />
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(180deg, rgba(0,0,0,.74), rgba(0,0,0,.52) 35%, rgba(37,37,37,.58) 71%, rgba(100,100,100,.68))",
    }} />
    <Label y={216}>成本</Label>
    <Slot x={33} y={284}>
      <NumberText>{spec.equipmentCount}</NumberText>台× <NumberText>{spec.unitCostTenThousands}</NumberText>万= <NumberText>{total.cost}</NumberText>万
    </Slot>
    <Label y={342} reveal={incomeReveal}>收入</Label>
    {incomeReveal >= .8 && <>
      <Slot x={98} y={408}>小时/月×</Slot>
      <Slot x={219} y={408}>元×</Slot>
      <div style={{
        position: "absolute", left: 250, top: 413, height: 18, width: monthUnitX + 37 - 250,
        background: red, transform: `scaleX(${highlight})`, transformOrigin: "left",
      }} />
      <Slot x={monthUnitX} y={408}>个月</Slot>
    </>}
    <Slot x={33} y={408}><RisingNumber at={spec.monthlyHours.at} seconds={seconds}>{spec.monthlyHours.value}</RisingNumber></Slot>
    <Slot x={178} y={408}><RisingNumber at={spec.hourlyRate.at} seconds={seconds}>{spec.hourlyRate.value}</RisingNumber></Slot>
    <Slot x={250} y={408}><RisingNumber at={spec.months.at} seconds={seconds}>{spec.months.value}</RisingNumber></Slot>
    {seconds >= spec.result.at - .4 && <Slot x={33} y={435}>=</Slot>}
    {seconds >= spec.result.at - .4 && <Slot x={53 + String(total.income).length * 12.9} y={435}>万</Slot>}
    <Slot x={49} y={435}><RisingNumber at={spec.result.at} seconds={seconds}>{total.income}</RisingNumber></Slot>
  </>;
}

// UBTECH Walker S2 mass-delivery behind-the-scenes footage, 13.90–23.90 seconds.
// https://www.youtube.com/watch?v=OvNJT-FLWJ0
const demo: PortraitDemo = {
  spec: {
    background: {source: "portrait-mg/latepost/calculation-flow/walker-robot-array.mp4", sourceStart: 0},
    equipmentCount: 100,
    unitCostTenThousands: 50,
    income: {at: .73},
    monthlyHours: {value: 10000, at: 1.20},
    hourlyRate: {value: 700, at: 3.02},
    months: {value: 8, at: 4.44},
    result: {at: 6.68},
  } satisfies PaybackSpec,
  durationInFrames: 233,
  fps: 30,
  reference: "晚点参考 V03_002 · BV1V9J46SEd9 · 65.2–73.0",
};

export const payback = {...paybackContract, Component: Payback, demo};
