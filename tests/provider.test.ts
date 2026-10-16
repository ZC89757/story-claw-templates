import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {findInheritedCompositionBounds} from "../src/composition-layout";
import type {MgCompositionNodeReference} from "../src/composition-layout";
import {getMgTemplateProvider} from "../src/provider";

const provider = getMgTemplateProvider();

test("all tools leave whole-instance timing to the host while retaining internal event timestamps", () => {
  const tools = provider.getPlanningTools(provider.templates.map(({htmlTag}) => htmlTag));
  for (const tool of tools) {
    const schema = tool.parameters as {properties: Record<string, unknown>; required?: readonly string[]};
    for (const key of ["at", "startTime", "endTime"]) {
      assert.equal(key in schema.properties, false, `${tool.name}.${key}`);
      assert.equal(schema.required?.includes(key) ?? false, false, `${tool.name} requires ${key}`);
    }
  }
  assert.throws(() => provider.resolveCall({
    name: "create_emphasis_text_cue", timing: {start: 10, end: 12},
    arguments: {group: "scale", order: null, text: "正文", at: 0},
  }), /整体时间由宿主计算/);
  const progress = provider.resolveCall({
    name: "create_progress_timeline", timing: {start: 10, end: 14},
    arguments: {group: "horizontal", order: null, title: "进展", nodes: [{title: "第一步", at: 10}, {title: "第二步", at: 12}]},
  });
  assert.equal(progress.at, 10);
  assert.deepEqual((progress.render.spec as {nodes: {at: number}[]}).nodes.map(({at}) => at), [0, 2]);
});

test("provider exposes only the host-facing static template protocol", () => {
  const effect = provider.templates.find((item) => item.htmlTag === "mg-effect");
  assert.deepEqual(Object.keys(effect ?? {}).sort(), ["groups", "htmlTag", "layerRole", "selectionHint"]);
  assert.equal(effect?.layerRole, "overlay");
  assert.ok(effect?.groups.includes("scanline-annotate-focus"));
});

test("ai-hot-focus-stage declares one normalized descendant composition bounds", () => {
  const stage = provider.templates.find((item) => item.htmlTag === "ai-hot-focus-stage");
  assert.deepEqual(stage?.compositionLayout, {
    bounds: {x: 0.035, y: 0.17, width: 0.93, height: 0.83},
  });
  assert.deepEqual(Object.keys(stage ?? {}).sort(), [
    "compositionLayout", "groups", "htmlTag", "layerRole", "selectionHint",
  ]);
  assert.equal(provider.templates.find((item) => item.htmlTag === "mg-effect")?.compositionLayout, undefined);
});

test("composition bounds inherit through nested nodes, but not across unrelated nodes", () => {
  const stage: MgCompositionNodeReference = {nodeId: "stage", htmlTag: "ai-hot-focus-stage"};
  const child: MgCompositionNodeReference = {nodeId: "child", parentNodeId: "stage", htmlTag: "emphasis"};
  const grandchild: MgCompositionNodeReference = {nodeId: "grandchild", parentNodeId: "child", htmlTag: "mg-effect"};
  const unrelated: MgCompositionNodeReference = {nodeId: "unrelated", htmlTag: "mg-effect"};
  const nodesById = new Map<string, MgCompositionNodeReference>(
    [stage, child, grandchild, unrelated].map((node): [string, MgCompositionNodeReference] => [node.nodeId, node]),
  );
  const expectedBounds = {x: 0.035, y: 0.17, width: 0.93, height: 0.83};

  assert.deepEqual(findInheritedCompositionBounds(child, nodesById), expectedBounds);
  assert.deepEqual(findInheritedCompositionBounds(grandchild, nodesById), expectedBounds);
  assert.equal(findInheritedCompositionBounds(unrelated, nodesById), undefined);
});

