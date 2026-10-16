import test from "node:test";
import assert from "node:assert/strict";
import {
  aiHotOpeningFunctionDefinition,
  resolveAiHotOpeningFunctionArgs,
} from "../src/ai-hot-opening/schema";
import {layoutAiHotOpeningItems} from "../src/ai-hot-opening/layout";
import {getMgTemplateProvider} from "../src/provider";

const validArgs = {
  title: "AI热点",
  sub_title: "2026/09/21",
  items: [
    "模型能力迎来升级",
    "多模态交互持续演进",
    "智能体进入真实业务",
    "具身智能热度上升",
    "开源生态加速发展",
    "芯片厂商加码 AI 算力",
  ],
};

test("ai hot opening exposes only the requested content fields", () => {
  assert.deepEqual(
    Object.keys(aiHotOpeningFunctionDefinition.parameters.properties).sort(),
    ["items", "sub_title", "title"],
  );
  assert.deepEqual(
    [...aiHotOpeningFunctionDefinition.parameters.required].sort(),
    ["items", "sub_title", "title"],
  );
});

test("ai hot opening resolves absolute times into one fixed visual group", () => {
  const resolved = resolveAiHotOpeningFunctionArgs(validArgs, {start: 12.5, end: 22.5});
  assert.equal(resolved.group, "color-orb");
  assert.equal(resolved.order, undefined);
  assert.equal(resolved.at, 12.5);
  assert.deepEqual(resolved.spec, {
    title: "AI热点",
    subTitle: "2026/09/21",
    items: validArgs.items,
    durationSeconds: 10,
  });

  const noSubtitle = resolveAiHotOpeningFunctionArgs({...validArgs, sub_title: "   "}, {start: 12.5, end: 22.5});
  assert.equal(noSubtitle.spec.subTitle, null);
});

test("ai hot opening rejects short, crowded or expanded calls", () => {
  assert.throws(
    () => resolveAiHotOpeningFunctionArgs({...validArgs, }, {start: 12.5, end: 19.49}),
    /host window of at least 7 seconds/,
  );
  assert.throws(
    () => resolveAiHotOpeningFunctionArgs({...validArgs, items: [...validArgs.items, "第七条"]}, {start: 12.5, end: 22.5}),
    /items must contain 1-6 headlines/,
  );
  assert.throws(
    () => resolveAiHotOpeningFunctionArgs({...validArgs, group: "color-orb"}, {start: 12.5, end: 22.5}),
    /does not accept extra fields: group/,
  );
});

test("six opening items are balanced around the center safe area", () => {
  const layout = layoutAiHotOpeningItems(validArgs.items);
  assert.equal(layout.length, 6);
  assert.equal(layout.filter((item) => item.side === "left").length, 3);
  assert.equal(layout.filter((item) => item.side === "right").length, 3);
  for (const item of layout) {
    assert.ok(item.left >= 40);
    assert.ok(item.left + item.width <= 1880);
    assert.ok(item.top >= 110 && item.top <= 850);
    if (item.side === "left") assert.ok(item.left + item.width < 780);
    else assert.ok(item.left > 1140);
  }
});

test("provider registers the opening as one fixed full-screen overlay", () => {
  const provider = getMgTemplateProvider();
  const descriptor = provider.templates.find((item) => item.htmlTag === "ai-hot-opening");
  assert.deepEqual(descriptor?.groups, ["color-orb"]);
  assert.equal(descriptor?.layerRole, "overlay");

  const tools = provider.getPlanningTools(["ai-hot-opening"]);
  assert.deepEqual(tools.map((tool) => tool.name), ["create_ai_hot_opening"]);
  const call = provider.resolveCall({timing: {start: 12.5, end: 22.5}, name: "create_ai_hot_opening", arguments: validArgs});
  assert.equal(call.htmlTag, "ai-hot-opening");
  assert.equal(call.group, "color-orb");
  assert.equal(call.instanceKey, "ai-hot-opening::color-orb::one");
  assert.deepEqual(call.elementAts, [12.5]);
  assert.equal(call.render.kind, "ai-hot-opening");
  assert.equal(call.render.canvas, "full");
  assert.equal(call.render.layerRole, "overlay");
  assert.match(provider.getTemplatePlanningInstructions(["ai-hot-opening"]), /标签窗口必须至少为 7 秒/);
  assert.throws(
    () => provider.validateAnnotatedInstance({htmlTag: "ai-hot-opening", tagCount: 2}),
    /只能出现一次/,
  );
});
