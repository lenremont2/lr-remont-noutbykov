import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reviews = JSON.parse(
  readFileSync(new URL("../src/data/reviews.json", import.meta.url), "utf8"),
);
const html = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const section = html.match(/<section id="lr-reviews"[\s\S]*?<\/section>/)?.[0];

assert.ok(section, "Reviews section must be built");
assert.equal(reviews.items.length, 24);
assert.equal(new Set(reviews.items.map((review) => review.name)).size, 24);
assert.equal(new Set(reviews.items.map((review) => review.avatar)).size, 24);
assert.equal((section.match(/<article class="lr-review">/g) || []).length, 24);
assert.equal((section.match(/Оценка 4 из 5/g) || []).length, 1);
assert.equal((section.match(/Оценка 5 из 5/g) || []).length, 23);
assert.match(section, /data-lr-review-track/);
assert.match(section, /aria-roledescription="карусель"/);
assert.match(section, /aria-controls="lr-review-track"/);
assert.doesNotMatch(section, /Показать ещё|lr-reviews__more/);

for (const review of reviews.items) {
  assert.ok(
    Number.isInteger(review.rating) && review.rating >= 4 && review.rating <= 5,
    review.name,
  );
  assert.ok(
    review.text.trim() && review.date.trim() && review.avatar.trim(),
    review.name,
  );
  const source = reviews.sources[review.source];
  assert.ok(source, `Missing source for ${review.name}`);
  assert.equal(new URL(source.url).protocol, "https:");
  assert.ok(
    section.includes(review.name) &&
      section.includes(review.text) &&
      section.includes(review.avatar),
    review.name,
  );
}
console.log("24 sourced laptop reviews with accessible ratings: passed.");

const { initializeReviewSlider } = await import("../src/scripts/landing.js");
const handlers = new Map();
const trackHandlers = new Map();
let step = 340;
let reduceMotion = true;
const motionHandlers = new Map();
globalThis.matchMedia = () => ({
  get matches() {
    return reduceMotion;
  },
  addEventListener: (type, listener) => motionHandlers.set(type, listener),
});
let frameId = 0;
const animationFrames = new Map();
globalThis.requestAnimationFrame = (callback) => {
  animationFrames.set(++frameId, callback);
  return frameId;
};
globalThis.cancelAnimationFrame = (id) => animationFrames.delete(id);
const finishAnimation = () => {
  const [id, callback] = animationFrames.entries().next().value;
  animationFrames.delete(id);
  callback(performance.now() + 600);
};
const cards = Array.from({ length: 24 }, (_, index) => ({
  dataset: {},
  inert: false,
  get offsetLeft() {
    return index * step;
  },
}));
const previous = {
  disabled: false,
  addEventListener: (type, listener) =>
    handlers.set("previous:" + type, listener),
};
const next = {
  disabled: false,
  addEventListener: (type, listener) => handlers.set("next:" + type, listener),
};
const position = { textContent: "" };
const controls = { hidden: true };
const track = {
  dataset: {},
  captured: null,
  setPointerCapture(id) {
    this.captured = id;
  },
  hasPointerCapture(id) {
    return this.captured === id;
  },
  releasePointerCapture() {
    this.captured = null;
  },
  children: cards,
  clientWidth: 1000,
  get scrollWidth() {
    return cards.length * step - 20;
  },
  scrollLeft: 0,
  addEventListener: (type, listener) => trackHandlers.set(type, listener),
  scrollTo({ left }) {
    this.scrollLeft = Math.min(
      Math.max(0, left),
      this.scrollWidth - this.clientWidth,
    );
    trackHandlers.get("scroll")?.();
  },
};
const elements = {
  "[data-lr-review-track]": track,
  "[data-lr-review-frame]": {
    get clientWidth() {
      return track.clientWidth + 32;
    },
  },
  "[data-lr-review-prev]": previous,
  "[data-lr-review-next]": next,
  "[data-lr-review-position]": position,
  "[data-lr-review-controls]": controls,
};
initializeReviewSlider({ querySelector: (selector) => elements[selector] });
assert.equal(controls.hidden, false);
assert.equal(previous.disabled, true);
assert.equal(position.textContent, "1–3 / 24");
handlers.get("next:click")();
assert.equal(track.scrollLeft, 1020);
assert.equal(position.textContent, "4–6 / 24");
handlers.get("previous:click")();
assert.equal(track.scrollLeft, 0);
const press = (key, target = track) => {
  let prevented = false;
  trackHandlers.get("keydown")({
    key,
    target,
    preventDefault: () => {
      prevented = true;
    },
  });
  return prevented;
};
assert.equal(press("End"), true);
assert.equal(next.disabled, true);
assert.equal(position.textContent, "22–24 / 24");
assert.equal(press("Home"), true);
assert.equal(previous.disabled, true);
assert.equal(
  press("ArrowRight", {}),
  false,
  "Links retain their keyboard behavior",
);
step = 360;
track.clientWidth = 340;
assert.equal(press("ArrowRight"), true);
assert.equal(position.textContent, "2–2 / 24");
assert.equal(press("ArrowLeft"), true);
assert.equal(previous.disabled, true);
step = 340;
track.clientWidth = 660;
handlers.get("next:click")();
assert.equal(position.textContent, "3–4 / 24");
console.log(
  "Review slider: paging, endpoints, mobile, tablet and keyboard passed.",
);

