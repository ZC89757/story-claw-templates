import {rankReorder} from "./rank-reorder";
import {tierColumnFocus} from "./tier-column-focus";
import {portfolioTreemap} from "./portfolio-treemap";
import {salesStructure} from "./sales-structure";
import {ringCostSubsidy} from "./ring-cost-subsidy";
import {pairedPriceTraces} from "./paired-price-traces";
import {priceTierPie} from "./price-tier-pie";
import {firstLastColumns} from "./first-last-columns";
import {historyThreshold} from "./history-threshold";
import {assetReturnWindow} from "./asset-return-window";
import {rollingBenchmark} from "./rolling-benchmark";

export const dataBatch = [rankReorder, tierColumnFocus, portfolioTreemap, salesStructure, ringCostSubsidy, pairedPriceTraces, priceTierPie, firstLastColumns, historyThreshold, assetReturnWindow, rollingBenchmark] as const;
