import assert from "node:assert/strict";
import test from "node:test";
import {getMgTemplateProvider} from "../src/provider";

const provider = getMgTemplateProvider();

test("provider exposes only the host-facing static template protocol", () => {
  const effect = provider.templates.find((item) => item.htmlTag === "mg-effect");
  assert.deepEqual(Object.keys(effect ?? {}).sort(), ["groups", "htmlTag", "layerRole", "selectionHint"]);
  assert.equal(effect?.layerRole, "overlay");
  assert.ok(effect?.groups.includes("scanline-annotate-focus"));
});

test("provider instance keys use HTML tag plus group plus optional order", () => {
  assert.equal(provider.instanceKey({htmlTag: "mg-effect", group: "scanline-annotate-focus"}), "mg-effect::scanline-annotate-focus::one");
  assert.equal(provider.instanceKey({htmlTag: "mg-effect", group: "scanline-annotate-focus", order: 2}), "mg-effect::scanline-annotate-focus::02");
  assert.notEqual(
    provider.instanceKey({htmlTag: "mg-effect", group: "scanline-annotate-focus"}),
    provider.instanceKey({htmlTag: "mg-effect", group: "reticle-lock-on"}),
  );
});

test("provider selects only tools needed by HTML and returns opaque runtime payload", () => {
  const tools = provider.getPlanningTools(["mg-effect"]);
  assert.deepEqual(new Set(tools.map((tool) => tool.name)), new Set([
    "create_effect_cue",
    "create_object_drop_effect",
    "create_glass_fracture_effect",
  ]));
  const call = provider.resolveCall({
    name: "create_effect_cue",
    arguments: {group: "scanline-annotate-focus", order: null, at: 12, text: "核心数字", items: [{text: "数字", at: 12.5}]},
  });
  assert.equal(call.htmlTag, "mg-effect");
  assert.equal(call.layerRole, "overlay");
  assert.equal(call.render.kind, "effect");
  assert.equal(call.render.layerRole, "overlay");
  assert.deepEqual(call.elementAts, [12, 12.5]);
});

test("configurable effect groups expose descriptions and require exactly one image", async () => {
  const effect = provider.templates.find((item) => item.htmlTag === "mg-effect");
  assert.ok(effect?.groups.includes("object-drop"));
  assert.ok(effect?.groups.includes("glass-fracture"));
  const effectTool = provider.getPlanningTools(["mg-effect"]).find((tool) => tool.name === "create_object_drop_effect");
  assert.match(effectTool?.description ?? "", /public[\\/]mg-effect[\\/]object-drop/);
  assert.match(effectTool?.description ?? "", /nv1-gpu-reference\.jpg/);
  const fractureTool = provider.getPlanningTools(["mg-effect"]).find((tool) => tool.name === "create_glass_fracture_effect");
  assert.match(fractureTool?.description ?? "", /固定裂纹/);

  assert.throws(() => provider.resolveCall({
    name: "create_object_drop_effect",
    arguments: {group: "object-drop", order: null, at: 12},
  }), /requires one image/);
  assert.throws(() => provider.resolveCall({
    name: "create_glass_fracture_effect",
    arguments: {group: "glass-fracture", order: null, at: 12, text: "失败", image: "nvidia-eye.svg", items: [{text: "失败", at: 12}]},
  }), /only accepts group, order, at, crackAt and image/);
  assert.throws(() => provider.resolveCall({
    name: "create_glass_fracture_effect",
    arguments: {group: "glass-fracture", order: null, at: 12, crackAt: 11, image: "nvidia-eye.svg"},
  }), /不能早于 at/);

  const fracture = provider.resolveCall({
    name: "create_glass_fracture_effect",
    arguments: {group: "glass-fracture", order: null, at: 12, crackAt: 13.2, image: "nvidia-eye.svg"},
  });
  assert.equal((fracture.render.spec as {crackAt?: number}).crackAt, 1.2);
  assert.deepEqual(fracture.elementAts, [12, 13.2]);

  const call = provider.resolveCall({
    name: "create_object_drop_effect",
    arguments: {group: "object-drop", order: null, at: 12, impactAt: 13.4, image: "nv1-gpu-reference.jpg"},
  });
  assert.equal((call.render.spec as {impactAt?: number}).impactAt, 1.4);
  assert.deepEqual(call.elementAts, [12, 13.4]);
  const resolvedSources: string[] = [];
  await provider.prepareRuntimeAssets({
    layers: [{
      id: "effect",
      instance: call.instanceKey,
      htmlTag: "mg-effect",
      group: call.group,
      layerRole: call.layerRole,
      startFrame: 0,
      endFrame: 30,
      durationFrames: 30,
      timelineOffsetFrames: 0,
      sourceText: "NV1",
      render: call.render,
    }],
    resolveImage: async (source) => {
      resolvedSources.push(source);
      return "assets/nv1.jpg";
    },
  });
  assert.deepEqual(resolvedSources, ["mg-effect/object-drop/nv1-gpu-reference.jpg"]);
  assert.equal((call.render.spec as {image?: string}).image, "assets/nv1.jpg");

  const invalid = provider.resolveCall({
    name: "create_glass_fracture_effect",
    arguments: {group: "glass-fracture", order: null, at: 12, image: "nv1-gpu-reference.jpg"},
  });
  await assert.rejects(() => provider.prepareRuntimeAssets({
    layers: [{
      id: "invalid-effect",
      instance: invalid.instanceKey,
      htmlTag: "mg-effect",
      group: invalid.group,
      layerRole: invalid.layerRole,
      startFrame: 0,
      endFrame: 30,
      durationFrames: 30,
      timelineOffsetFrames: 0,
      sourceText: "失败",
      render: invalid.render,
    }],
    resolveImage: async (source) => source,
  }), /不在固定素材目录/);

  assert.equal(provider.isToolAllowed({htmlTag: "mg-effect", group: "object-drop", name: "create_effect_cue"}), false);
  assert.equal(provider.isToolAllowed({htmlTag: "mg-effect", group: "object-drop", name: "create_object_drop_effect"}), true);
});

test("multi-series chart groups share one Function Call and remain runtime groups", () => {
  const tools = provider.getPlanningTools(["multi-series-chart"]);
  assert.deepEqual(tools.map((tool) => tool.name), ["create_multi_series_chart"]);
  assert.match(tools[0].description, /search_web/);
  assert.match(provider.getTemplatePlanningInstructions(["multi-series-chart"]), /先调用 search_web/);
  assert.equal(provider.getTemplatePlanningInstructions(["xy-chart"]), "");

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
