import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const out = "artifacts/landings-review-2026-11-03/comparison/feedback-v2";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const results = [];
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 1024, isMobile: width < 500, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    assert.equal((await page.goto("http://127.0.0.1:4322/", { waitUntil: "networkidle" })).status(), 200);
    await page.addStyleTag({ content: "astro-dev-toolbar{display:none!important}" });
    await page.evaluate(() => document.fonts.ready);
    for (const id of ["lr-hero", "lr-symptoms", "lr-manufacturers", "lr-formats", "lr-reviews"]) {
      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await section.locator("img[src]").evaluateAll(async imgs => { await Promise.all(imgs.map(async img => { img.loading = "eager"; try { await img.decode(); } catch { throw new Error(`Cannot decode: ${img.src}`); } })); });
      if ([320,390,1440].includes(width)) await section.screenshot({ path: `${out}/${id}-${width}.jpg`, type: "jpeg", quality: 85 });
    }
    const facts = await page.evaluate(() => {
      const hero = document.querySelector("#lr-hero");
      const grid = document.querySelector("#lr-formats .lr-formats__grid");
      const photos = [...document.querySelectorAll("#lr-hero .lr-social-links__qr")];
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        heroBullets: hero.querySelectorAll(".lr-hero__benefit").length,
        contacts: hero.querySelector(".lr-hero__contacts").textContent,
        qrVisible: photos.filter(p => getComputedStyle(p).display !== "none").length,
        services: document.querySelectorAll("#lr-symptoms .lr-symptoms__group-media").length,
        serviceCopy: document.querySelectorAll("#lr-symptoms .lr-symptoms__group-copy, #lr-symptoms .lr-symptoms__group-badge").length,
        formatImages: [...grid.querySelectorAll("img")].map(img=>img.getAttribute("src")),
        columns: getComputedStyle(grid).gridTemplateColumns,
        carousel: grid.scrollWidth > grid.clientWidth,
        documents: document.querySelectorAll(".lr-document").length,
        illustrations: document.querySelectorAll(".lr-reviews__illustration-grid img").length,
        reviews: document.querySelectorAll(".lr-review").length,
      };
    });
    assert.equal(facts.overflow, 0, `overflow at ${width}`);
    assert.equal(facts.heroBullets, 5);
    assert.equal(facts.services, 6);
    assert.equal(facts.serviceCopy, 0);
    assert.equal(facts.qrVisible, width >= 768 ? 4 : 0);
    assert.equal(facts.formatImages.length, 4);
    assert(facts.formatImages.every(src => src.endsWith("-vector.svg")));
    assert.equal(facts.carousel, width < 768);
    assert.equal(facts.documents, 4);
    assert.equal(facts.illustrations, 2);
    assert.equal(facts.reviews, 27);
    const photo = page.locator(".lr-reviews__illustration-grid [data-lr-photo-open]").first();
    await photo.click();
    await page.locator("dialog[data-lr-review-photo]").waitFor({ state: "visible" });
    assert((await page.locator("[data-lr-photo-image]").getAttribute("src")).includes("repair-illustration"));
    await page.keyboard.press("Escape");
    assert(await photo.evaluate(el => document.activeElement === el));
    assert.deepEqual(errors, []);
    results.push({ width, ...facts, errors });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  await page.goto("http://127.0.0.1:4322/", { waitUntil: "networkidle" });
  await page.locator(".lr-marquee").scrollIntoViewIfNeeded();
  const track = page.locator(".lr-marquee__track");
  const viewport = await page.locator(".lr-marquee__viewport").boundingBox();
  await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
  assert.equal(await track.evaluate(el => getComputedStyle(el).animationPlayState), "running");
  await page.locator(".lr-marquee__list a").first().focus();
  assert.equal(await track.evaluate(el => getComputedStyle(el).animationPlayState), "running");
  assert.equal(await page.locator("[data-lr-marquee-pause]").count(), 0);
  const marquee = await track.evaluate(el => {
    const anim = el.getAnimations()[0];
    anim.pause(); anim.currentTime = 118200;
    const viewport = el.parentElement.getBoundingClientRect();
    const links = [...el.querySelectorAll("[data-lr-marquee-copy] a")];
    const visible = links.find(link => { const r = link.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
    const r = visible.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("a");
    return { viewport: { x: viewport.x, width: viewport.width }, cloneLink: visible.getAttribute("href"), clickable: hit === visible, cloneTabStops: links.filter(link => link.tabIndex >= 0).length };
  });
  assert(Math.abs(marquee.viewport.x) < 1 && Math.abs(marquee.viewport.width - 1440) < 1);
  assert(marquee.clickable);
  assert.equal(marquee.cloneTabStops, 0);
  results.push({ marquee });
  await page.close();
  writeFileSync(`${out}/evidence.json`, JSON.stringify(results, null, 2));
  console.log("PASS: 5 widths, layout/copy/media, photo dialog, full-bleed moving marquee and clickable clones.");
} finally { await browser.close(); }
