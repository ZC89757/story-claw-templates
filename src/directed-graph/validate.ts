import {DirectedGraphSpec} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateDirectedGraphSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  if (!Array.isArray(input.nodes) || input.nodes.length < 1 || input.nodes.length > 40) {
    return ["nodes must contain 1..40 items"];
  }
  if (!Array.isArray(input.edges) || input.edges.length === 0) return ["edges must contain at least one item"];
  const errors: string[] = [];
  if (input.title !== undefined && (typeof input.title !== "string" || !input.title.trim())) errors.push("title must be a non-empty string");
  const knownNodes = new Map<string, {at: number; label: string}>();
  input.nodes.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`nodes[${index}] must be an object`);
      return;
    }
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const label = typeof raw.label === "string" ? raw.label.trim() : "";
    if (!id) errors.push(`nodes[${index}].id is required`);
    if (!/^[A-Za-z0-9_-]+$/.test(id)) errors.push(`nodes[${index}].id must be an ASCII identifier`);
    if (!label) errors.push(`nodes[${index}].label is required`);
    if (typeof raw.at !== "number" || !Number.isFinite(raw.at) || raw.at < 0) errors.push(`nodes[${index}].at must be a non-negative number`);
    if (id && knownNodes.has(id)) errors.push(`nodes[${index}].id duplicates an existing node`);
    if (id && typeof raw.at === "number" && Number.isFinite(raw.at) && raw.at >= 0) {
      knownNodes.set(id, {at: raw.at, label});
    }
  });
  if (input.edges.length > 40) errors.push("edges may contain at most 40 items");
  const edgeKeys = new Set<string>();
  let previousAt = -1;

  input.edges.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`edges[${index}] must be an object`);
      return;
    }
    const from = typeof raw.from === "string" ? raw.from.trim() : "";
    const to = typeof raw.to === "string" ? raw.to.trim() : "";
    if (!from) errors.push(`edges[${index}].from is required`);
    if (!to) errors.push(`edges[${index}].to is required`);
    if (from && from === to) errors.push(`edges[${index}] cannot point to itself`);
    if (from && !knownNodes.has(from)) errors.push(`edges[${index}].from must reference a declared node`);
    if (to && !knownNodes.has(to)) errors.push(`edges[${index}].to must reference a declared node`);
    if (typeof raw.relation !== "string" || !raw.relation.trim()) errors.push(`edges[${index}].relation is required`);
    if (typeof raw.at !== "number" || !Number.isFinite(raw.at) || raw.at < previousAt) errors.push(`edges[${index}].at must be non-decreasing`);
    if (from && to && knownNodes.has(from) && knownNodes.has(to) && typeof raw.at === "number" && Number.isFinite(raw.at)) {
      const fromAt = knownNodes.get(from)!.at;
      const toAt = knownNodes.get(to)!.at;
      if (raw.at < Math.max(fromAt, toAt)) errors.push(`edges[${index}].at must not precede both endpoint nodes`);
    }
    const edgeKey = `${from}\u0000${to}`;
    if (edgeKeys.has(edgeKey)) errors.push(`edges[${index}] duplicates an existing direction`);
    edgeKeys.add(edgeKey);
    if (typeof raw.at === "number") previousAt = raw.at;
  });
  return errors;
};

export const assertDirectedGraphSpec = (input: unknown): DirectedGraphSpec => {
  const errors = validateDirectedGraphSpec(input);
  if (errors.length) throw new Error(`Invalid DirectedGraphSpec:\n- ${errors.join("\n- ")}`);
  return input as DirectedGraphSpec;
};
