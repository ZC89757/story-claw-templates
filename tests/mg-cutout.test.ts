import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {mgTemplateProvider} from "../src/provider";
import {MG_CUTOUT_GROUP, mgCutoutRiseFunctionDefinition} from "../src/mg-cutout/schema";
import {evaluateMgCutoutRise, MG_CUTOUT_RISE_DURATION} from "../src/mg-cutout/evaluate";

const call = (source: Record<string, unknown> = {
  mode: "transparent",
  image: "public/era-shift/foreground/jensen-huang.png",
  subject: null,
  references: [],
}) => mgTemplateProvider.resolveCall({timing: {start: 3.4, end: (3.4) + 60},
  name: "create_cutout_rise",
  arguments: {group: MG_CUTOUT_GROUP, order: null, source},
});

const placement = (render: ReturnType<typeof call>["render"]) => ({
  id: "cutout-test",
  instance: "cutout-test",
  htmlTag: "mg-cutout",
  group: MG_CUTOUT_GROUP,
  layerRole: "overlay" as const,
  startFrame: 85,
  endFrame: 235,
  durationFrames: 150,
  timelineOffsetFrames: 0,
  sourceText: "",
  render,
});

test("provider exposes one transparent cutout overlay group", () => {
  const descriptor = mgTemplateProvider.templates.find((item) => item.htmlTag === "mg-cutout");
  assert.ok(descriptor);
  assert.deepEqual(descriptor.groups, [MG_CUTOUT_GROUP]);
  assert.equal(descriptor.layerRole, "overlay");
  assert.equal(mgTemplateProvider.supportsHtmlTag("mg-cutout"), true);
  assert.equal(mgTemplateProvider.supportsGroup("mg-cutout", MG_CUTOUT_GROUP), true);
  assert.equal(mgCutoutRiseFunctionDefinition.name, "create_cutout_rise");
  assert.deepEqual(Object.keys(mgCutoutRiseFunctionDefinition.parameters.properties), ["group", "order", "source"]);
});

test("cutout rises from below with a monotone natural ease-out", () => {
  assert.equal(evaluateMgCutoutRise(-0.1), 0);
  assert.equal(evaluateMgCutoutRise(0), 0);
  assert.equal(evaluateMgCutoutRise(MG_CUTOUT_RISE_DURATION / 2), 0.875);
  assert.equal(evaluateMgCutoutRise(MG_CUTOUT_RISE_DURATION), 1);
  assert.equal(evaluateMgCutoutRise(2), 1);
});

test("already-transparent source is copied without background removal", async () => {
  const resolved = call();
  assert.equal(resolved.htmlTag, "mg-cutout");
  assert.equal(resolved.layerRole, "overlay");
  assert.equal(resolved.at, 3.4);
  assert.deepEqual(resolved.elementAts, [3.4]);
  assert.equal(resolved.render.background, "transparent");
  const sources: string[] = [];
  await mgTemplateProvider.prepareRuntimeAssets({
    layers: [placement(resolved.render)],
    resolveImage: async (source) => { sources.push(source); return "assets/transparent-cutout.png"; },
  });
  assert.deepEqual(sources, ["public/era-shift/foreground/jensen-huang.png"]);
  assert.equal((resolved.render.spec as {image: string; prepared: boolean}).image, "assets/transparent-cutout.png");
  assert.equal((resolved.render.spec as {prepared: boolean}).prepared, true);
});

test("reference generation creates a fixed green plate, removes it, and resolves the alpha image", async () => {
  const resolved = call({
    mode: "generate",
    image: null,
    subject: "一台复古银色相机",
    references: ["https://example.com/camera.jpg"],
  });
  const generated: Array<Record<string, unknown>> = [];
  const cutouts: Array<Record<string, unknown>> = [];
  const resolvedImages: string[] = [];
  await mgTemplateProvider.prepareRuntimeAssets({
    layers: [placement(resolved.render)],
    resolveImage: async (source) => { resolvedImages.push(source); return "assets/camera-cutout.png"; },
    generateImageFromReferences: async (request) => {
      generated.push(request as unknown as Record<string, unknown>);
      return "C:/cache/camera-green.png";
    },
    removeSolidBackground: async (request) => {
      cutouts.push(request as unknown as Record<string, unknown>);
      return "C:/cache/camera-alpha.png";
    },
  });
  assert.equal(generated.length, 1);
  assert.equal(cutouts.length, 1);
  assert.deepEqual(resolvedImages, ["C:/cache/camera-alpha.png"]);
  assert.match(String(generated[0].prompt), /solid chroma green/i);
  assert.match(String(generated[0].prompt), /#00ff00/i);
  assert.deepEqual(generated[0].references, ["https://example.com/camera.jpg"]);
  assert.equal(generated[0].aspectRatio, "2:3");
  assert.equal(cutouts[0].sourcePath, "C:/cache/camera-green.png");
  assert.equal(cutouts[0].backgroundColor, "#00ff00");
  assert.equal((resolved.render.spec as {image: string}).image, "assets/camera-cutout.png");
});

test("existing chroma image requires an absolute local path and the host cutout callback", async () => {
  const sourcePath = path.resolve("green-screen.png");
  const resolved = call({mode: "chroma", image: sourcePath, subject: null, references: []});
  let cutoutPath = "";
  await mgTemplateProvider.prepareRuntimeAssets({
    layers: [placement(resolved.render)],
    resolveImage: async () => "assets/final-alpha.png",
    removeSolidBackground: async (request) => {
      cutoutPath = request.sourcePath;
      return "C:/cache/final-alpha.png";
    },
  });
  assert.equal(cutoutPath, sourcePath);
  await assert.rejects(() => mgTemplateProvider.prepareRuntimeAssets({
    layers: [placement(call({mode: "chroma", image: "green-screen.png", subject: null, references: []}).render)],
    resolveImage: async (source) => source,
    removeSolidBackground: async () => "C:/cache/cutout.png",
  }), /绝对本地文件路径/);
});

test("generated source requires both host image callbacks", async () => {
  const resolved = call({mode: "generate", image: null, subject: "一只橘猫", references: ["https://example.com/cat.jpg"]});
  await assert.rejects(() => mgTemplateProvider.prepareRuntimeAssets({
    layers: [placement(resolved.render)],
    resolveImage: async (source) => source,
    removeSolidBackground: async () => "C:/cache/cutout.png",
  }), /参考图生图能力/);
});
