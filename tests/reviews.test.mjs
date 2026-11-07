import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "./read-normalized.mjs";

const reviews = JSON.parse(
  readFileSync(new URL("../src/data/reviews.json", import.meta.url), "utf8"),
);
const html = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const section = html.match(/<section id="lr-reviews"[\s\S]*?<\/section>/)?.[0];

assert.ok(section, "Reviews section must be built");
assert.equal(reviews.items.length, 27);
assert.equal(new Set(reviews.items.map((review) => review.name)).size, 27);
const avatarReviews = reviews.items.filter((review) => review.avatar);
assert.equal(avatarReviews.length, 24);
assert.deepEqual(
  avatarReviews.map((review) => review.avatar).sort(),
  Array.from(
    { length: 24 },
    (_, index) =>
      `/media/review-avatar-${String(index + 1).padStart(2, "0")}.webp`,
  ),
);
assert.equal((section.match(/<article class="lr-review">/g) || []).length, 26);
assert.equal((section.match(/Оценка 1 из 5/g) || []).length, 0);
assert.ok(!section.includes("Петр Перцев"));
assert.equal((section.match(/Оценка 4 из 5/g) || []).length, 1);
assert.equal((section.match(/Оценка 5 из 5/g) || []).length, 25);
assert.match(section, /data-lr-review-track/);
assert.match(section, /aria-roledescription="карусель"/);
assert.doesNotMatch(
  section,
  /data-lr-review-prev|data-lr-review-next|lr-review__date|lr-review__footer/,
);
for (const card of section.match(
  /<article class="lr-review">[\s\S]*?<\/article>/g,
) || []) {
  assert.match(
    card.match(/<header[\s\S]*?<\/header>/)?.[0] || "",
    /lr-review__source/,
  );
}
assert.doesNotMatch(section, /Показать ещё|lr-reviews__more/);

for (const review of reviews.items) {
  if (review.name === "Петр Перцев") continue;
  assert.ok(
    Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5,
    review.name,
  );
  assert.ok(review.text.trim() && review.date.trim(), review.name);
  const source = reviews.sources[review.source];
  assert.ok(source, `Missing source for ${review.name}`);
  assert.equal(new URL(source.url).protocol, "https:");
  assert.ok(
    section.includes(review.name) && section.includes(review.text),
    review.name,
  );
  if (review.avatar) {
    assert.ok(section.includes(review.avatar), review.name);
    assert.ok(
      existsSync(new URL(`../public${review.avatar}`, import.meta.url)),
    );
  }
}
const photoReview = reviews.items.find((review) => review.name === "DS");
assert.ok(photoReview);
assert.equal(photoReview.avatar, undefined, "Do not invent an avatar for DS");
assert.equal(photoReview.subject, "Ремонт iMac");
assert.equal(photoReview.source, "yandexZvezdnaya");
assert.equal(new URL(photoReview.reviewUrl).hostname, "yandex.ru");
assert.equal(photoReview.photos.length, 1);
const photo = photoReview.photos[0];
assert.equal(photo.src, "/media/review-ds-imac-2023.jpg");
assert.deepEqual([photo.width, photo.height], [113, 150]);
assert.match(photo.alt, /iMac/);
const photoBytes = readFileSync(
  new URL(`../public${photo.src}`, import.meta.url),
);
assert.equal(photoBytes.readUInt16BE(0), 0xffd8, "Review photo must be JPEG");
const photoCard = section
  .match(/<article class="lr-review">[\s\S]*?<\/article>/g)
  ?.find((card) => card.includes("/media/review-result-candid-imac.webp"));
