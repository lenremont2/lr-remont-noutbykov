import { parse } from "postcss";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { validatePhone, formatPhone } from "../src/scripts/landing.js";

for (const phone of ["+7 (921) 234-56-78", "8 812 345 67 89", "79212345678"]) {
  const result = validatePhone(phone);
  assert.equal(result.error, "", phone);
  assert.match(result.value, /^\+7\d{10}$/);
}
assert.equal(validatePhone("8 (921) 234-56-78").value, "+79212345678");
for (const phone of [
  "",
  " ",
  "+",
  "123",
  "792123456789",
  "19999999999",
  "77777777777",
  "80000000000",
  "abc79212345678",
]) {
  assert.ok(validatePhone(phone).error, `Must reject: ${phone}`);
}

// Check the built result: formatting must not silently discard card headings.
const html = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const data = JSON.parse(
  readFileSync(
    new URL("../src/data/laptop-service.json", import.meta.url),
    "utf8",
  ),
);
assert.equal((html.match(/id="hop-landing"/g) || []).length, 1);
assert.equal((html.match(/<h1[ >]/g) || []).length, 0);
assert.match(html, /<h2[^>]+id="lr-hero-title"/);
assert.ok(html.includes(data.hero.fields.H2));
const homeHero = html.match(/<section id="lr-hero"[\s\S]*?<\/section>/)?.[0];
assert.ok(homeHero?.includes("lr-hero--home"));
assert.ok(homeHero.includes(data.hero.fields["Лид"]));
assert.equal((homeHero.match(/data-lr-hero-video/g) || []).length, 1);
const heroHeading = homeHero.match(
  /<h2[^>]*id="lr-hero-title"[^>]*>[\s\S]*?<\/h2>/,
)?.[0];
const heroHeadingText = heroHeading
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
assert.ok(heroHeadingText.includes(data.hero.fields["Срок ремонта"]));
assert.ok(!homeHero.includes('class="lr-hero__badge"'));
assert.ok(!homeHero.includes('class="lr-hero__media-label"'));
assert.ok(homeHero.includes('data-source="hero"'));
assert.ok(homeHero.includes('href="#lr-map-workshops"'));
const benefitsSection = html.match(
  /<section id="lr-benefits"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(benefitsSection, "Detailed benefits section must exist");
assert.equal((benefitsSection.match(/class="lr-benefit"/g) || []).length, 6);
for (const benefit of data.benefits.items) {
  assert.ok(benefit.text.trim(), benefit.title);
  assert.ok(
    benefitsSection.includes(`<h3>${benefit.title}</h3>`),
    benefit.title,
  );
  assert.ok(benefitsSection.includes(benefit.text), benefit.title);
}
assert.ok(benefitsSection.includes('data-source="benefits"'));
const casesEnabled = !readFileSync(
  new URL("../src/pages/index.astro", import.meta.url),
  "utf8",
).includes("<!-- <RepairCases /> -->");
const ids = [
  "hero",
  "quick-contacts",
  "symptoms",
  ...(casesEnabled ? ["repair-cases"] : []),
  "quiz",
  "benefits",
  "formats",
  "lab",
  "process",
  "expertise",
  "guarantee",
  "reviews",
  "prices",
  "locations",
  "faq",
  "contact",
];
const positions = ids.map((id) => html.indexOf(`id="lr-${id}"`));
assert.ok(
  positions.every((pos, i) => pos >= 0 && (!i || pos > positions[i - 1])),
);
for (const key of [
  "symptoms",
  "formats",
  "lab",
  "process",
  "expertise",
  "guarantee",
  "locations",
  "faq",
]) {
  for (const item of data[key].items)
    assert.ok(html.includes(item.title), `${key}: ${item.title}`);
}
assert.deepEqual(
  data.prices.tables.map((table) => table.length),
  [8, 4, 6],
);
for (const [, price] of data.prices.tables.flat())
  assert.ok(html.includes(price));
assert.ok(
  !html.includes('id="lr-repair-times"'),
  "Standalone times section must be removed",
);
const priceSection = html.match(
  /<section id="lr-prices"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(priceSection);
const repairCases = JSON.parse(
  readFileSync(
    new URL("../src/data/repair-cases.json", import.meta.url),
    "utf8",
  ),
);
const casesSection = html.match(
  /<section id="lr-repair-cases"[\s\S]*?<\/section>/,
)?.[0];
assert.equal(Boolean(casesSection), casesEnabled);
if (casesSection) {
  const caseCards =
    casesSection.match(/<article class="lr-repair-case"[\s\S]*?<\/article>/g) ||
    [];
  assert.equal(caseCards.length, 4);
  repairCases.forEach((item, i) => {
    const price = data.prices.tables
      .flat()
      .find(([work]) => work === item.priceWork)?.[1];
    assert.ok(price, item.priceWork);
    assert.ok(data.symptoms.items.some(({ title }) => title === item.symptom));
    for (const text of [item.title, price, item.image, ...item.works]) {
      assert.ok(caseCards[i].includes(text), text);
    }
    assert.ok(caseCards[i].includes(`data-symptom="${item.symptom}"`));
    assert.ok(caseCards[i].includes(`data-source="repair-case-${item.id}"`));
  });
  assert.ok(casesSection.includes('href="#lr-prices"'));
}
assert.equal(
  (priceSection.match(/<td class="lr-price-table__duration">/g) || []).length,
  18,
);
assert.equal(
  (priceSection.match(/class="lr-price-table__time-inline"/g) || []).length,
  18,
);
const priceRows = priceSection.match(/<tr>[\s\S]*?<\/tr>/g) || [];
for (const [work, price, duration] of data.prices.tables.flat()) {
  assert.ok(duration?.trim(), "Missing repair duration: " + work);
  const row = priceRows.find((row) => row.includes(work));
  assert.ok(row?.includes(price), work);
  assert.ok(row?.includes(duration), work);
}
for (const [, path] of html.matchAll(/(?:src|poster)="(\/media\/[^"]+)"/g)) {
  assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)), path);
}
assert.ok(!html.includes("data-lr-demo-form"));
assert.ok(!html.includes("formAction"));
assert.ok(!html.includes('href="#"'));
console.log(
  "Phone validation, complete content, section order and local media: passed.",
);

