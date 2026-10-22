import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {getMgTemplateProvider} from "../src/provider";
import {resolveCanvasFunctionArgs} from "../src/mg-canvas/schema";
import {evaluateCanvas} from "../src/mg-canvas/CanvasTemplate";
import {resolveCanvasSlots} from "../src/mg-canvas/composition-layout";
import {resolvePartWholeFunctionArgs} from "../src/part-whole-chart/schema";
import {evaluatePartWhole} from "../src/part-whole-chart/PartWholeTemplate";
import {chartRevealProgress} from "../src/chart-reveal";
import {resolveDualAxisFunctionArgs} from "../src/dual-axis-chart/schema";
import {resolveArgumentFunctionArgs} from "../src/mg-argument/schema";
import {resolveImageComparisonFunctionArgs} from "../src/image-side-by-side/schema";
import {resolveImageGraphFunctionArgs} from "../src/image-directed-graph/schema";
import {imageGraphLayout} from "../src/image-directed-graph/ImageGraphTemplate";
import {findInheritedCompositionBounds} from "../src/composition-layout";
import {progressTimelineParametersSchema, resolveProgressTimelineFunctionArgs} from "../src/progress-timeline/schema";
import {TIMELINE_WINDOW_LAYOUT, resolveTimelineWindowSlots} from "../src/progress-timeline/content-window";
import {canvasPreviewArgs, piePreviewArgs, dualAxisPreviewArgs, argumentPreviewArgs, imageComparisonPreviewArgs, imageGraphPreviewArgs} from "../src/explainer-previews";
const provider = getMgTemplateProvider();
const timing = {start: 0, end: 12};
const copy = <T,>(value: T): T => structuredClone(value);
const cases = [
  ["mg-canvas", "create_continuous_canvas", canvasPreviewArgs],
  ["part-whole-chart", "create_part_whole_chart", piePreviewArgs],
  ["dual-axis-chart", "create_dual_axis_chart", dualAxisPreviewArgs],
  ["mg-argument", "create_evidence_gap", argumentPreviewArgs],
  ["image-side-by-side", "create_image_comparison", imageComparisonPreviewArgs],
  ["image-directed-graph", "create_image_directed_graph", imageGraphPreviewArgs],
] as const;

test("new capabilities have closed schemas and host-owned instance timing", () => {
  const visit = (value: any) => {
    if (!value || typeof value !== "object") return;
    if (value.type === "object") {assert.equal(value.additionalProperties, false); assert.deepEqual([...value.required].sort(), Object.keys(value.properties).sort());}
    Object.values(value).forEach(visit);
  };
  for (const [tag, name, args] of cases) {
    const tools = provider.getPlanningTools([tag]); assert.equal(tools.length, 1); assert.equal(tools[0].name, name); visit(tools[0].parameters);
    const call = provider.resolveCall({name, arguments: args, timing}); assert.equal(call.htmlTag, tag);
    for (const key of ["at", "startTime", "endTime", "duration", "children"]) assert.throws(() => provider.resolveCall({name, arguments: {...args, [key]: 2}, timing}), `${tag} root ${key}`);
  }
});

test("canvas revisits existing nodes rather than duplicating a new card", () => {
  const {spec} = resolveCanvasFunctionArgs(canvasPreviewArgs, timing);
  const state = evaluateCanvas(spec, 10);
  assert.equal(spec.nodes.length, 3); assert.equal(spec.steps.length, 4);
  assert.equal(state.index, 0); assert.equal(state.camera, 0); assert.equal(state.visited.size, 3);
  assert.deepEqual(resolveCanvasFunctionArgs({...canvasPreviewArgs, group: "subject-detail"}, timing).spec, spec);
  assert.throws(() => resolveCanvasFunctionArgs({...canvasPreviewArgs, steps: [{nodeId: "missing", at: 0}]}, timing), /unknown node/);
  assert.throws(() => resolveCanvasFunctionArgs({...canvasPreviewArgs, steps: [{nodeId: "platform", at: 1}]}, timing), /host start/);
  assert.throws(() => resolveCanvasFunctionArgs({...canvasPreviewArgs, nodes: [...canvasPreviewArgs.nodes, canvasPreviewArgs.nodes[0]]}, timing), /unique/);
});

