import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const out = new URL("./", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 564, height: 991 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const report = { widths: [], scenarios: [], errors };
const shot = async (name, selector) => {
  const locator = page.locator(selector);
  await locator.locator("img[src]").evaluateAll(async (images) =>
    Promise.all(
      images.map(async (i) => {
        i.loading = "eager";
        try {
          await i.decode();
        } catch {}
      }),
    ),
  );
  await locator.screenshot({
    path: fileURLToPath(new URL(name + ".png", out)),
  });
};
await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.fonts.ready);
assert.equal(
  await page
    .locator("[data-lr-review-prev],[data-lr-review-next],.lr-review__date")
    .count(),
  0,
);
assert.equal(
  await page.locator(".lr-review__header>.lr-review__source").count(),
  26,
);
await shot("reviews-564", "#lr-reviews");
const row = page
  .locator("#lr-prices .lr-price-table tbody:last-child tr")
  .first();
const action = row.locator(".lr-price-row__action");
assert.equal(await action.isVisible(), true);
const work = await action.getAttribute("data-symptom");
await action.click();
assert.equal(
  await page.locator('[data-lr-modal="lead"] [name="symptom"]').inputValue(),
  work,
);
await page.keyboard.press("Escape");
report.scenarios.push("price action visible on touch and work passed to form");
await page.locator("[data-lr-hero-cta] [data-lr-quiz-open]").click();
for (const value of ["standard", "Программы и настройка", "courier"])
  await page
    .locator(`[data-lr-quiz-modal] input[type="radio"][value="${value}"]`)
    .check();
assert.equal(await page.locator("[data-lr-quiz-analysis]").isVisible(), true);
await shot("quiz-analysis", "[data-lr-quiz-modal]");
await page.locator("[data-lr-quiz-analysis]").waitFor({ state: "hidden" });
assert.equal(
  await page.locator("[data-lr-quiz] [data-lr-form]").isVisible(),
  true,
);
assert.equal(
  await page
    .locator('[data-lr-quiz] [name="service_format"][type="hidden"]')
    .inputValue(),
  "courier",
);
await page.locator("[data-lr-quiz-prev]").click();
await page
  .locator('[data-lr-quiz-modal] input[type="radio"][value="courier"]')
  .click();
await page.locator("[data-lr-quiz-finish]").click();
assert.match(
  await page.locator("[data-lr-quiz-progress]").innerText(),
  /4 из 4/,
);
await page.locator("[data-lr-quiz-prev]").click();
await page
  .locator('[data-lr-quiz-modal] input[type="radio"][value="courier"]')
  .click();
