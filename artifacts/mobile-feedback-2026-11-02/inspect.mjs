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
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: new URL("mobile-hero.png", out).pathname.replace(/^\/(\w:)/, "$1"),
});
console.log(
  await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    initialized: document.querySelector("#hop-landing").dataset.lrInitialized,
    sections: [...document.querySelectorAll("main > section")].map((s) => s.id),
    errors: [...document.querySelectorAll("astro-error-overlay")].length,
  })),
);
const capture = async (name, selector) => {
  const target = selector ? page.locator(selector) : page;
  if (selector) {
    await target.locator("img[src]").evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (image) => {
          image.loading = "eager";
          try {
            await image.decode();
          } catch {}
        }),
      );
    });
  }
  await target.screenshot({ path: fileURLToPath(new URL(name + ".png", out)) });
};
const report = { widths: [], scenarios: [], errors };
const step = () => page.locator("[data-lr-quiz-progress]").innerText();
await page.locator("[data-lr-hero-cta] [data-lr-quiz-open]").click();
await page.locator('[data-lr-quiz-modal] input[value="standard"]').check();
assert.match(await step(), /2 из 4/);
await page
  .locator('[data-lr-quiz-modal] input[value="Программы и настройка"]')
  .check();
assert.match(await step(), /3 из 4/);
await page.locator('[data-lr-quiz-modal] input[value="courier"]').check();
assert.match(await step(), /4 из 4/);
const quizForm = page.locator("[data-lr-quiz] [data-lr-form]");
assert.equal(
  await quizForm.locator('[name="service_format"]').inputValue(),
  "courier",
);
assert.equal(
  await quizForm.locator('[name="visit_address"]').isEnabled(),
  true,
);
await capture("mobile-quiz-contact", "[data-lr-quiz-modal]");
await page.locator("[data-lr-quiz-prev]").click();
await page
  .locator('[data-lr-quiz-modal] input[type="radio"][value="courier"]')
  .click();
assert.match(await step(), /4 из 4/);
await page.locator("[data-lr-quiz-prev]").click();
await page.locator('[data-lr-quiz-modal] input[value="workshop"]').check();
assert.match(await step(), /4 из 4/);
assert.equal(
  await quizForm.locator("[data-lr-workshop-picker]").isVisible(),
  true,
);
await page.keyboard.press("Escape");
assert.equal(await page.locator("[data-lr-quiz-modal]").isVisible(), false);
report.scenarios.push("quiz auto advance, back, context, modal Escape");
await page.locator('#lr-formats [data-format="workshop"]').click();
const lead = page.locator('[data-lr-modal="lead"]');
const form = lead.locator("form");
await form.locator('[name="workshop_id"]').selectOption("prosveshcheniya");
assert.equal(
  await form.locator('[name="service_format"]').inputValue(),
  "workshop",
);
await capture("mobile-workshop", '[data-lr-modal="lead"]');
const position = await page.evaluate(() => scrollY);
await page.keyboard.press("Escape");
assert.ok(Math.abs((await page.evaluate(() => scrollY)) - position) < 3);
report.scenarios.push(
  "workshop selector in place, Escape and scroll preserved",
);
await page.locator('#lr-formats [data-format="courier"]').click();
assert.equal(await form.locator('[name="visit_address"]').isEnabled(), true);
assert.equal(
  await form.locator('[name="requested_repair_place"]').isEnabled(),
  false,
);
await form.locator('[name="visit_address"]').fill("Тестовый адрес, дом 1");
await form.locator('[name="phone"]').click();
for (const digit of "9212345678")
  await form.locator(`[data-lr-digit="${digit}"]`).click();