test("canvas slots close during camera movement and reopen only after settling", () => {
  const {spec} = resolveCanvasFunctionArgs(canvasPreviewArgs, timing);
  assert.deepEqual(resolveCanvasSlots(spec, 30, 360), [
    {slotId: "step-1-platform", openFrame: 0, closeFrame: 90},
    {slotId: "step-2-users", openFrame: 105, closeFrame: 180},
    {slotId: "step-3-business", openFrame: 195, closeFrame: 270},
    {slotId: "step-4-platform", openFrame: 285, closeFrame: 360},
  ]);
  assert.throws(() => resolveCanvasSlots(spec, 0, 360));
});

test("timeline content-window reuses the original tool parameters exactly", () => {
  const tool = provider.getPlanningTools(["progress-timeline"])[0];
  assert.deepEqual(tool.parameters, progressTimelineParametersSchema);
  assert.deepEqual(Object.keys(progressTimelineParametersSchema.properties), ["group", "order", "title", "nodes"]);
  assert.deepEqual(Object.keys(progressTimelineParametersSchema.properties.nodes.items.properties), ["at", "year", "title"]);
  const args = {group: "content-window", order: null, title: "时间线", nodes: [{year: "2012", title: "手机普及", at: 100}, {year: "2017", title: "内容投入", at: 104}]};
  const {spec} = resolveProgressTimelineFunctionArgs(args, {start: 100, end: 109});
  assert.deepEqual(resolveTimelineWindowSlots(spec, 30, 270), [{slotId: "node-1", openFrame: 0, closeFrame: 120}, {slotId: "node-2", openFrame: 134, closeFrame: 270}]);
  assert.deepEqual(resolveTimelineWindowSlots(resolveProgressTimelineFunctionArgs({...args, group: "horizontal"}, {start: 100, end: 109}).spec, 30, 270), []);
});

test("content-window clips descendants by canonical group identity without changing old groups", () => {
  for (const group of ["horizontal", "vertical", "content-window"]) {
    const parent = {nodeId: `progress-timeline::${group}::one`, htmlTag: "progress-timeline"};
    const child = {nodeId: "child", parentNodeId: parent.nodeId, htmlTag: "timed-table"};
    const bounds = findInheritedCompositionBounds(child, new Map([[parent.nodeId, parent], [child.nodeId, child]]));
    assert.deepEqual(bounds, group === "content-window" ? TIMELINE_WINDOW_LAYOUT.bounds : undefined);
  }
});

test("part-whole chart rejects inconsistent totals, overlap-by-sum and invalid numbers", () => {
  const {spec} = resolvePartWholeFunctionArgs(piePreviewArgs, timing);
  assert.equal(evaluatePartWhole(spec, 0)[0].shown, 0);
  assert.equal(evaluatePartWhole(spec, 5)[0].shown, 4.2);
  assert.ok(Math.abs(4.2 / 5.64 * 100 - 74.468) < 0.001);
  for (const value of [0, -1, NaN, Infinity]) assert.throws(() => resolvePartWholeFunctionArgs({...piePreviewArgs, total: {...piePreviewArgs.total, value}}, timing));
  assert.throws(() => resolvePartWholeFunctionArgs({...piePreviewArgs, parts: [{...piePreviewArgs.parts[0], value: 7}]}, timing), /exceeds total/);
  assert.throws(() => resolvePartWholeFunctionArgs({...piePreviewArgs, parts: [{...piePreviewArgs.parts[0], value: -1}]}, timing));
});

