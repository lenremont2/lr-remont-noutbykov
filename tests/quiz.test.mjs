import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initializeRepairQuiz } from "../src/scripts/landing.js";

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
initializeRepairQuiz(
  {
    querySelectorAll: () => steps,
    querySelector: (selector) => selectors.get(selector),
  },
  () => {
    contextUpdates += 1;
  },
);
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
answers[1] = { value: "Не включается" };
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
  ["premium", "Не включается", "courier"],
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
