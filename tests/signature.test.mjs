import assert from "node:assert/strict";
import { test } from "node:test";
import { initializeSignature } from "../src/scripts/landing.js";

const originalMatchMedia = globalThis.matchMedia;
const originalObserver = globalThis.IntersectionObserver;
function restore() {
  if (originalMatchMedia === undefined) delete globalThis.matchMedia;
  else globalThis.matchMedia = originalMatchMedia;
  if (originalObserver === undefined) delete globalThis.IntersectionObserver;
  else globalThis.IntersectionObserver = originalObserver;
}

test("Signature stays static until first intersection, then stops observing", () => {
  let callback,
    observed,
    disconnected = 0;
  const signature = { dataset: {} };
  try {
    globalThis.matchMedia = () => ({ matches: false });
    globalThis.IntersectionObserver = class {
      constructor(listener, options) {
        callback = listener;
        assert.equal(options.threshold, 0.4);
      }
      observe(target) {
        observed = target;
      }
      disconnect() {
        disconnected += 1;
      }
    };
    initializeSignature(signature);
    assert.equal(observed, signature);
    assert.equal(signature.dataset.lrSignatureRevealed, undefined);
    callback([{ isIntersecting: false }]);
    assert.equal(signature.dataset.lrSignatureRevealed, undefined);
    assert.equal(disconnected, 0);
    callback([{ isIntersecting: true }]);
    assert.equal(signature.dataset.lrSignatureRevealed, "true");
    assert.equal(disconnected, 1, "One reveal disconnects the observer");
  } finally {
    restore();
  }
});

test("Reduced motion keeps the signature static without an observer", () => {
  const signature = { dataset: {} };
  try {
    globalThis.matchMedia = () => ({ matches: true });
    globalThis.IntersectionObserver = class {
      constructor() {
        assert.fail("Reduced motion must not animate");
      }
    };
    initializeSignature(signature);
    assert.deepEqual(signature.dataset, {});
  } finally {
    restore();
  }
});

test("Missing IntersectionObserver preserves the static signature", () => {
  const signature = { dataset: {} };
  try {
    globalThis.matchMedia = () => ({ matches: false });
    delete globalThis.IntersectionObserver;
    assert.doesNotThrow(() => initializeSignature(signature));
    assert.deepEqual(signature.dataset, {});
  } finally {
    restore();
  }
});
