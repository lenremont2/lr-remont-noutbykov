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
assert.equal((section.match(/data-lr-quiz-step/g) || []).length, 4);
assert.equal((section.match(/data-hop-lead-submit/g) || []).length, 1);
assert.match(section, /data-hop-lead-ignore/);
assert.match(section, /type="button"[^>]*data-lr-quiz-next/);
assert.match(section, /type="button"[^>]*data-lr-quiz-prev/);
const quizImages =
  section.match(/<img\b[^>]*lr-quiz__option-image[^>]*>/g) || [];
assert.equal(quizImages.length, 9);
for (const image of quizImages) {
  const src = image.match(/src="([^"]+)"/)?.[1];
  assert.ok(src?.startsWith("/media/"), "Quiz illustrations must be local");
  assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src);
  assert.match(image, /alt=""/);
  assert.match(image, /width="72" height="72"/);
}
for (const task of [
  "Физическая поломка",
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

const names = ["device_category", "symptom", "service_format"];
const answers = [null, null, null];
const handlers = {};
let focused;
let contextUpdates = 0;
const control = (name) => ({
  hidden: false,
  textContent: "",
  addEventListener: (type, handler) => {
    handlers[`${name}:${type}`] = handler;
  },
});
const form = {
  elements: Object.fromEntries(names.map((name) => [name, { value: "" }])),
};
const steps = Array.from({ length: 4 }, (_, index) => ({
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
const questions = {
  addEventListener: (type, handler) => {
    handlers[`questions:${type}`] = handler;
  },
  querySelector: (selector) =>
    answers[names.indexOf(selector.match(/name="([^"]+)"/)[1])],
};
const previous = control("previous");
const next = control("next");
const progress = control("progress");
const error = control("error");
const navigation = control("navigation");
const selectors = new Map([
  ["[data-lr-quiz-questions]", questions],
  ["[data-lr-form]", form],
  ["[data-lr-quiz-prev]", previous],
  ["[data-lr-quiz-next]", next],
  ["[data-lr-quiz-progress]", progress],
  ["[data-lr-quiz-error]", error],
  ["[data-lr-quiz-navigation]", navigation],
]);
const quiz = {
  querySelectorAll: () => steps,
  querySelector: (selector) => selectors.get(selector),
};
initializeRepairQuiz(quiz, () => {
  contextUpdates += 1;
});
assert.deepEqual(
  steps.map((step) => step.hidden),
  [false, true, true, true],
);
assert.equal(previous.hidden, true);
assert.equal(navigation.hidden, false);
handlers["next:click"]();
assert.ok(error.textContent);
assert.equal(progress.textContent, "Шаг 1 из 4");
assert.equal(focused, 0);
answers[0] = { value: "premium" };
handlers["questions:change"]();
assert.equal(error.textContent, "");
handlers["next:click"]();
answers[1] = { value: "Программы и настройка" };
handlers["previous:click"]();
assert.equal(answers[0].value, "premium");
handlers["next:click"]();
let prevented = false;
handlers["questions:submit"]({
  preventDefault: () => {
    prevented = true;
  },
});
assert.equal(prevented, true);
assert.equal(progress.textContent, "Шаг 3 из 4");
assert.equal(next.textContent, "Перейти к контактам");
answers[2] = { value: "courier" };
handlers["next:click"]();
assert.equal(progress.textContent, "Шаг 4 из 4");
assert.equal(next.hidden, true);
assert.equal(contextUpdates, 1);
assert.deepEqual(
  names.map((name) => form.elements[name].value),
  ["premium", "Программы и настройка", "courier"],
);
form.elements.phone = { value: "+7 (921) 234-56-78" };
handlers["previous:click"]();
answers[2] = { value: "workshop" };
handlers["next:click"]();
assert.equal(form.elements.service_format.value, "workshop");
assert.equal(form.elements.phone.value, "+7 (921) 234-56-78");
handlers["next:click"]();
assert.equal(contextUpdates, 2);
console.log(
  "Quiz: required answers, back navigation, Enter, context transfer and preserved contact passed.",
);

const modalHandlers = {};
const listen = (name) => (type, handler) => {
  modalHandlers[`${name}:${type}`] = handler;
};
const home = {
  style: { minHeight: "3px" },
  querySelector: () => quiz,
  getBoundingClientRect: () => ({ height: 420 }),
  append: (node) => {
    assert.equal(node, quiz);
    quiz.parent = home;
  },
};
const slot = {
  append: (node) => {
    assert.equal(node, quiz);
    quiz.parent = slot;
  },
};
const closeButton = { addEventListener: listen("close") };
const dialog = {
  open: false,
  querySelector: (selector) =>
    selector === "[data-lr-quiz-slot]" ? slot : closeButton,
  addEventListener: listen("dialog"),
  getBoundingClientRect: () => ({ left: 10, right: 710, top: 10, bottom: 600 }),
  showModal() {
    this.open = true;
  },
  close() {
    this.open = false;
    modalHandlers["dialog:close"]();
  },
};
const rootSelectors = new Map([
  ["[data-lr-quiz-modal]", dialog],
  ["[data-lr-quiz-home]", home],
]);
const root = {
  querySelector: (selector) => rootSelectors.get(selector),
  addEventListener: listen("root"),
};
let restoredFocus = 0;
let toggles = 0;
const trigger = {
  focus: () => {
    restoredFocus += 1;
  },
};
const open = () => {
  let intercepted = false;
  modalHandlers["root:click"]({
    target: { closest: () => trigger },
    preventDefault: () => {
      intercepted = true;
    },
  });
  assert.equal(intercepted, true);
  assert.equal(dialog.open, true);
  assert.equal(quiz.parent, slot);
  assert.equal(home.style.minHeight, "420px");
  assert.equal(progress.textContent, "Шаг 4 из 4");
  assert.equal(form.elements.phone.value, "+7 (921) 234-56-78");
};
const restored = () => {
  assert.equal(dialog.open, false);
  assert.equal(quiz.parent, home);
  assert.equal(home.style.minHeight, "3px");
  assert.equal(form.elements.service_format.value, "workshop");
};
initializeQuizModal(root, () => {
  toggles += 1;
});
open();
handlers["previous:click"]();
assert.equal(progress.textContent, "Шаг 3 из 4");
modalHandlers["close:click"]();
restored();
assert.equal(progress.textContent, "Шаг 3 из 4");
handlers["next:click"]();
open();
let cancelled = false;
modalHandlers["dialog:cancel"]({
  preventDefault: () => {
    cancelled = true;
  },
});
assert.equal(cancelled, true);
restored();
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
assert.equal(toggles, 6);
const fallbackHandlers = {};
initializeQuizModal({
  querySelector: (selector) => (selector === "[data-lr-quiz-home]" ? home : {}),
  addEventListener: (type, handler) => {
    fallbackHandlers[type] = handler;
  },
});
assert.deepEqual(fallbackHandlers, {});
console.log(
  "Quiz modal: same form and step preserved, button/Escape/backdrop close, focus restored and unsupported-dialog fallback passed.",
);
