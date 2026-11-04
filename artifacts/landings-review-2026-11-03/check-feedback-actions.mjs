import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import assert from "node:assert/strict";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:4322/", { waitUntil: "networkidle" });
  await page.locator("[data-lr-hero-cta] [data-lr-quiz-open]").click();
  assert(await page.locator("#lr-quiz-modal").evaluate(el => el.open));
  await page.keyboard.press("Escape");
  for (const format of ["at-home", "mobile-lab", "workshop", "courier"]) {
    await page.locator(`#lr-formats [data-format="${format}"]`).click();
    const dialog = page.locator('[data-lr-modal="map"]');
    assert(await dialog.evaluate(el => el.open));
    assert.equal(await dialog.getAttribute("data-format"), format);
    await page.keyboard.press("Escape");
  }
  await page.locator('.lr-marquee__list:not([data-lr-marquee-copy]) [data-source="manufacturers-other"]').click();
  const lead = page.locator('[data-lr-modal="lead"]');
  assert(await lead.evaluate(el => el.open));
  assert.equal(await lead.locator('[name="source"]').inputValue(), "manufacturers-other");
  await page.keyboard.press("Escape");
  const docs = page.locator(".lr-documents");
  await docs.focus();
  const before = await docs.evaluate(el => el.scrollLeft);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  assert((await docs.evaluate(el => el.scrollLeft)) > before);
  await page.close();
  const report = await browser.newPage({ viewport: { width: 390, height: 844 } });
  assert.equal((await report.goto('http://127.0.0.1:4330/feedback-v2/')).status(), 200);
  assert.equal(await report.locator("section").count(), 5);
  await report.locator("img").evaluateAll(async imgs => Promise.all(imgs.map(async img => { img.loading = 'eager'; await img.decode(); })));
  assert.equal(await report.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  console.log("PASS: Hero quiz, all four format actions, other-brand lead context, document keyboard scroll and paired report.");
} finally { await browser.close(); }
