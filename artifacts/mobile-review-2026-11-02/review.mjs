import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const out = new URL("./", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const errors = [],
  httpErrors = [];
const report = { layouts: [], scenarios: {}, errors, httpErrors };
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) httpErrors.push({ url: r.url(), status: r.status() });
});
const save = async (name, selector) => {
  const target = selector ? page.locator(selector) : page;
  if (selector)
    await target.locator("img[src]").evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (i) => {
          i.loading = "eager";
          try {
            await i.decode();
          } catch {}
        }),
      );
    });
  await target.screenshot({ path: fileURLToPath(new URL(name + ".png", out)) });
};
for (const [width, height] of [
  [360, 640],
  [375, 667],
  [390, 844],
  [430, 932],
  [768, 1024],
]) {
  await page.setViewportSize({ width, height });
  await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => {
    const bounds = (e) => {
      const b = e.getBoundingClientRect();
      return {
        top: Math.round(b.top + scrollY),
        height: Math.round(b.height),
        width: Math.round(b.width),
      };
    };
    return {
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
      sections: [...document.querySelectorAll("main>section")].map((e) => ({
        id: e.id,
        ...bounds(e),
        words: (e.innerText.match(/\S+/g) || []).length,
      })),
      heroCTA: bounds(document.querySelector("[data-lr-hero-cta]")),
      mobileBarHidden: document.querySelector("[data-lr-mobile-bar]").hidden,
      smallTargets: [
        ...document.querySelectorAll(
          "#hop-landing a,#hop-landing button,#hop-landing summary",
        ),
      ]
        .filter((e) => {
          const b = e.getBoundingClientRect();
          return b.width && b.height && (b.width < 40 || b.height < 40);
        })
        .map((e) => ({
          text: (e.innerText || e.getAttribute("aria-label") || "").slice(
            0,
            80,
          ),
          ...bounds(e),
        }))
        .slice(0, 100),
    };
  });
  report.layouts.push(layout);
  await save("entry-" + width);
  if (width === 390) {
    for (const id of layout.sections.map((s) => s.id))
      await save(id + "-390", "#" + id);
    await page.screenshot({
      path: fileURLToPath(new URL("full-390.png", out)),
      fullPage: true,
    });
  }
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
await page.locator("[data-lr-hero-cta] [data-lr-quiz-open]").click();
await save("quiz-1", "[data-lr-quiz-modal]");
await page
  .locator('[data-lr-quiz-modal] input[type="radio"][value="standard"]')
  .check();
await save("quiz-2", "[data-lr-quiz-modal]");
await page
  .locator(
    '[data-lr-quiz-modal] input[type="radio"][value="Программы и настройка"]',
  )
  .check();
await save("quiz-3", "[data-lr-quiz-modal]");
await page
  .locator('[data-lr-quiz-modal] input[type="radio"][value="courier"]')
  .check();
await save("quiz-4", "[data-lr-quiz-modal]");
report.scenarios.quizContact = await page
  .locator("[data-lr-quiz] [data-lr-form]")
  .evaluate((f) => ({
    phoneReadOnly: f.elements.phone.readOnly,
    values: Object.fromEntries(
      [...f.elements].filter((e) => e.name).map((e) => [e.name, e.value]),
    ),
    text: f.innerText,
  }));
await page.keyboard.press("Escape");
await page.locator("#lr-prices [data-lr-lead-open]").click();
report.scenarios.priceAfterQuiz = await page
  .locator('[data-lr-modal="lead"] form')
  .evaluate((f) => ({
    format: f.elements.service_format.value,
    symptom: f.elements.symptom.value,
    device: f.elements.device_category.value,
  }));
await page.keyboard.press("Escape");
await page.locator('#lr-formats [data-format="workshop"]').click();
await save("workshop-initial", '[data-lr-modal="lead"]');
const form = page.locator('[data-lr-modal="lead"] form');
await form.locator('[name="workshop_id"]').selectOption("prosveshcheniya");
await save("workshop-selected", '[data-lr-modal="lead"]');
await form.locator('[name="phone"]').click();
await save("keypad", '[data-lr-modal="lead"]');
report.scenarios.keypad = await form.evaluate((f) => ({
  phoneReadOnly: f.elements.phone.readOnly,
  inputmode: f.elements.phone.inputMode,
  placeholder: f.elements.phone.placeholder,
  phone: f.elements.phone.value,
  keypad: f.querySelector("[data-lr-dialpad]").getBoundingClientRect().height,
  consent: f.elements.consent.getBoundingClientRect().top,
  submit: f.querySelector('[type="submit"]').getBoundingClientRect().top,
  dialogHeight: f.closest("dialog").getBoundingClientRect().height,
}));
await page.keyboard.press("Escape");
await page.locator('#lr-formats [data-format="courier"]').click();
await page.keyboard.press("Escape");
await page.locator("#lr-symptoms [data-lr-lead-open]").click();
report.scenarios.recoveryAfterCourier = await form.evaluate((f) => ({
  format: f.elements.service_format.value,
  symptom: f.elements.symptom.value,
  addressRequired: f.elements.visit_address.required,
}));
await save("recovery-inherited-format", '[data-lr-modal="lead"]');
await page.keyboard.press("Escape");
await page
  .locator("#lr-reviews .lr-review__details")
  .first()
  .locator("summary")
  .click();
await save("review-expanded", "#lr-reviews");
await page.locator("#lr-reviews [data-lr-photo-open]").first().click();
report.scenarios.reviewPhoto = await page
  .locator("[data-lr-review-photo] img")
  .evaluate((i) => ({
    naturalWidth: i.naturalWidth,
    naturalHeight: i.naturalHeight,
    width: i.getBoundingClientRect().width,
    height: i.getBoundingClientRect().height,
  }));
await save("photo-expanded", "[data-lr-review-photo]");
await page.keyboard.press("Escape");
report.scenarios.videoBytes = await page.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .filter((e) => e.name.includes(".mp4"))
    .map((e) => ({
      name: e.name,
      transfer: e.transferSize,
      duration: Math.round(e.duration),
    })),
);
for (const route of [
  "remont-macbook-spb.htm",
  "remont-noutbukov-acer-spb.htm",
  "noutbuk-ne-vklyuchaetsya.htm",
]) {
  await page.goto("http://localhost:4322/" + route, {
    waitUntil: "domcontentloaded",
  });
  report.scenarios[route] = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1: document.querySelector("h1").innerText,
    firstCTA: [...document.querySelectorAll("a[data-lr-lead-open]")]
      .slice(0, 2)
      .map((a) => ({
        text: a.innerText,
        top: Math.round(a.getBoundingClientRect().top),
      })),
  }));
  await save(route.replace(".htm", ""));
}
await writeFile(
  new URL("evidence.json", out),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      layouts: report.layouts.map(
        ({ width, height, pageHeight, heroCTA, mobileBarHidden }) => ({
          width,
          height,
          pageHeight,
          heroCTA,
          mobileBarHidden,
        }),
      ),
      scenarios: report.scenarios,
      errors,
      httpErrors,
    },
    null,
    2,
  ),
);
await browser.close();
