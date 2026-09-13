import test from "node:test";
import assert from "node:assert/strict";
import specJson from "../examples/black-swan-directed-graph.spec.json";
import {evaluateDirectedGraphEdge, evaluateDirectedGraphNode} from "../src/directed-graph/evaluate";
import {assertDirectedGraphSpec, validateDirectedGraphSpec} from "../src/directed-graph/validate";

const spec = assertDirectedGraphSpec(specJson);

test("edge remains hidden before its timestamp", () => {
  const edge = spec.edges[1];
  assert.equal(evaluateDirectedGraphEdge(edge, edge.at - 0.001).lineProgress, 0);
  assert.equal(evaluateDirectedGraphEdge(edge, edge.at).lineProgress, 0);
});

test("target node appears only after the arrow finishes", () => {
  const edge = spec.edges[1];
  assert.equal(evaluateDirectedGraphEdge(edge, edge.at + 0.54).nodeProgress, 0);
  assert.ok(evaluateDirectedGraphEdge(edge, edge.at + 0.7).nodeProgress > 0);
});

test("nodes use their own timestamps instead of edge completion", () => {
  const node = spec.nodes[1];
  assert.equal(evaluateDirectedGraphNode(node, node.at - 0.001), 0);
  assert.ok(evaluateDirectedGraphNode(node, node.at + 0.2) > 0);
});

test("validator rejects an edge before either endpoint node", () => {
  const invalid = {
    nodes: [
      {id: "A", label: "A", at: 1},
      {id: "B", label: "B", at: 3},
    ],
    edges: [{at: 2, from: "A", to: "B", relation: "ab"}],
  };
  assert.ok(validateDirectedGraphSpec(invalid).some((error) => error.includes("must not precede")));
});
