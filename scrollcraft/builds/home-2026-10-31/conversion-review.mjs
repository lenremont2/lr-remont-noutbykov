import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const phase = process.argv[2] || "before";
const out = new URL(`./lab/conversion-v2/${phase}/`, import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [];
try {
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [390, 844],
    [360, 640],
    [768, 1024],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addInitScript(() => {
      Element.prototype.requestPointerLock = () =>
        Promise.reject(new Error("Disabled during verification"));
      Element.prototype.setPointerCapture = () => {};
      Element.prototype.releasePointerCapture = () => {};
      Document.prototype.exitPointerLock = () => {};
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4500/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#hop-landing")?.dataset.lrInitialized ===
        "true",
    );
    await page.evaluate(() => document.fonts.ready);
    for (const id of ["lr-formats", "lr-director"]) {
      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const metrics = await section.evaluate((element) => ({
        height: element.offsetHeight,
        words: [
          ...new Intl.Segmenter("ru", { granularity: "word" }).segment(
            element.innerText,
          ),
        ].filter((part) => part.isWordLike).length,
        actions: element.querySelectorAll("a,button,input:not([type=hidden])")
          .length,
        text: element.innerText,
      }));
      await section.screenshot({
        path: fileURLToPath(new URL(`${width}-${id}.png`, out)),
      });
      results.push({ width, id, ...metrics });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow ${width} ${id}`,
      );
    }
    if (phase === "after") {
      const cards = page.locator("#lr-formats .lr-format");
      assert.equal(await cards.count(), 4);
      for (const format of ["at-home", "mobile-lab", "courier"]) {
        const action = page.locator(`#lr-formats [data-format="${format}"]`);
        await action.focus();
        await page.keyboard.press("Enter");
        assert.equal(
          await page
            .locator("[data-lr-modal=lead] [name=service_format]")
            .inputValue(),
          format,
        );
        await page.keyboard.press("Escape");
        assert.equal(
          await action.evaluate(
            (element) => document.activeElement === element,
          ),
          true,
        );
      }
      await page.locator('#lr-formats a[href="#lr-map-workshops"]').click();
      assert.ok(page.url().endsWith("#lr-map-workshops"));
      await page.locator('[data-source="director"]').click();
      assert.equal(
        await page
          .locator("[data-lr-modal=lead] [name=service_format]")
          .inputValue(),
        "courier",
        "The generic CTA preserves the last chosen repair format",
      );
      assert.equal(
        await page.locator("[data-lr-modal=lead]").isVisible(),
        true,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page
          .locator("[data-source=director]")
          .evaluate((element) => document.activeElement === element),
        true,
      );
      assert.equal(await page.locator("#lr-formats input").count(), 0);
      assert.equal(await page.locator("#lr-formats a").count(), 4);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await fs.writeFile(
    new URL("metrics.json", out),
    JSON.stringify(results, null, 2),
  );
  console.log(
    JSON.stringify(
      results.map(({ text, ...metrics }) => metrics),
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
