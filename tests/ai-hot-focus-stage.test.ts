import test from "node:test";
import assert from "node:assert/strict";
import {
  aiHotFocusStageFunctionDefinition,
  resolveAiHotFocusStageFunctionArgs,
} from "../src/ai-hot-focus-stage/schema";
import {resolveAiHotFocusStageCompositionSlots} from "../src/ai-hot-focus-stage/composition-layout";
import {getMgTemplateProvider} from "../src/provider";

const validArgs = {
  title: "AI热点",
  sub_title: "2026/09/21",
  items: [
    {title: "OpenAI 发布全新推理模型", time: 17.2},
    {title: "多模态交互进入实时生成阶段", time: 22.4},
    {title: "智能体开始接管复杂工作流", time: 27.6},
  ],
};

test("focus stage exposes only three content fields", () => {
  assert.deepEqual(Object.keys(aiHotFocusStageFunctionDefinition.parameters.properties).sort(), ["items", "sub_title", "title"]);
  assert.deepEqual([...aiHotFocusStageFunctionDefinition.parameters.required].sort(), ["items", "sub_title", "title"]);
  assert.match(aiHotFocusStageFunctionDefinition.parameters.properties.items.items.properties.time.description, /switch animation is triggered/);
});

test("focus stage converts absolute item times to local component times", () => {
  const resolved = resolveAiHotFocusStageFunctionArgs(validArgs, {start: 12, end: (12) + 60});
  assert.equal(resolved.group, "focus-stage");
  assert.equal(resolved.at, 12);
  assert.deepEqual(resolved.spec, {
    title: "AI热点",
    subTitle: "2026/09/21",
    items: [
      {title: validArgs.items[0].title, time: 5.2},
      {title: validArgs.items[1].title, time: 10.4},
      {title: validArgs.items[2].title, time: 15.6},
    ],
  });
  assert.equal(resolveAiHotFocusStageFunctionArgs({...validArgs, sub_title: null}, {start: 12, end: (12) + 60}).spec.subTitle, null);
});

test("focus stage exposes readiness slots from its local item times", () => {
  const resolved = resolveAiHotFocusStageFunctionArgs(validArgs, {start: 12, end: (12) + 60});
  assert.deepEqual(resolveAiHotFocusStageCompositionSlots(resolved.spec, 25, 1000), [
    {slotId: "item-1", openFrame: 163, closeFrame: 260},
    {slotId: "item-2", openFrame: 303, closeFrame: 390},
    {slotId: "item-3", openFrame: 433, closeFrame: 1000},
  ]);
  assert.deepEqual(resolveAiHotFocusStageCompositionSlots(resolved.spec, 25, 400), [
    {slotId: "item-1", openFrame: 163, closeFrame: 260},
    {slotId: "item-2", openFrame: 303, closeFrame: 390},
  ]);
  assert.deepEqual(resolveAiHotFocusStageCompositionSlots(resolved.spec, 30, 1200).map(({openFrame}) => openFrame), [
    195, 364, 520,
  ]);
});

test("focus stage rejects invalid timing and expanded parameter surfaces", () => {
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, endTime: 60}, {start: 12, end: (12) + 60}), /extra fields: endTime/);
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, items: [{title: "过早", time: 16.9}]}, {start: 12, end: (12) + 60}), /at least 5 seconds/);
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, items: [validArgs.items[0], {title: "过近", time: 19}]}, {start: 12, end: (12) + 60}), /at least 2.5 seconds/);
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, items: [{...validArgs.items[0], color: "red"}]}, {start: 12, end: (12) + 60}), /item does not accept extra fields: color/);
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, items: Array.from({length: 7}, (_, index) => ({title: `标题${index}`, time: 17.2 + index * 3}))}, {start: 12, end: (12) + 60}), /items must contain 1-6 items/);
});

test("provider registers focus stage as one fixed full-canvas scene", () => {
  const provider = getMgTemplateProvider();
  const descriptor = provider.templates.find((item) => item.htmlTag === "ai-hot-focus-stage");
  assert.deepEqual(descriptor?.groups, ["focus-stage"]);
  assert.equal(descriptor?.layerRole, "scene");
  assert.deepEqual(provider.getPlanningTools(["ai-hot-focus-stage"]).map((tool) => tool.name), ["create_ai_hot_focus_stage"]);

  const call = provider.resolveCall({timing: {start: 12, end: (12) + 60}, name: "create_ai_hot_focus_stage", arguments: validArgs});
  assert.equal(call.htmlTag, "ai-hot-focus-stage");
  assert.equal(call.instanceKey, "ai-hot-focus-stage::focus-stage::one");
  assert.deepEqual(call.elementAts, [12, 17.2, 22.4, 27.6]);
  assert.equal(call.render.kind, "ai-hot-focus-stage");
  assert.equal(call.render.canvas, "full");
  assert.equal(call.render.layerRole, "scene");
  assert.deepEqual(provider.resolveCompositionSlots({
    htmlTag: "ai-hot-focus-stage",
    spec: call.render.spec,
    fps: 25,
    durationFrames: 1000,
  })[0], {slotId: "item-1", openFrame: 163, closeFrame: 260});
  assert.match(provider.getTemplatePlanningInstructions(["ai-hot-focus-stage"]), /整体时间由宿主从标签计算/);
  assert.match(provider.getTemplatePlanningInstructions(["ai-hot-focus-stage"]), /新闻切换动作的触发时间/);
  assert.throws(() => provider.validateAnnotatedInstance({htmlTag: "ai-hot-focus-stage", tagCount: 2}), /只能出现一次/);
});
