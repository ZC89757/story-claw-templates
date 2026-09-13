import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {getMgTemplateProvider} from "../src/provider";
import {
  ERA_SHIFT_GROUP,
  eraShiftFunctionDefinition,
  resolveEraShiftFunctionArgs,
} from "../src/era-shift/schema";

const provider = getMgTemplateProvider();

const eraShiftArguments = {
  group: ERA_SHIFT_GROUP,
  order: null,
  at: 12,
  image: "jensen-huang.png",
  switchAt: 14.1,
  startItems: [
    {text: "游戏显卡", logo: "nvidia.svg"},
    {text: "并行计算"},
  ],
  endItems: [
    {text: "OpenAI", logo: "openai.svg"},
    {text: "AI 基础设施"},
  ],
};

test("provider exposes era-shift as a scene template", () => {
  const descriptor = provider.templates.find((item) => item.htmlTag === "era-shift");
  assert.ok(descriptor);
  assert.deepEqual(descriptor.groups, [ERA_SHIFT_GROUP]);
  assert.equal(descriptor.layerRole, "scene");
  assert.equal(provider.supportsHtmlTag("era-shift"), true);
  assert.equal(provider.supportsGroup("era-shift", ERA_SHIFT_GROUP), true);
  assert.equal(provider.supportsGroup("era-shift", "gaming-to-ai"), false);
});

test("era-shift Function Calling exposes the foreground/background contract", () => {
  assert.equal(eraShiftFunctionDefinition.name, "create_era_shift");
  assert.deepEqual(Object.keys(eraShiftFunctionDefinition.parameters.properties), [
    "group", "order", "at", "foreground", "switchAt", "startItems", "endItems",
  ]);
  assert.deepEqual(eraShiftFunctionDefinition.parameters.required, [
    "group", "order", "at", "foreground", "switchAt", "startItems", "endItems",
  ]);
  assert.deepEqual(provider.getPlanningTools(["era-shift"]).map((tool) => tool.name), ["create_era_shift"]);
  const description = provider.getPlanningTools(["era-shift"])[0]?.description ?? "";
  assert.match(description, /foreground/);
  assert.match(description, /openai\.svg/);
  assert.match(description, /foreground\.mode=generate/);
  assert.match(description, /不要输出 assetDir/);
  assert.match(provider.getTemplatePlanningInstructions(["era-shift"]), /search_web/);
  assert.equal(provider.isToolAllowed({
    htmlTag: "era-shift",
    group: ERA_SHIFT_GROUP,
    name: "create_era_shift",
  }), true);
});

test("era-shift converts the absolute switch time to local time", () => {
  const resolved = resolveEraShiftFunctionArgs(eraShiftArguments);
  assert.equal(resolved.spec.image, "jensen-huang.png");
  assert.deepEqual(resolved.spec.foreground, {
    mode: "existing",
    image: "jensen-huang.png",
    person: null,
    references: [],
  });
  assert.equal(resolved.spec.switchAt, 2.1);
  assert.deepEqual(resolved.spec.startItems, eraShiftArguments.startItems);
  assert.deepEqual(resolved.spec.endItems, eraShiftArguments.endItems);

  const call = provider.resolveCall({name: "create_era_shift", arguments: eraShiftArguments});
  assert.equal(call.htmlTag, "era-shift");
  assert.equal(call.group, ERA_SHIFT_GROUP);
  assert.equal(call.at, 12);
  assert.deepEqual(call.elementAts, [12, 14.1]);
  assert.equal(call.instanceKey, `era-shift::${ERA_SHIFT_GROUP}::one`);
  assert.equal(call.render.kind, "era-shift");
  assert.equal(call.render.layerRole, "scene");
});

test("era-shift rejects a switch before the scene root", () => {
  assert.throws(() => resolveEraShiftFunctionArgs({
    ...eraShiftArguments,
    switchAt: 11.9,
  }), /cannot precede scene at/);
});

test("era-shift rejects an unsupported group or extra field", () => {
  assert.throws(() => resolveEraShiftFunctionArgs({
    ...eraShiftArguments,
    group: "gaming-to-ai",
  }), /group must be foreground-with-background/);
  assert.throws(() => resolveEraShiftFunctionArgs({
    ...eraShiftArguments,
    title: "legacy field",
  } as never), /only accepts group, order, at, image, foreground, switchAt, startItems and endItems/);
});