await page.locator("[data-lr-quiz-prev]").click();
assert.match(
  await page.locator("[data-lr-quiz-progress]").innerText(),
  /3 из 4/,
);
await page.waitForTimeout(1200);
assert.match(
  await page.locator("[data-lr-quiz-progress]").innerText(),
  /3 из 4/,
);
await page.keyboard.press("Escape");
report.scenarios.push(
  "analysis screen, automatic finish, skip and Back cancellation",
);
for (const width of [360, 564, 603, 1440]) {
  await page.setViewportSize({ width, height: 991 });
  await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    photos: [...document.querySelectorAll("#lr-formats .lr-format__media")].map(
      (e) => ({
        width: e.getBoundingClientRect().width,
        height: e.getBoundingClientRect().height,
      }),
    ),
    tracks: [...document.querySelectorAll("[data-lr-swipe-track]")].map(
      (e) => ({
        width: e.clientWidth,
        scrollWidth: e.scrollWidth,
        scrollbar: getComputedStyle(e).scrollbarWidth,
      }),
    ),
  }));
  assert.equal(dimensions.width, dimensions.scrollWidth);
  if (width < 768)
    assert.ok(
      dimensions.photos.every((p) => p.width > width * 0.75 && p.height >= 200),
    );
  assert.ok(
    dimensions.tracks.every(
      (t) => t.scrollWidth > t.width && t.scrollbar === "none",
    ),
  );
  report.widths.push(dimensions);
  if (width !== 603) continue;
  await shot("formats-603", "#lr-formats");
  await shot("symptoms-603", "#lr-symptoms");
  const track = page.locator("#lr-symptoms [data-lr-swipe-track]");
  await track.focus();
  await page.keyboard.press("ArrowRight");
  assert.ok((await track.evaluate((e) => e.scrollLeft)) > 0);
  await page.keyboard.press("End");
  const end = await track.evaluate((e) => e.scrollLeft);
  assert.ok(end > 500);
  await page.keyboard.press("Home");
  assert.ok((await track.evaluate((e) => e.scrollLeft)) < 2);
  report.scenarios.push("symptom slider keyboard paging and endpoints");
}
await page.setViewportSize({ width: 564, height: 991 });
await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
const brands = page.locator("#lr-manufacturers [data-lr-swipe-track]");
const touchTrack = page.locator("#lr-symptoms [data-lr-swipe-track]");
await touchTrack.scrollIntoViewIfNeeded();
const touchBox = await touchTrack.boundingBox();
const cdp = await context.newCDPSession(page);
const startX = touchBox.x + touchBox.width * 0.8;
const touchY = touchBox.y + touchBox.height * 0.5;
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: startX, y: touchY }],
});
for (let i = 1; i <= 8; i++) {
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: startX - (touchBox.width * 0.65 * i) / 8, y: touchY }],
  });
  await page.waitForTimeout(20);
}
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
await page.waitForTimeout(700);
assert.ok((await touchTrack.evaluate((e) => e.scrollLeft)) > 20);
report.scenarios.push("native touch swipe advances problem cards");
await brands.scrollIntoViewIfNeeded();
await page.waitForTimeout(4700);
const moved = await brands.evaluate((e) => e.scrollLeft);
assert.ok(moved > 20, "Brands advance automatically");
await page.locator("[data-lr-swipe-pause]").click();
const paused = await brands.evaluate((e) => e.scrollLeft);
await page.waitForTimeout(4300);
assert.equal(await brands.evaluate((e) => e.scrollLeft), paused);
await shot("brands-564", "#lr-manufacturers");
report.scenarios.push("brands autoSwipe and explicit pause");
await brands.focus();
await page.keyboard.press("End");
await page.locator("[data-lr-swipe-pause]").click();
await page.waitForTimeout(4700);
assert.ok((await brands.evaluate((e) => e.scrollLeft)) < 2);
await page.locator("[data-lr-swipe-pause]").click();
report.scenarios.push("brands autoplay wraps from the last card to the start");
await page.emulateMedia({ reducedMotion: "reduce" });
await page.reload({ waitUntil: "domcontentloaded" });
await brands.scrollIntoViewIfNeeded();
await page.waitForTimeout(4300);
assert.equal(await brands.evaluate((e) => e.scrollLeft), 0);
assert.equal(await page.locator("[data-lr-swipe-pause]").isVisible(), false);
await brands.focus();
await page.keyboard.press("ArrowRight");
assert.ok((await brands.evaluate((e) => e.scrollLeft)) > 0);
report.scenarios.push(
  "reduced motion disables autoplay and preserves manual paging",
);
const desktop = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
});
desktop.on("pageerror", (e) => errors.push(e.message));
await desktop.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
const desktopRow = desktop
  .locator("#lr-prices .lr-price-table tbody:last-child tr")
  .first();
const desktopAction = desktopRow.locator(".lr-price-row__action");
assert.equal(
  await desktopAction.evaluate((e) => getComputedStyle(e).opacity),
  "0",
);
await desktopRow.hover();
await desktopAction.waitFor({ state: "visible" });
await desktop.waitForTimeout(220);
assert.equal(
  await desktopAction.evaluate((e) => getComputedStyle(e).opacity),
  "1",
);
await desktop
  .locator("#lr-prices")
  .screenshot({ path: fileURLToPath(new URL("prices-hover-1440.png", out)) });
await desktop.mouse.move(0, 0);
await desktopAction.focus();
await desktop.waitForTimeout(220);
assert.equal(
  await desktopAction.evaluate((e) => getComputedStyle(e).opacity),
  "1",
);
report.scenarios.push(
  "desktop price hover and keyboard focus reveal the action",
);
const dragTrack = desktop.locator("#lr-symptoms [data-lr-swipe-track]");
await dragTrack.scrollIntoViewIfNeeded();
const box = await dragTrack.boundingBox();
await desktop.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.5);
await desktop.mouse.down();
await desktop.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, {
  steps: 8,
});
await desktop.mouse.up();
await desktop.waitForTimeout(700);
assert.ok((await dragTrack.evaluate((e) => e.scrollLeft)) > 0);
assert.equal(new URL(desktop.url()).pathname, "/");
report.scenarios.push(
  "mouse drag on category links scrolls without navigation",
);
await dragTrack.focus();
await desktop.keyboard.press("Home");
await dragTrack.locator("a").first().click();
await desktop.waitForURL(/noutbuk-ne-vklyuchaetsya\.htm/);
report.scenarios.push("a single category click keeps normal navigation");
assert.deepEqual(errors, []);
console.log(JSON.stringify(report, null, 2));
await writeFile(
  new URL("report.json", out),
  JSON.stringify(report, null, 2) + "\n",
);
await browser.close();
