import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("./reference/landings/2026-10-30_lr-remont-noutbukov-v2.html", import.meta.url), "utf8");
const text = (value) => value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
const section = (id) => html.match(new RegExp(`<section\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))[1];
const nodes = (name, source = html) => [...source.matchAll(new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*class="[^"\\n]*\\b${name}\\b[^"\\n]*"[^>]*>([\\s\\S]*?)<\\/\\1>`, "g"))].map((match) => text(match[2]));
const one = (name, source) => nodes(name, source)[0];
const symptoms = [...section("lr-what-we-fix").matchAll(/<article class="what-we-fix-card">([\s\S]*?)<\/article>/g)].map(([_, card], index) => ({
  title: one("wwf-title", card), badge: one("wwf-tag", card), text: one("wwf-copy-lead", card), tags: nodes("wwf-mini-pill", card), price: one("wwf-footer-price", card), note: one("wwf-footer-sub", card),
  image: "/media/" + card.match(/<img[^>]*src="[^\"]*\/media\/([^\"]+)"/)[1],
  href: ["/remont-noutbuka-posle-zalitiya.htm", "#lr-contact", "/noutbuk-ne-vklyuchaetsya.htm", "/noutbuk-tormozit-ne-zagruzhaetsya.htm", "/noutbuk-peregrevaetsya.htm", "/noutbuk-tormozit-ne-zagruzhaetsya.htm#lr-next"][index],
}));
const priceHtml = section("lr-prices");
const macStart = priceHtml.indexOf('id="priceTabMac"');
const priceGroups = [priceHtml.slice(0, macStart), priceHtml.slice(macStart)];
const groups = priceGroups.map((source, index) => {
  const titles = nodes("price-item-name", source);
  const prices = nodes("price-val", source);
  const times = nodes("price-item-time", source);
  assert.equal(titles.length, index ? 5 : 10);
  assert.equal(titles.length, prices.length);
  return { title: index ? "Apple MacBook" : "Все ноутбуки", diagnostic: titles[0], rows: titles.slice(1).map((title, i) => [title, prices[i + 1], times[i + 1]]) };
});
const formatKeys = ["at-home", "workshop", "mobile-lab", "courier"];
const formats = [...section("lr-formats").matchAll(/<article class="format-card">([\s\S]*?)<\/article>/g)].map(([_, card], index) => ({
  format: formatKeys[index], title: one("format-title", card), text: one("format-short-usp", card), note: one("format-badge-top", card) + (index === 0 ? " — 0 ₽" : ""),
}));
const faq = [...section("lr-faq").matchAll(/<details class="faq-item"[^>]*>([\s\S]*?)<\/details>/g)].map(([_, block]) => ({ title: text(block.match(/<summary>([\s\S]*?)<\/summary>/)[1]), text: one("faq-body", block) }));
faq[5].text = "Также ремонтируем " + nodes("fmw-chip", section("lr-faq")).join(", ") + ". Выберите марку в разделе производителей или сообщите её при обращении.";
const business = section("lr-b2b");
const businessTitles = nodes("b2b-perk-title", business);
const businessTexts = nodes("b2b-perk-sub", business);
const equipment = section("lr-equipment");
const guarantees = section("lr-advantages");
const guaranteeTitles = nodes("adv-stat-title", guarantees);
const guaranteeTexts = nodes("adv-stat-desc", guarantees);
const home = {
  hero: {
    title: "Починим ноутбук сегодня от 40 минут",
    lead: one("hero-offer-sub", section("top")).replace("ДО того, как мастер открутит первый винтик", "до начала ремонта"),
    messengerText: "Пришлите фото поломки дежурному мастеру — назовём цену за 2 минуты.",
    bullets: nodes("hb-title", section("top")).map((title, i) => ({ title, text: nodes("hb-desc", section("top"))[i] })).concat({ title: "Скидка до 15% пенсионерам, студентам и семьям", text: "Продувка от пыли — в подарок при ремонте!" }),
  },
  symptoms: { title: one("section-title", section("lr-what-we-fix")), lead: one("section-lead", section("lr-what-we-fix")), items: symptoms },
  prices: { title: one("section-title", priceHtml), lead: one("section-lead", priceHtml), groups, bonus: one("pbs-text", priceHtml) },
  formats: { title: "Выберите способ ремонта", lead: one("section-lead", section("lr-formats")), items: formats },
  lab: { title: one("section-title", section("lr-lab")), lead: text(section("lr-lab").match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]), benefits: nodes("lab-tag-chip", section("lr-lab")) },
  equipment: { title: one("section-title", equipment), lead: one("section-lead", equipment), items: nodes("wz-title", equipment).map((title, i) => ({ title, text: nodes("wz-desc", equipment)[i] })) },
  business: { title: "Ремонт ноутбуков для бизнеса", lead: text(business.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]), items: businessTitles.map((title, i) => ({ title, text: businessTexts[i] })) },
  guarantees: { title: one("section-title", guarantees), items: guaranteeTitles.map((title, i) => ({ value: nodes("adv-stat-num", guarantees)[i], title, text: guaranteeTexts[i] })) },
  director: { title: "Ремонт без сюрпризов", quote: one("director-quote", guarantees).replace(/^[«“]|[»”]$/g, "") },
  locations: { title: one("section-title", section("lr-all-workshops")), lead: one("section-lead", section("lr-all-workshops")) },
  faq: { title: one("section-title", section("lr-faq")), items: faq },
  contact: { eyebrow: "Бесплатная консультация мастера за 3 минуты", title: "Узнайте цену до выезда мастера", messengerText: "Связь в мессенджерах без ожидания: можно прислать фото или видео поломки.", lead: text(section("lr-contact").match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]) },
};
assert.equal(symptoms.length, 6);
assert.equal(home.hero.bullets.length, 5);
assert.equal(formats.length, 4);
assert.equal(faq.length, 6);
assert.equal(home.guarantees.items.length, 4);
assert.equal(home.business.items.length, 4);
writeFileSync(new URL("../../src/data/home-copy.json", import.meta.url), JSON.stringify(home, null, 2) + "\n");
console.log("Imported archive copy: 6 symptom cards, 5 Hero bullets, 13 paid price rows, 4 formats, 4 guarantees, 6 FAQ answers.");
