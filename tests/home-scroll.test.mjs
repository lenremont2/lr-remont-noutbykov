import assert from "node:assert/strict";
import { initializeHomeScroll } from "../src/scripts/landing.js";

const originals = Object.fromEntries(
  ["window", "matchMedia", "requestAnimationFrame"].map((key) => [
    key,
    globalThis[key],
  ]),
);
try {
  const events = {};
  let nextFrame;
  let positions = [200, 700, 1200, 1700];
  const steps = positions.map((_, index) => ({
    dataset: { stepCaption: `Step ${index}` },
    getBoundingClientRect: () => ({ top: positions[index] }),
  }));
  const photos = positions.map(() => ({ dataset: {} }));
  const caption = { textContent: "" };
  const journey = {
    dataset: {},
    getBoundingClientRect: () => ({ top: 0, bottom: 2000 }),
    querySelector: () => caption,
    querySelectorAll: (selector) =>
      selector === "[data-lr-journey-step]" ? steps : photos,
  };
  globalThis.window = {
    innerHeight: 1000,
    addEventListener: (name, callback) => (events[name] = callback),
  };
  globalThis.matchMedia = () => ({ matches: true, addEventListener() {} });
  globalThis.requestAnimationFrame = (callback) => {
    nextFrame = callback;
    return 1;
  };
  initializeHomeScroll({
    querySelector: (selector) =>
      selector === "[data-lr-repair-journey]" ? journey : null,
  });
  assert.equal(journey.dataset.lrActiveStep, "0");
  positions = [-600, -100, 400, 900];
  events.scroll();
  nextFrame();
  assert.equal(journey.dataset.lrActiveStep, "2");
  assert.equal(caption.textContent, "");
  for (const [index, step] of steps.entries()) {
    assert.equal(step.dataset.lrCurrent, String(index === 2));
    assert.deepEqual(photos[index].dataset, {});
  }
  initializeHomeScroll({ querySelector: () => null });
} finally {
  for (const [key, value] of Object.entries(originals)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
}
console.log("Repair journey updates without the homepage hero: passed.");
