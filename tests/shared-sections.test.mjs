import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
    const formats = section(html, "lr-formats");
    assert.ok(formats?.includes("lr-formats--compact"), page.slug);
    assert.equal((formats.match(/<article /g) || []).length, 4, page.slug);
    assert.ok(!formats.includes("lr-formats__trust"), page.slug);
    for (const name of ["home", "mobile", "workshop", "courier"])
      assert.ok(formats.includes(`format-${name}-v4-1280.webp`), page.slug);
    const process = section(html, "lr-process");
    assert.ok(process?.includes("lr-process-section--steps"), page.slug);
    assert.equal(
      (process.match(/lr-process__number/g) || []).length,
      4,
      page.slug,
    );
    assert.ok(
      !process.includes("<details") &&
        !process.includes("lr-process-section__contact"),
      page.slug,
    );
    assert.equal(
      section(html, "lr-guarantee"),
      section(home, "lr-guarantee").replace(' id="lr-security"', ""),
      page.slug,
    );
    const channels = (text) =>
      section(text, "lr-contact").match(
        /<div class="lr-contact__channels">[\s\S]*<\/section>/,
      )?.[0];
    assert.equal(channels(html), channels(home), page.slug);
    assert.ok(
      section(html, "lr-prices").includes("lr-home-pricing"),
      page.slug,
    );
    assert.ok(section(html, "lr-faq").includes("lr-faq__item"), page.slug);
  }
});
