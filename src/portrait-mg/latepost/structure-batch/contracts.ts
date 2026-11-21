import {promotionRouteContract} from "./promotion-route-contract";
import {transactionLoopContract} from "./transaction-loop-contract";
import {flywheelContract} from "./flywheel-contract";
import {rankPyramidContract} from "./rank-pyramid-contract";
import {productionMilestonesContract} from "./production-milestones-contract";
import {technologyTreeContract} from "./technology-tree-contract";
import {bilateralExchangeContract} from "./bilateral-exchange-contract";
import {revenueDistributionContract} from "./revenue-distribution-contract";
import {serviceTierPyramidContract} from "./service-tier-pyramid-contract";

export const structureContracts = [promotionRouteContract, transactionLoopContract, flywheelContract, rankPyramidContract, productionMilestonesContract, technologyTreeContract, bilateralExchangeContract, revenueDistributionContract, serviceTierPyramidContract] as const;
