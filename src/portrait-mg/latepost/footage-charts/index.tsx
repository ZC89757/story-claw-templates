import {peakEndContract, revenuePieContract} from "./contracts";
import {PeakEndCurve, peakEndDemo} from "./peak-end";
import {RevenuePie, revenuePieDemo} from "./revenue-pie";

export const footageChartBatch = [
  {...peakEndContract, Component: PeakEndCurve, demo: peakEndDemo},
  {...revenuePieContract, Component: RevenuePie, demo: revenuePieDemo},
] as const;
