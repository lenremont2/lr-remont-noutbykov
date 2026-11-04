import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const report = [];
try {
  for (const width of [320, 390, 768, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:4322/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#hop-landing")?.dataset.lrInitialized ===
        "true",
    );
    const layouts = [];
    for (const id of ["lr-symptoms", "lr-manufacturers"]) {
      const track = page.locator(`#${id} [data-lr-swipe-track]`);
      await track.scrollIntoViewIfNeeded();
      await track.evaluate((el) =>
        el.scrollTo({ left: 0, behavior: "instant" }),
      );
      const layout = await track.evaluate((el) => {
        const box = el.getBoundingClientRect(),
          card = el.firstElementChild.getBoundingClientRect();
        const container = el.closest(".lr-container").getBoundingClientRect();
        return {
          x: box.x,
          width: box.width,
          cardX: card.x,
          contentX: container.x,
          end: el.scrollWidth - el.clientWidth,
          inert: [...el.children].some((card) => card.inert),
          snap: getComputedStyle(el).scrollSnapType,
        };
      });
      assert.ok(
        Math.abs(layout.x) < 1 && Math.abs(layout.width - width) < 1,
        JSON.stringify({ id, width, layout }),
      );
      assert.ok(
        Math.abs(layout.cardX - layout.contentX) < 1,
        "First card aligns with content",
      );
      assert.equal(layout.inert, false);
      assert.equal(layout.snap, "none");
      assert.ok(layout.end > 0);
      const box = await track.boundingBox();
      await page.mouse.move(
        Math.min(width - 40, layout.contentX + 180),
        box.y + 60,
      );
      await page.mouse.down();
      await page.mouse.move(
        Math.min(width - 40, layout.contentX + 180) - 100,
        box.y + 60,
        { steps: 10 },
      );
      const held = await track.evaluate((el) => el.scrollLeft);
      assert.ok(
        Math.abs(held - 100) < 2,
        "Mouse drag follows pointer without snapping",
      );
      await page.mouse.up();
      const released = await track.evaluate((el) => el.scrollLeft);
      await page.waitForTimeout(400);
      assert.ok(
        Math.abs((await track.evaluate((el) => el.scrollLeft)) - released) < 1,
        "No second animation after releasing mouse",
      );
      await track.focus();
      await page.keyboard.press("End");
      const end = await track.evaluate((el) => {
        const last = el.lastElementChild.getBoundingClientRect();
        return {
          left: el.scrollLeft,
          end: el.scrollWidth - el.clientWidth,
          right: last.right,
          contentRight: el.closest(".lr-container").getBoundingClientRect()
            .right,
        };
      });
      assert.ok(Math.abs(end.left - end.end) < 1);
      assert.ok(
        Math.abs(end.right - end.contentRight) < 2,
        "Last card aligns with content at finite end",
      );
      await page.keyboard.press("Home");
      assert.equal(await track.evaluate((el) => el.scrollLeft), 0);
      await track.evaluate((el) =>
        el.scrollTo({ left: 100, behavior: "instant" }),
      );
      await track.evaluate((el) => el.blur());
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `artifacts/carousels-2026-11-02/${id}-${width}.png`,
        });
      layouts.push({ id, layout, drag: held, released });
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    assert.deepEqual(errors, []);
    report.push({ width, layouts, errors });
    console.log(`Layout, mouse and keyboard passed at ${width}px`);
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      document.querySelector("#hop-landing")?.dataset.lrInitialized === "true",
  );
  const session = await page.context().newCDPSession(page);
  for (const id of ["lr-symptoms", "lr-manufacturers"]) {
    const track = page.locator(`#${id} [data-lr-swipe-track]`);
    await track.scrollIntoViewIfNeeded();
    const box = await track.boundingBox();
    const y = Math.min(700, box.y + 60);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 320, y }],
    });
    const samples = [];
    for (let i = 1; i <= 8; i++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 320 - i * 22, y }],
      });
      await page.waitForTimeout(20);
      samples.push(await track.evaluate((el) => el.scrollLeft));
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    samples.push(
      ...(await track.evaluate(
        (el) =>
          new Promise((resolve) => {
            const frames = [];
            const tick = () => {
              frames.push(el.scrollLeft);
              if (frames.length < 40) requestAnimationFrame(tick);
              else resolve(frames);
            };
            requestAnimationFrame(tick);
          }),
      )),
    );
    assert.ok(samples.at(-1) > 100, "Native touch gesture scrolls");
    assert.ok(
      samples.every((value, i) => !i || value >= samples[i - 1] - 1),
      "Native gesture has no backwards jump or snap",
    );
    report.push({ id, nativeTouch: samples });
  }
  const auto = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await auto.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
  await auto.waitForFunction(
    () =>
      document.querySelector("#hop-landing")?.dataset.lrInitialized === "true",
  );
  await auto.locator("#lr-manufacturer-track").scrollIntoViewIfNeeded();
  const autoplayFrames = async () =>
    auto.locator("#lr-manufacturer-track").evaluate(
      (el) =>
        new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Autoplay did not start")),
            6500,
          );
          el.addEventListener(
            "scroll",
            () => {
              clearTimeout(timeout);
              const frames = [];
              const tick = () => {
                frames.push(el.scrollLeft);
                if (frames.length < 45) requestAnimationFrame(tick);
                else resolve(frames);
              };
              requestAnimationFrame(tick);
            },
            { once: true },
          );
        }),
    );
  const forward = await autoplayFrames();
  assert.ok(
    forward.some((left) => left > 0 && left < 142),
    "Autoplay has intermediate native animation frames",
  );
  await auto
    .locator("#lr-manufacturer-track")
    .evaluate((el) =>
      el.scrollTo({ left: el.scrollWidth, behavior: "instant" }),
    );
  await auto.waitForTimeout(100);
  const returning = await autoplayFrames();
  assert.ok(
    returning.some((left) => left > 0 && left < returning[0] - 2),
    "Return from finite end animates without teleporting",
  );
  assert.ok(returning.every((value, i) => !i || value <= returning[i - 1] + 1));
  assert.equal(
    await auto.locator("#lr-manufacturer-track > li").count(),
    10,
    "No cloned or appended cards",
  );
  report.push({ autoplay: forward, returnFromEnd: returning });
  await auto.close();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#lr-manufacturers").scrollIntoViewIfNeeded();
  assert.equal(await page.locator("[data-lr-swipe-pause]").count(), 0);
  await page.locator("#lr-manufacturer-track").focus();
  await page.keyboard.press("Home");
  await page.locator("#lr-manufacturer-track a").first().click();
  await page.waitForURL("**/remont-noutbukov-acer-spb.htm");
  report.push({ reducedMotion: true, normalLinkNavigation: true });
  await page.close();
  writeFileSync(
    "artifacts/carousels-2026-11-02/results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
