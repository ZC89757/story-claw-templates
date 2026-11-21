import {rankReorderContract} from "./rank-reorder-contract";
import {tierColumnFocusContract} from "./tier-column-focus-contract";
import {portfolioTreemapContract} from "./portfolio-treemap-contract";
import {salesStructureContract} from "./sales-structure-contract";
import {ringCostSubsidyContract} from "./ring-cost-subsidy-contract";
import {pairedPriceTracesContract} from "./paired-price-traces-contract";
import {priceTierPieContract} from "./price-tier-pie-contract";
import {firstLastColumnsContract} from "./first-last-columns-contract";
import {historyThresholdContract} from "./history-threshold-contract";
import {assetReturnWindowContract} from "./asset-return-window-contract";
import {rollingBenchmarkContract} from "./rolling-benchmark-contract";

export const dataContracts = [rankReorderContract, tierColumnFocusContract, portfolioTreemapContract, salesStructureContract, ringCostSubsidyContract, pairedPriceTracesContract, priceTierPieContract, firstLastColumnsContract, historyThresholdContract, assetReturnWindowContract, rollingBenchmarkContract] as const;