test("era-shift instances use one together tag", () => {
  assert.throws(() => provider.validateAnnotatedInstance({htmlTag: "era-shift", tagCount: 2}), /只能出现一次/);
  assert.doesNotThrow(() => provider.validateAnnotatedInstance({htmlTag: "era-shift", tagCount: 1}));
});

test("era-shift reports malformed arrays without a TypeError", () => {
  assert.throws(() => resolveEraShiftFunctionArgs({
    ...eraShiftArguments,
    startItems: null,
  } as never), /startItems must contain 1-8 items/);
  assert.throws(() => resolveEraShiftFunctionArgs({
    ...eraShiftArguments,
    endItems: [{text: "OpenAI", logo: 42}],
  } as never), /logo must be a non-empty string/);
  assert.throws(() => resolveEraShiftFunctionArgs({
    ...eraShiftArguments,
    startItems: [{text: "GPU", at: 1}],
  } as never), /item only accepts text and logo/);
});

test("era-shift prepares only fixed package assets", async () => {
  const layer = provider.resolveCall({name: "create_era_shift", arguments: eraShiftArguments}).render;
  let resolverCalls = 0;
  await provider.prepareRuntimeAssets({
    layers: [{
      id: "era",
      instance: "era",
      htmlTag: "era-shift",
      group: ERA_SHIFT_GROUP,
      layerRole: "scene",
      startFrame: 0,
      endFrame: 90,
      durationFrames: 90,
      timelineOffsetFrames: 0,
      sourceText: "",
      render: layer,
    }],
    resolveImage: async () => {
      resolverCalls += 1;
      return "unexpected";
    },
  });
  const spec = layer.spec as typeof eraShiftArguments;
  assert.equal(spec.image, "era-shift/foreground/jensen-huang.png");
  assert.equal(spec.startItems[0].logo, "era-shift/logos/nvidia.svg");
  assert.equal(spec.endItems[0].logo, "era-shift/logos/openai.svg");
  assert.equal(resolverCalls, 0);
});

test("era-shift generates and cuts a custom foreground through host callbacks", async () => {
  const layer = provider.resolveCall({
    name: "create_era_shift",
    arguments: {
      group: ERA_SHIFT_GROUP,
      order: null,
      at: 12,
      foreground: {
        mode: "generate",
        image: null,
        person: "Ada Lovelace",
        references: ["https://example.com/ada.jpg"],
      },
      switchAt: 14.1,
      startItems: [{text: "早期计算"}],
      endItems: [{text: "现代计算"}],
    },
  }).render;
  const generated: unknown[] = [];
  const cutouts: unknown[] = [];
  const resolved: string[] = [];
  await provider.prepareRuntimeAssets({
    layers: [{
      id: "era-generated",
      instance: "era-generated",
      htmlTag: "era-shift",
      group: ERA_SHIFT_GROUP,
      layerRole: "scene",
      startFrame: 0,
      endFrame: 90,
      durationFrames: 90,
      timelineOffsetFrames: 0,
      sourceText: "",
      render: layer,
    }],
    resolveImage: async (source) => { resolved.push(source); return "assets/ada-cutout.png"; },
    generateImageFromReferences: async (request) => {
      generated.push(request);
      return "C:/tmp/ada-generated.png";
    },
    removeSolidBackground: async (request) => {
      cutouts.push(request);
      return "C:/tmp/ada-cutout.png";
    },
  });
  const spec = layer.spec as {image: string; foreground: {mode: string; person: string; references: string[]}};
  assert.equal(spec.image, "assets/ada-cutout.png");
  assert.equal(spec.foreground.mode, "generate");
  assert.equal(spec.foreground.person, "Ada Lovelace");
  assert.deepEqual(spec.foreground.references, ["https://example.com/ada.jpg"]);
  assert.equal(generated.length, 1);
  assert.equal(cutouts.length, 1);
  assert.deepEqual(resolved, ["C:/tmp/ada-cutout.png"]);
  const generation = generated[0] as {prompt: string; references: readonly string[]; aspectRatio: string};
  assert.match(generation.prompt, /solid chroma-green/);
  assert.deepEqual(generation.references, ["https://example.com/ada.jpg"]);
  assert.equal(generation.aspectRatio, "2:3");
  assert.equal((cutouts[0] as {backgroundColor: string}).backgroundColor, "#00ff00");
});

