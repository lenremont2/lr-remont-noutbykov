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
  .filter((row) => row.includes('class="lr-home-pricing__price"'));
const works = source.prices.groups.flatMap((group) => group.rows);
assert.equal(rows.length, works.length);
for (const [index, [work, price]] of works.entries()) {
  assert.ok(rows[index].includes(work) && rows[index].includes(price));
  assert.ok(!rows[index].includes("data-lr-lead-open"));
  assert.ok(!rows[index].includes("Заказать"));
}
for (const table of prices.matchAll(/<table\b[\s\S]*?<\/table>/g)) {
  assert.ok(!table[0].includes("data-lr-lead-open"));
}
