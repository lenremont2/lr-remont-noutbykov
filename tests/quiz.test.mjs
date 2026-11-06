import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "./read-normalized.mjs";
import {
  initializeQuizModal,
  initializeRepairQuiz,
} from "../src/scripts/landing.js";

const html = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const section = html.match(/<section id="lr-quiz"[\s\S]*?<\/section>/)?.[0];
assert.ok(section);
assert.equal((section.match(/data-lr-quiz-step/g) || []).length, 5);
assert.equal((section.match(/data-hop-lead-submit/g) || []).length, 1);
assert.match(section, /data-hop-lead-ignore/);
assert.doesNotMatch(
  section,
  /data-lr-quiz-next|data-lr-quiz-navigation|data-lr-quiz-finish/,
);
assert.ok(
  section.indexOf("data-lr-quiz-prev") <
    section.indexOf("data-lr-quiz-questions"),
);
assert.match(section, /aria-describedby="lr-quiz-hint"/);
assert.equal((section.match(/data-lr-quiz-answer=/g) || []).length, 3);
assert.match(section, /type="button"[^>]*data-lr-quiz-prev/);
const quizImages =
  section.match(/<img\b[^>]*lr-quiz__option-image[^>]*>/g) || [];
assert.equal(quizImages.length, 14);
for (const image of quizImages) {
  const src = image.match(/src="([^"]+)"/)?.[1];
  assert.ok(src?.startsWith("/media/"), "Quiz illustrations must be local");
  assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src);
  assert.match(image, /alt=""/);
  assert.match(image, /width="72" height="72"/);
}
for (const task of [
  "Физическая поломка",
  "Залит водой, чаем или кофе",
  "Восстановление данных",
  "Программы и настройка",
  "Чистка и перегрев",
  "Ускорение и апгрейд",
  "Другая неисправность",
]) {
  assert.ok(section.includes(`name="symptom" value="${task}"`), task);
}
const formats = [
  ...section.matchAll(
    /<input\b[^>]*type="radio"[^>]*name="service_format" value="([^"]+)"/g,
  ),
].map((match) => match[1]);
assert.deepEqual(formats, [
  "mobile-lab",
  "at-home",
  "workshop",
  "courier",
  "consultation",
]);
assert.ok(section.includes("К дому или работе"));
assert.match(section, /label[^>]*>Когда нужна помощь\?/);
assert.match(section, /name="request_timing"/);
for (const timing of [
  "Срочно сегодня (за 1–2 часа)",
  "Сегодня вечером или завтра",
  "Сначала просто узнать точную цену",
])
  assert.ok(section.includes(timing), timing);
assert.ok(section.includes("Заберём и привезём курьером по акту"));

const originalTimers = {
  setTimeout,
  clearTimeout,
  matchMedia: globalThis.matchMedia,
};
const timers = new Map();
const originalDocument = globalThis.document;
let timerId = 0;
globalThis.setTimeout = (callback, delay) => {
  timers.set(++timerId, { callback, delay });
  return timerId;
};
globalThis.clearTimeout = (id) => timers.delete(id);
const finishLoading = () => {
  for (const { callback } of [...timers.values()]) callback();
};

