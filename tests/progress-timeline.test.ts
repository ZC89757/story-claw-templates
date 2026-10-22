import test from "node:test";
import assert from "node:assert/strict";
import specJson from "../examples/black-swan-progress.spec.json";
import {evaluateProgressTimeline} from "../src/progress-timeline/evaluate";
import {assertProgressTimelineSpec, validateProgressTimelineSpec} from "../src/progress-timeline/validate";
import {horizontalTimelineLayout} from "../src/progress-timeline/horizontal-layout";

const spec = assertProgressTimelineSpec(specJson);

test("progress remains still until the node timestamp", () => {
  assert.equal(evaluateProgressTimeline(spec, 9.852).progress, 12);
  assert.equal(evaluateProgressTimeline(spec, 9.853).progress, 12);
});

test("progress reaches the target after the node duration", () => {
  assert.equal(evaluateProgressTimeline(spec, 10.553).progress, 25);
});

test("active detail changes when movement is triggered", () => {
  assert.equal(evaluateProgressTimeline(spec, 9.852).activeIndex, 1);
  assert.equal(evaluateProgressTimeline(spec, 9.853).activeIndex, 2);
});

test("validator rejects decreasing progress", () => {
  const invalid = structuredClone(specJson);
  invalid.nodes[2].progress = 5;
  assert.ok(validateProgressTimelineSpec(invalid).some((error) => error.includes("progress must increase")));
});

for (const positions of [[0, 100], [0, 50, 100], [0, 10, 100]]) {
  test(`following timeline keeps adjacent date labels inside the viewport: ${positions.join(",")}`, () => {
    const shortSpec = {...spec, followViewport: true, nodes: positions.map((progress, index) =>
      ({...spec.nodes[0], id: String(index), at: index, kind: "major" as const, progress}))};
    const before = structuredClone(shortSpec);
    const layout = horizontalTimelineLayout(shortSpec);
    for (let right = 1; right < positions.length; right++) {
      const offset = layout.viewportOffset(positions[right]);
      for (const progress of positions.slice(right - 1, right + 1)) {
        const x = layout.nodeX(progress) - offset;
        assert.ok(x - 150 >= 0 && x + 150 <= 1920, `Date box at ${x} must fit the 1920px viewport`);
      }
    }
    assert.deepEqual(shortSpec, before, "Layout must not change content or timing");
  });
}

test("fixed-view timelines retain their original track and camera", () => {
  const fixed = horizontalTimelineLayout({...spec, followViewport: false});
  assert.equal(fixed.trackWidth, 4300);
  assert.equal(fixed.viewportOffset(100), 0);
});
