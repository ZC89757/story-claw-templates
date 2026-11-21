import {payrollContract, regulatoryAmountContract, supplyComparisonContract} from "./contracts";
import {Payroll, payrollDemo} from "./payroll";
import {RegulatoryAmount, regulatoryAmountDemo} from "./regulatory-amount";
import {SupplyComparison, supplyComparisonDemo} from "./supply-comparison";
import {reportZoomContract} from "./report-zoom-contract";
import {ReportZoom, reportZoomDemo} from "./report-zoom";
import {reportEvidenceContract} from "./report-evidence-contract";
import {ReportEvidence, reportEvidenceDemo} from "./report-evidence";
import {distillSourcesContract} from "./distill-sources-contract";
import {DistillSources, distillSourcesDemo} from "./distill-sources";
import {taskMatrixContract} from "./task-matrix-contract";
import {TaskMatrix, taskMatrixDemo} from "./task-matrix";
import {researchPaperContract} from "./research-paper-contract";
import {ResearchPaper, researchPaperDemo} from "./research-paper";

export const documentBatch = [
  {...regulatoryAmountContract, Component: RegulatoryAmount, demo: regulatoryAmountDemo},
  {...payrollContract, Component: Payroll, demo: payrollDemo},
  {...supplyComparisonContract, Component: SupplyComparison, demo: supplyComparisonDemo},
  {...reportZoomContract, Component: ReportZoom, demo: reportZoomDemo},
  {...reportEvidenceContract, Component: ReportEvidence, demo: reportEvidenceDemo},
  {...distillSourcesContract, Component: DistillSources, demo: distillSourcesDemo},
  {...taskMatrixContract, Component: TaskMatrix, demo: taskMatrixDemo},
  {...researchPaperContract, Component: ResearchPaper, demo: researchPaperDemo},
] as const;
