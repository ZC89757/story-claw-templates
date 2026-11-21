import {paybackContract} from "./payback-contract";
import {sankeyContract} from "./sankey-contract";

export const calculationFlowContracts = [paybackContract, sankeyContract] as const;
