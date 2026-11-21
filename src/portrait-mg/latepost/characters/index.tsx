import {
  commentStackContract, pairedQuoteContract, overheadQuestionContract,
  officeMonologueContract, interviewContrastContract, crewAppealsContract,
} from "./contracts";
import {CommentStack, PairedQuote, commentStackDemo, pairedQuoteDemo} from "./quotes";
import {
  OverheadQuestion, OfficeMonologue, InterviewContrast, CrewAppeals,
  overheadQuestionDemo, officeMonologueDemo, interviewContrastDemo, crewAppealsDemo,
} from "./people-scenes";

export const characterBatch = [
  {...commentStackContract, Component: CommentStack, demo: commentStackDemo},
  {...pairedQuoteContract, Component: PairedQuote, demo: pairedQuoteDemo},
  {...overheadQuestionContract, Component: OverheadQuestion, demo: overheadQuestionDemo},
  {...officeMonologueContract, Component: OfficeMonologue, demo: officeMonologueDemo},
  {...interviewContrastContract, Component: InterviewContrast, demo: interviewContrastDemo},
  {...crewAppealsContract, Component: CrewAppeals, demo: crewAppealsDemo},
] as const;
