import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [];
try {
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 564, height: 991 },
    { width: 740, height: 360 },
    { width: 1440, height: 900 },
  ]) {
    console.log(`Checking ${viewport.width}×${viewport.height}`);
    const page = await browser.newPage({
      viewport,
      reducedMotion: "reduce",
      isMobile: viewport.width < 1024,
      hasTouch: viewport.width < 1024,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:4322/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#hop-landing")?.dataset.lrInitialized ===
        "true",
      null,
      { timeout: 10000 },
    );
    await page.waitForFunction(
      () =>
        document.querySelector("#hop-landing")?.dataset.lrInitialized ===
        "true",
      null,
      { timeout: 10000 },
    );
    const dialog = page.locator('[data-lr-modal="map"]');
    for (const [format, type, title] of [
      ["at-home", "address", "Выберите адрес для выезда мастера"],
      ["mobile-lab", "address", "Куда приехать мастерской на колёсах?"],
      ["workshop", "workshops", "Выберите мастерскую"],
      ["courier", "address", "Откуда забрать ноутбук?"],
    ]) {
      const trigger = page.locator(
        `[data-lr-map-open][data-format="${format}"]`,
      );
      await trigger.click();
      assert.equal(await dialog.evaluate((el) => el.open), true);
      assert.equal(await page.locator("dialog[open]").count(), 1);
      assert.equal(await dialog.getAttribute("data-format"), format);
      assert.equal(
        await dialog.getAttribute("data-source"),
        `formats:${format}`,
      );
      assert.equal(await dialog.locator("h2").textContent(), title);
      assert.equal(
        await dialog.locator(`[data-lr-map-view="${type}"]`).isVisible(),
        true,
      );
      assert.equal(
        await dialog.locator("[data-lr-map-view]:visible").count(),
        1,
      );
      assert.equal(await page.locator("[data-lr-mobile-bar]").count(), 0);
      assert.equal(
        await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
      );
      const box = await dialog.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= viewport.width);
      assert.ok(box.y >= 0 && box.y + box.height <= viewport.height);
      await page
        .locator('#lr-contact input[name="phone"]')
        .evaluate((el) => el.focus());
      assert.equal(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
        true,
      );
      if (viewport.width === 390 && format === "workshop")
        await page.screenshot({
          path: "artifacts/map-comments-2026-11-02/workshops-modal-390.png",
        });
      if (format === "at-home") {
        await page.keyboard.press("Escape");
      } else if (format === "mobile-lab") {
        await page.mouse.click(2, 2);
      } else {
        await dialog.locator("[data-lr-modal-close]").click();
      }
      await page.waitForFunction(
        () => !document.querySelector('[data-lr-modal="map"]').open,
        null,
        { timeout: 5000 },
      );
      assert.equal(
        await trigger.evaluate((el) => el === document.activeElement),
        true,
      );
    }
    await page.locator("#lr-locations").scrollIntoViewIfNeeded();
    assert.equal(
      await page.locator("#lr-locations [data-lr-map-placeholder]").count(),
      1,
    );
    assert.equal(
      await page
        .locator("#lr-locations details, #lr-locations [data-lr-lead-open]")
        .count(),
      0,
    );
    if (viewport.width === 390)
      await page.screenshot({
        path: "artifacts/map-comments-2026-11-02/locations-390.png",
      });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page
      .locator("[data-lr-lead-open]")
      .first()
      .evaluate((el) => el.click());
    assert.equal(
      await page.locator('[data-lr-modal="lead"]').evaluate((el) => el.open),
      true,
    );
    await page.locator('[data-lr-modal="lead"] .lr-modal__close').click();
    assert.deepEqual(errors, []);
    results.push({
      viewport,
      formats: 4,
      closing: ["Escape", "backdrop", "button"],
      focusRestored: true,
      errors,
    });
    await page.close();
  }
  for (const path of [
    "/remont-noutbukov-acer-spb.htm",
    "/remont-macbook-spb.htm",
    "/noutbuk-ne-vklyuchaetsya.htm",
  ]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const response = await page.goto(`http://localhost:4322${path}`);
    assert.equal(response.status(), 200, path);
    assert.equal(await page.locator("[data-lr-map-open]").count(), 4);
    await page.locator('[data-lr-map-open="workshops"]').click();
    assert.equal(
      await page.locator('[data-lr-modal="map"]').evaluate((el) => el.open),
      true,
    );
    await page.keyboard.press("Escape");
    results.push({ path, mapModal: true });
    await page.close();
  }
  writeFileSync(
    "artifacts/map-comments-2026-11-02/results.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(
    "Map dialogs: five viewports, four formats, three close methods, focus, overflow, lead form and child pages passed.",
  );
} finally {
  await browser.close();
}
