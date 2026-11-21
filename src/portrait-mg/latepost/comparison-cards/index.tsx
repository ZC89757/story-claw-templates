import {metrics} from "./metrics";
import {businessTriangle} from "./business-triangle";
import {hoursConversion, payrollCases} from "./work-hours";
import {duelingPhones} from "./phones";
import {listingCycle} from "./cycle";
import {scrollCards, tableReveal} from "./reveal";

export const comparisonCardBatch = [
  metrics, businessTriangle, hoursConversion, payrollCases, duelingPhones, listingCycle, tableReveal, scrollCards,
] as const;
