import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
const base = new URL("./", import.meta.url);
const root = new URL("../../", base);
const seed = JSON.parse(
  readFileSync(new URL("src/data/reviews.json", root), "utf8"),
);
const current = JSON.parse(
  readFileSync(new URL("src/data/workshops.json", root), "utf8"),
);
const workshops = current.workshops.map(({ id, city, address }) => ({
  id,
  city,
  address,
  status: "official-listed",
  networkEvidence: current.sourceUrl,
}));
const extras = [
  [
    "moscow-sadovaya",
    "Москва",
    "Садовая-Триумфальная,16 стр.3",
    "official-listed",
    "https://lenremont.moscow/contact",
  ],
  [
    "novgorod",
    "Великий Новгород",
    "Воскресенский бульвар,10",
    "official-listed",
    current.sourceUrl,
  ],
  ["pskov", "Псков", "Яна Фабрициуса,8", "official-listed", current.sourceUrl],
  [
    "zvezdnaya9",
    "Санкт-Петербург",
    "Звёздная,9к1",
    "historical-card",
    "https://yandex.ru/maps/org/lenremont/139175119866/reviews/",
  ],
  ...[
    "Белы Куна,20к1",
    "Юных Пионеров,38 лит.Ж",
    "наб.Комсомольского канала,13",
    "Полюстровский,47",
    "Кузнецовская,52к15",
    "Гончарная,3",
    "1-й Верхний пер.,10 лит.А",
  ].map((a, i) => [
    "catalog-" + i,
    "Санкт-Петербург",
    a,
    "candidate",
    "https://totadres.ru/sankt-peterburg/filials/564484",
  ]),
  ...[
    "Олеко Дундича,36к1",
    "Жака Дюкло,6к2",
    "Наставников,47к2",
    "Непокорённых,2",
    "Фрунзе,15",
  ].map((a, i) => [
    "historical-" + i,
    "Санкт-Петербург",
    a,
    "candidate",
    "https://064.ru/93856",
  ]),
  [
    "moscow-nagornaya",
    "Москва",
    "Нагорная,23к1",
    "candidate",
    "https://companypage.ru/servisyi/lenremont",
  ],
  [
    "moscow-bratislavskaya",
    "Москва",
    "Братиславская,25",
    "candidate",
    "https://redmap.ru/moskva/lenremont",
  ],
  [
    "pskov-rizhskiy",
    "Псков",
    "Рижский проспект,26",
    "candidate",
    "https://pskov.lenremont.ru/",
  ],
  [
    "tver",
    "Тверь",
    null,
    "city-mention-unverified",
    "https://v8.lenremont.ru/about.htm",
  ],
  [
    "donetsk",
    "Донецк",
    null,
    "city-mention-unverified",
    "https://v8.lenremont.ru/about.htm",
  ],
];
workshops.push(
  ...extras.map(([id, city, address, status, networkEvidence]) => ({
    id,
    city,
    address,
    status,
    networkEvidence,
  })),
);
writeFileSync(
  new URL("workshops.json", base),
  JSON.stringify(workshops, null, 2) + "\n",
);
const normalize = (raw) => {
  const u = new URL(raw);
  if (/^yandex\./.test(u.hostname)) {
    const id = u.pathname.match(/\/org\/lenremont\/(\d+)/)?.[1];
    if (id) return "https://yandex.ru/maps/org/lenremont/" + id + "/reviews/";
  }
  if (u.hostname === "www.otzovik.com") u.hostname = "otzovik.com";
  if (u.hostname === "zoon.ru")
    u.pathname = u.pathname.replace(/(?:reviews|price)\/$/, "");
  return u.href;
};
const cards = new Map();
const add = (
  url,
  platform,
  branch = "needs-address-verification",
  city = null,
  taskId = null,
) => {
  const normalized = normalize(url);
  if (!cards.has(normalized))
    cards.set(normalized, {
      taskId: taskId ?? "card-" + String(cards.size + 1).padStart(3, "0"),
      platform,
      url: normalized,
      branch,
      city,
      status: "queued",
    });
};
add(
  "https://yandex.ru/maps/org/lenremont/139175119866/reviews/",
  "Яндекс Карты",
  "Звёздная,9к1",
  "Санкт-Петербург",
  "yandex-zvezdnaya9",
);
add(
  "https://otzovik.com/reviews/kompaniya_po_remontu_bitovoy_tehniki_lenremont_russia_sankt-peterburg/",
  "Отзовик",
  "company-wide",
  "Russia",
  "otzovik-company",
);
add(
  "https://2gis.ru/spb/firm/70000001039113813/tab/reviews",
  "2ГИС",
  "Маршала Жукова,35к3",
  "Санкт-Петербург",
  "2gis-marshala",
);
add(
  "https://www.otzyvru.com/lenremont",
  "Отзыв.ру",
  "company-wide",
  "Russia",
  "otzyvru-company",
);
for (const s of Object.values(seed.sources))
  add(s.url, s.name, s.branch, "Санкт-Петербург");
const discover = readdirSync(new URL("discovery/", base)).filter((f) =>
  f.endsWith(".txt"),
);
for (const file of discover) {
  const raw = readFileSync(new URL("discovery/" + file, base), "utf8");
  for (const url of raw.match(/https?:\/\/[^)\s"<>]+/g) ?? []) {
    if (/yandex\.[^/]+\/maps\/org\/lenremont\/\d+/.test(url))
      add(url, "Яндекс Карты");
    if (/2gis\.ru\/[^/]+\/firm\/\d+/.test(url)) add(url, "2ГИС");
    if (/zoon\.ru\/[^/]+\/repair\/servisnyj_tsentr_lenremont_[^/]+\//.test(url))
      add(url, "Zoon");
    if (
      /(?:rting\.ru\/[^/]+\/co\/lenremont\/\d+|nov\.remkarta\.ru\/velikiy-novgorod\/lenremont-\d+)/.test(
        url,
      )
    )
      add(url, "Каталог");
  }
}
for (const [platform, url] of [
  [
    "Отзовик",
    "https://otzovik.com/reviews/kompaniya_po_remontu_bitovoy_tehniki_lenremont_russia_gatchina/",
  ],
  [
    "SPR",
    "https://szo.spr.ru/sankt-peterburg/remont-kompyuterov-orgtehniki-mobilnih-telefonov/reviews/lenremont.html",
  ],
  ["Klerk", "https://www.klerk.ru/company/4692/reviews/"],
  ["Firmateka", "https://firmateka.com/company/lenremont/"],
  ["Companypage", "https://companypage.ru/servisyi/lenremont"],
  ["Официальный сайт", "https://www.lenremont.ru/remont-noutbukov-spb.htm"],
  ["Официальный сайт", "https://www.lenremont.ru/testimonials.htm"],
  ["Зеркало", "https://otzovikkrd23.ru/lenremont-otzyvy/"],
  ["Зеркало", "https://tv-press.ru/lenremont-otzyvy/"],
  ["Rem-rating", "https://rem-rating.ru/lenremont-otzyvy"],
])
  add(url, platform, "company-wide");
assert.equal(
  new Set([...cards.values()].map((x) => x.taskId)).size,
  cards.size,
);
writeFileSync(
  new URL("queue.json", base),
  JSON.stringify([...cards.values()], null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      workshops: workshops.length,
      cards: cards.size,
      queue: [...cards.values()].map(({ taskId, platform, url }) => ({
        taskId,
        platform,
        url,
      })),
    },
    null,
    2,
  ),
);