assert.equal(cards[2].inert, false);
assert.equal(cards[0].inert, true);
track.clientWidth = 1000;
press("Home");
reduceMotion = false;
handlers.get("next:click")();
assert.equal(track.dataset.lrAnimating, "true");
assert.equal(animationFrames.size, 1);
handlers.get("next:click")();
assert.equal(
  animationFrames.size,
  1,
  "A repeated click replaces the running animation",
);
finishAnimation();
assert.equal(position.textContent, "7–9 / 24");
assert.equal(track.dataset.lrAnimating, undefined);
assert.equal(cards[6].dataset.lrReviewActive, "true");
assert.equal(cards[5].inert, true);
handlers.get("next:click")();
trackHandlers.get("pointerdown")({ pointerType: "touch" });
assert.equal(animationFrames.size, 0, "Swiping cancels the button animation");
handlers.get("next:click")();
reduceMotion = true;
motionHandlers.get("change")();
assert.equal(animationFrames.size, 0);
assert.equal(position.textContent, "10–12 / 24");
console.log(
  "Review motion: interrupted and repeated transitions, active cards and reduced motion passed.",
);
const pointer = (overrides = {}) => ({
  pointerType: "mouse",
  button: 0,
  buttons: 1,
  pointerId: 7,
  clientX: 600,
  target: { closest: () => null },
  preventDefault() {},
  ...overrides,
});
press("Home");
trackHandlers.get("pointerdown")(pointer());
assert.equal(track.dataset.lrDragging, "true");
assert.equal(track.captured, 7);
trackHandlers.get("pointermove")(pointer({ clientX: 180 }));
assert.equal(track.scrollLeft, 420, "The row follows the held mouse");
trackHandlers.get("pointerup")(pointer({ clientX: 180, buttons: 0 }));
assert.equal(track.scrollLeft, 340, "Release settles onto the nearest card");
assert.equal(track.dataset.lrDragging, undefined);
assert.equal(track.captured, null);
trackHandlers.get("pointerdown")(pointer({ pointerType: "touch" }));
assert.equal(
  track.dataset.lrDragging,
  undefined,
  "Touch keeps native scrolling",
);
trackHandlers.get("pointerdown")(pointer({ target: { closest: () => ({}) } }));
assert.equal(
  track.dataset.lrDragging,
  undefined,
  "Source links remain clickable",
);
trackHandlers.get("pointerdown")(pointer({ button: 2 }));
assert.equal(track.dataset.lrDragging, undefined);
trackHandlers.get("pointerdown")(pointer());
trackHandlers.get("pointermove")(pointer({ clientX: 980 }));
trackHandlers.get("pointercancel")(pointer());
assert.equal(track.scrollLeft, 0);
assert.equal(track.dataset.lrDragging, undefined);
assert.equal(track.captured, null);
console.log(
  "Review drag: held mouse, snapping, cancellation, native touch and source links passed.",
);