assert.equal(formatPhone("8 (921) 234-56-78"), "+7 (921) 234-56-78");
assert.equal(formatPhone("9212345678"), "+7 (921) 234-56-78");
assert.equal(formatPhone("+7921"), "+7 (921)");
assert.equal(formatPhone(""), "");
assert.equal(formatPhone("+"), "+7");
assert.equal(formatPhone("79212345678999"), "+7 (921) 234-56-78");
console.log("Phone mask: passed.");

for (const file of readdirSync(
  new URL("../dist/_astro/", import.meta.url),
).filter((name) => name.endsWith(".css"))) {
  const css = readFileSync(
    new URL(`../dist/_astro/${file}`, import.meta.url),
    "utf8",
  );
  parse(css).walkRules((rule) => {
    for (const selector of rule.selectors)
      assert.ok(selector.startsWith("#hop-landing"), selector);
  });
}
assert.equal((html.match(/data-hop-lead-form/g) || []).length, 3);
assert.equal((html.match(/data-hop-lead-submit/g) || []).length, 3);
assert.equal((html.match(/data-lead-root/g) || []).length, 3);
assert.equal((html.match(/data-lead-success/g) || []).length, 3);
assert.equal((html.match(/method="post"/g) || []).length, 3);
console.log("CSS isolation and Lead Capture attributes: passed.");

for (const benefit of data.hero.bullets) {
  assert.ok(html.includes(benefit.title), benefit.title);
  assert.ok(html.includes(benefit.text), benefit.title);
}

const symptomCards = html.match(/<a class="lr-symptom"[\s\S]*?<\/a>/g) || [];
assert.equal(symptomCards.length, 6);
data.symptoms.items.forEach((item, i) => {
  const price = data.prices.tables
    .flat()
    .find(([work]) => work === item.priceWork)?.[1];
  assert.ok(price, item.priceWork);
  assert.ok(symptomCards[i].includes(item.image), item.title);
  assert.ok(symptomCards[i].includes(price), item.title);
  assert.ok(symptomCards[i].includes(item.title), item.title);
  assert.ok(!symptomCards[i].includes(item.text), item.title);
  assert.ok(!symptomCards[i].includes(item.priceWork), item.title);
  assert.match(symptomCards[i], /href="\/[a-z-]+\.htm"/);
  assert.ok(!/<button[ >]/.test(symptomCards[i]), item.title);
});
for (const slot of ["workshops", "pickup"]) {
  assert.equal(
    (
      html.match(new RegExp('data-lr-map-placeholder="' + slot + '"', "g")) ||
      []
    ).length,
    1,
  );
  assert.ok(html.includes('id="lr-map-' + slot + '"'));
}
assert.ok(html.includes('href="#lr-map-pickup"'));
console.log(
  "Six illustrated symptoms with source prices and two map placeholders: passed.",
);

for (const [, anchor] of html.matchAll(/href="#([^" ]+)"/g)) {
  assert.ok(html.includes('id="' + anchor + '"'), anchor);
}
assert.equal((html.match(/data-lr-qr-disclosure/g) || []).length, 6);
assert.equal(
  (
    html.match(
      /href="https:\/\/www.lenremont.ru\/politika-obrabotki-personalnyh-dannyh.htm"/g,
    ) || []
  ).length,
  3,
);
assert.ok(html.includes(data.symptoms.fields["Пояснение цены"]));
assert.ok(html.includes('href="#lr-map-workshops"'));
assert.ok(html.includes('class="lr-locations__blocks"'));
console.log(
  "Anchors, price caveat, privacy links and responsive QR disclosure: passed.",
);