assert.ok(
  photoCard?.includes(photoReview.subject),
  "Photo subject must be explicit",
);
assert.ok(photoCard.includes('href="/media/review-result-candid-imac.webp"'));
assert.ok(!photoCard.includes(photoReview.reviewUrl));
assert.ok(photoCard.includes("Яндекс Карты"));
const computerReview = reviews.items.find(
  (review) => review.name === "Егор Налимов",
);
assert.equal(computerReview.subject, "Чистка настольного компьютера");
assert.equal(computerReview.source, "yandexAvia");
assert.equal(computerReview.photos.length, 1);
assert.ok(
  existsSync(
    new URL(`../public${computerReview.photos[0].src}`, import.meta.url),
  ),
);
assert.ok(section.includes(computerReview.subject));
assert.ok(section.includes("/media/review-result-candid-desktop.webp"));
for (const rating of reviews.ratings) {
  assert.ok(reviews.sources[rating.source]);
  assert.ok(rating.rating > 0 && rating.rating <= 5);
  assert.ok(Number.isInteger(rating.ratingCount) && rating.ratingCount > 0);
  assert.match(rating.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
}
for (const aggregator of reviews.aggregators) {
  assert.ok(section.includes(aggregator.name));
  assert.ok(aggregator.rating > 0 && aggregator.rating <= 5);
  assert.ok(
    Number.isInteger(aggregator.ratingCount) && aggregator.ratingCount > 0,
  );
}
assert.equal(reviews.aggregators.length, 3);
const award = section.match(/<ul class="lr-documents"[\s\S]*?<\/ul>/)?.[0];
assert.ok(
  award,
  "The document gallery is separate from aggregator scores and client reviews",
);
for (const title of [
  "Премия «Знак качества»",
  "«Личный бренд — 2025»",
  "Благодарственное письмо",
  "За вклад в развитие Санкт-Петербурга",
]) {
  assert.ok(award.includes(title), title);
}
assert.equal((award.match(/data-lr-photo-open/g) || []).length, 4);
assert.ok(
  section.indexOf("lr-reviews__documents") > section.lastIndexOf("</article>"),
);
assert.equal((award.match(/class="lr-document"/g) || []).length, 4);
assert.doesNotMatch(
  section,
  /МАКЕТ|Ожидаем оригинал|оригиналы документов пока/,
);
assert.equal((award.match(/class="lr-document__emblem"/g) || []).length, 4);
assert.doesNotMatch(award, /<img\b/);
const awardProofs = [...award.matchAll(/href="([^"]+)"/g)];
assert.equal(awardProofs.length, 4);
for (const [, href] of awardProofs)
  assert.ok(existsSync(new URL(`../public${href}`, import.meta.url)));
assert.match(section, /lr-review__source--yandex/);
assert.doesNotMatch(section, /lr-reviews__illustrations|repair-illustration-/);
const illustrations = JSON.parse(
  readFileSync(
    new URL("../src/data/review-illustrations.json", import.meta.url),
    "utf8",
  ),
);
assert.equal(Object.keys(illustrations).length, 26);
assert.equal(
  (section.match(/class="lr-review__illustration-label"/g) || []).length,
  0,
);
for (const review of reviews.items) {
  if (review.name === "Петр Перцев") {
    assert.equal(illustrations[review.name], undefined);
    continue;
  }
  const photo = illustrations[review.name];
  assert.ok(photo?.illustration && photo.alt.includes("создано с ИИ"));
  assert.match(photo.src, /^\/media\/review-result-candid-[a-z-]+\.webp$/);
  assert.ok(photo.width >= 900 && photo.height >= 675);
  assert.ok(section.includes(photo.src));
  assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)));
}
const ratings = section.match(
  /<ul class="lr-reviews__ratings"[\s\S]*?<\/ul>/,
)?.[0];
assert.equal(
  (ratings.match(/<div class="lr-reviews__rating-card\b/g) || []).length,
  3,
);
assert.equal((ratings.match(/lr-reviews__rating-platform/g) || []).length, 3);
const ratingLinks = [
  ...ratings.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
];
assert.equal(
  ratingLinks.length,
  0,
  "Aggregator ratings must not contain links",
);
assert.doesNotMatch(award, /№\s*1|номер\s*один/i);
assert.ok(!award.includes("lr-reviews__rating-stars"));
assert.doesNotMatch(section, /lr-reviews__ratings-reference|lr-reviews-hint/);
assert.doesNotMatch(section, /data-lr-review-position/);
console.log(
  "24 laptop reviews and two explicitly labelled computer photo reviews: passed.",
);

const { initializeReviewSlider } = await import("../src/scripts/landing.js");
const handlers = new Map();
const trackHandlers = new Map();
let step = 340;
let frameWidth;
let reduceMotion = true;
const motionHandlers = new Map();
globalThis.matchMedia = () => ({
  get matches() {
    return reduceMotion;
  },
  addEventListener: (type, listener) => motionHandlers.set(type, listener),
});
let frameId = 0;
const animationFrames = new Map();
globalThis.requestAnimationFrame = (callback) => {
  animationFrames.set(++frameId, callback);
  return frameId;
};
globalThis.cancelAnimationFrame = (id) => animationFrames.delete(id);
const finishAnimation = () => {
  const [id, callback] = animationFrames.entries().next().value;
  animationFrames.delete(id);
  callback(performance.now() + 600);
};
const cards = Array.from({ length: 25 }, (_, index) => ({
  dataset: {},
  inert: false,
  get offsetLeft() {
    return index * step;
  },
}));
const previous = {
  disabled: false,
  addEventListener: (type, listener) =>
    handlers.set("previous:" + type, listener),
};
const next = {
  disabled: false,
  addEventListener: (type, listener) => handlers.set("next:" + type, listener),
};
const controls = { hidden: true };
const track = {
  dataset: {},
  captured: null,
  setPointerCapture(id) {
    this.captured = id;
  },
  hasPointerCapture(id) {
    return this.captured === id;
  },
  releasePointerCapture() {
    this.captured = null;
  },
  children: cards,
  clientWidth: 1000,
  get scrollWidth() {
    return cards.length * step - 20;
  },
  scrollLeft: 0,
  addEventListener: (type, listener) => trackHandlers.set(type, listener),
  scrollTo({ left }) {
    this.scrollLeft = Math.min(
      Math.max(0, left),
      this.scrollWidth - this.clientWidth,
    );
    trackHandlers.get("scroll")?.();
  },
};
const elements = {
  "[data-lr-review-track]": track,
  "[data-lr-review-frame]": {
    get clientWidth() {
      return frameWidth ?? track.clientWidth + 32;
    },
  },
  "[data-lr-review-prev]": previous,
  "[data-lr-review-next]": next,
  "[data-lr-review-controls]": controls,
};
assert.doesNotThrow(() =>
  initializeReviewSlider({
    querySelector: (selector) => elements[selector] ?? null,
  }),
);
const activeCards = () =>
  cards.flatMap((card, index) => (!card.inert ? [index + 1] : []));
assert.equal(controls.hidden, false);
assert.equal(previous.disabled, true);
assert.deepEqual(activeCards(), [1, 2, 3]);
handlers.get("next:click")();
assert.equal(track.scrollLeft, 1020);
assert.deepEqual(activeCards(), [4, 5, 6]);
handlers.get("previous:click")();
assert.equal(track.scrollLeft, 0);
const press = (key, target = track) => {
  let prevented = false;
  trackHandlers.get("keydown")({
    key,
    target,
    preventDefault: () => {
      prevented = true;
    },
  });
  return prevented;
};
assert.equal(press("End"), true);
assert.equal(next.disabled, true);
assert.deepEqual(activeCards(), [23, 24, 25]);
assert.equal(press("Home"), true);
assert.equal(previous.disabled, true);
assert.equal(
  press("ArrowRight", {}),
  false,
  "Links retain their keyboard behavior",
);
for (const viewport of [360, 390]) {
  track.clientWidth = viewport;
  frameWidth = viewport * 0.88;
  step = frameWidth - 64 + 16;
  assert.equal(press("ArrowRight"), true);
  assert.equal(track.scrollLeft, step);
  assert.deepEqual(activeCards(), [2]);
  assert.equal(cards[1].inert, false);
  assert.equal(cards[2].inert, true, "The next-card preview is not focusable");
  assert.equal(press("End"), true);
  assert.equal(next.disabled, true);
  assert.deepEqual(activeCards(), [25]);
  assert.equal(press("Home"), true);
  assert.equal(previous.disabled, true);
}
frameWidth = undefined;
step = 340;
track.clientWidth = 660;
handlers.get("next:click")();
assert.deepEqual(activeCards(), [3, 4]);
console.log(
  "Review slider: paging, endpoints, mobile, tablet and keyboard passed.",
);

assert.equal(cards[2].inert, false);
assert.equal(cards[0].inert, true);
track.clientWidth = 1000;
press("Home");
reduceMotion = false;
handlers.get("next:click")();
assert.equal(track.dataset.lrAnimating, "true");
assert.equal(animationFrames.size, 1);
handlers.get("next:click")();
assert.equal(
  animationFrames.size,
  1,
  "A repeated click replaces the running animation",
);
finishAnimation();
assert.deepEqual(activeCards(), [7, 8, 9]);
assert.equal(track.dataset.lrAnimating, undefined);
assert.equal(cards[6].dataset.lrReviewActive, "true");
assert.equal(cards[5].inert, true);
handlers.get("next:click")();
trackHandlers.get("pointerdown")({ pointerType: "touch" });
assert.equal(animationFrames.size, 0, "Swiping cancels the button animation");
handlers.get("next:click")();
reduceMotion = true;
motionHandlers.get("change")();
assert.equal(animationFrames.size, 0);
assert.deepEqual(activeCards(), [10, 11, 12]);
console.log(
  "Review motion: interrupted and repeated transitions, active cards and reduced motion passed.",
);
const pointer = (overrides = {}) => ({
  pointerType: "mouse",
  button: 0,
  buttons: 1,
  pointerId: 7,
  clientX: 600,
  target: { closest: () => null },
  preventDefault() {},
  ...overrides,
});
press("Home");
trackHandlers.get("pointerdown")(pointer());
assert.equal(track.dataset.lrDragging, "true");
assert.equal(track.captured, 7);
trackHandlers.get("pointermove")(pointer({ clientX: 180 }));
assert.equal(track.scrollLeft, 420, "The row follows the held mouse");
trackHandlers.get("pointerup")(pointer({ clientX: 180, buttons: 0 }));
assert.equal(track.scrollLeft, 340, "Release settles onto the nearest card");
assert.equal(track.dataset.lrDragging, undefined);
assert.equal(track.captured, null);
trackHandlers.get("pointerdown")(pointer({ pointerType: "touch" }));
assert.equal(
  track.dataset.lrDragging,
  undefined,
  "Touch keeps native scrolling",
);
trackHandlers.get("pointerdown")(pointer({ target: { closest: () => ({}) } }));
assert.equal(
  track.dataset.lrDragging,
  undefined,
  "Source links remain clickable",
);
trackHandlers.get("pointerdown")(pointer({ button: 2 }));
assert.equal(track.dataset.lrDragging, undefined);
trackHandlers.get("pointerdown")(pointer());
trackHandlers.get("pointermove")(pointer({ clientX: 980 }));
trackHandlers.get("pointercancel")(pointer());
assert.equal(track.scrollLeft, 0);
assert.equal(track.dataset.lrDragging, undefined);
assert.equal(track.captured, null);
console.log(
  "Review drag: held mouse, snapping, cancellation, native touch and source links passed.",
);

press("Home");
reduceMotion = false;
let actualLeft = track.scrollLeft;
Object.defineProperty(track, "scrollLeft", {
  configurable: true,
  get() {
    // Model browser snap when layout is read after snapping is re-enabled.
    if (!this.dataset.lrDragging && !this.dataset.lrAnimating)
      actualLeft = Math.round(actualLeft / step) * step;
    return actualLeft;
  },
  set(left) {
    actualLeft = left;
  },
});
trackHandlers.get("pointerdown")(pointer());
trackHandlers.get("pointermove")(pointer({ clientX: 420 }));
assert.equal(track.scrollLeft, 180);
trackHandlers.get("pointerup")(pointer({ clientX: 420, buttons: 0 }));
assert.equal(
  track.scrollLeft,
  180,
  "Release starts settling at the dragged position",
);
assert.equal(track.dataset.lrAnimating, "true");
handlers.get("next:click")();
assert.equal(
  track.scrollLeft,
  180,
  "Retargeting keeps snap disabled between animations",
);
assert.equal(animationFrames.size, 1);
finishAnimation();
assert.equal(track.dataset.lrAnimating, undefined);
assert.equal(track.scrollLeft, 1360);
handlers.get("next:click")();
track.scrollLeft = 1450;
trackHandlers.get("pointerdown")(pointer());
assert.equal(
  track.scrollLeft,
  1450,
  "Grabbing an animation does not trigger native snap",
);
trackHandlers.get("pointerup")(pointer({ buttons: 0 }));
assert.equal(
  track.scrollLeft,
  1450,
  "Releasing without dragging resumes smooth settling",
);
finishAnimation();
assert.equal(track.scrollLeft, 1360);
