import {payback} from "./payback";
import {sankey} from "./sankey";

export const calculationFlowBatch = [payback, sankey] as const;
