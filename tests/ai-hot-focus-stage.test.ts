import test from "node:test";
import assert from "node:assert/strict";
import {
  aiHotFocusStageFunctionDefinition,
  resolveAiHotFocusStageFunctionArgs,
} from "../src/ai-hot-focus-stage/schema";
import {getMgTemplateProvider} from "../src/provider";

const validArgs = {
  at: 12,
  title: "AI热点",
  sub_title: "2026/09/21",
  items: [
    {title: "OpenAI 发布全新推理模型", time: 17.2},
    {title: "多模态交互进入实时生成阶段", time: 22.4},
    {title: "智能体开始接管复杂工作流", time: 27.6},
  ],
};

test("focus stage exposes only four content and timing fields", () => {
  assert.deepEqual(Object.keys(aiHotFocusStageFunctionDefinition.parameters.properties).sort(), ["at", "items", "sub_title", "title"]);
  assert.deepEqual([...aiHotFocusStageFunctionDefinition.parameters.required].sort(), ["at", "items", "sub_title", "title"]);
});

test("focus stage converts absolute item times to local component times", () => {
  const resolved = resolveAiHotFocusStageFunctionArgs(validArgs);
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
  assert.equal(resolveAiHotFocusStageFunctionArgs({...validArgs, sub_title: null}).spec.subTitle, null);
});

test("focus stage rejects invalid timing and expanded parameter surfaces", () => {
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, endTime: 60}), /extra fields: endTime/);
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, items: [{title: "过早", time: 16.9}]}), /at least 5 seconds/);
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, items: [validArgs.items[0], {title: "过近", time: 19}]}), /at least 2.5 seconds/);
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, items: [{...validArgs.items[0], color: "red"}]}), /item does not accept extra fields: color/);
  assert.throws(() => resolveAiHotFocusStageFunctionArgs({...validArgs, items: Array.from({length: 7}, (_, index) => ({title: `标题${index}`, time: 17.2 + index * 3}))}), /items must contain 1-6 items/);
});

test("provider registers focus stage as one fixed full-canvas scene", () => {
  const provider = getMgTemplateProvider();
  const descriptor = provider.templates.find((item) => item.htmlTag === "ai-hot-focus-stage");
  assert.deepEqual(descriptor?.groups, ["focus-stage"]);
  assert.equal(descriptor?.layerRole, "scene");
  assert.deepEqual(provider.getPlanningTools(["ai-hot-focus-stage"]).map((tool) => tool.name), ["create_ai_hot_focus_stage"]);

  const call = provider.resolveCall({name: "create_ai_hot_focus_stage", arguments: validArgs});
  assert.equal(call.htmlTag, "ai-hot-focus-stage");
  assert.equal(call.instanceKey, "ai-hot-focus-stage::focus-stage::one");
  assert.deepEqual(call.elementAts, [12, 17.2, 22.4, 27.6]);
  assert.equal(call.render.kind, "ai-hot-focus-stage");
  assert.equal(call.render.canvas, "full");
  assert.equal(call.render.layerRole, "scene");
  assert.match(provider.getTemplatePlanningInstructions(["ai-hot-focus-stage"]), /不要传 endTime/);
  assert.throws(() => provider.validateAnnotatedInstance({htmlTag: "ai-hot-focus-stage", tagCount: 2}), /只能出现一次/);
});
