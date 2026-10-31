import assert from "node:assert/strict";
import { initializeHeroVideo } from "../src/scripts/landing.js";

function setup({ reduced = false, blocked = false } = {}) {
  let onMotionChange;
  const preference = {
    matches: reduced,
    addEventListener(type, handler) {
      assert.equal(type, "change");
      onMotionChange = handler;
    },
  };
  globalThis.matchMedia = () => preference;
  const video = {
    controls: false,
    muted: false,
    playsInline: false,
    plays: 0,
    pauses: 0,
    play() {
      assert.equal(this.muted, true, "Autoplay must be muted before starting");
      assert.equal(this.playsInline, true);
      this.plays += 1;
      return blocked
        ? Promise.reject(new Error("Autoplay blocked"))
        : Promise.resolve();
    },
    pause() {
      this.pauses += 1;
    },
  };
  initializeHeroVideo(video);
  return {
    video,
    changeMotion(reduced) {
      preference.matches = reduced;
      onMotionChange();
    },
  };
}

const originalMatchMedia = globalThis.matchMedia;
const originalObserver = globalThis.IntersectionObserver;
try {
  const playing = setup();
  assert.equal(playing.video.plays, 1);
  assert.equal(
    playing.video.controls,
    false,
    "Hero video has controls disabled",
  );
  assert.equal(playing.video.loop, true, "Hero video loops continuously");
  playing.changeMotion(true);
  assert.equal(playing.video.autoplay, false);
  assert.equal(playing.video.pauses, 1);
  playing.changeMotion(false);
  assert.equal(playing.video.plays, 2);

  const reduced = setup({ reduced: true });
  assert.equal(reduced.video.plays, 0);
  assert.equal(
    reduced.video.controls,
    false,
    "Reduced motion does not enable controls",
  );

  const blocked = setup({ blocked: true });
  await Promise.resolve();
  assert.equal(
    blocked.video.controls,
    false,
    "Blocked autoplay does not enable controls",
  );

  let visibility;
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      visibility = callback;
    }
    observe() {}
  };
  const observed = setup();
  visibility([{ isIntersecting: false }]);
  assert.equal(observed.video.autoplay, false, "Offscreen footage pauses");
  assert.equal(observed.video.pauses, 1);
  visibility([{ isIntersecting: true }]);
  assert.equal(observed.video.plays, 2, "Visible footage resumes");
  observed.changeMotion(true);
  visibility([{ isIntersecting: true }]);
  assert.equal(
    observed.video.plays,
    2,
    "Visibility cannot override reduced motion",
  );
} finally {
  if (originalObserver === undefined) delete globalThis.IntersectionObserver;
  else globalThis.IntersectionObserver = originalObserver;
  if (originalMatchMedia === undefined) delete globalThis.matchMedia;
  else globalThis.matchMedia = originalMatchMedia;
}

console.log(
  "Hero video: muted autoplay, loop and reduced motion without controls passed.",
);
