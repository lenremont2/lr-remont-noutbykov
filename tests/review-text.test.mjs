import assert from "node:assert/strict";
import { initializeReviewText } from "../src/scripts/landing.js";

const text = { scrollHeight: 96 };
const details = { open: false };
const body = {
  dataset: {},
  querySelector: (selector) =>
    selector === ".lr-review__excerpt" ? text : details,
};
let resize;
globalThis.getComputedStyle = () => ({ lineHeight: "24px" });
globalThis.document = {};
globalThis.ResizeObserver = class {
  constructor(callback) {
    resize = callback;
  }
  observe() {}
};
initializeReviewText({ querySelectorAll: () => [body] });
assert.equal(body.dataset.lrTruncated, undefined, "Four lines stay visible");
text.scrollHeight = 120;
resize([{ contentRect: { width: 300 } }]);
assert.equal(body.dataset.lrTruncated, "true", "Five lines are truncated");
details.open = true;
resize([{ contentRect: { width: 250 } }]);
assert.equal(details.open, true, "Resizing preserves expanded text");
text.scrollHeight = 96;
resize([{ contentRect: { width: 500 } }]);
assert.equal(body.dataset.lrTruncated, undefined);
assert.equal(details.open, false, "A short review has no expand control");
console.log("Review text: line threshold and resizing passed.");