test("era-shift rejects generated foregrounds without host generation callbacks", async () => {
  const layer = provider.resolveCall({
    name: "create_era_shift",
    arguments: {
      group: ERA_SHIFT_GROUP,
      order: null,
      at: 12,
      foreground: {mode: "generate", image: null, person: "Ada Lovelace", references: ["https://example.com/ada.jpg"]},
      switchAt: 14.1,
      startItems: [{text: "早期计算"}],
      endItems: [{text: "现代计算"}],
    },
  }).render;
  await assert.rejects(() => provider.prepareRuntimeAssets({
    layers: [{
      id: "era-generated",
      instance: "era-generated",
      htmlTag: "era-shift",
      group: ERA_SHIFT_GROUP,
      layerRole: "scene",
      startFrame: 0,
      endFrame: 90,
      durationFrames: 90,
      timelineOffsetFrames: 0,
      sourceText: "",
      render: layer,
    }],
    resolveImage: async (source) => source,
  }), /需要宿主提供参考图生图和纯色背景抠图能力/);
});

test("era-shift runtime asset copy includes foreground and logo directories", async () => {
  const target = await fs.mkdtemp(path.join(os.tmpdir(), "story-claw-era-shift-"));
  try {
    await provider.copyRuntimeAssets(target);
    await fs.access(path.join(target, "era-shift", "foreground", "jensen-huang.png"));
    await fs.access(path.join(target, "era-shift", "logos", "openai.svg"));
  } finally {
    await fs.rm(target, {recursive: true, force: true});
  }
});

test("era-shift rejects assets outside its fixed directories", async () => {
  const layer = provider.resolveCall({
    name: "create_era_shift",
    arguments: {...eraShiftArguments, image: "../ai-company-logos/nvidia.svg"},
  }).render;
  await assert.rejects(() => provider.prepareRuntimeAssets({
    layers: [{
      id: "era",
      instance: "era",
      htmlTag: "era-shift",
      group: ERA_SHIFT_GROUP,
      layerRole: "scene",
      startFrame: 0,
      endFrame: 90,
      durationFrames: 90,
      timelineOffsetFrames: 0,
      sourceText: "",
      render: layer,
    }],
    resolveImage: async (source) => source,
  }), /不在固定目录/);
});

test("era-shift runtime preparation rejects an invalid group", async () => {
  const layer = provider.resolveCall({name: "create_era_shift", arguments: eraShiftArguments}).render;
  await assert.rejects(() => provider.prepareRuntimeAssets({
    layers: [{
      id: "era",
      instance: "era",
      htmlTag: "era-shift",
      group: ERA_SHIFT_GROUP,
      layerRole: "scene",
      startFrame: 0,
      endFrame: 90,
      durationFrames: 90,
      timelineOffsetFrames: 0,
      sourceText: "",
      render: {...layer, group: "gaming-to-ai"},
    }],
    resolveImage: async (source) => source,
  }), /group must be foreground-with-background/);
});

test("era-shift runtime preparation rejects malformed item data", async () => {
  const layer = provider.resolveCall({name: "create_era_shift", arguments: eraShiftArguments}).render;
  const malformed = {
    ...layer,
    spec: {
      ...(layer.spec as Record<string, unknown>),
      startItems: [{text: ""}],
    },
  };
  await assert.rejects(() => provider.prepareRuntimeAssets({
    layers: [{
      id: "era",
      instance: "era",
      htmlTag: "era-shift",
      group: ERA_SHIFT_GROUP,
      layerRole: "scene",
      startFrame: 0,
      endFrame: 90,
      durationFrames: 90,
      timelineOffsetFrames: 0,
      sourceText: "",
      render: malformed,
    }],
    resolveImage: async (source) => source,
  }), /startItems\[0\]\.text must be a non-empty string/);
});
