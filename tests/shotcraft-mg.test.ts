import assert from "node:assert/strict";
import test from "node:test";
import {MG_STYLE_CATALOG, mgStylesForTemplate} from "../src/catalog";
import {resolveShowcaseFunctionArgs} from "../src/showcase/schema";
import {resolveMetricFunctionArgs} from "../src/metric/schema";
import {resolveTransitionFunctionArgs} from "../src/transition/schema";
import {resolveRhythmFunctionArgs} from "../src/rhythm/schema";
import {resolveEffectFunctionArgs} from "../src/effect/schema";
import {resolveCameraFunctionArgs} from "../src/camera/schema";
import {numericValue, formatNumeric} from "../src/metric/evaluate";

test("Shotcraft showcase keeps only visible item text and converts absolute times", () => {
  const resolved = resolveShowcaseFunctionArgs({
    group: "card-stack",
    at: 12,
    title: "功能",
    items: [{text: "搜索", at: 12}, {text: "筛选", at: 13.5}],
  });
  assert.deepEqual(resolved.spec.items.map((item) => item.at), [0, 1.5]);
  assert.deepEqual(resolved.spec.items.map((item) => item.text), ["搜索", "筛选"]);
});

test("Shotcraft metric preserves units while exposing numeric motion", () => {
  const resolved = resolveMetricFunctionArgs({
    group: "odometer-digit-roll",
    at: 20,
    title: "完成率",
    points: [{label: "成功", value: "99.8%", at: 21}],
  });
  assert.equal(resolved.spec.points[0].at, 1);
  assert.equal(numericValue("99.8%"), 99.8);
  assert.equal(formatNumeric(12.3, "99.8%"), "12.3%");
});

test("transition and rhythm calls resolve to compact fixed-style specs", () => {
  const transition = resolveTransitionFunctionArgs({group: "clock-wipe", at: 4, text: "下一段"});
  const rhythm = resolveRhythmFunctionArgs({group: "strobe-black-frames", at: 8, text: "重音"});
  assert.deepEqual(transition.spec, {text: "下一段", at: 0});
  assert.deepEqual(rhythm.spec, {text: "重音", at: 0});
});

test("effect and camera calls keep only semantic anchors and localize item times", () => {
  const effect = resolveEffectFunctionArgs({
    group: "scanline-annotate-focus",
    order: null,
    at: 30,
    text: "扫描页面",
    items: [{text: "锁定标题", at: 30.4}, {text: "确认结果", at: 31.2}],
  });
  const camera = resolveCameraFunctionArgs({
    group: "slow-push-in",
    order: null,
    at: 42,
    text: "核心数字",
    items: [{text: "数字", at: 42.5}],
  });
  assert.deepEqual(effect.spec.items?.map((item) => item.at), [0.4, 1.2]);
  assert.deepEqual(camera.spec.items?.map((item) => item.at), [0.5]);
  assert.equal("duration" in effect.spec, false);
  assert.equal("zoom" in camera.spec, false);
});

test("catalog exposes the expanded Shotcraft families with one default each", () => {
  for (const template of ["showcase", "metric", "transition", "rhythm", "effect", "camera"] as const) {
    const entries = mgStylesForTemplate(template);
    assert.ok(entries.length >= 10, template);
    assert.equal(entries.filter((entry) => entry.isDefault).length, 1, template);
  }
  assert.ok(MG_STYLE_CATALOG.some((entry) => entry.template === "title" && entry.style === "brace-expand"));
  assert.ok(MG_STYLE_CATALOG.some((entry) => entry.template === "transition" && entry.style === "whip-pan"));
  assert.ok(MG_STYLE_CATALOG.some((entry) => entry.template === "effect" && entry.style === "scanline-annotate-focus"));
  assert.ok(MG_STYLE_CATALOG.some((entry) => entry.template === "camera" && entry.style === "slow-push-in"));
});
