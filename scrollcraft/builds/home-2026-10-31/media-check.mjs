import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addInitScript(() => {
    Element.prototype.requestPointerLock = () =>
      Promise.reject(new Error("Disabled"));
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Document.prototype.exitPointerLock = () => {};
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4500/remont-noutbukov-spb.htm/", {
    waitUntil: "domcontentloaded",
  });
  const video = page.locator("[data-lr-hero-video]");
  await page.waitForFunction(
    () => document.querySelector("[data-lr-hero-video]").readyState >= 2,
  );
  assert.equal(await video.evaluate((element) => element.error), null);
  assert.ok(await video.evaluate((element) => element.videoWidth > 0));
  await page.locator("#lr-process").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector("[data-lr-hero-video]").paused,
  );
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForFunction(
    () => !document.querySelector("[data-lr-hero-video]").paused,
  );
  const state = await video.evaluate((element) => ({
    readyState: element.readyState,
    width: element.videoWidth,
    paused: element.paused,
    error: element.error,
  }));
  const scenes = await page.locator("[data-sc-act]").evaluateAll((elements) =>
    elements.map((element) => ({
      id: element.id,
      height: element.offsetHeight,
    })),
  );
  console.log(
    JSON.stringify(
      { alias: true, media: state, offscreenPauseAndResume: true, scenes },
      null,
      2,
    ),
  );
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: width === 360 ? 640 : 900 });
    for (const id of ["lr-formats", "lr-process"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: fileURLToPath(
          new URL(
            `./lab/functional/release-${width}-${id}.png`,
            import.meta.url,
          ),
        ),
      });
    }
  }
  console.log("Final layout: 360, 768, 1280 px without overflow.");
  await context.close();
} finally {
  await browser.close();
}
