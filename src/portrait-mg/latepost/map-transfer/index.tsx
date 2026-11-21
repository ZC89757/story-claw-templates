import {supplierMap} from "./supplier-map";
import {teacherTransfer} from "./teacher-transfer";
import {isometricDiffusion} from "./diffusion";

export const mapTransferBatch = [supplierMap, teacherTransfer, isometricDiffusion] as const;
