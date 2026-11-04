import assert from "node:assert/strict";
import { initializeHeroVideo } from "../src/scripts/landing.js";

function setup({
  reduced = false,
  blocked = false,
  mediaError = false,
  noSource = false,
  loading = false,
} = {}) {
  let rejectPlayback = blocked;
  let clickPlay;
  let nextFrame;
  const preview = { dataset: {} };
  const button = {
    hidden: true,
    addEventListener(type, handler) {
      assert.equal(type, "click");
      clickPlay = handler;
    },
  };
  let onMotionChange;
  const handlers = {};
  const preference = {
    matches: reduced,
    addEventListener(type, handler) {
      assert.equal(type, "change");
      onMotionChange = handler;
    },
  };
  globalThis.matchMedia = () => preference;
  const video = {
    parentElement: {
      querySelector: (selector) =>
        selector === "[data-lr-hero-play]" ? button : preview,
    },
    dataset: {},
    requestVideoFrameCallback(callback) {
      nextFrame = callback;
    },
    controls: false,
    muted: false,
    playsInline: false,
    plays: 0,
    pauses: 0,
    paused: noSource ? false : true,
    readyState: noSource || loading ? 0 : 4,
    networkState: noSource ? 3 : 1,
    error: mediaError ? { code: 4 } : null,
    loads: 0,
    load() {
      this.error = null;
      this.loads += 1;
      this.networkState = 1;
      this.paused = true;
    },
    addEventListener(type, handler) {
      handlers[type] = handler;
    },
    play() {
      assert.equal(this.muted, true, "Autoplay must be muted before starting");
      assert.equal(this.playsInline, true);
      this.plays += 1;
      this.paused = rejectPlayback;
      if (loading) return new Promise(() => {});
      return rejectPlayback
        ? Promise.reject(new Error("Autoplay blocked"))
        : Promise.resolve();
    },
    pause() {
      this.pauses += 1;
      this.paused = true;
      handlers.pause?.();
    },
  };
  initializeHeroVideo(video);
  return {
    video,
    button,
    preview,
    drawFrame() {
      nextFrame?.();
    },
    retry() {
      rejectPlayback = false;
      clickPlay();
    },
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
  assert.equal(
    playing.preview.dataset.lrLoaded,
    undefined,
    "Keep preview until a video frame is presented",
  );
  assert.equal(playing.button.hidden, true);
  playing.drawFrame();
  assert.equal(playing.preview.dataset.lrLoaded, "true");
  assert.equal(playing.video.dataset.lrPlaying, "true");
  const pending = setup({ loading: true });
  assert.equal(
    pending.button.hidden,
    true,
    "Loading must not flash the play button",
  );
  assert.equal(pending.preview.dataset.lrLoaded, undefined);
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
    blocked.button.hidden,
    false,
    "Blocked autoplay offers manual playback",
  );
  blocked.retry();
  await Promise.resolve();
  assert.equal(
    blocked.button.hidden,
    true,
    "Successful manual playback hides the fallback",
  );
  assert.equal(
    blocked.video.controls,
    false,
    "Blocked autoplay does not enable controls",
  );
  const failedDownload = setup({ mediaError: true });
  assert.equal(
    failedDownload.button.hidden,
    false,
    "An error before initialization still offers retry",
  );
  failedDownload.retry();
  await Promise.resolve();
  assert.equal(failedDownload.video.loads, 1);
  assert.equal(failedDownload.button.hidden, true);
  const failedSource = setup({ noSource: true });
  assert.equal(failedSource.video.error, null);
  assert.equal(failedSource.button.hidden, false);
  failedSource.retry();
  await Promise.resolve();
  assert.equal(failedSource.video.loads, 1);
  assert.equal(failedSource.video.plays, 1);
  assert.equal(failedSource.button.hidden, true);

  globalThis.IntersectionObserver = class {
    constructor() {
      throw new Error("Hero playback must not depend on intersection changes");
    }
  };
  const observed = setup();
  observed.drawFrame();
  assert.equal(observed.video.plays, 1);
  assert.equal(
    observed.video.pauses,
    0,
    "Scrolling must not stop Hero playback",
  );
  observed.video.pause();
  assert.equal(
    observed.button.hidden,
    false,
    "Unexpected pause offers manual recovery",
  );
  observed.retry();
  await Promise.resolve();
  assert.equal(observed.button.hidden, true);
  observed.changeMotion(true);
  assert.equal(observed.video.autoplay, false);
} finally {
  if (originalObserver === undefined) delete globalThis.IntersectionObserver;
  else globalThis.IntersectionObserver = originalObserver;
  if (originalMatchMedia === undefined) delete globalThis.matchMedia;
  else globalThis.matchMedia = originalMatchMedia;
}

console.log(
  "Hero video: muted autoplay, loop and reduced motion without controls passed.",
);
