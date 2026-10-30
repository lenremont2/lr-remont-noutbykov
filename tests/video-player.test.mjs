import assert from "node:assert/strict";
import { test } from "node:test";
import { initializeVideoPlayer } from "../src/scripts/landing.js";

function setup(playResult = () => Promise.resolve()) {
  const videoEvents = new Map();
  const buttonEvents = new Map();
  const video = {
    controls: true,
    focused: false,
    play: playResult,
    focus() {
      this.focused = true;
    },
    addEventListener: (name, listener) => videoEvents.set(name, listener),
  };
  const button = {
    hidden: true,
    disabled: false,
    addEventListener: (name, listener) => buttonEvents.set(name, listener),
  };
  initializeVideoPlayer({
    querySelector: (selector) =>
      selector === "[data-lr-player-video]" ? video : button,
  });
  return {
    video,
    button,
    emit: (name) => videoEvents.get(name)(),
    click: () => buttonEvents.get("click")(),
  };
}

test("Player exposes preview/play and returns native controls after play", async () => {
  let resolvePlay;
  const player = setup(
    () =>
      new Promise((resolve) => {
        resolvePlay = resolve;
      }),
  );
  assert.equal(player.video.controls, false);
  assert.equal(player.button.hidden, false);
  const pending = player.click();
  assert.equal(
    player.button.disabled,
    true,
    "Pending play cannot be submitted twice",
  );
  player.emit("playing");
  assert.equal(player.video.controls, true);
  assert.equal(player.button.hidden, true);
  resolvePlay();
  await pending;
  assert.equal(player.button.disabled, false);
  assert.equal(player.video.focused, true);
});

test("Ended playback restores the preview button", async () => {
  const player = setup();
  await player.click();
  player.emit("ended");
  assert.equal(player.video.controls, false);
  assert.equal(player.button.hidden, false);
  assert.equal(player.button.disabled, false);
});

test("Rejected play and media errors retain native controls", async () => {
  const blocked = setup(() => Promise.reject(new Error("Playback blocked")));
  await assert.doesNotReject(() => blocked.click());
  assert.equal(blocked.video.controls, true);
  assert.equal(blocked.button.hidden, true);
  assert.equal(blocked.button.disabled, false);
  const failed = setup();
  failed.emit("error");
  assert.equal(failed.video.controls, true);
  assert.equal(failed.button.hidden, true);
});

test("Missing video or play button leaves native markup untouched", () => {
  for (const missing of ["[data-lr-player-video]", "[data-lr-player-play]"]) {
    const native = {
      controls: true,
      addEventListener() {
        assert.fail("Incomplete players must not attach handlers");
      },
    };
    assert.doesNotThrow(() =>
      initializeVideoPlayer({
        querySelector: (selector) => (selector === missing ? null : native),
      }),
    );
    assert.equal(native.controls, true);
  }
});
