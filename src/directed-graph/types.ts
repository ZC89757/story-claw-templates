export type DirectedGraphNode = {
  /** Stable node identity copied from the reviewed HTML topology. */
  id: string;
  /** Human-readable label shown inside the node. */
  label: string;
  /** Scene-local second at which the node starts appearing. */
  at: number;
};

export type DirectedGraphEdge = {
  /** Scene-local second at which drawing this edge begins. */
  at: number;
  from: string;
  to: string;
  relation: string;
};

export type DirectedGraphSpec = {
  title?: string;
  nodes: DirectedGraphNode[];
  edges: DirectedGraphEdge[];
};

export type DirectedGraphEdgeState = {
  lineProgress: number;
  nodeProgress: number;
};
