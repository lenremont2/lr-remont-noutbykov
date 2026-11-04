import assert from "node:assert/strict";
import { initializeReviewSlider } from "../src/scripts/landing.js";

const events = {};
const classes = new Set();
const calls = [];
let reduced = false;
globalThis.matchMedia = () => ({
  get matches() {
    return reduced;
  },
  addEventListener() {},
});
globalThis.cancelAnimationFrame = () => {};
globalThis.requestAnimationFrame = () => {
  throw new Error("Swipe tracks must use native scrolling");
};
const cards = Array.from({ length: 6 }, (_, index) => ({
  offsetLeft: index * 100,
  offsetWidth: 88,
  dataset: {},
  inert: false,
}));
const track = {
  children: cards,
  dataset: {},
  scrollLeft: 0,
  scrollWidth: 600,
  clientWidth: 300,
  classList: {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
  },
  addEventListener: (type, callback) => {
    events[type] = callback;
  },
  scrollTo(options) {
    calls.push(options);
    this.scrollLeft = Math.max(0, Math.min(300, options.left));
  },
  setPointerCapture(id) {
    this.capture = id;
  },
  hasPointerCapture(id) {
    return this.capture === id;
  },
  releasePointerCapture() {
    this.capture = null;
  },
};
const buttons = {};
initializeReviewSlider({
  hasAttribute: (name) => name === "data-lr-swipe-slider",
  querySelector: (selector) =>
    selector === "[data-lr-swipe-track]"
      ? track
      : selector === "[data-lr-review-next]"
        ? {
            addEventListener: (_, callback) => {
              buttons.next = callback;
            },
          }
        : null,
});
assert.ok(
  cards.every((card) => !card.inert),
  "All carousel links remain available to keyboard and touch",
);
buttons.next();
assert.equal(calls.at(-1).behavior, "smooth");
assert.equal(track.scrollLeft, 300);
events.scrollend();
const settledCalls = calls.length;
events.wheel();
assert.equal(
  calls.length,
  settledCalls,
  "Wheel input does not rewrite native scroll positions",
);
events.keydown({ target: track, key: "Home", preventDefault() {} });
assert.equal(track.scrollLeft, 0);
const link = {};
const target = { closest: (selector) => (selector === "a" ? link : null) };
events.pointerdown({
  pointerType: "mouse",
  button: 0,
  pointerId: 1,
  clientX: 200,
  target,
});
events.pointermove({
  pointerId: 1,
  buttons: 1,
  clientX: 120,
  preventDefault() {},
});
assert.equal(track.scrollLeft, 80, "Dragging follows the pointer one to one");
events.pointerup({ pointerId: 1 });
assert.equal(
  track.scrollLeft,
  80,
  "Releasing does not jump or start a second animation",
);
let suppressed = false;
events.click({
  preventDefault() {
    suppressed = true;
  },
  stopImmediatePropagation() {},
});
assert.equal(suppressed, true, "Dragging a link does not navigate");
events.pointerdown({ pointerType: "touch" });
assert.equal(
  track.scrollLeft,
  80,
  "Touch interruption preserves the current position",
);
reduced = true;
buttons.next();
assert.equal(calls.at(-1).behavior, "instant");
console.log(
  "Swipe carousels: native motion, continuous drag/release, links, keyboard and reduced motion passed.",
);
