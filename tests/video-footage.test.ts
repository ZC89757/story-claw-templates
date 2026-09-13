import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {getMgTemplateProvider} from "../src/provider";
import {
  normalizeVideoFootageSource,
  resolveVideoFootageFunctionArgs,
  scanVideoFootageLibrary,
  videoFootageFunctionDefinition,
  type VideoFootageAsset,
} from "../src/video-footage";

const provider = getMgTemplateProvider();
const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
const fixtureSource = path.join(publicRoot, "video-footage", "sources", "__provider-test.mp4");
const fixtureMetadata = path.join(publicRoot, "video-footage", "metadata", "__provider-test.json");

const fakeAsset: VideoFootageAsset = {
  source: "nvidia-history.mp4",
  runtimeSource: "video-footage/sources/nvidia-history.mp4",
  duration: 30,
  subtitles: [{start: 4, end: 8, text: "NVIDIA 发布新产品"}],
  metadataFile: "nvidia-history.json",
  assetVersion: "fixture-version",
};

test("video-footage exposes the minimal Function Calling contract", () => {
  assert.equal(videoFootageFunctionDefinition.name, "use_video_footage");
  assert.deepEqual(Object.keys(videoFootageFunctionDefinition.parameters.properties), [
    "group", "order", "at", "source", "sourceStart", "sourceEnd",
  ]);
  assert.deepEqual(videoFootageFunctionDefinition.parameters.required, [
    "group", "order", "at", "source", "sourceStart", "sourceEnd",
  ]);

  const descriptor = provider.templates.find((item) => item.htmlTag === "video-footage");
  assert.deepEqual(descriptor?.groups, ["full-bleed"]);
  assert.equal(descriptor?.layerRole, "scene");
  assert.deepEqual(provider.getPlanningTools(["video-footage"]).map((tool) => tool.name), ["use_video_footage"]);
});

test("video-footage resolves a listed source and keeps source time separate from episode at", () => {
  const resolved = resolveVideoFootageFunctionArgs({
    group: "full-bleed",
    order: null,
    at: 42.5,
    source: "nvidia-history.mp4",
    sourceStart: 4.25,
    sourceEnd: 11.75,
  }, {resolveSource: () => fakeAsset});

  assert.equal(resolved.at, 42.5);
  assert.deepEqual(resolved.spec, {
    source: "video-footage/sources/nvidia-history.mp4",
    sourceStart: 4.25,
    sourceEnd: 11.75,
    assetVersion: "fixture-version",
  });
});

test("video-footage rejects traversal, invalid ranges and source duration overflow", () => {
  assert.throws(() => normalizeVideoFootageSource("../secret.mp4"), /目录穿越/);
  assert.throws(() => normalizeVideoFootageSource("https://example.com/a.mp4"), /相对路径/);
  assert.throws(() => resolveVideoFootageFunctionArgs({
    group: "full-bleed", order: null, at: 0, source: "nvidia-history.mp4", sourceStart: 8, sourceEnd: 8,
  }, {resolveSource: () => fakeAsset}), /sourceEnd 必须大于/);
  assert.throws(() => resolveVideoFootageFunctionArgs({
    group: "full-bleed", order: null, at: 0, source: "nvidia-history.mp4", sourceStart: 28, sourceEnd: 31,
  }, {resolveSource: () => fakeAsset}), /超过素材时长/);
});

test("Provider scans paired metadata, injects subtitles and resolves an opaque scene layer", (context) => {
  fs.mkdirSync(path.dirname(fixtureSource), {recursive: true});
  fs.mkdirSync(path.dirname(fixtureMetadata), {recursive: true});
  fs.writeFileSync(fixtureSource, "fixture");
  fs.writeFileSync(fixtureMetadata, JSON.stringify({
    source: "__provider-test.mp4",
    duration: 20,
    subtitles: [
      {start: 2.5, end: 5.2, text: "英伟达早期产品"},
      {start: 8, end: 12.4, text: "数据中心开始部署 AI 芯片"},
    ],
  }), "utf8");
  context.after(() => {
    fs.rmSync(fixtureSource, {force: true});
    fs.rmSync(fixtureMetadata, {force: true});
  });

  const library = scanVideoFootageLibrary();
  assert.ok(library.assets.some((asset) => asset.source === "__provider-test.mp4"));
  const tool = provider.getPlanningTools(["video-footage"])[0];
  assert.match(tool.description, /__provider-test\.mp4/);
  assert.match(tool.description, /数据中心开始部署 AI 芯片/);

  const call = provider.resolveCall({
    name: "use_video_footage",
    arguments: {
      group: "full-bleed",
      order: null,
      at: 15,
      source: "__provider-test.mp4",
      sourceStart: 7.5,
      sourceEnd: 13,
    },
  });
  assert.equal(call.htmlTag, "video-footage");
  assert.equal(call.layerRole, "scene");
  assert.equal(call.render.kind, "video-footage");
  assert.equal(call.render.canvas, "full");
  assert.equal((call.render.spec as {source: string}).source, "video-footage/sources/__provider-test.mp4");
});
