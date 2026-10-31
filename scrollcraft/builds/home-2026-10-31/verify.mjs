import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright-core";

// Playwright 1.64.1: the installed types are authoritative; Context7 stops at 1.63.
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const out = new URL("./lab/functional/", import.meta.url);
await fs.mkdir(out, { recursive: true });
const results = [];
const errors = [];
const setup = async (
  width,
  height,
  reducedMotion = "no-preference",
  javaScriptEnabled = true,
) => {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion,
    javaScriptEnabled,
  });
  await context.addInitScript(() => {
    Element.prototype.requestPointerLock = () =>
      Promise.reject(new Error("Disabled in verification"));
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Document.prototype.exitPointerLock = () => {};
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("http://127.0.0.1:4500/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { page, context };
};
const screenshot = async (page, name) =>
  page.screenshot({
    path: new URL(`${name}.png`, out).pathname.replace(/^\/(\w:)/, "$1"),
  });

try {
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [768, 1024],
    [390, 844],
    [360, 640],
  ]) {
    const { page, context } = await setup(width, height);
    await screenshot(page, `${width}-hero`);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("[data-lr-route-choice]").count(), 4);
    assert.equal(
      await page.locator("[data-lr-route-choice]:checked").count(),
      0,
    );
    for (const id of [
      "lr-hero",
      "lr-formats",
      "lr-process",
      "lr-prices",
      "lr-guarantee",
      "lr-contact",
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        dimensions.scroll <= dimensions.width,
        `Overflow: ${width} ${id}`,
      );
      if (["lr-formats", "lr-process", "lr-contact"].includes(id))
        await screenshot(page, `${width}-${id}`);
    }
    const broken = await page
      .locator("img")
      .evaluateAll((images) =>
        images
          .filter((image) => image.complete && !image.naturalWidth)
          .map((image) => image.src),
      );
    assert.deepEqual(broken, []);
    for (const format of ["workshop", "mobile-lab", "at-home", "courier"]) {
      await page.locator(`[data-lr-route-choice][value="${format}"]`).check();
      const route = await page.locator("[data-lr-route-name]").textContent();
      assert.ok(route && route !== "Любой удобный вариант");
      const fields = await page
        .locator("#lr-contact [data-lr-form] [name=service_format]")
        .inputValue();
      assert.equal(fields, format);
      await page.locator('[data-source="repair-journey"]').click();
      assert.equal(
        await page
          .locator("[data-lr-modal=lead] [data-lr-form] [name=service_format]")
          .inputValue(),
        format,
      );
      assert.ok(await page.locator("[data-lr-modal=lead]").isVisible());
      for (let tab = 0; tab < 12; tab++) {
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(() =>
            Boolean(document.activeElement.closest("[data-lr-modal=lead]")),
          ),
          true,
        );
      }
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator("[data-lr-modal=lead]").isVisible(),
        false,
      );
      assert.equal(
        await page.evaluate(() => document.activeElement.dataset.source),
        "repair-journey",
      );
    }
    await page.locator('[data-source="repair-journey"]').click();
    await page
      .locator("[data-lr-modal=lead] [data-lr-form] [data-lr-context-change]")
      .click();
    await page
      .locator("[data-lr-modal=lead] [data-lr-form] [data-lr-format-select]")
      .selectOption("workshop");
    assert.equal(
      await page.locator("[data-lr-route-choice]:checked").inputValue(),
      "workshop",
    );
    await page
      .locator("[data-lr-modal=lead] [data-lr-form] [data-hop-lead-submit]")
      .click();
    assert.ok(
      await page
        .locator("[data-lr-modal=lead] [data-lr-form] [data-lr-phone-error]")
        .textContent(),
    );
    await page.keyboard.press("Escape");
    await page.locator("[data-lr-route-choice]").first().focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.locator("[data-lr-route-choice]:checked").inputValue(),
      "mobile-lab",
    );
    await page.locator("#lr-faq summary").first().focus();
    await page.keyboard.press("Enter");
    assert.ok(
      (await page.locator("#lr-faq details").first().getAttribute("open")) !==
        null,
    );
    if (width >= 768) {
      for (let index = 0; index < 4; index++) {
        await page
          .locator("[data-lr-journey-step]")
          .nth(index)
          .evaluate((step) =>
            scrollTo({
              top:
                scrollY + step.getBoundingClientRect().top - innerHeight * 0.35,
              behavior: "instant",
            }),
          );
        await page.waitForTimeout(500);
        assert.equal(
          await page
            .locator("[data-lr-repair-journey]")
            .getAttribute("data-lr-active-step"),
          String(index),
        );
        await screenshot(page, `${width}-step-${index}`);
      }
    } else {
      assert.equal(
        await page.locator(".lr-repair-journey__inline-photo:visible").count(),
        4,
      );
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(100);
    const before = await page
      .locator(".lr-hero__film")
      .evaluate((el) => getComputedStyle(el).transform);
    await page.evaluate(() => scrollTo({ top: 300, behavior: "instant" }));
    await page.waitForTimeout(100);
    const after = await page
      .locator(".lr-hero__film")
      .evaluate((el) => getComputedStyle(el).transform);
    if (height > 650) assert.notEqual(before, after);
    results.push({
      width,
      height,
      overflow: false,
      fourRoutes: true,
      modalContext: true,
      keyboard: true,
      visualStates: true,
    });
    await context.close();
  }
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    const { page, context } = await setup(width, height, "reduce");
    await screenshot(page, `${width}-reduced`);
    assert.equal(
      await page
        .locator(".lr-hero__film")
        .evaluate((el) => getComputedStyle(el).transform),
      "none",
    );
    assert.equal(
      await page
        .locator("[data-lr-hero-video]")
        .evaluate((video) => video.paused),
      true,
    );
    assert.equal(
      await page
        .locator(".lr-repair-journey__visual")
        .evaluate((el) => getComputedStyle(el).position),
      "static",
    );
    await page.locator("#lr-process").scrollIntoViewIfNeeded();
    await screenshot(page, `${width}-reduced-process`);
    results.push({
      width,
      reducedMotion: true,
      pausedVideo: true,
      staticJourney: true,
    });
    await context.close();
  }
  const { page, context } = await setup(390, 844, "no-preference", false);
  assert.equal(await page.locator("[data-lr-journey-step]").count(), 4);
  assert.equal(
    await page
      .locator("#lr-contact [data-lr-form] [data-hop-lead-submit]")
      .isDisabled(),
    true,
  );
  await page.locator(".lr-hero__route-link").click();
  assert.ok(page.url().endsWith("#lr-formats"));
  await screenshot(page, "390-no-js");
  results.push({
    noJavaScript: true,
    readableSteps: true,
    disabledUnconnectedForm: true,
    anchorNavigation: true,
  });
  await context.close();
  assert.deepEqual(errors, []);
  await fs.writeFile(
    new URL("report.json", out),
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(
    JSON.stringify({ contexts: results.length, results, errors }, null, 2),
  );
} finally {
  await browser.close();
}
