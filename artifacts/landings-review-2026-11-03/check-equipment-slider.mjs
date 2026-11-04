import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const out = "artifacts/landings-review-2026-11-03/equipment-slider";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const results = [];
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 1024, isMobile: width < 500, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:4322/", { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "astro-dev-toolbar{display:none!important}" });
    const section = page.locator("#lr-workshop-gallery");
    const track = section.locator("[data-lr-swipe-track]");
    await section.scrollIntoViewIfNeeded();
    await section.locator("img").evaluateAll(imgs => Promise.all(imgs.map(async img => { img.loading = "eager"; await img.decode(); })));
    const metrics = await page.evaluate(() => {
      const track = document.querySelector(".lr-equipment-reference__track");
      const card = track.firstElementChild;
      const reference = document.querySelector(".lr-symptoms__group");
      return { overflow: document.documentElement.scrollWidth - innerWidth, viewport: track.getBoundingClientRect().width, card: card.getBoundingClientRect().width, referenceCard: reference.getBoundingClientRect().width, scrollbar: getComputedStyle(track).scrollbarWidth, count: track.children.length, scrollable: track.scrollWidth > track.clientWidth };
    });
    assert.equal(metrics.overflow, 0);
    assert(Math.abs(metrics.viewport - width) < 1);
    assert(Math.abs(metrics.card - metrics.referenceCard) < 1);
    assert.equal(metrics.count, 4);
    assert(metrics.scrollable);
    assert.equal(metrics.scrollbar, "none");
    await section.screenshot({ path: `${out}/equipment-${width}.jpg`, type: "jpeg", quality: 85 });
    await track.focus();
    await page.keyboard.press("ArrowRight");
    assert((await track.evaluate(el => el.scrollLeft)) > 0);
    await page.keyboard.press("End");
    assert(await track.evaluate(el => Math.abs(el.scrollWidth - el.clientWidth - el.scrollLeft) < 2));
    await page.keyboard.press("Home");
    assert.equal(await track.evaluate(el => el.scrollLeft), 0);
    if (width === 390) {
      const box = await track.boundingBox();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 280, y: box.y + 120 }] });
      for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 280 - i * 24, y: box.y + 120 }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(250);
      assert((await track.evaluate(el => el.scrollLeft)) > 100);
      await track.focus(); await page.keyboard.press("Home");
    }
    if (width === 1440) {
      const box = await track.boundingBox();
      await page.mouse.move(350, box.y + 90); await page.mouse.down();
      await page.mouse.move(150, box.y + 90, { steps: 10 }); await page.mouse.up();
      assert((await track.evaluate(el => el.scrollLeft)) > 100);
      assert.equal(await page.locator("dialog[open]").count(), 0);
      await track.focus(); await page.keyboard.press("Home");
    }
    await section.locator("[data-lr-photo-open]").first().click();
    assert(await page.locator("[data-lr-review-photo]").evaluate(el => el.open));
    await page.keyboard.press("Escape");
    assert(await section.locator("[data-lr-photo-open]").first().evaluate(el => el === document.activeElement));
    assert.deepEqual(errors, []);
    results.push({ width, ...metrics, errors });
    await page.close();
  }
  writeFileSync(`${out}/evidence.json`, JSON.stringify(results, null, 2));
  console.log("PASS: equipment matches service slider on 5 widths; keyboard, touch swipe, mouse drag and photo zoom.");
} finally { await browser.close(); }
