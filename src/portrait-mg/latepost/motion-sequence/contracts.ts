import {globeContract} from "./globe-contract";
import {workHoursContract} from "./work-hours-contract";

export const motionSequenceContracts = [globeContract, workHoursContract] as const;
