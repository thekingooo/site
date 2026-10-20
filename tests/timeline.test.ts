import { test } from "node:test";
import assert from "node:assert/strict";
import { sceneState, TAU } from "../src/lib/timeline";

test("five completed states have four full clockwise turns", () => {
  for (let index = 0; index < 5; index++) {
    const state = sceneState(index / 4);
    assert.equal(state.index, index);
    assert.ok(Math.abs(state.rotation + index * TAU) < 1e-10);
    assert.equal(state.explosion < 1e-10, true);
    assert.equal(state.mix, index === 4 ? 1 : 0);
  }
});

test("a complete turn remains continuous through each boundary", () => {
  for (const p of [0.25, 0.5, 0.75]) {
    const before = sceneState(p - 0.000001),
      after = sceneState(p + 0.000001);
    assert.ok(Math.abs(after.rotation - before.rotation) < 0.0001);
    assert.equal(before.index, after.index);
    assert.ok(before.mix > 0.999 && after.mix < 0.001);
  }
});

test("transformation happens while the open face is turned away", () => {
  assert.equal(sceneState(0.25 * 0.3).mix, 0);
  assert.equal(sceneState(0.25 * 0.7).mix, 1);
  assert.ok(Math.abs(sceneState(0.125).mix - 0.5) < 1e-10);
});

test("reverse scrolling restores the exact original state without history", () => {
  const forward = Array.from({ length: 101 }, (_, i) => sceneState(i / 100));
  for (let i = 100; i >= 0; i--)
    assert.deepEqual(sceneState(i / 100), forward[i]);
});

test("reduced motion keeps all five states without forced rotation", () => {
  for (let i = 0; i < 5; i++) {
    const s = sceneState(i / 4, true);
    assert.equal(s.index, i);
    assert.equal(s.rotation, 0);
    assert.equal(s.explosion, 0);
  }
});

test("progress clamps invalid or overscrolled input", () => {
  assert.equal(sceneState(-1).progress, 0);
  assert.equal(sceneState(2).progress, 1);
  assert.equal(sceneState(NaN).progress, 0);
});
