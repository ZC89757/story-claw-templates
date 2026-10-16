import assert from "node:assert/strict";
import test from "node:test";
import {MG_STYLE_CATALOG} from "../src/catalog";
import {getMgTemplateProvider} from "../src/provider";
import {
  resolveScLongtakeFunctionArgs,
  scLongtakeFunctionDefinition,
} from "../src/sc-longtake/schema";

const provider = getMgTemplateProvider();

const longtakeArguments = {
  group: "relay",
  order: null,
  reference_image_state: "generate",
  reference_image_prompt: "A researcher beside a glowing GPU workstation",
  segments: [
    {at: 12, video_prompt: "Begin a slow continuous push toward the workstation."},
    {at: 14.4, video_prompt: "Continue from the supplied tail frame toward the server racks."},
    {at: 16.8, video_prompt: "Continue the same uninterrupted shot into the server room."},
  ],
};

test("sc-longtake exposes the relay Function Calling contract", () => {
  assert.equal(scLongtakeFunctionDefinition.name, "create_sc_longtake");
  assert.deepEqual(Object.keys(scLongtakeFunctionDefinition.parameters.properties), [
    "group", "order", "reference_image_state", "reference_image_path", "reference_image_prompt", "segments",
  ]);
  assert.deepEqual(scLongtakeFunctionDefinition.parameters.required, [
    "group", "order", "reference_image_state", "segments",
  ]);
  assert.deepEqual(provider.getPlanningTools(["sc-longtake"]).map((tool) => tool.name), ["create_sc_longtake"]);
  assert.equal(provider.isToolAllowed({
    htmlTag: "sc-longtake",
    group: "relay",
    name: "create_sc_longtake",
  }), true);
  assert.equal(provider.isToolAllowed({
    htmlTag: "sc-longtake",
    group: "relay",
    name: "create_sc_video",
  }), false);
});

test("sc-longtake keeps absolute segment times and resolves an opaque scene layer", () => {
  const resolved = resolveScLongtakeFunctionArgs(longtakeArguments, {start: 12, end: (12) + 60});
  assert.deepEqual(resolved.spec.segments.map((segment) => segment.at), [12, 14.4, 16.8]);

  const call = provider.resolveCall({timing: {start: 12, end: (12) + 60}, name: "create_sc_longtake", arguments: longtakeArguments});
  assert.equal(call.htmlTag, "sc-longtake");
  assert.equal(call.group, "relay");
  assert.equal(call.order, undefined);
  assert.equal(call.at, 12);
  assert.deepEqual(call.elementAts, [12, 12, 14.4, 16.8]);
  assert.equal(call.instanceKey, "sc-longtake::relay::one");
  assert.equal(call.render.kind, "sc-longtake");
  assert.equal(call.render.group, "relay");
  assert.equal(call.render.layerRole, "scene");
  assert.equal(call.render.background, "#071014");
});

test("sc-longtake requires a valid initial reference and ordered segment chain", () => {
  assert.throws(() => resolveScLongtakeFunctionArgs({
    ...longtakeArguments,
    reference_image_state: "existing",
  }, {start: 12, end: (12) + 60}), /existing 状态必须提供 reference_image_path/);
  assert.throws(() => resolveScLongtakeFunctionArgs({
    ...longtakeArguments,
    segments: [
      {at: 12, video_prompt: "first"},
      {at: 11.9, video_prompt: "second"},
    ],
  }, {start: 12, end: (12) + 60}), /segments\.at 必须严格递增/);
  assert.throws(() => resolveScLongtakeFunctionArgs({
    ...longtakeArguments,
    segments: [{at: 12, video_prompt: "only"}],
  }, {start: 12, end: (12) + 60}), /segments 必须包含 2-8 个连续片段/);
});

test("catalog registers one distinct sc-longtake relay style", () => {
  const entries = MG_STYLE_CATALOG.filter((entry) => entry.template === "sc-longtake");
  assert.deepEqual(entries.map((entry) => ({htmlTag: entry.htmlTag, style: entry.style, name: entry.name})), [
    {htmlTag: "sc-longtake", style: "relay", name: "接力一镜到底"},
  ]);
});
