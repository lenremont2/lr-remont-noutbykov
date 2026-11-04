import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const archive = readFileSync(new URL("./reference/landings/2026-10-30_lr-remont-noutbukov-v2.html", import.meta.url), "utf8");
const built = readFileSync(new URL("../../dist/index.html", import.meta.url), "utf8");
const plain = (value) => value.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;|&#xA0;/gi, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
const section = (html, id) => html.match(new RegExp(`<section\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`))?.[1] ?? "";
const nodes = (html, name) => [...html.matchAll(new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*class="[^"\\n]*\\b${name}\\b[^"\\n]*"[^>]*>([\\s\\S]*?)</\\1>`, "g"))].map((match) => plain(match[2]));
const results = [];
const punctuationAdaptation = new Map([["Бесплатно — даже при отказе от ремонта", "Бесплатно, даже при отказе от ремонта"]]);
const compare = (sourceId, targetId, classes, extra = []) => {
  const source = section(archive, sourceId);
  const target = plain(section(built, targetId));
  assert.ok(source && target, `${sourceId} -> ${targetId}`);
  const fragments = [...classes.flatMap((name) => nodes(source, name)), ...extra];
  assert.ok(fragments.length);
  const missing = fragments.filter((text) => !target.includes(punctuationAdaptation.get(text) ?? text));
  results.push({ sourceId, targetId, checked: fragments.length, missing });
};
compare("top", "lr-hero", ["hb-title", "hb-desc"], ["Починим ноутбук сегодня от 40 минут", "Скидка до 15% пенсионерам, студентам и семьям", "Продувка от пыли", "Пришлите фото поломки дежурному мастеру — назовём цену за 2 минуты"]);
compare("lr-what-we-fix", "lr-symptoms", ["section-title", "section-lead", "wwf-title", "wwf-tag", "wwf-copy-lead", "wwf-mini-pill", "wwf-footer-price", "wwf-footer-sub"]);
compare("lr-prices", "lr-prices", ["section-title", "section-lead", "price-item-name", "price-item-time", "price-val", "pbs-text"]);
compare("lr-formats", "lr-formats", ["section-lead", "format-title", "format-short-usp", "format-badge-top"]);
compare("lr-lab", "lr-lab", ["section-title", "lab-tag-chip"], [plain(section(archive, "lr-lab").match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1])]);
compare("lr-quiz", "lr-quiz", [], ["Залит водой, чаем или кофе", "Нужно восстановить данные и файлы", "Сломался экран, разъём или не включается", "Вирусы, программы или сбой Windows / macOS", "Срочно сегодня (за 1–2 часа)", "Сегодня вечером или завтра", "Сначала просто узнать точную цену", "Диагностика — 0 ₽ даже при отказе"]);
compare("lr-advantages", "lr-guarantee", ["section-title", "adv-stat-num", "adv-stat-title", "adv-stat-desc"], [plain(nodes(section(archive, "lr-advantages"), "director-quote")[0]).replace(/^[«“]|[»”]$/g, "")]);
compare("lr-equipment", "lr-workshop-gallery", ["section-title", "section-lead", "wz-title", "wz-desc"]);
compare("lr-b2b", "lr-business-trust", ["b2b-perk-title", "b2b-perk-sub"], ["640-48-04", "Получить КП и счёт"]);
compare("lr-all-workshops", "lr-locations", ["section-title", "section-lead"]);
const faqSource = section(archive, "lr-faq");
compare("lr-faq", "lr-faq", ["section-title", "fmw-chip"], [...faqSource.matchAll(/<details class="faq-item"[^>]*>([\s\S]*?)<\/details>/g)].slice(0, 5).flatMap(([, detail]) => [plain(detail.match(/<summary>([\s\S]*?)<\/summary>/)[1]), ...nodes(detail, "faq-body")]));
compare("lr-contact", "lr-contact", [], [plain(section(archive, "lr-contact").match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]), "Бесплатная консультация мастера за 3 минуты", "можно прислать фото или видео поломки"]);

const report = { checkedAt: "2026-11-03", punctuationAdaptation: Object.fromEntries(punctuationAdaptation), results, checkedFragments: results.reduce((sum, item) => sum + item.checked, 0), missingFragments: results.flatMap((item) => item.missing) };
writeFileSync(new URL("./copy-recheck.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
assert.deepEqual(report.missingFragments, [], "Archive copy is missing from the corresponding rendered blocks");