test("composition bounds reject broken parent references and cycles", () => {
  const missing: MgCompositionNodeReference = {nodeId: "child", parentNodeId: "missing"};
  assert.throws(() => findInheritedCompositionBounds(
    missing,
    new Map<string, MgCompositionNodeReference>([[missing.nodeId, missing]]),
  ), /找不到父节点/);

  const first: MgCompositionNodeReference = {nodeId: "first", parentNodeId: "second"};
  const second: MgCompositionNodeReference = {nodeId: "second", parentNodeId: "first"};
  assert.throws(
    () => findInheritedCompositionBounds(
      first,
      new Map<string, MgCompositionNodeReference>([[first.nodeId, first], [second.nodeId, second]]),
    ),
    /存在循环/,
  );
});

test("provider instance keys use HTML tag plus group plus optional order", () => {
  assert.equal(provider.instanceKey({htmlTag: "mg-effect", group: "scanline-annotate-focus"}), "mg-effect::scanline-annotate-focus::one");
  assert.equal(provider.instanceKey({htmlTag: "mg-effect", group: "scanline-annotate-focus", order: 2}), "mg-effect::scanline-annotate-focus::02");
  assert.notEqual(
    provider.instanceKey({htmlTag: "mg-effect", group: "scanline-annotate-focus"}),
    provider.instanceKey({htmlTag: "mg-effect", group: "reticle-lock-on"}),
  );
});

test("mg-cutout declares its template-owned minimum source duration", () => {
  const cutout = provider.templates.find((item) => item.htmlTag === "mg-cutout");
  assert.equal(cutout?.minDurationSeconds, 1.5);
  assert.equal(provider.templates.find((item) => item.htmlTag === "mg-effect")?.minDurationSeconds, undefined);
});

test("provider selects only tools needed by HTML and returns opaque runtime payload", () => {
  const tools = provider.getPlanningTools(["mg-effect"]);
  assert.deepEqual(new Set(tools.map((tool) => tool.name)), new Set([
    "create_effect_cue",
    "create_object_drop_effect",
    "create_glass_fracture_effect",
  ]));
  const call = provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_effect_cue",
    arguments: {group: "scanline-annotate-focus", order: null, text: "核心数字", items: [{text: "数字", at: 12.5}]},
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

  assert.throws(() => provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_object_drop_effect",
    arguments: {group: "object-drop", order: null, },
  }), /requires one image/);
  assert.throws(() => provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_glass_fracture_effect",
    arguments: {group: "glass-fracture", order: null, text: "失败", image: "nvidia-eye.svg", items: [{text: "失败", at: 12}]},
  }), /only accepts group, order, crackAt and image/);
  assert.throws(() => provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_glass_fracture_effect",
    arguments: {group: "glass-fracture", order: null, crackAt: 11, image: "nvidia-eye.svg"},
  }), /不能早于 at/);

  const fracture = provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_glass_fracture_effect",
    arguments: {group: "glass-fracture", order: null, crackAt: 13.2, image: "nvidia-eye.svg"},
  });
  assert.equal((fracture.render.spec as {crackAt?: number}).crackAt, 1.2);
  assert.deepEqual(fracture.elementAts, [12, 13.2]);

  const call = provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_object_drop_effect",
    arguments: {group: "object-drop", order: null, impactAt: 13.4, image: "nv1-gpu-reference.jpg"},
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

  const invalid = provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_glass_fracture_effect",
    arguments: {group: "glass-fracture", order: null, image: "nv1-gpu-reference.jpg"},
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
    title: "模型能力",
    xAxis: {label: "维度", categories: ["推理", "代码"]},
    yAxis: {label: "评分", unit: "分"},
    series: [
      {name: "模型 A", data: [{category: "推理", at: 20, value: 87}, {category: "代码", at: 22, value: 91}]},
      {name: "模型 B", data: [{category: "推理", at: 20, value: 82}, {category: "代码", at: 22, value: 89}]},
    ],
  });

  for (const group of ["bar", "line"] as const) {
    const call = provider.resolveCall({timing: {start: 20, end: (20) + 60}, name: "create_multi_series_chart", arguments: argumentsFor(group)});
    assert.equal(call.group, group);
    assert.equal(call.render.group, group);
    assert.equal("chartType" in (call.render.spec as Record<string, unknown>), false);
    assert.equal(provider.isToolAllowed({htmlTag: "multi-series-chart", group, name: "create_multi_series_chart"}), true);
  }
});

