import { parse } from "postcss";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { readFileSync } from "./read-normalized.mjs";
import {
  validatePhone,
  formatPhone,
  initializeLanding,
} from "../src/scripts/landing.js";

// A page using LandingLayout may contain only native links/details, no lead modal.
const originalDocument = globalThis.document;
const originalMatchMedia = globalThis.matchMedia;
try {
  const listeners = [];
  const previewRoot = {
    dataset: {},
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (type) => listeners.push(type),
  };
  globalThis.document = { querySelector: () => previewRoot };
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
  assert.doesNotThrow(
    () => initializeLanding(),
    "A preview without lead modal must initialize safely",
  );
  assert.equal(previewRoot.dataset.lrInitialized, "true");
  assert.deepEqual(listeners, ["beforeinput", "input"]);
  initializeLanding();
  assert.equal(
    listeners.length,
    2,
    "Repeated initialization must not duplicate listeners",
  );
  globalThis.document = { querySelector: () => null };
  assert.doesNotThrow(
    () => initializeLanding(),
    "A document without the landing root must be safe",
  );
} finally {
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if (originalMatchMedia === undefined) delete globalThis.matchMedia;
  else globalThis.matchMedia = originalMatchMedia;
}

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
const main = html.match(
  /<main\b[^>]*id="hop-landing"[^>]*>([\s\S]*?)<\/main>/,
)?.[1];
assert.ok(main, "Landing main must exist");
const mainIds = [...main.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(
  new Set(mainIds).size,
  mainIds.length,
  "IDs in main must be unique",
);
const leadForms = html.match(/<form\b[^>]*data-lr-form[\s\S]*?<\/form>/g) || [];
assert.equal(leadForms.length, 3);
for (const form of leadForms) {
  assert.ok(!form.includes("lr-form__details"));
  assert.ok(!/name="(?:model|problem)"/.test(form));
  assert.ok(form.includes('name="phone"'));
  assert.ok(form.includes('name="consent"'));
}
const data = JSON.parse(
  readFileSync(
    new URL("../src/data/laptop-service.json", import.meta.url),
    "utf8",
  ),
);
assert.equal((html.match(/id="hop-landing"/g) || []).length, 1);
assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
assert.match(html, /<h1[^>]+id="lr-hero-title"/);
const homeHero = html.match(/<section id="lr-hero"[\s\S]*?<\/section>/)?.[0];
assert.ok(homeHero?.includes("lr-hero--home"));
const homeHeroText = homeHero.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
assert.match(
  homeHeroText,
  /Обычная диагностика в мастерской — бесплатно, даже при отказе от ремонта\./,
);
assert.match(homeHeroText, /Стоимость согласуем до начала работ\./);
assert.ok(!homeHero.includes('class="lr-eyebrow"'));
assert.equal((homeHero.match(/<video\b/g) || []).length, 1);
const heroVideo = homeHero.match(/<video\b[^>]*>/)?.[0];
assert.ok(!heroVideo.includes("controls"));
assert.match(heroVideo, /\bautoplay\b/);
assert.match(heroVideo, /\bloop\b/);
assert.match(heroVideo, /\bmuted\b/);
assert.match(heroVideo, /\bplaysinline\b/);
assert.match(heroVideo, /\bdata-lr-hero-video\b/);
assert.match(heroVideo, /\bposter="\/media\/mobile-lab-exterior\.webp"/);
assert.match(homeHero, /<source\b[^>]*src="\/media\/notebook-auto\.mp4"/);
assert.ok(!homeHero.includes("data-lr-service-format"));
assert.ok(!homeHero.includes("data-lr-format-view"));
assert.ok(!homeHero.includes("data-lr-selected-format"));
const heroHeading = homeHero.match(
  /<h1[^>]*id="lr-hero-title"[^>]*>[\s\S]*?<\/h1>/,
)?.[0];
const heroHeadingText = heroHeading
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
assert.equal(
  heroHeadingText,
  "Ремонт ноутбуков на дому или в сервисном центре в Санкт-Петербурге и Ленинградской области",
);
assert.ok(!homeHeroText.includes("40–90"));
assert.ok(homeHero.includes("data-lr-hero-cta"));
const heroPriceAction = homeHero.match(
  /<a\b[^>]*data-lr-quiz-open[^>]*>[\s\S]*?<\/a>/,
)?.[0];
assert.ok(heroPriceAction?.includes('href="#lr-quiz"'));
assert.ok(heroPriceAction.includes("Узнать стоимость ремонта"));
assert.ok(!heroPriceAction.includes("data-lr-lead-open"));
const heroRequestAction = homeHero.match(
  /<a\b[^>]*data-source="hero-request"[^>]*>[\s\S]*?<\/a>/,
)?.[0];
assert.ok(heroRequestAction?.includes("data-lr-lead-open"));
assert.ok(heroRequestAction.includes("Оставить заявку"));
assert.ok(!heroRequestAction.includes("data-lr-quiz-open"));
assert.ok(
  !html.includes('id="lr-benefits"'),
  "Home benefits are integrated into relevant sections",
);
const brandHtml = readFileSync(
  new URL("../dist/remont-noutbukov-acer-spb.htm/index.html", import.meta.url),
  "utf8",
);
const benefitsSection = brandHtml.match(
  /<section id="lr-benefits"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(
  benefitsSection,
  "Brand pages must retain the six illustrated benefits",
);
assert.equal(
  (benefitsSection.match(/<article\b[^>]*data-benefit-row/g) || []).length,
  6,
);
for (const benefit of data.benefits.items) {
  assert.ok(benefit.text.trim(), benefit.title);
  assert.ok(benefitsSection.includes(benefit.title), benefit.title);
  assert.ok(benefitsSection.includes(benefit.text), benefit.title);
  if (benefit.image) {
    assert.ok(benefitsSection.includes(benefit.image), benefit.title);
    assert.ok(
      existsSync(new URL(`../public${benefit.image}`, import.meta.url)),
      benefit.image,
    );
  }
}
const casesEnabled = !readFileSync(
  new URL("../src/pages/index.astro", import.meta.url),
  "utf8",
).includes("<!-- <RepairCases /> -->");
const ids = [
  "hero",
  "reviews",
  "prices",
  "formats",
  "lab",
  "quiz",
  "workshop-gallery",
  "process",
  "expertise",
  "business-trust",
  "director",
  "guarantee",
  "quiz-callout",
  "locations",
  ...(casesEnabled ? ["repair-cases"] : []),
  "service-guide",
  "symptoms",
  "manufacturers",
  "faq",
  "contact",
];
assert.deepEqual(
  [...main.matchAll(/<section\b[^>]*\bid="lr-([^"]+)"/g)].map(
    (match) => match[1],
  ),
  ids,
  "Home section order must follow the approved architecture",
);
const positions = ids.map((id) => html.indexOf(`id="lr-${id}"`));
assert.ok(
  positions.every((pos, i) => pos >= 0 && (!i || pos > positions[i - 1])),
);
for (const key of ["formats", "lab", "process", "expertise", "faq"]) {
  for (const item of data[key].items)
    assert.ok(html.includes(item.title), `${key}: ${item.title}`);
}
const formatsSection = html.match(
  /<section id="lr-formats"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(formatsSection);
assert.equal(
  (formatsSection.match(/<article class="lr-format\b/g) || []).length,
  4,
);
assert.deepEqual(
  data.formats.items.map((item) => item.format),
  ["at-home", "mobile-lab", "workshop", "courier"],
);
for (const format of ["at-home", "mobile-lab"])
  assert.ok(
    formatsSection.includes(`data-source="formats" data-format="${format}"`),
  );
assert.ok(formatsSection.includes('href="#lr-map-workshops"'));
assert.ok(
  formatsSection.includes(
    'data-source="formats:courier" data-format="courier"',
  ),
);
assert.ok(!formatsSection.includes("lr-formats__trust"));
for (const card of formatsSection.match(/<article\b[\s\S]*?<\/article>/g) ||
  []) {
  const features = card.match(
    /<ul class="lr-format__features">[\s\S]*?<\/ul>/,
  )?.[0];
  assert.ok(features, "Every format must explain its benefits");
  const count = (features.match(/<li>/g) || []).length;
  assert.equal(count, 2, "Each format has two checked benefits");
}
const labSection = html.match(/<section id="lr-lab"[\s\S]*?<\/section>/)?.[0];
assert.ok(labSection);
assert.match(labSection, /<video\b[^>]*\bcontrols\b/);
assert.ok(labSection.includes('src="/media/mobile-lab-tour.mp4"'));
assert.ok(labSection.includes('href="/media/mobile-lab-tour.mp4"'));
assert.ok(!labSection.includes('src="/media/mobile-lab-exterior.webp"'));
assert.ok(labSection.includes('data-source="lab" data-format="mobile-lab"'));
assert.ok(labSection.includes("data-lr-video-player"));
assert.ok(labSection.includes("data-lr-player-video"));
assert.match(labSection, /<button\b[^>]*data-lr-player-play[^>]*\bhidden\b/);
const processSection = html.match(
  /<section id="lr-process"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(processSection?.includes("lr-process--steps"));
assert.equal(
  (processSection.match(/<li>/g) || []).length,
  data.process.items.length,
);
assert.doesNotMatch(processSection, /<details\b|data-source="process"/);
for (const item of data.process.items) {
  assert.ok(processSection.includes(item.title), item.title);
  assert.ok(processSection.includes(item.text), item.title);
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
const firstPriceRow = priceSection.match(
  /<tbody\b[^>]*>\s*(<tr\b[\s\S]*?<\/tr>)/,
)?.[1];
assert.ok(firstPriceRow?.includes("Обычная диагностика"));
assert.ok(firstPriceRow.includes("в мастерской"));
assert.ok(firstPriceRow.includes("0 ₽"));
assert.ok(firstPriceRow.includes("Бесплатно, даже при отказе от ремонта"));
assert.equal((priceSection.match(/<table\b/g) || []).length, 2);
assert.equal((priceSection.match(/<caption\b/g) || []).length, 2);
assert.equal((priceSection.match(/scope="col"/g) || []).length, 6);
for (const table of priceSection.match(/<table\b[\s\S]*?<\/table>/g) || []) {
  const headers = [
    ...table.matchAll(/<th\b([^>]*scope="col"[^>]*)>([\s\S]*?)<\/th>/g),
  ];
  assert.equal(headers.length, 3);
  assert.deepEqual(
    headers.map((header) => header[2].replace(/<[^>]+>/g, " ").trim()),
    ["Работа", "Время работы", "Стоимость работы"],
  );
  for (const header of headers) {
    assert.ok(header[2].includes('class="lr-visually-hidden"'));
    assert.doesNotMatch(header[1], /(?:^|\s)hidden(?:\s|=|$)|aria-hidden/);
  }
}
assert.ok(priceSection.includes("Сколько стоит ремонт ноутбука"));
assert.ok(priceSection.includes("Указана стоимость работы без запчастей"));
assert.ok(priceSection.includes("срочная — 500 ₽"));
assert.doesNotMatch(
  priceSection,
  /<details\b|data-lr-estimate|data-lr-lead-open/,
);
assert.doesNotMatch(priceSection, /lr-eyebrow|lr-prices__note|<time\b/);
const protectionSection = html.match(
  /<section id="lr-guarantee"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(protectionSection?.includes('id="lr-security"'));
assert.doesNotMatch(protectionSection, /<details\b|lr-guarantee__support/);
const protectionFacts = protectionSection;
assert.equal((protectionFacts.match(/<article>/g) || []).length, 3);
for (const text of [
  data.guarantee.fields["Большой факт"],
  "Смета до работ",
  "Проверка до оплаты",
])
  assert.ok(protectionFacts.includes(text), text);
for (const text of [
  "Стоимость работ и деталей согласуем заранее",
  "Покажем результат и проверим ноутбук вместе с вами",
])
  assert.ok(protectionFacts.includes(text), text);
const director = html.match(
  /<section\b[^>]*id="lr-director"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(director.includes("/media/director-sorokin-640.webp"));
const portraitPosition = director.indexOf("<figure");
const identityPosition = director.indexOf('class="lr-director__name"');
const signaturePosition = director.indexOf("data-lr-signature");
assert.ok(
  portraitPosition < identityPosition && identityPosition < signaturePosition,
);
const signature = director.match(
  /<svg\b[^>]*data-lr-signature[\s\S]*?<\/svg>/,
)?.[0];
assert.ok(signature?.includes('aria-hidden="true"'));
assert.equal((signature.match(/<path\b/g) || []).length, 3);
assert.doesNotMatch(
  signature,
  /data-lr-signature-revealed|style=|\shidden(?:\s|>)/,
);
assert.match(director, /<a\b[^>]*data-lr-lead-open[^>]*data-source="director"/);
assert.ok(
  !html.includes('id="lr-timeline"'),
  "Times must be integrated into pricing",
);
assert.equal((main.match(/\sdata-lr-quiz(?:[\s=>])/g) || []).length, 1);
assert.equal((main.match(/\sdata-lr-quiz-home(?:[\s=>])/g) || []).length, 1);
assert.equal((main.match(/id="lr-quiz-form-phone"/g) || []).length, 1);
assert.equal((main.match(/id="lr-quiz-modal"/g) || []).length, 1);
assert.ok(main.indexOf('id="lr-quiz-modal"') > main.indexOf('id="lr-contact"'));
const manufacturerSection = html.match(
  /<section\b[^>]*id="lr-manufacturers"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(manufacturerSection, "Manufacturer navigation must exist");
const manufacturerCards = [
  ...manufacturerSection.matchAll(
    /<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>/g,
  ),
];
assert.equal(manufacturerCards.length, 40);
const servicePages = JSON.parse(
  readFileSync(
    new URL("../src/data/service-pages.json", import.meta.url),
    "utf8",
  ),
);
const manufacturerRoutes = [...servicePages.brands, servicePages.macbook].map(
  ({ slug }) => `/${slug}.htm`,
);
assert.deepEqual(
  manufacturerCards.map((match) => match[1]).sort(),
  manufacturerRoutes.sort(),
);
for (const match of manufacturerCards)
  assert.ok(
    existsSync(new URL(`../dist${match[1]}/index.html`, import.meta.url)),
    match[1],
  );
const featuredManufacturerCards = manufacturerCards.filter((match) =>
  match[0].includes("<img"),
);
assert.equal(featuredManufacturerCards.length, 10);
assert.ok(!manufacturerSection.includes("manufacturer-undefined"));
const manufacturerImages = featuredManufacturerCards.map((match) => {
  const path = match[0].match(/<img\b[^>]*src="(\/media\/[^" ]+\.svg)"/)?.[1];
  assert.ok(path, "Every featured manufacturer must use a local SVG");
  assert.ok(
    readFileSync(new URL(`../public${path}`, import.meta.url), "utf8").includes(
      "<svg",
    ),
    path,
  );
  return path;
});
assert.equal(new Set(manufacturerImages).size, 10);
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
    if (
      rule.parent.type === "atrule" &&
      rule.parent.name.endsWith("keyframes")
    ) {
      assert.ok(rule.parent.params.startsWith("lr-"), rule.parent.params);
      return;
    }
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

const homeFactList = homeHero.match(
  /<ul class="lr-hero__facts"[\s\S]*?<\/ul>/,
)[0];
const homeFacts = [...homeFactList.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map(
  ([, title]) => title,
);
assert.equal(homeFacts.length, 4);
for (const fact of homeFacts) assert.ok(brandHtml.includes(fact), fact);

assert.ok(
  html.includes('id="lr-symptoms"'),
  "Home must include symptoms section after SEO block",
);
assert.equal(
  (html.match(/<a class="lr-symptom"[\s\S]*?<\/a>/g) || []).length,
  8,
);
assert.equal(
  (html.match(/<a class="lr-symptoms__modern-card"[\s\S]*?<\/a>/g) || [])
    .length,
  0,
);
const symptomCards =
  brandHtml.match(/<a class="lr-symptom"[\s\S]*?<\/a>/g) || [];
assert.equal(symptomCards.length, 8);
assert.equal(
  (brandHtml.match(/<a class="lr-symptoms__modern-card"[\s\S]*?<\/a>/g) || [])
    .length,
  0,
);
assert.ok(!html.includes('id="lr-laptop-failures"'));
assert.equal(new Set(data.symptoms.items.map((item) => item.slug)).size, 9);
const secondarySymptom = data.symptoms.items.find(
  (item) => item.slug === "remont-cd-dvd-privoda-noutbuka",
);
assert.ok(secondarySymptom);
const secondarySymptomLink = brandHtml.match(
  /<p class="lr-symptoms__secondary">[\s\S]*?<\/p>/,
)?.[0];
assert.ok(
  secondarySymptomLink?.includes('href="/' + secondarySymptom.slug + '.htm"'),
);
assert.ok(!symptomCards.join("").includes(secondarySymptom.slug));
const symptomGroups = brandHtml.match(
  /<nav class="lr-symptoms__groups"[\s\S]*?<\/nav>/,
)?.[0];
assert.ok(symptomGroups);
assert.equal(
  (symptomGroups.match(/class="lr-symptoms__group"/g) || []).length,
  4,
);
for (const group of [
  "Поломка",
  "Программы и настройка",
  "Ускорение и апгрейд",
  "Чистка и перегрев",
]) {
  assert.ok(symptomGroups.includes(group));
}
data.symptoms.items
  .filter((item) => item !== secondarySymptom)
  .forEach((item, i) => {
    assert.ok(symptomCards[i].includes(item.image), item.title);
    assert.ok(!symptomCards[i].includes("lr-symptom__price"), item.title);
    assert.ok(symptomCards[i].includes(item.title), item.title);
    assert.ok(!symptomCards[i].includes(item.text), item.title);
    if (item.priceWork)
      assert.ok(!symptomCards[i].includes(item.priceWork), item.title);
    assert.ok(
      symptomCards[i].includes('href="/' + item.slug + '.htm"'),
      item.slug,
    );
    assert.match(symptomCards[i], /href="\/[a-z-]+\.htm"/);
    assert.ok(!/<button[ >]/.test(symptomCards[i]), item.title);
  });
const directory = JSON.parse(
  readFileSync(new URL("../src/data/workshops.json", import.meta.url), "utf8"),
);
const locationsSection = html.match(
  /<section id="lr-locations"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(locationsSection, "Location directory must exist");
assert.equal(directory.workshops.length, 24);
assert.equal(new Set(directory.workshops.map(({ id }) => id)).size, 24);
assert.equal(
  new Set(directory.workshops.map(({ city, address }) => `${city}, ${address}`))
    .size,
  24,
);
assert.equal(new URL(directory.sourceUrl).origin, "https://www.lenremont.ru");
assert.match(directory.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
assert.match(directory.phone, /^\+7\d{10}$/);
assert.ok(!locationsSection.includes("data-lr-map-placeholder"));
assert.ok(!locationsSection.includes("lr-workshop-card"));
assert.ok(!locationsSection.includes("lr-workshop-directory-more"));
const mapSlots = [
  ...locationsSection.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g),
];
assert.equal(mapSlots.length, 2, "Two static map integration slots must exist");
for (const [index, [slot, title]] of [
  ["workshops", "Карта всех мастерских"],
  ["address", "Выберите свой адрес"],
].entries()) {
  assert.ok(mapSlots[index][1].includes(`id="lr-map-${slot}"`));
  assert.ok(mapSlots[index][1].includes(`data-lr-map-slot="${slot}"`));
  const heading = mapSlots[index][2].match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1];
  assert.equal(heading?.trim(), title);
  assert.ok(mapSlots[index][2].includes("lr-location-map--pending"));
  assert.ok(mapSlots[index][2].includes("Здесь будет карта"));
}
assert.doesNotMatch(locationsSection, /<iframe\b|<input\b|<button\b|<select\b/);
directory.workshops.forEach((workshop) => {
  assert.match(workshop.id, /^[a-z0-9-]+$/);
  assert.ok(
    workshop.address.trim() && workshop.city.trim() && workshop.metro.trim(),
    workshop.id,
  );
  const hours = directory.hours[workshop.hours];
  assert.ok(Array.isArray(hours) && hours.length > 0, `Hours: ${workshop.id}`);
  const directions = new URL(workshop.directionsUrl);
  assert.equal(directions.origin, "https://www.lenremont.ru", workshop.id);
  for (const line of hours) assert.ok(line.trim(), workshop.id);
});
assert.ok(html.includes('id="lr-map-workshops"'));
assert.ok(!html.includes('id="lr-map-pickup"'));
assert.ok(!locationsSection.includes('data-source="locations"'));
console.log(
  "Brand symptom navigation, 24 source addresses and two static map integration slots: passed.",
);

for (const [, anchor] of html.matchAll(/href="#([^" ]+)"/g)) {
  assert.ok(html.includes('id="' + anchor + '"'), anchor);
}
assert.equal((html.match(/data-lr-qr-disclosure/g) || []).length, 0);
assert.equal(
  (html.match(/class="lr-social-links__qr lr-social-links__qr--/g) || [])
    .length,
  8,
);
for (const channel of ["vk", "tg", "max", "whatsapp"]) {
  const path = "/media/lr-qr-" + channel + ".svg";
  assert.equal(html.split('src="' + path + '"').length - 1, 2, channel);
  const svg = readFileSync(
    new URL("../public" + path, import.meta.url),
    "utf8",
  );
  assert.ok(svg.includes('fill="#000"'), channel);
  assert.ok(
    svg.includes('<rect width="300" height="300" fill="#fff"'),
    channel,
  );
  assert.ok(!html.includes("/media/lr-qr-" + channel + ".webp"), channel);
}
assert.equal(
  (html.match(/src="\/media\/lr-qr-whatsapp.svg"/g) || []).length,
  2,
);
assert.ok(
  existsSync(new URL("../public/media/lr-qr-whatsapp.svg", import.meta.url)),
);
assert.equal(
  (html.match(/href="whatsapp:\/\/send\?phone=78127023333"/g) || []).length,
  4,
);
assert.equal((html.match(/aria-label="Написать в WhatsApp"/g) || []).length, 2);
assert.equal(
  (
    html.match(
      /href="https:\/\/www.lenremont.ru\/politika-obrabotki-personalnyh-dannyh.htm"/g,
    ) || []
  ).length,
  3,
);
assert.ok(!brandHtml.includes(data.symptoms.fields["Пояснение цены"]));
assert.ok(html.includes('href="#lr-map-workshops"'));
const homeFaq = html.match(/<section id="lr-faq"[\s\S]*?<\/section>/)?.[0];
assert.ok(homeFaq && !homeFaq.includes("data-lr-question"));
assert.equal(
  (homeFaq.match(/<details\b/g) || []).length,
  data.faq.items.length,
);
const homeContact = html.match(
  /<section id="lr-contact"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(homeContact.includes("Позвоните нам по телефону"));
assert.ok(homeContact.includes("Или напишите нам в мессенджере"));
assert.ok(!homeContact.includes(data.contact.fields["Подпись режима"]));
assert.ok(
  !homeContact.includes("Пришлите модель ноутбука и описание проблемы."),
);
assert.ok(brandHtml.includes("Позвоните нам по телефону"));
assert.ok(brandHtml.includes("Или напишите нам в мессенджере"));

const businessSection = html.match(
  /<section id="lr-business-trust"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(businessSection, "Corporate and parts conditions must exist");
for (const target of ["tel:+78126404804", "mailto:lenremont@lenrem.ru"])
  assert.ok(businessSection.includes(`href="${target}"`), target);
assert.ok(
  !businessSection.includes(
    'href="https://www.lenremont.ru/juridicheskim-licam.htm"',
  ),
);
assert.ok(businessSection.includes('data-source="business-trust-parts"'));
assert.ok(!businessSection.includes("только оригинальные"));
assert.ok(!businessSection.includes("сертифицированный сервис"));
const seoSection = html.match(
  /<section id="lr-service-guide"[\s\S]*?<\/section>/,
)?.[0];
assert.equal((seoSection.match(/<article\b/g) || []).length, 6);
assert.deepEqual(
  [...seoSection.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((link) => link[1]),
  [
    "#lr-expertise",
    "#lr-prices",
    "#lr-locations",
    "#lr-formats",
    "#lr-guarantee",
  ],
);
console.log(
  "Anchors, price caveat, privacy links and persistent QR codes: passed.",
);
