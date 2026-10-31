import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const out = new URL("./lab/composition-v3/", import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [];
try {
  for (const [width, height, reduced = false] of [
    [1440, 900],
    [1280, 800],
    [768, 1024],
    [390, 844],
    [360, 640],
    [1440, 900, true],
    [390, 844, true],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
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
    for (const id of ["lr-workshop-gallery", "lr-director"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(950);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow ${width} ${id}`,
      );
      await page.locator(`#${id}`).screenshot({
        path: fileURLToPath(
          new URL(`${width}${reduced ? "-reduced" : ""}-${id}.png`, out),
        ),
      });
    }
    const gallery = await page
      .locator(".lr-workshop-gallery__item")
      .evaluateAll((items) =>
        items.map((item) => {
          const rect = item.getBoundingClientRect();
          const caption = item.querySelector("figcaption");
          const text = caption.getBoundingClientRect();
          const photo = item.querySelector("img");
          return {
            width: rect.width,
            height: rect.height,
            captionInside:
              text.left >= rect.left &&
              text.right <= rect.right + 1 &&
              text.top >= rect.top &&
              text.bottom <= rect.bottom,
            captionBackground: getComputedStyle(caption).backgroundColor,
            gradient: getComputedStyle(item, "::after").backgroundImage,
            loaded: photo.complete && photo.naturalWidth > 0,
          };
        }),
      );
    assert.equal(gallery.length, 6);
    assert.ok(
      gallery[0].width > gallery[1].width * 1.8,
      "The lead photo spans two columns",
    );
    if (width >= 1024)
      assert.ok(
        gallery[0].height > gallery[1].height * 1.8,
        "The lead photo spans two rows",
      );
    for (const tile of gallery) {
      assert.ok(tile.captionInside);
      assert.equal(tile.captionBackground, "rgba(0, 0, 0, 0)");
      assert.ok(tile.gradient.includes("linear-gradient"));
      assert.ok(tile.loaded);
    }
    const director = await page.locator("#lr-director").evaluate((section) => {
      const box = (selector) => {
        const r = section.querySelector(selector).getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height,
        };
      };
      return {
        photo: box(".lr-director__photo img"),
        name: box(".lr-director__name"),
        role: box(".lr-caption"),
        signature: box(".lr-signature"),
        copy: box(".lr-director__copy"),
      };
    });
    assert.ok(
      director.photo.width >= 220 && director.photo.height >= 340,
      "A large portrait is restored",
    );
    assert.ok(director.name.top >= director.photo.bottom - 1);
    assert.ok(director.role.top > director.name.top);
    assert.ok(director.signature.top >= director.role.bottom - 1);
    if (width >= 768)
      assert.ok(
        director.copy.left >= director.photo.right - 1,
        "Copy is right of the portrait",
      );
    else assert.ok(director.copy.top >= director.signature.bottom - 1);
    const action = page.locator('[data-source="director"]');
    await action.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("[data-lr-modal=lead]").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(
      await action.evaluate((element) => document.activeElement === element),
      true,
    );
    assert.deepEqual(errors, []);
    results.push({ width, height, reduced, gallery, director, errors });
    await context.close();
  }
  await fs.writeFile(
    new URL("report.json", out),
    JSON.stringify(results, null, 2),
  );
  console.log(
    `Passed ${results.length} viewport/motion cases: six bento photos, transparent captions, large portrait, reading order, CTA and keyboard.`,
  );
} finally {
  await browser.close();
}
