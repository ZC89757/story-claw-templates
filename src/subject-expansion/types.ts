export const SUBJECT_EXPANSION_GROUP = "progressive" as const;
export const SUBJECT_EXPANSION_GROUPS = [SUBJECT_EXPANSION_GROUP, "impact"] as const;
export type SubjectExpansionGroup = typeof SUBJECT_EXPANSION_GROUPS[number];

export type SubjectExpansionSource =
  | {mode: "transparent"; image: string; prompt: null}
  | {mode: "generate"; image: null; prompt: string};

export type SubjectExpansionItem = {
  id: string;
  label: string;
  relation: string;
  source: SubjectExpansionSource | null;
  at: number;
};

export type SubjectExpansionHighlight = {targets: string[]; note: string | null; at: number};

export type SubjectExpansionFunctionArgs = {
  group: SubjectExpansionGroup;
  order: number | null;
  subject: {label: string; source: SubjectExpansionSource};
  items: SubjectExpansionItem[];
  highlights: SubjectExpansionHighlight[];
};

/** Element times are local here. Image paths are materialized by the Provider. */
export type SubjectExpansionSpec = {
  subject: SubjectExpansionFunctionArgs["subject"] & {image: string};
  items: Array<SubjectExpansionItem & {image: string | null}>;
  highlights: SubjectExpansionHighlight[];
  prepared?: boolean;
};
