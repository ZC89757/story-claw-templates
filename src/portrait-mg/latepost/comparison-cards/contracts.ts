import {metricsContract} from "./metrics-contract";
import {businessTriangleContract} from "./business-triangle-contract";
import {hoursConversionContract, payrollCasesContract} from "./work-hours-contract";
import {phonesContract} from "./phones-contract";
import {cycleContract} from "./cycle-contract";
import {scrollCardsContract, tableRevealContract} from "./reveal-contract";

export const comparisonCardContracts = [
  metricsContract, businessTriangleContract, hoursConversionContract, payrollCasesContract,
  phonesContract, cycleContract, tableRevealContract, scrollCardsContract,
] as const;