test("dual axes retain units and independently compute scales", () => {
  const {spec} = resolveDualAxisFunctionArgs(dualAxisPreviewArgs, timing);
  assert.equal(spec.leftAxis.unit, "万"); assert.equal(spec.rightAxis.unit, "%");
  assert.ok(spec.leftAxis.max >= 420); assert.equal(spec.rightAxis.max, 100);
  const args = copy(dualAxisPreviewArgs); args.series[1].axis = "left";
  assert.throws(() => resolveDualAxisFunctionArgs(args, timing), /unique/);
  const percent = copy(dualAxisPreviewArgs); percent.series[1].data[0].value = 120;
  assert.throws(() => resolveDualAxisFunctionArgs(percent, timing), /0..100/);
  const missing = copy(dualAxisPreviewArgs); missing.series[0].data.pop();
  assert.throws(() => resolveDualAxisFunctionArgs(missing, timing));
  assert.equal(provider.resolveCall({name: "create_dual_axis_chart", arguments: dualAxisPreviewArgs, timing}).layerRole, "overlay");
});

test("evidence-gap describes absent evidence rather than a truth score", () => {
  const {spec} = resolveArgumentFunctionArgs(argumentPreviewArgs, timing);
  assert.equal(spec.claims[0].conclusion, "所有参与者收入同步提高");
  assert.throws(() => resolveArgumentFunctionArgs({...argumentPreviewArgs, claims: [{...argumentPreviewArgs.claims[0], missingEvidence: []}]}, timing), /entries/);
  assert.throws(() => resolveArgumentFunctionArgs({...argumentPreviewArgs, claims: [{...argumentPreviewArgs.claims[0], truth: false}]}, timing), /extra/);
});

test("image comparison requires two introduced sides and rejects premature highlights", () => {
  assert.doesNotThrow(() => resolveImageComparisonFunctionArgs(imageComparisonPreviewArgs, timing));
  const args = copy(imageComparisonPreviewArgs); args.highlights[0].at = 1;
  assert.throws(() => resolveImageComparisonFunctionArgs(args, timing), /before it appears/);
  const oneSide = copy(imageComparisonPreviewArgs); oneSide.items = oneSide.items.map((p) => ({...p, side: "left"}));
  assert.throws(() => resolveImageComparisonFunctionArgs(oneSide, timing), /both comparison sides/);
});

test("image graph retains explicit cycle topology and disallows unknown, duplicate and premature edges", () => {
  const {spec} = resolveImageGraphFunctionArgs(imageGraphPreviewArgs, timing);
  assert.equal(spec.edges[2].to, "content");
  assert.ok(imageGraphLayout(spec).scale > 0);
  const unknown = copy(imageGraphPreviewArgs); unknown.edges[0].to = "missing";
  assert.throws(() => resolveImageGraphFunctionArgs(unknown, timing), /unknown node/);
  const premature = copy(imageGraphPreviewArgs); premature.edges[0].at = 1;
  assert.throws(() => resolveImageGraphFunctionArgs(premature, timing), /precede its nodes/);
  const duplicate = copy(imageGraphPreviewArgs); duplicate.edges.push({...duplicate.edges[2], at: 8});
  assert.throws(() => resolveImageGraphFunctionArgs(duplicate, timing), /unique/);
});

test("image preparation resolves explicit transparent files and is idempotent", async () => {
  for (const [tag, name, args] of cases.filter(([tag]) => ["mg-canvas", "image-side-by-side", "image-directed-graph"].includes(tag))) {
    const call = provider.resolveCall({name, arguments: args, timing});
    const placement = {id: "test", instance: call.instanceKey, htmlTag: tag, group: call.group, layerRole: call.layerRole, startFrame: 0, endFrame: 360, durationFrames: 360, timelineOffsetFrames: 0, sourceText: "测试", render: call.render};
    let resolved = 0;
    const input = {layers: [placement], resolveImage: async () => `assets/test-${++resolved}.png`};
    await provider.prepareRuntimeAssets(input); const count = resolved;
    assert.ok(count > 0); await provider.prepareRuntimeAssets(input); assert.equal(resolved, count);
    assert.equal((call.render.spec as {prepared?: boolean}).prepared, true);
  }
});

