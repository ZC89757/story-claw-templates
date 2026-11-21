import {promotionRoute} from "./promotion-route";
import {transactionLoop} from "./transaction-loop";
import {flywheel} from "./flywheel";
import {rankPyramid} from "./rank-pyramid";
import {productionMilestones} from "./production-milestones";
import {technologyTree} from "./technology-tree";
import {bilateralExchange} from "./bilateral-exchange";
import {revenueDistribution} from "./revenue-distribution";
import {serviceTierPyramid} from "./service-tier-pyramid";

export const structureBatch = [promotionRoute, transactionLoop, flywheel, rankPyramid, productionMilestones, technologyTree, bilateralExchange, revenueDistribution, serviceTierPyramid] as const;
