import assert from "node:assert/strict";
import { readFileSync } from "./read-normalized.mjs";

const home = JSON.parse(
  readFileSync(new URL("../src/data/home-copy.json", import.meta.url), "utf8"),
);
const html = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const plain = (value) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const text = plain(html);
const check = (value) =>
  assert.ok(text.includes(value), `Missing archive copy: ${value}`);
for (const value of [
  home.hero.title,
  home.hero.lead,
  home.hero.messengerText,
  home.symptoms.title,
  home.symptoms.lead,
  home.prices.title,
  home.prices.lead,
  home.prices.bonus,
  home.formats.lead,
  home.lab.title,
  home.lab.lead,
  home.equipment.title,
  home.equipment.lead,
  home.business.title,
  home.business.lead,
  home.guarantees.title,
  home.director.quote,
  home.locations.title,
  home.locations.lead,
  home.faq.title,
  home.contact.title,
  home.contact.lead,
  home.contact.eyebrow,
  home.contact.messengerText,
])
  check(value);
for (const items of [
  home.hero.bullets,
  home.formats.items,
  home.equipment.items,
  home.business.items,
  home.guarantees.items,
  home.faq.items,
]) {
  for (const item of items) {
    check(item.title);
    check(item.text);
  }
}
for (const value of home.lab.benefits) check(value);
const hero = html.match(/<section id="lr-hero"[\s\S]*?<\/section>/)[0];
assert.equal((hero.match(/class="lr-hero__benefit(?: |")/g) || []).length, 8);
assert.doesNotMatch(html, /БСО|бланк[а-я ]*строгой отчётности/iu);
assert.equal(home.hero.bullets[0].title, "Официальная гарантия — 1 год");
assert.match(home.hero.bullets[0].text, /договор, чек и гарантийный талон/);
for (const title of [
  "Оплата после проверки",
  "Возврат старых деталей",
  "Скидка до 15%",
  "Продувка от пыли в подарок",
])
  assert.ok(home.hero.bullets.some((bullet) => bullet.title === title));
assert.ok(hero.indexOf("lr-hero__benefits") < hero.indexOf("data-lr-hero-cta"));
const prices = html.match(/<section id="lr-prices"[\s\S]*?<\/section>/)[0];
assert.equal((prices.match(/data-lr-price-tab(?:\s|>)/g) || []).length, 2);
assert.ok(
  !/data-lr-price-panel[^>]*\bhidden\b/.test(prices),
  "Both categories remain available without JavaScript",
);
assert.deepEqual(
  home.prices.groups.map((group) => group.rows.length),
  [9, 4],
);
assert.equal(home.symptoms.items[0].price, "от 2 390 ₽");
assert.equal(
  home.prices.groups[0].rows.find(([work]) => work.includes("залития"))[1],
  "от 5 090 ₽",
  "Keep the price discrepancy requested by the user",
);
const symptoms = html.match(/<section id="lr-symptoms"[\s\S]*?<\/section>/)[0];
assert.equal(
  (symptoms.match(/class="lr-symptoms__group-media"/g) || []).length,
  12,
);
assert.doesNotMatch(
  symptoms,
  /lr-symptoms__group-copy|lr-symptoms__group-badge|lr-symptoms__group-tags|lr-symptoms__all/,
);
for (const title of [
  "Разбит экран или пропало изображение",
  "Не заряжается",
  "Неисправности клавиатуры",
  "Поломки разъёмов питания и наушников",
  "Быстро разряжается или вздулся аккумулятор",
  "Пропадает Wi-Fi и Bluetooth",
])
  assert.ok(symptoms.includes(title));
for (const item of home.symptoms.items) {
  assert.ok(symptoms.includes(item.title) && symptoms.includes(item.price));
  assert.ok(symptoms.includes(`href="${item.href}"`));
}
for (const group of home.prices.groups) {
  check(group.diagnostic);
  for (const row of group.rows) for (const value of row) check(value);
}
for (const item of home.formats.items) check(item.note);
for (const format of ["at-home", "mobile-lab", "workshop", "courier"])
  assert.ok(html.includes(`data-format-illustration="${format}"`));
assert.ok(html.indexOf('id="lr-guarantee"') < html.indexOf('id="lr-director"'));
assert.equal((html.match(/id="lr-director"/g) || []).length, 1);
