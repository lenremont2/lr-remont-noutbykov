import assert from "node:assert/strict";
import { initializeAutoSwipe } from "../src/scripts/landing.js";

const originals = Object.fromEntries(
  ["document", "IntersectionObserver", "setTimeout", "clearTimeout"].map(
    (key) => [key, globalThis[key]],
  ),
);
try {
  const timers = new Map();
  const events = {};
  let timerId = 0,
    intersections,
    advances = 0,
    stops = 0;
  globalThis.setTimeout = (callback, delay) => {
    assert.equal(delay, 4000);
    timers.set(++timerId, callback);
    return timerId;
  };
  globalThis.clearTimeout = (id) => timers.delete(id);
  globalThis.document = {
    hidden: false,
    addEventListener: (name, callback) =>
      (events["document:" + name] = callback),
  };
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      intersections = callback;
    }
    observe() {}
  };
  const track = {
    addEventListener: (name, callback) => (events["track:" + name] = callback),
  };
  const motion = {
    matches: false,
    addEventListener: (name, callback) => (events["motion:" + name] = callback),
  };
  initializeAutoSwipe(
    {
      querySelector: () => track,
    },
    () => advances++,
    () => stops++,
    motion,
  );
  assert.equal(timers.size, 0, "An offscreen slider must stay still");
  intersections([{ isIntersecting: true }]);
  assert.equal(timers.size, 1);
  const [id, tick] = [...timers][0];
  timers.delete(id);
  tick();
  assert.equal(advances, 1);
  assert.equal(timers.size, 1);
  document.hidden = true;
  events["document:visibilitychange"]();
  assert.equal(timers.size, 0);
  document.hidden = false;
  events["document:visibilitychange"]();
  assert.equal(timers.size, 1);
  motion.matches = true;
  events["motion:change"]();
  assert.equal(timers.size, 0);
  motion.matches = false;
  events["motion:change"]();
  assert.equal(timers.size, 1);
  events["track:pointerenter"]({ pointerType: "mouse" });
  assert.equal(timers.size, 0);
  events["track:pointerleave"]({ pointerType: "mouse" });
  assert.equal(timers.size, 1);
  events["track:focusin"]();
  assert.equal(timers.size, 0, "Keyboard use pauses autoplay");
  intersections([{ isIntersecting: false }]);
  assert.equal(timers.size, 0);
  intersections([{ isIntersecting: true }]);
  assert.equal(
    timers.size,
    0,
    "Manual interaction keeps autoplay stopped without a resume button",
  );
  events["track:pointerdown"]();
  events["track:wheel"]();
  assert.equal(timers.size, 0);
  assert.ok(stops > 0);
} finally {
  for (const [key, value] of Object.entries(originals)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
}
