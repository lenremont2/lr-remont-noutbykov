import assert from "node:assert/strict";
import { initializePhotoLightbox } from "../src/scripts/landing.js";

const originalFactory = globalThis.GLightbox;
const originalMatchMedia = globalThis.matchMedia;
try {
  let handler;
  let close;
  let options;
  let opened = 0;
  let destroyed = 0;
  let focused = 0;
  const link = {
    href: "/media/photo.jpg",
    querySelector: () => ({ alt: "Фото" }),
    focus: () => focused++,
  };
  const root = {
    dataset: {},
    querySelector: () => link,
    addEventListener: (type, callback) => {
      assert.equal(handler, undefined);
      handler = callback;
    },
  };
  globalThis.matchMedia = () => ({ matches: true });
  globalThis.GLightbox = (config) => {
    options = config;
    return {
      on: (name, callback) => {
        assert.equal(name, "close");
        close = callback;
      },
      open: () => opened++,
      destroy: () => destroyed++,
    };
  };
  initializePhotoLightbox(root);
  initializePhotoLightbox(root);
  let prevented = 0;
  const event = {
    target: { closest: () => link },
    preventDefault: () => prevented++,
  };
  handler(event);
  assert.equal(opened, 1);
  assert.equal(prevented, 1);
  assert.deepEqual(options.elements, [
    { href: link.href, type: "image", alt: "Фото", title: "", description: "" },
  ]);
  assert.equal(options.openEffect, "none");
  close();
  assert.equal(destroyed, 1);
  assert.equal(focused, 1);
  handler({ ...event, ctrlKey: true });
  globalThis.GLightbox = undefined;
  handler(event);
  assert.equal(
    prevented,
    1,
    "Modified clicks and CDN failure preserve native links",
  );
} finally {
  globalThis.GLightbox = originalFactory;
  globalThis.matchMedia = originalMatchMedia;
}
