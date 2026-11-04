import assert from "node:assert/strict";
import { readFileSync } from "./read-normalized.mjs";
const html = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const source = JSON.parse(
  readFileSync(new URL("../src/data/home-copy.json", import.meta.url), "utf8"),
);
const prices = html.match(/<section id="lr-prices"[\s\S]*?<\/section>/)?.[0];
assert.ok(prices);
const rows = [...prices.matchAll(/<tr>[\s\S]*?<\/tr>/g)]
  .map((match) => match[0])
  .filter((row) => row.includes("lr-price-row__action"));
const works = source.prices.groups.flatMap((group) => group.rows);
assert.equal(rows.length, works.length);
for (const [index, [work, price]] of works.entries()) {
  assert.ok(rows[index].includes(work) && rows[index].includes(price));
  const action = rows[index].match(
    /<a\b[^>]*lr-price-row__action[^>]*>[\s\S]*?<\/a>/,
  )?.[0];
  assert.ok(action?.includes("data-lr-lead-open"));
  assert.equal(
    action.match(/class="lr-price-row__value">([\s\S]*?)<\/span>/)?.[1].trim(),
    price,
    "The price itself opens the form",
  );
  assert.ok(
    action.includes(`aria-label="Уточнить стоимость: ${work}, ${price}"`),
  );
  assert.ok(!rows[index].includes("Заказать ремонт"));
  assert.ok(action.includes(`data-symptom="${work}"`));
  assert.ok(
    action.includes(
      `data-device-category="${index < source.prices.groups[0].rows.length ? "standard" : "premium"}"`,
    ),
  );
}
