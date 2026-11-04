import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const p = await b.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await p.goto("http://localhost:4322/", { waitUntil: "domcontentloaded" });
const r = await p.evaluate(() => {
  const info = (e) => {
    if (!e) return null;
    const s = getComputedStyle(e),
      r = e.getBoundingClientRect();
    return {
      tag: e.tagName,
      display: s.display,
      visibility: s.visibility,
      height: r.height,
      top: r.top,
      html: e.outerHTML.slice(0, 400),
    };
  };
  return {
    other: info(document.querySelector(".lr-manufacturers__other")),
    summary: info(document.querySelector(".lr-manufacturers__other>summary")),
    title: info(document.querySelector("#lr-other-manufacturers-title")),
    navs: [...document.querySelectorAll("#hop-landing nav")].map((e) => ({
      class: e.className,
      label: e.getAttribute("aria-label"),
    })),
    hints: [...document.querySelectorAll(".lr-quiz__step")]
      .map((e) => e.innerText)
      .filter((x) => x.includes("модель")),
    buttons: [...document.querySelectorAll("[data-lr-mobile-bar] a")].map(
      (e) => ({ text: e.innerText, height: e.getBoundingClientRect().height }),
    ),
    heroVideo: {
      poster: document.querySelector("[data-lr-hero-video]").poster,
      controls: document.querySelector("[data-lr-hero-video]").controls,
    },
  };
});
await p.locator('#lr-formats [data-format="at-home"]').click();
r.homeForm = await p.locator('[data-lr-modal="lead"] form').evaluate((f) => ({
  format: f.elements.service_format.value,
  place: f.elements.requested_repair_place.value,
  fields: [...f.elements]
    .filter((e) => !e.disabled && e.type !== "hidden")
    .map((e) => ({
      name: e.name,
      type: e.type,
      required: e.required,
      tag: e.tagName,
    })),
}));
await p.keyboard.press("Escape");
await p.locator('#lr-formats [data-format="courier"]').click();
await p.keyboard.press("Escape");
await p.locator("[data-lr-hero-cta] [data-lr-quiz-open]").click();
await p
  .locator('[data-lr-quiz-modal] input[type="radio"][value="standard"]')
  .check();
await p
  .locator(
    '[data-lr-quiz-modal] input[type="radio"][value="Другая неисправность"]',
  )
  .check();
await p
  .locator('[data-lr-quiz-modal] input[type="radio"][value="consultation"]')
  .check();
await p.keyboard.press("Escape");
await p.locator("#lr-prices [data-lr-lead-open]").click();
r.afterChangingQuiz = await p
  .locator('[data-lr-modal="lead"] form')
  .evaluate((f) => ({
    format: f.elements.service_format.value,
    symptom: f.elements.symptom.value,
    addressRequired: f.elements.visit_address.required,
  }));
console.log(JSON.stringify(r, null, 2));
await writeFile(
  new URL("probe.json", import.meta.url),
  JSON.stringify(r, null, 2) + "\n",
);
await b.close();