function createQuiz({ brand = false, reducedMotion = false } = {}) {
  const names = brand
    ? ["symptom", "service_format"]
    : ["device_category", "symptom", "service_format"];
  const answers = names.map(() => null);
  const handlers = {};
  let focused;
  let updates = 0;
  let scrolls = 0;
  const control = (name) => ({
    hidden: true,
    textContent: "",
    value: "",
    setAttribute() {},
    removeAttribute() {},
    focus: () => {
      focused = name;
    },
    addEventListener: (type, handler) => {
      handlers[`${name}:${type}`] = handler;
    },
  });
  const steps = Array.from({ length: names.length + 2 }, (_, index) => ({
    hidden: false,
    querySelector: (selector) =>
      selector === "input:checked"
        ? answers[index]
        : {
            focus: () => {
              focused = index;
            },
          },
  }));
  const location = steps[names.length];
  const workshop = control("workshop");
  Object.defineProperty(workshop, "selectedOptions", {
    get: () => [
      {
        textContent: workshop.value
          ? "Санкт-Петербург, пр. Просвещения, д. 20"
          : "Выберите мастерскую",
      },
    ],
  });
  const address = control("address");
  const place = control("place");
  const placeField = control("place-field");
  const locationTitle = control("location-title");
  const locationSummary = control("location-summary");
  const locationLabel = control("location-label");
  const locationValue = control("location-value");
  const locationViews = ["workshops", "address"].map((name) => ({
    hidden: true,
    dataset: { lrQuizLocationView: name },
  }));
  const locationSelectors = new Map([
    ["[data-lr-quiz-location-title]", locationTitle],
    ["[data-lr-quiz-address-label]", control("address-label")],
    ["[data-lr-quiz-place-field]", placeField],
    ["[data-lr-quiz-location-confirm]", control("location-confirm")],
  ]);
  const originalLocationQuery = location.querySelector;
  location.querySelector = (selector) =>
    locationSelectors.get(selector) || originalLocationQuery(selector);
  Object.assign(location, {
    querySelectorAll: () => locationViews,
    addEventListener: (type, handler) => {
      handlers[`location:${type}`] = handler;
    },
  });
  const form = {
    elements: Object.fromEntries([
      ...[
        "device_category",
        "symptom",
        "service_format",
        "workshop_id",
        "visit_address",
        "requested_repair_place",
      ].map((name) => [name, { value: "" }]),
      ["phone", { value: "" }],
      ["consent", { checked: false }],
      [
        "quiz_service",
        { value: brand ? "Ремонт ноутбуков ASUS" : "Ремонт ноутбуков" },
      ],
    ]),
  };
  const questions = {
    hidden: false,
    addEventListener: (type, handler) => {
      handlers[`questions:${type}`] = handler;
    },
    querySelector: (selector) =>
      answers[names.indexOf(selector.match(/name="([^"]+)"/)[1])],
  };
  const previous = control("previous");
  const progress = control("progress");
  const meter = control("meter");
  const hint = control("hint");
  const error = control("error");
  const toolbar = control("toolbar");
  const analysis = {
    hidden: true,
    querySelector: () => ({
      focus: () => {
        focused = "analysis";
      },
    }),
  };
  const summaries = ["device_category", "symptom", "service_format"].map(
    (name) => ({
      dataset: { lrQuizAnswer: name },
      textContent: brand && name === "device_category" ? "ASUS" : "—",
    }),
  );
  const selectors = new Map([
    ["[data-lr-quiz-questions]", questions],
    ["[data-lr-quiz-location]", location],
    ["[data-lr-quiz-workshop]", workshop],
    ["[data-lr-quiz-address]", address],
    ["[data-lr-quiz-place]", place],
    ["[data-lr-quiz-location-summary]", locationSummary],
    ["[data-lr-quiz-location-label]", locationLabel],
    ["[data-lr-quiz-location-value]", locationValue],
    ["[data-lr-form]", form],
    ["[data-lr-quiz-prev]", previous],
    ["[data-lr-quiz-progress]", progress],
    ["[data-lr-quiz-meter]", meter],
    ["[data-lr-quiz-hint]", hint],
    ["[data-lr-quiz-error]", error],
    ["[data-lr-quiz-toolbar]", toolbar],
    ["[data-lr-quiz-analysis]", analysis],
  ]);
  let busy = false;
  const quiz = {
    scrollIntoView(options) {
      assert.deepEqual(options, { block: "start", behavior: "instant" });
      scrolls += 1;
    },
    setAttribute: () => {
      busy = true;
    },
    removeAttribute: () => {
      busy = false;
    },
    querySelectorAll: (selector) =>
      selector === "[data-lr-quiz-step]" ? steps : summaries,
    querySelector: (selector) => selectors.get(selector) || { focus() {} },
    contains: () => true,
  };
  globalThis.matchMedia = () => ({ matches: reducedMotion });
  initializeRepairQuiz(quiz, () => {
    updates += 1;
  });
  const select = (index, value, label = value, keyboard = false) => {
    if (keyboard) handlers["questions:keydown"]({ key: "ArrowDown" });
    else handlers["questions:pointerdown"]();
    const input = {
      name: names[index],
      value,
      checked: true,
      matches: () => true,
      closest: (selector) =>
        selector === "label"
          ? { querySelector: () => ({ textContent: label }) }
          : steps[index],
    };
    answers[index] = input;
    handlers["questions:change"]({ target: input });
    return input;
  };
  return {
    quiz,
    steps,
    form,
    answers,
    handlers,
    previous,
    progress,
    meter,
    hint,
    error,
    toolbar,
    analysis,
    questions,
    summaries,
    location,
    workshop,
    address,
    place,
    placeField,
    locationTitle,
    locationSummary,
    locationLabel,
    locationValue,
    locationViews,
    confirmLocation: () => handlers["location-confirm:click"](),
    select,
    back: () => handlers["previous:click"](),
    repeat: (index) => handlers["questions:click"]({ target: answers[index] }),
    get focused() {
      return focused;
    },
    get updates() {
      return updates;
    },
    get busy() {
      return busy;
    },
    get scrolls() {
      return scrolls;
    },
  };
}

try {
  const home = createQuiz();
  assert.deepEqual(
    home.steps.map((step) => step.hidden),
    [false, true, true, true, true],
  );
  assert.equal(home.previous.hidden, true);
  assert.equal(home.toolbar.hidden, false);
  assert.equal(home.meter.hidden, false);
  assert.equal(home.hint.hidden, false);
  assert.equal(home.scrolls, 0, "Initialization must not move the page");
  let prevented = false;
  home.handlers["questions:submit"]({
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.ok(prevented && home.error.textContent);
  assert.equal(home.focused, 0);
  const first = home.select(
    0,
    "premium",
    "MacBook или премиальный ультрабук",
    true,
  );
  assert.equal(
    home.progress.textContent,
    "Шаг 2 из 5",
    "Keyboard selection advances automatically",
  );
  assert.equal(home.meter.value, 2);
  assert.equal(home.focused, 1);
  assert.equal(
    home.scrolls,
    1,
    "A new question keeps its top navigation visible",
  );
  home.handlers["questions:click"]({ target: first });
  assert.equal(
    home.progress.textContent,
    "Шаг 2 из 5",
    "The following click cannot skip a question",
  );
  home.select(1, "Программы и настройка");
  home.back();
  assert.equal(home.answers[1].value, "Программы и настройка");
  home.repeat(1);
  assert.equal(
    home.progress.textContent,
    "Шаг 3 из 5",
    "Saved choices remain actionable after Back",
  );
  const last = home.select(2, "courier", "Передам курьеру");
  assert.equal(home.progress.textContent, "Шаг 4 из 5");
  assert.equal(
    home.analysis.hidden,
    true,
    "The location step must precede loading",
  );
  assert.deepEqual(
    home.locationViews.map((view) => view.hidden),
    [true, false],
  );
  assert.equal(
    home.placeField.hidden,
    true,
    "Courier needs a pickup address, not a repair-place choice",
  );
  home.confirmLocation();
  assert.ok(home.error.textContent);
  assert.equal(home.focused, "address");
  home.address.value = "  Санкт-Петербург, Невский проспект, д. 10  ";
  home.confirmLocation();
  assert.equal(home.analysis.hidden, false);
  assert.equal(home.questions.hidden, true);
  assert.equal(home.hint.hidden, true);
  assert.equal(home.busy, true);
  assert.equal(home.updates, 0);
  assert.equal([...timers.values()][0].delay, 900);
  assert.deepEqual(
    home.summaries.map((item) => item.textContent),
    [
      "MacBook или премиальный ультрабук",
      "Программы и настройка",
      "Передам курьеру",
    ],
  );
  home.back();
  assert.equal(timers.size, 0, "Back cancels loading");
  assert.equal(home.analysis.hidden, true);
  assert.equal(home.progress.textContent, "Шаг 4 из 5");
  home.confirmLocation();
  home.handlers["questions:change"]({ target: last });
  assert.equal(
    timers.size,
    1,
    "Repeated events cannot schedule two transitions",
  );
  finishLoading();
  assert.equal(home.progress.textContent, "Шаг 5 из 5");
  assert.equal(
    home.form.elements.visit_address.value,
    "Санкт-Петербург, Невский проспект, д. 10",
  );
  assert.equal(
    home.locationValue.textContent,
    home.form.elements.visit_address.value,
  );
  assert.equal(home.meter.value, 5);
  assert.equal(home.busy, false);
  assert.equal(home.questions.hidden, true);
  assert.equal(home.steps[4].hidden, false);
  assert.equal(home.updates, 1);
  assert.deepEqual(
    ["device_category", "symptom", "service_format"].map(
      (name) => home.form.elements[name].value,
    ),
    ["premium", "Программы и настройка", "courier"],
  );
  home.form.elements.phone.value = "+7 (921) 234-56-78";
  home.form.elements.consent.checked = true;
  home.back();
  assert.equal(
    home.address.value.trim(),
    home.form.elements.visit_address.value,
  );
  home.back();
  home.select(2, "workshop", "Привезу в сервисный центр");
  assert.deepEqual(
    home.locationViews.map((view) => view.hidden),
    [false, true],
  );
  home.confirmLocation();
  assert.equal(home.focused, "workshop");
  assert.ok(home.error.textContent);
  home.workshop.value = "prosveshcheniya";
  home.confirmLocation();
  finishLoading();
  assert.equal(home.form.elements.workshop_id.value, "prosveshcheniya");
  assert.equal(home.locationLabel.textContent, "Мастерская");
  assert.match(home.locationValue.textContent, /Просвещения/);
  assert.equal(home.form.elements.service_format.value, "workshop");
  assert.equal(home.form.elements.phone.value, "+7 (921) 234-56-78");
  assert.equal(home.form.elements.consent.checked, true);
  assert.equal(home.updates, 2);
  home.handlers["questions:change"]({ target: last });
  assert.equal(
    home.updates,
    2,
    "Hidden questions cannot advance the final form",
  );

  const modalHandlers = {};
  const listen = (name) => (type, handler) => {
    modalHandlers[`${name}:${type}`] = handler;
  };
  const placeholder = {
    style: { minHeight: "3px" },
    querySelector: () => home.quiz,
    getBoundingClientRect: () => ({ height: 420 }),
    append: (node) => {
      assert.equal(node, home.quiz);
      home.quiz.parent = placeholder;
    },
  };
  const slot = {
    append: (node) => {
      assert.equal(node, home.quiz);
      home.quiz.parent = slot;
    },
  };
  const dialog = {
    open: false,
    querySelector: (selector) =>
      selector === "[data-lr-quiz-slot]"
        ? slot
        : { addEventListener: listen("close") },
    addEventListener: listen("dialog"),
    getBoundingClientRect: () => ({
      left: 10,
      right: 710,
      top: 10,
      bottom: 600,
    }),
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
      modalHandlers["dialog:close"]();
    },
  };
  const root = {
    querySelector: (selector) =>
      selector === "[data-lr-quiz-modal]" ? dialog : placeholder,
    addEventListener: listen("root"),
  };
  let restoredFocus = 0;
  const trigger = {
    focus: () => {
      restoredFocus += 1;
    },
  };
  const open = () => {
    modalHandlers["root:click"]({
      target: { closest: () => trigger },
      preventDefault() {},
    });
    assert.equal(dialog.open, true);
    assert.equal(home.quiz.parent, slot);
    assert.equal(placeholder.style.minHeight, "420px");
    assert.equal(home.form.elements.phone.value, "+7 (921) 234-56-78");
  };
  const restored = () => {
    assert.equal(dialog.open, false);
    assert.equal(home.quiz.parent, placeholder);
    assert.equal(placeholder.style.minHeight, "3px");
    assert.equal(home.form.elements.service_format.value, "workshop");
  };
  initializeQuizModal(root);
  open();
  home.back();
  modalHandlers["close:click"]();
  restored();
  assert.equal(home.progress.textContent, "Шаг 4 из 5");
  home.confirmLocation();
  open();
  assert.equal(
    home.analysis.hidden,
    false,
    "The loading screen can be reopened",
  );
  let cancelled = false;
  modalHandlers["dialog:cancel"]({
    preventDefault: () => {
      cancelled = true;
    },
  });
  assert.equal(cancelled, true);
  restored();
  const scrollsBeforeClose = home.scrolls;
  globalThis.document = { activeElement: trigger };
  home.quiz.contains = () => false;
  finishLoading();
  assert.equal(
    home.scrolls,
    scrollsBeforeClose,
    "Finishing in a closed modal must not move the page",
  );
  open();
  modalHandlers["dialog:click"]({ target: dialog, clientX: 100, clientY: 100 });
  assert.equal(dialog.open, true);
  let blockedScroll = false;
  modalHandlers["root:wheel"]({
    clientX: 0,
    clientY: 0,
    preventDefault: () => {
      blockedScroll = true;
    },
  });
  assert.equal(blockedScroll, true);
  modalHandlers["dialog:click"]({ target: dialog, clientX: 0, clientY: 0 });
  restored();
  assert.equal(restoredFocus, 3);
  const fallbackHandlers = {};
  initializeQuizModal({
    querySelector: (selector) =>
      selector === "[data-lr-quiz-home]" ? placeholder : {},
    addEventListener: (type, handler) => {
      fallbackHandlers[type] = handler;
    },
  });
  assert.deepEqual(fallbackHandlers, {});

  const brand = createQuiz({ brand: true });
  assert.equal(brand.progress.textContent, "Шаг 1 из 4");
  brand.select(0, "Чистка и перегрев", "Греется, шумит или гаснет", true);
  assert.equal(brand.progress.textContent, "Шаг 2 из 4");
  brand.select(1, "courier", "Передам курьеру", true);
  assert.equal(brand.progress.textContent, "Шаг 3 из 4");
  brand.address.value = "Выборг, проспект Ленина, д. 1";
  brand.confirmLocation();
  assert.equal(
    [...timers.values()][0].delay,
    0,
    "Keyboard flow skips the loading delay",
  );
  finishLoading();
  assert.equal(brand.progress.textContent, "Шаг 4 из 4");
  assert.equal(brand.form.elements.device_category.value, "");
  assert.equal(brand.form.elements.quiz_service.value, "Ремонт ноутбуков ASUS");
  assert.equal(brand.summaries[0].textContent, "ASUS");
  brand.back();
  let enterPrevented = false;
  brand.handlers["location:keydown"]({
    key: "Enter",
    target: brand.address,
    preventDefault: () => {
      enterPrevented = true;
    },
  });
  finishLoading();
  assert.equal(enterPrevented, true);
  assert.equal(brand.progress.textContent, "Шаг 4 из 4");

  for (const format of ["at-home", "mobile-lab"]) {
    const visit = createQuiz();
    visit.select(0, "standard");
    visit.select(1, "Чистка и перегрев");
    visit.select(2, format);
    assert.equal(visit.progress.textContent, "Шаг 4 из 5");
    assert.equal(visit.placeField.hidden, false);
    assert.equal(
      visit.place.value,
      format === "at-home" ? "home" : "mobile-lab",
    );
    visit.address.value = "Санкт-Петербург, ул. Ленина, д. 5";
    visit.place.value = "work";
    visit.back();
    visit.repeat(2);
    assert.equal(
      visit.address.value,
      "Санкт-Петербург, ул. Ленина, д. 5",
      "Draft address survives Back",
    );
    visit.confirmLocation();
    finishLoading();
    assert.equal(visit.form.elements.requested_repair_place.value, "work");
    assert.equal(visit.form.elements.visit_address.value, visit.address.value);
    visit.back();
    visit.back();
    visit.select(2, "consultation");
    finishLoading();
    assert.equal(visit.progress.textContent, "Шаг 4 из 4");
    assert.equal(
      visit.location.hidden,
      true,
      "Consultation skips the location step",
    );
    assert.equal(visit.locationSummary.hidden, true);
  }
  const reduced = createQuiz({ reducedMotion: true });
  reduced.select(0, "standard");
  reduced.select(1, "Другая неисправность");
  reduced.select(2, "consultation");
  assert.equal(
    [...timers.values()][0].delay,
    0,
    "Reduced motion skips the loading delay",
  );
  finishLoading();
  assert.equal(reduced.progress.textContent, "Шаг 4 из 4");
  assert.equal(timers.size, 0);
  console.log(
    "Quiz: automatic pointer/keyboard choices, saved-answer clicks, Back/loading cancellation, summary/payload, preserved phone/consent, brand and reduced-motion flows passed.",
  );
  console.log(
    "Quiz modal: same form and step, reopening during loading, button/Escape/backdrop close, focus restoration and dialog fallback passed.",
  );
} finally {
  globalThis.setTimeout = originalTimers.setTimeout;
  globalThis.clearTimeout = originalTimers.clearTimeout;
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if (originalTimers.matchMedia === undefined) delete globalThis.matchMedia;
  else globalThis.matchMedia = originalTimers.matchMedia;
}
