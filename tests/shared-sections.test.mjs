import assert from "node:assert/strict";
import { readFileSync } from "./read-normalized.mjs";
import { test } from "node:test";

const content = JSON.parse(
  readFileSync(
    new URL("../src/data/service-pages.json", import.meta.url),
    "utf8",
  ),
);
const home = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const section = (html, id) =>
  html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))?.[0];
const macGuarantee = section(
  readFileSync(
    new URL(`../dist/${content.macbook.slug}.htm/index.html`, import.meta.url),
    "utf8",
  ),
  "lr-guarantee",
);
assert.equal((macGuarantee.match(/<article>/g) || []).length, 3);
assert.ok(macGuarantee.includes("Гарантия и порядок ремонта"));
assert.ok(
  section(home, "lr-guarantee").includes("lr-home-protection--combined"),
);

test("All 49 child pages use the homepage service components", () => {
  for (const page of [
    ...content.brands,
    ...content.problems,
    content.macbook,
  ]) {
    const html = readFileSync(
      new URL(`../dist/${page.slug}.htm/index.html`, import.meta.url),
      "utf8",
    );
    assert.ok(!html.includes("lr-mobile-bar"), page.slug);
    const formats = section(html, "lr-formats");
    const isBrand = content.brands.includes(page);
    const isProblem = content.problems.includes(page);
    const usesHomeVisuals = isBrand || isProblem;
    if (isBrand) {
      const symptomCards = (text) =>
        section(text, "lr-symptoms").match(/<nav\b[\s\S]*?<\/nav>/)?.[0];
      assert.equal(symptomCards(html), symptomCards(home), page.slug);
    }
    if (usesHomeVisuals) {
      assert.equal(formats, section(home, "lr-formats"), page.slug);
      assert.equal(
        section(html, "lr-reviews"),
        section(home, "lr-reviews"),
        page.slug,
      );
    }
    assert.ok(formats?.includes("lr-formats--compact"), page.slug);
    assert.equal((formats.match(/<article /g) || []).length, 4, page.slug);
    assert.ok(!formats.includes("lr-formats__trust"), page.slug);
    assert.equal(
      (formats.match(/data-lr-map-open=/g) || []).length,
      4,
      page.slug,
    );
    assert.ok(html.includes('data-lr-modal="map"'), page.slug);
    assert.ok(html.includes('id="lr-map-workshops-modal"'), page.slug);
    assert.ok(html.includes('id="lr-map-address"'), page.slug);
    if (usesHomeVisuals) {
      assert.ok(formats.includes("lr-formats--journey"), page.slug);
      assert.equal(
        (formats.match(/data-format-schema=/g) || []).length,
        0,
        page.slug,
      );
    } else {
      for (const name of ["home", "mobile", "workshop", "courier"])
        assert.ok(formats.includes(`format-${name}-v4-1280.webp`), page.slug);
    }
    const process = section(html, "lr-process");
    assert.ok(
      process?.includes(
        usesHomeVisuals ? "lr-repair-journey" : "lr-process-section--steps",
      ),
      page.slug,
    );
    assert.equal(
      (
        process.match(
          usesHomeVisuals ? /data-lr-journey-step/g : /lr-process__number/g,
        ) || []
      ).length,
      4,
      page.slug,
    );
    assert.ok(
      !process.includes("<details") &&
        !process.includes("lr-process-section__contact"),
      page.slug,
    );
    assert.equal(
      section(html, "lr-guarantee").replace(' id="lr-security"', ""),
      (usesHomeVisuals ? section(home, "lr-guarantee") : macGuarantee).replace(
        ' id="lr-security"',
        "",
      ),
      page.slug,
    );
    if (usesHomeVisuals) {
      assert.match(
        html,
        /<dialog class="lr-modal lr-modal--compact"[^>]*data-lr-modal="lead"/,
      );
    }
    if (isProblem && page.slug === "noutbuk-ne-vklyuchaetsya") {
      for (const text of [
        "Как пройдёт ремонт ноутбука, который не включается",
        "Уточним модель, реакцию на кнопку питания и зарядное устройство.",
        "Проверьте запуск и получите гарантию",
      ]) {
        assert.ok(process.includes(text), `${page.slug}: ${text}`);
      }
    } else if (usesHomeVisuals) {
      assert.equal(process, section(home, "lr-process"), page.slug);
    }
    const channels = (text) =>
      section(text, "lr-contact")
        .match(/<div class="lr-contact__channels">[\s\S]*<\/section>/)?.[0]
        .match(/href="[^"]+"/g);
    assert.deepEqual(channels(html), channels(home), page.slug);
    assert.ok(
      section(html, "lr-prices").includes("lr-home-pricing"),
      page.slug,
    );
    assert.ok(section(html, "lr-faq").includes("lr-faq__item"), page.slug);
  }
});
