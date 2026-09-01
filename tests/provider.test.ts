import assert from "node:assert/strict";
import test from "node:test";
import {getMgTemplateProvider} from "../src/provider";

const provider = getMgTemplateProvider();

test("provider exposes only the host-facing static template protocol", () => {
  const camera = provider.templates.find((item) => item.htmlTag === "mg-camera");
  assert.deepEqual(Object.keys(camera ?? {}).sort(), ["groups", "htmlTag", "layerRole", "selectionHint"]);
  assert.equal(camera?.layerRole, "scene");
  assert.ok(camera?.groups.includes("slow-push-in"));
});

test("provider instance keys use HTML tag plus group plus optional order", () => {
  assert.equal(provider.instanceKey({htmlTag: "mg-camera", group: "slow-push-in"}), "mg-camera::slow-push-in::one");
  assert.equal(provider.instanceKey({htmlTag: "mg-camera", group: "slow-push-in", order: 2}), "mg-camera::slow-push-in::02");
  assert.notEqual(
    provider.instanceKey({htmlTag: "mg-camera", group: "slow-push-in"}),
    provider.instanceKey({htmlTag: "mg-camera", group: "dolly-zoom"}),
  );
});

test("provider selects only tools needed by HTML and returns opaque runtime payload", () => {
  const tools = provider.getPlanningTools(["mg-camera", "mg-effect"]);
  assert.deepEqual(new Set(tools.map((tool) => tool.name)), new Set(["create_camera_move", "create_effect_cue"]));
  const call = provider.resolveCall({
    name: "create_camera_move",
    arguments: {group: "slow-push-in", order: null, at: 12, text: "核心数字", items: [{text: "数字", at: 12.5}]},
  });
  assert.equal(call.htmlTag, "mg-camera");
  assert.equal(call.layerRole, "scene");
  assert.equal(call.render.kind, "camera");
  assert.equal(call.render.layerRole, "scene");
  assert.deepEqual(call.elementAts, [12, 12.5]);
});

test("multi-series chart groups share one Function Call and remain runtime groups", () => {
  const tools = provider.getPlanningTools(["multi-series-chart"]);
  assert.deepEqual(tools.map((tool) => tool.name), ["create_multi_series_chart"]);

  const argumentsFor = (group: "bar" | "line") => ({
    group,
    order: null,
    at: 20,
    title: "模型能力",
    xAxis: {label: "维度", categories: ["推理", "代码"]},
    yAxis: {label: "评分", unit: "分"},
    series: [
      {name: "模型 A", data: [{category: "推理", at: 20, value: 87}, {category: "代码", at: 22, value: 91}]},
      {name: "模型 B", data: [{category: "推理", at: 20, value: 82}, {category: "代码", at: 22, value: 89}]},
    ],
  });

  for (const group of ["bar", "line"] as const) {
    const call = provider.resolveCall({name: "create_multi_series_chart", arguments: argumentsFor(group)});
    assert.equal(call.group, group);
    assert.equal(call.render.group, group);
    assert.equal("chartType" in (call.render.spec as Record<string, unknown>), false);
    assert.equal(provider.isToolAllowed({htmlTag: "multi-series-chart", group, name: "create_multi_series_chart"}), true);
  }
});