test("web-news-focus uses a scene layer and keeps camera geometry provider-owned", () => {
  const descriptor = provider.templates.find((item) => item.htmlTag === "web-news-focus");
  assert.deepEqual(Object.keys(descriptor ?? {}).sort(), ["groups", "htmlTag", "layerRole", "selectionHint"]);
  assert.deepEqual(descriptor?.groups, ["focus"]);
  assert.equal(descriptor?.layerRole, "scene");
  const tools = provider.getPlanningTools(["web-news-focus"]);
  assert.deepEqual(tools.map((tool) => tool.name), ["create_web_news_focus"]);
  assert.match(provider.getTemplatePlanningInstructions(["web-news-focus"]), /DOM Range/);
  assert.match(tools[0].description, /canonical URL/);
  assert.deepEqual(Object.keys((tools[0].parameters as {properties: Record<string, unknown>}).properties), [
    "group", "order", "url", "highlights", "entrance",
  ]);

  const call = provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_web_news_focus",
    arguments: {
      group: "focus",
      order: null,
      url: "https://www.reuters.com/technology/article",
      entrance: "fade",
      highlights: [{text: "真实重点", at: 12}, {text: "第二重点", at: 14.5}],
    },
  });
  assert.equal(call.render.kind, "web-news-focus");
  assert.equal(call.render.canvas, "full");
  assert.equal(call.layerRole, "scene");
  assert.deepEqual(call.elementAts, [12, 12, 14.5]);
  assert.equal((call.render.spec as {highlights: Array<{at: number}>}).highlights[1].at, 2.5);
});

test("web-page-focus is a separate scene tool with unhighlighted focus anchors", () => {
  const descriptor = provider.templates.find((item) => item.htmlTag === "web-page-focus");
  assert.deepEqual(descriptor?.groups, ["focus"]);
  assert.equal(descriptor?.layerRole, "scene");
  const tools = provider.getPlanningTools(["web-page-focus"]);
  assert.deepEqual(tools.map((tool) => tool.name), ["create_web_page_focus"]);
  const call = provider.resolveCall({timing: {start: 12, end: (12) + 60},
    name: "create_web_page_focus",
    arguments: {
      group: "focus", order: null, url: "https://openai.com/index/announcement",
      entrance: "fade", focus: [{text: "Official announcement", at: 12.75}],
    },
  });
  assert.equal(call.render.kind, "web-page-focus");
  assert.equal(call.render.canvas, "full");
  assert.deepEqual(call.elementAts, [12, 12.75]);
});

test("web focus preparation rejects missing snapshots instead of refetching the website", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "web-focus-missing-"));
  try {
    for (const kind of ["news", "page"] as const) {
      const call = provider.resolveCall({timing: {start: 12, end: (12) + 60},
        name: `create_web_${kind}_focus`,
        arguments: {
          group: "focus", order: null, url: "https://www.reuters.com/technology/report", entrance: "fade",
          [kind === "news" ? "highlights" : "focus"]: [{text: "网页重点", at: 12}],
        },
      });
      await assert.rejects(() => provider.prepareRuntimeAssets({
        layers: [{
          id: `web-${kind}`, instance: call.instanceKey, htmlTag: `web-${kind}-focus`,
          group: call.group, layerRole: call.layerRole, startFrame: 0, endFrame: 30,
          durationFrames: 30, timelineOffsetFrames: 0, sourceText: "网页重点", render: call.render,
        }],
        resolveImage: async (source) => source,
        webSnapshotDirectory: directory,
      }), /WEB_(?:NEWS|PAGE)_FOCUS_CAPTURE_FAILED.*找不到网页快照.*search_web/);
    }
  } finally {
    await fs.rm(directory, {recursive: true, force: true});
  }
});
