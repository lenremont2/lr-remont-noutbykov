import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createReadStream, statSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, sep, extname } from "node:path";
import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = resolve("dist");
const output = resolve("artifacts/landings-review-2026-11-03/rechecked");
mkdirSync(output, { recursive: true });
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".woff2": "font/woff2" };
const server = createServer((request, response) => {
  try {
    let file = resolve(root, "." + decodeURIComponent(new URL(request.url, "http://localhost").pathname));
    if (file !== root && !file.startsWith(root + sep)) throw new Error("Outside root");
    if (statSync(file).isDirectory()) file = join(file, "index.html");
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(response);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const results = [];
try {
  for (const width of [390, 320, 768, 1440]) {
    const height = width === 1440 ? 900 : width === 768 ? 1024 : width === 390 ? 844 : 740;
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("#hop-landing")?.dataset.lrInitialized === "true");
    const primary = await page.locator("[data-lr-hero-cta] [data-lr-quiz-open]").boundingBox();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const horizontalScroll = await page.evaluate(() => { window.scrollTo({ left: 10000, top: 0, behavior: "instant" }); const value = scrollX; window.scrollTo({ left: 0, top: 0, behavior: "instant" }); return value; });
    if (horizontalScroll) console.log(await page.evaluate(() => ({ body: { width: document.body.scrollWidth, margin: getComputedStyle(document.body).margin }, document: document.documentElement.scrollWidth, outside: [...document.querySelectorAll("#hop-landing *")].filter((element) => element.getBoundingClientRect().right > innerWidth + 1 && !element.closest(".lr-swipe-track, .lr-reviews__track")).slice(0, 20).map((element) => ({ tag: element.tagName, class: element.className, position: getComputedStyle(element).position, right: element.getBoundingClientRect().right, text: element.textContent.slice(0, 30) })) })));
    assert.equal(horizontalScroll, 0, `The page must not scroll horizontally at ${width}`);
    if (overflow > 1) console.log(await page.evaluate(() => [...document.querySelectorAll("#hop-landing *")].filter((element) => element.getBoundingClientRect().right > innerWidth + 1 && !element.closest(".lr-swipe-track, .lr-reviews__track, .lr-visually-hidden")).slice(0, 20).map((element) => ({ tag: element.tagName, class: element.className, right: element.getBoundingClientRect().right, text: element.textContent.slice(0, 50) }))));
    assert.ok(overflow <= 1, `Overflow at ${width}: ${overflow}`);
    if (width === 390) assert.ok(primary.y + primary.height <= height, `Five Hero bullets and the primary action fit the mobile fold: ${primary.y + primary.height}/${height}`);
    assert.equal(await page.locator(".lr-hero__benefit").count(), 5);
    assert.equal(await page.locator("[data-format-schema]").count(), 4);
    await page.screenshot({ path: join(output, `fold-${width}.jpg`), type: "jpeg", quality: 85 });
    const ids = width === 1440 || width === 390
      ? ["lr-hero", "lr-symptoms", "lr-formats", "lr-prices", "lr-quiz", "lr-process", "lr-lab", "lr-workshop-gallery", "lr-business-trust", "lr-guarantee", "lr-locations", "lr-service-guide", "lr-faq", "lr-contact"]
      : ["lr-hero", "lr-prices", "lr-formats"];
    for (const id of ids) {
      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await section.evaluate(async (element) => {
        await Promise.all([...element.querySelectorAll("img")].map(async (image) => { image.loading = "eager"; await image.decode().catch(() => {}); }));
      });
      await section.screenshot({ path: join(output, `${id}-${width}.jpg`), type: "jpeg", quality: 85, animations: "disabled" });
    }
    const tabs = page.getByRole("tab");
    assert.equal(await tabs.count(), 2);
    await page.locator("#lr-price-tab-1").click();
    assert.equal(await page.locator("#lr-price-panel-1").isVisible(), true);
    assert.equal(await page.locator("#lr-price-panel-0").isVisible(), false);
    assert.equal(await page.locator("#lr-price-panel-1 .lr-price-row__action").count(), 4);
    const price = page.locator("#lr-price-panel-1 .lr-price-row__action").nth(0);
    const symptom = await price.getAttribute("data-symptom");
    await price.click();
    const lead = page.locator('[data-lr-modal="lead"]');
    assert.equal(await lead.evaluate((element) => element.open), true);
    assert.equal(await lead.locator('input[name="device_category"]').inputValue(), "premium");
    assert.equal(await lead.locator('input[name="symptom"]').inputValue(), symptom);
    await page.keyboard.press("Escape");
    assert.equal(await price.evaluate((element) => document.activeElement === element), true);
    const tab0 = page.locator("#lr-price-tab-0");
    const tab1 = page.locator("#lr-price-tab-1");
    await tab1.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await tab0.getAttribute("aria-selected"), "true");
    await page.keyboard.press("End");
    assert.equal(await tab1.getAttribute("aria-selected"), "true");
    await page.keyboard.press("Home");
    assert.equal(await tab0.getAttribute("aria-selected"), "true");
    for (const format of ["at-home", "mobile-lab", "workshop", "courier"]) {
      const action = page.locator(`#lr-formats [data-format="${format}"]`);
      await action.click();
      const map = page.locator('[data-lr-modal="map"]');
      assert.equal(await map.evaluate((element) => element.open), true);
      assert.equal(await map.getAttribute("data-format"), format);
      assert.equal(await map.locator(`[data-lr-map-view="${format === "workshop" ? "workshops" : "address"}"]`).isVisible(), true);
      await page.keyboard.press("Escape");
      assert.equal(await action.evaluate((element) => document.activeElement === element), true);
    }
    await page.locator("#lr-hero [data-source='hero-request']").click();
    assert.equal(await lead.evaluate((element) => element.open), true);
    await page.keyboard.press("Escape");
    await page.locator("#lr-hero [data-lr-quiz-open]").click();
    assert.equal(await page.locator("#lr-quiz-modal").evaluate((element) => element.open), true);
    await page.locator('[data-lr-quiz] label:has(input[name="device_category"][value="standard"])').click();
    await page.locator('[data-lr-quiz] label:has(input[name="symptom"][value="Восстановление данных"])').click();
    await page.locator('[data-lr-quiz] label:has(input[name="service_format"][value="workshop"])').click();
    const timing = page.locator('[data-lr-quiz] select[name="request_timing"]');
    await timing.selectOption({ label: "Срочно сегодня (за 1–2 часа)" });
    assert.equal(await page.locator('[data-lr-quiz] input[type="hidden"][name="symptom"]').inputValue(), "Восстановление данных");
    await page.locator('[data-lr-quiz] [data-lr-quiz-prev]').click();
    await page.locator('[data-lr-quiz] [data-lr-quiz-next]').click();
    await timing.waitFor({ state: "visible" });
    assert.equal(await timing.inputValue(), "Срочно сегодня (за 1–2 часа)");
    assert.equal(await timing.evaluate((element) => new FormData(element.form).get("request_timing")), "Срочно сегодня (за 1–2 часа)");
    await page.locator('#lr-quiz-modal').screenshot({ path: join(output, `quiz-contact-${width}.jpg`), type: "jpeg", quality: 85 });
    await page.keyboard.press("Escape");
    const faq = page.locator("#lr-faq details").nth(0);
    await faq.locator("summary").click();
    assert.equal(await faq.getAttribute("open"), "");
    assert.deepEqual(errors, []);
    results.push({ width, height, overflow, primaryBottom: primary.y + primary.height, primaryInsideFold: primary.y + primary.height <= height, tabs: "click, arrows, Home/End, context and focus return passed", maps: "all four formats passed", errors });
    console.log(`Passed interactions at ${width}; primary bottom ${Math.round(primary.y + primary.height)}/${height}`);
    await page.close();
  }
  const noScript = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  await noScript.goto(url);
  assert.equal(await noScript.locator("#lr-price-panel-0").isVisible(), true);
  assert.equal(await noScript.locator("#lr-price-panel-1").isVisible(), true);
  assert.equal(await noScript.locator("[data-lr-price-tabs]").isVisible(), false);
  await noScript.close();
  for (const slug of ["remont-noutbukov-acer-spb", "noutbuk-ne-vklyuchaetsya", "remont-macbook-spb"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.goto(`${url}/${slug}.htm/`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("[data-format-schema]").count(), 4);
    assert.equal(await page.locator("[data-lr-price-tabs]").count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.close();
  }
  writeFileSync(join(output, "verification.json"), JSON.stringify({ results, noScript: "Both price categories readable", childPages: "Acer, no-power and MacBook passed", formSubmission: "Not performed" }, null, 2));
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
