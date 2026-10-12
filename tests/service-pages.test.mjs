import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parse } from "postcss";
import { readdirSync } from "node:fs";

const content = JSON.parse(
  readFileSync(
    new URL("../src/data/service-pages.json", import.meta.url),
    "utf8",
  ),
);
const source = JSON.parse(
  readFileSync(
    new URL("../src/data/laptop-service.json", import.meta.url),
    "utf8",
  ),
);
const pages = [...content.brands, ...content.problems, content.macbook];
assert.equal(content.brands.length, 9);
assert.equal(new Set(content.brands.map((page) => page.heroImage)).size, 9);
assert.equal(content.problems.length, 6);
assert.equal(new Set(content.problems.map((page) => page.heroImage)).size, 6);
assert.equal(pages.length, 16);
for (const field of ["slug", "title", "description", "h1"]) {
  assert.equal(
    new Set(pages.map((page) => page[field])).size,
    pages.length,
    field,
  );
  assert.ok(
    pages.every((page) => page[field].trim()),
    field,
  );
}
const standardWorks = source.prices.tables
  .slice(0, 2)
  .flat()
  .map(([work]) => work);
for (const problem of content.problems) {
  assert.ok(
    problem.priceWorks.every((work) => standardWorks.includes(work)),
    problem.slug,
  );
  assert.ok(
    source.symptoms.items.some(
      (item) => item.image === `/media/symptom-${problem.imageKey}.webp`,
    ),
    problem.slug,
  );
}
const rootHtml = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const allPages = new Map(pages.map((page) => [`/${page.slug}.htm`, page]));
allPages.set("/remont-noutbukov-spb.htm", null);
for (const page of pages) {
  assert.match(page.slug, /^[a-z0-9-]+$/);
  const html = readFileSync(
    new URL(`../dist/${page.slug}.htm/index.html`, import.meta.url),
    "utf8",
  );
  assert.ok(
    rootHtml.includes(`href="/${page.slug}.htm"`),
    `Discovery link: ${page.slug}`,
  );
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html lang="ru"/);
  assert.equal((html.match(/id="hop-landing"/g) || []).length, 1);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, page.slug);
  assert.ok(html.includes(page.h1), page.slug);
  if (content.brands.includes(page)) {
    const hero = html.match(/<section id="lr-hero"[\s\S]*?<\/section>/)?.[0];
    assert.ok(hero?.includes("lr-hero--brand"), page.slug);
    assert.ok(
      hero.includes('id="lr-hero-title">' + page.h1 + "</h1>"),
      page.slug,
    );
    assert.ok(hero.includes(page.lead), page.slug);
    assert.ok(hero.includes("lr-hero__brand-time"), page.slug);
    assert.ok(
      hero.includes(source.hero.fields["Срок ремонта"].split(" всего за ")[1]),
      page.slug,
    );
    for (const fact of source.hero.bullets) {
      assert.ok(
        hero.includes(fact.title) && hero.includes(fact.text),
        page.slug,
      );
    }
    for (const channel of ["ВКонтакте", "Telegram", "MAX"]) {
      assert.ok(hero.includes(channel), page.slug);
    }
    assert.ok(hero.includes('src="' + page.heroImage + '"'), page.slug);
    assert.ok(hero.includes('width="768" height="1024"'), page.slug);
    assert.ok(
      hero.includes('data-source="brand:' + page.label + '"'),
      page.slug,
    );
    assert.ok(hero.includes('href="#lr-formats"'), page.slug);
    assert.ok(
      !hero.includes("<video") &&
        hero.includes("lr-hero__facts") &&
        hero.includes("lr-quick-contacts"),
      page.slug,
    );
    assert.ok(
      html.includes(page.sectionTitle) && html.includes(page.intro),
      page.slug,
    );
    for (const item of page.checks)
      assert.ok(
        html.includes(item.title) && html.includes(item.text),
        page.slug,
      );
    for (const text of page.prepare) assert.ok(html.includes(text), page.slug);
  }
  if (content.problems.includes(page)) {
    assert.ok(html.includes(`src="${page.heroImage}"`), page.slug);
    assert.ok(html.includes('href="#lr-first-aid"'), page.slug);
    assert.ok(html.includes('id="lr-first-aid"'), page.slug);
    assert.ok(html.includes(page.warning), page.slug);
    assert.ok(html.includes(page.recommendation.title), page.slug);
    assert.ok(html.includes(page.recommendation.text), page.slug);
    assert.ok(
      html.includes(`data-source="problem:${page.imageKey}:recommendation"`),
      page.slug,
    );
    for (const text of [...page.immediate, ...page.prepare])
      assert.ok(html.includes(text), page.slug);
    for (const item of page.decisions)
      assert.ok(
        html.includes(item.title) && html.includes(item.text),
        page.slug,
      );
    for (const cause of page.causes) {
      assert.ok(
        html.includes(cause.title) && html.includes(cause.text),
        page.slug,
      );
    }
    const firstAid = html.indexOf('id="lr-first-aid"');
    const nextStep = html.indexOf('class="lr-problem-decisions"');
    assert.ok(
      firstAid < nextStep && nextStep < html.indexOf('id="lr-prices"'),
      page.slug,
    );
  }
  const guideId = content.problems.includes(page)
    ? "lr-problem-guide"
    : "lr-brand-guide";
  const sections = !content.problems.includes(page)
    ? [
        "lr-hero",
        "lr-symptoms",
        "lr-timeline",
        "lr-benefits",
        "lr-formats",
        "lr-process",
        "lr-security",
        "lr-guarantee",
        "lr-reviews",
        "lr-prices",
        guideId,
        "lr-faq",
      ]
    : [
        "lr-hero",
        guideId,
        "lr-formats",
        "lr-prices",
        "lr-guarantee",
        "lr-reviews",
        "lr-faq",
      ];
  const positions = sections.map((id) => html.indexOf('id="' + id + '"'));
  assert.ok(
    positions.every(
      (position, i) => position >= 0 && (!i || position > positions[i - 1]),
    ),
    "Service section order: " + page.slug,
  );
  assert.ok(
    html.indexOf('class="lr-section lr-related"') > positions.at(-1),
    page.slug,
  );
  assert.ok(!html.includes('id="lr-locations"'), page.slug);
  for (const format of ["mobile-lab", "workshop", "courier"])
    assert.ok(
      html.includes('data-source="formats" data-format="' + format + '"'),
      page.slug,
    );
  for (const item of page.faq)
    assert.ok(
      html.includes(item.question) && html.includes(item.answer),
      page.slug,
    );
  if (page === content.macbook) {
    for (const id of ["lr-mac-checks", "lr-mac-data", "lr-mac-model"])
      assert.ok(html.includes('id="' + id + '"'), page.slug);
    assert.ok(html.includes("https://support.apple.com/ru-ru/102767"));
    assert.ok(
      html.includes(
        "Возможность сохранения данных зависит от состояния устройства.",
      ),
    );
  }
  assert.equal(html.match(/<title>([^<]+)<\/title>/)?.[1], page.title);
  assert.ok(html.includes(`name="description" content="${page.description}"`));
  const canonical = "https://www.lenremont.ru/" + page.slug + ".htm";
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), page.slug);
  assert.ok(html.includes(`property="og:url" content="${canonical}"`));
  const json = html.match(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
  )?.[1];
  assert.ok(json, page.slug);
  const schema = JSON.parse(json);
  assert.equal(schema["@context"], "https://schema.org");
  const service = schema["@graph"].find((item) => item["@type"] === "Service");
  const breadcrumb = schema["@graph"].find(
    (item) => item["@type"] === "BreadcrumbList",
  );
  assert.equal(service.url, canonical);
  assert.equal(service.name, page.h1);
  assert.deepEqual(
    breadcrumb.itemListElement.map((item) => item.position),
    [1, 2, 3],
  );
  assert.equal(breadcrumb.itemListElement.at(-1).item, canonical);
  assert.ok(!json.includes('"aggregateRating"') && !json.includes('"Review"'));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(ids.length, new Set(ids).size, `Duplicate IDs: ${page.slug}`);
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith("#"))
      assert.ok(ids.includes(href.slice(1)), `${page.slug}: ${href}`);
    if (href.startsWith("/") && href.endsWith(".htm"))
      assert.ok(allPages.has(href), `${page.slug}: ${href}`);
  }
  for (const [, media] of html.matchAll(/(?:src|poster)="(\/media\/[^"]+)"/g)) {
    assert.ok(existsSync(new URL("../public" + media, import.meta.url)), media);
  }
  assert.equal((html.match(/data-hop-lead-form/g) || []).length, 2);
  const serviceName = content.brands.includes(page)
    ? `Ремонт ноутбуков ${page.label}`
    : content.problems.includes(page)
      ? `Ремонт ноутбука: ${page.label}`
      : "Ремонт MacBook";
  assert.deepEqual(
    [...html.matchAll(/name="quiz_service" value="([^"]+)"/g)].map(
      ([, value]) => value,
    ),
    [serviceName, serviceName],
    `Form context: ${page.slug}`,
  );
  assert.ok(
    !/<p[^>]*>\s*<(?:h[1-6]|div|table|section)\b/.test(html),
    page.slug,
  );
  assert.ok(!/<a[^>]*>[^<]*<(?:a|button|input)\b/.test(html), page.slug);
  const priceSection = html.match(
    /<section id="lr-prices"[\s\S]*?<\/section>/,
  )?.[0];
  assert.ok(
    priceSection &&
      !priceSection.includes("<input") &&
      !priceSection.includes("<button"),
  );
}
for (const file of readdirSync(
  new URL("../dist/_astro", import.meta.url),
).filter((file) => file.endsWith(".css"))) {
  const css = readFileSync(
    new URL(`../dist/_astro/${file}`, import.meta.url),
    "utf8",
  );
  parse(css).walkRules((rule) =>
    rule.selectors.forEach((selector) =>
      assert.ok(selector.startsWith("#hop-landing"), selector),
    ),
  );
}
const macSource = readFileSync(
  new URL("../src/pages/remont-macbook-spb.htm.astro", import.meta.url),
  "utf8",
);
assert.ok(
  !macSource.includes("BrandLanding") && !macSource.includes("ProblemLanding"),
);
console.log(
  "16 pages: unique SEO fields, one H1/root, JSON-LD, links, prices, media, forms and CSS isolation passed.",
);