assert.equal(
  await form.locator('[name="phone"]').inputValue(),
  "+7 (921) 234-56-78",
);
assert.equal(await form.locator('[type="submit"]').isEnabled(), false);
await form.locator('[name="consent"]').check();
assert.equal(await form.locator('[type="submit"]').isEnabled(), true);
assert.equal(await form.locator("[data-lr-dialpad]").isVisible(), false);
await capture("mobile-form-ready", '[data-lr-modal="lead"]');
await form.locator('[name="consent"]').uncheck();
assert.equal(await form.locator('[type="submit"]').isEnabled(), false);
await form.locator('[name="phone"]').click();
await form.locator('[data-lr-digit="clear"]').click();
assert.equal(await form.locator('[name="phone"]').inputValue(), "");
await form.locator("[data-lr-native-phone]").click();
await form.locator('[name="phone"]').fill("8 (921) 234-56-78");
assert.equal(
  await form.locator('[name="phone"]').inputValue(),
  "+7 (921) 234-56-78",
);
await page.keyboard.press("Escape");
report.scenarios.push(
  "courier address, dialpad, clear, native input, readiness, consent revoked",
);
await page.locator(".lr-review__details").first().locator("summary").click();
assert.equal(
  await page.locator(".lr-review__details").first().getAttribute("open"),
  "",
);
await page.locator(".lr-review__details").first().locator("summary").click();
await page.locator("[data-lr-photo-open]").first().click();
assert.equal(await page.locator("[data-lr-review-photo]").isVisible(), true);
await capture("mobile-review-photo", "[data-lr-review-photo]");
await page.keyboard.press("Escape");
assert.equal(await page.locator("[data-lr-review-photo]").isVisible(), false);
report.scenarios.push("review disclosure and image dialog");
for (const width of [360, 390, 768, 1280, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    qrVisible: [...document.querySelectorAll(".lr-social-links__qr")].some(
      (e) => e.getBoundingClientRect().width > 0,
    ),
    broken: [...document.querySelectorAll("#hop-landing img[src]")]
      .filter((i) => i.complete && !i.naturalWidth)
      .map((i) => i.getAttribute("src")),
  }));
  assert.ok(layout.scrollWidth <= width, JSON.stringify(layout));
  if (width < 768) assert.equal(layout.qrVisible, false);
  assert.deepEqual(layout.broken, []);
  report.widths.push(layout);
  await capture("home-" + width);
  if ([390, 1440].includes(width))
    for (const id of [
      "lr-symptoms",
      "lr-formats",
      "lr-reviews",
      "lr-process",
      "lr-director",
      "lr-locations",
    ])
      await capture(id + "-" + width, "#" + id);
}
for (const route of [
  "remont-macbook-spb.htm",
  "remont-noutbukov-acer-spb.htm",
  "noutbuk-ne-vklyuchaetsya.htm",
]) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:4322/" + route, {
    waitUntil: "domcontentloaded",
  });
  assert.equal(
    await page.locator("#hop-landing").getAttribute("data-lr-initialized"),
    "true",
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    route,
  );
  await page.locator('#lr-formats [data-format="courier"]').click();
  assert.equal(
    await page
      .locator('[data-lr-modal="lead"] [name="visit_address"]')
      .isEnabled(),
    true,
  );
  await page.keyboard.press("Escape");
  await capture(route.replace(".htm", ""));
  report.scenarios.push(route + ": mobile layout and courier modal");
}
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
assert.equal(
  await page.locator("[data-lr-hero-video]").evaluate((v) => v.paused),
  true,
);
await page.locator("[data-lr-hero-cta] [data-lr-quiz-open]").click();
await page
  .locator('[data-lr-quiz-modal] input[value="standard"]')
  .press("ArrowDown");
assert.match(await step(), /1 из 4/);
await page.locator("[data-lr-quiz-next]").click();
assert.match(await step(), /2 из 4/);
await page.keyboard.press("Escape");
report.scenarios.push(
  "reduced motion, keyboard radio selection and explicit Next",
);
assert.deepEqual(errors, []);
console.log(JSON.stringify(report, null, 2));
await writeFile(new URL("report.json", out), JSON.stringify(report, null, 2));
await browser.close();
