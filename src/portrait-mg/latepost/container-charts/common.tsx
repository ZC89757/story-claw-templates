import type {CSSProperties} from "react";
import {clamp} from "../../common";

export const designBackground = "linear-gradient(#020003 0%, #020003 19%, #060307 28%, #141115 39%, #252226 50%, #363337 62.5%, #504d51 78%, #706d71 100%)";
export const sans = '"Microsoft YaHei", sans-serif';
export const serif = 'SimSun, "Songti SC", serif';
export const numbers = '"Times New Roman", serif';

export const chartCanvas: CSSProperties = {position: "absolute", inset: 0, background: designBackground};
export const chartSvg: CSSProperties = {position: "absolute", inset: 0, pointerEvents: "none"};

export const progress = (time: number, at: number, seconds: number) => clamp((time - at) / seconds);
export const easeOut = (value: number) => 1 - (1 - value) ** 3;
