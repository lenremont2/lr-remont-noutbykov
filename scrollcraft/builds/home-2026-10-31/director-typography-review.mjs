import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const out = new URL("./lab/director-typography/", import.meta.url);
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
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator("#lr-director");
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(950);
    const metrics = await section.evaluate((root) => {
      const rgb = (value) => value.match(/[\d.]+/g).map(Number);
      const luminance = ([r, g, b]) =>
        [r, g, b]
          .map((value) => {
            const c = value / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          })
          .reduce(
            (sum, value, index) =>
              sum + value * [0.2126, 0.7152, 0.0722][index],
            0,
          );
      const style = (element) => {
        const s = getComputedStyle(element);
        let ancestor = element;
        while (
          ancestor &&
          rgb(getComputedStyle(ancestor).backgroundColor)[3] === 0
        )
          ancestor = ancestor.parentElement;
        const foreground = luminance(rgb(s.color));
        const background = luminance(
          rgb(getComputedStyle(ancestor).backgroundColor),
        );
        return {
          font: parseFloat(s.fontSize),
          line: parseFloat(s.lineHeight),
          weight: s.fontWeight,
          marginTop: s.marginTop,
          marginBottom: s.marginBottom,
          textIndent: s.textIndent,
          align: s.textAlign,
          contrast:
            (Math.max(foreground, background) + 0.05) /
            (Math.min(foreground, background) + 0.05),
          maxWidth: s.maxWidth,
          width: element.getBoundingClientRect().width,
        };
      };
      const paragraphs = [...root.querySelectorAll(".lr-director__message p")];
      return {
        title: style(root.querySelector("h2")),
        lead: style(root.querySelector(".lr-director__principle")),
        body: paragraphs.slice(1).map(style),
        gap: getComputedStyle(root.querySelector(".lr-director__message"))
          .rowGap,
        photoWidth: root.querySelector("img").getBoundingClientRect().width,
        paragraphs: paragraphs.length,
        actions: root.querySelectorAll("a,button").length,
        words: [
          ...new Intl.Segmenter("ru", { granularity: "word" }).segment(
            root.querySelector("blockquote").innerText,
          ),
        ].filter((part) => part.isWordLike).length,
        boundWords:
          root.textContent.includes("с\u00a0понятного") &&
          root.textContent.includes("до\u00a0начала"),
      };
    });
    assert.equal(metrics.paragraphs, 4);
    assert.equal(metrics.actions, 1);
    assert.equal(metrics.gap, "20px");
    assert.ok(metrics.lead.font > metrics.body[0].font);
    assert.ok(metrics.title.font > metrics.lead.font);
    assert.equal(metrics.lead.weight, "600");
    assert.ok(metrics.photoWidth >= 220);
    assert.ok(metrics.boundWords);
    for (const body of metrics.body) {
      assert.equal(body.font, width >= 1024 ? 18 : 16);
      assert.ok(body.line / body.font >= 1.59);
      assert.equal(body.weight, "400");
      assert.equal(body.marginTop, "0px");
      assert.equal(body.marginBottom, "0px");
      assert.equal(body.textIndent, "0px");
      assert.ok(body.contrast >= 10);
      assert.ok(body.align === "start" || body.align === "left");
    }
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await section.screenshot({
      path: fileURLToPath(
        new URL(`${width}${reduced ? "-reduced" : ""}.png`, out),
      ),
    });
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
    results.push({ width, height, reduced, metrics, errors });
    await context.close();
  }
  await fs.writeFile(
    new URL("report.json", out),
    JSON.stringify(results, null, 2),
  );
  console.log(
    JSON.stringify(
      results.map(({ width, reduced, metrics }) => ({
        width,
        reduced,
        words: metrics.words,
        body: metrics.body[0],
        lead: metrics.lead.font,
      })),
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