test("all new internal event times are bounded by the host interval", () => {
  const late = copy(piePreviewArgs); late.parts[0].at = 12;
  assert.throws(() => resolvePartWholeFunctionArgs(late, timing), /host/);
  const early = copy(argumentPreviewArgs); early.claims[0].at = -1;
  assert.throws(() => resolveArgumentFunctionArgs(early, timing));
});

test("prompt-only cutouts reuse existing callbacks in every image-bearing template", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "mg-cutout-contract-"));
  try {
    const cutout = path.join(directory, "transparent.png");
    await fs.writeFile(cutout, "test fixture; callbacks are mocked");
    const source = {mode: "generate", image: null, prompt: "一名拿着手机的普通用户"};
    for (const [tag, name, original] of cases.filter(([tag]) => ["mg-canvas", "image-side-by-side", "image-directed-graph"].includes(tag))) {
      const args: any = copy(original);
      if (tag === "image-side-by-side") {args.left.source = source; args.right.source = source;}
      else args.nodes.forEach((n: any) => {n.source = source;});
      const call = provider.resolveCall({name, arguments: args, timing});
      const placement = {id: "test", instance: call.instanceKey, htmlTag: tag, group: call.group, layerRole: call.layerRole, startFrame: 0, endFrame: 360, durationFrames: 360, timelineOffsetFrames: 0, sourceText: "测试", render: call.render};
      const events: string[] = [];
      const input = {
        layers: [placement],
        generateImageFromReferences: async (request: any) => {
          events.push("generate");
          assert.match(request.prompt, /一名拿着手机的普通用户/);
          assert.match(request.prompt, /style board only/);
          assert.match(request.prompt, /#00ff00/);
          assert.equal(request.aspectRatio, "1:1");
          assert.equal(request.references.length, 1);
          assert.equal(path.extname(request.references[0]), ".png");
          assert.deepEqual((await fs.readFile(request.references[0])).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
          return path.join(directory, "green.png");
        },
        removeSolidBackground: async (request: any) => {
          events.push("cutout"); assert.equal(request.sourcePath, path.join(directory, "green.png"));
          assert.equal(request.backgroundColor, "#00ff00"); return cutout;
        },
        resolveImage: async (value: string) => {events.push("resolve"); assert.equal(value, cutout); return "assets/transparent.png";},
      };
      await provider.prepareRuntimeAssets(input);
      assert.deepEqual(events, ["generate", "cutout", "resolve"], "duplicate subjects share the same generated cutout");
      await provider.prepareRuntimeAssets(input);
      assert.equal(events.length, 3, "prepared specs are idempotent");
      const spec: any = call.render.spec;
      const images = tag === "image-side-by-side" ? [spec.left.image, spec.right.image] : spec.nodes.map((n: any) => n.image);
      assert.ok(images.every((image: string) => image === "assets/transparent.png"));
    }
  } finally {await fs.rm(directory, {recursive: true, force: true});}
});
test("chart animation approaches the supplied values without overshoot or reversal", () => {
  for (const duration of [0.85, 1.2]) {
    let previous = 0;
    for (let tick = -10; tick <= 100; tick++) {
      const value = chartRevealProgress(tick / 25, duration);
      assert.ok(value >= previous && value >= 0 && value <= 1);
      previous = value;
    }
    assert.equal(chartRevealProgress(duration, duration), 1);
  }
  const {spec} = resolvePartWholeFunctionArgs(piePreviewArgs, timing);
  for (let tick = 0; tick <= 120; tick++) {
    const parts = evaluatePartWhole(spec, tick / 30);
    assert.ok(parts.every((part, index) => part.shown >= 0 && part.shown <= spec.parts[index].value));
    assert.ok(parts.reduce((sum, part) => sum + part.shown, 0) <= spec.total.value + 1e-9);
  }
});
