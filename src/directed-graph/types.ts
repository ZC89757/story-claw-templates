export type DirectedGraphEdge = {
  /** Scene-local second at which drawing this edge begins. */
  at: number;
  from: string;
  to: string;
  relation: string;
};

export type DirectedGraphSpec = {
  edges: DirectedGraphEdge[];
};

export type DirectedGraphEdgeState = {
  lineProgress: number;
  nodeProgress: number;
};
