import assert from "node:assert/strict";
import {
  initializePhoneMask,
  formatPhone,
  validatePhone,
} from "../src/scripts/landing.js";

const handlers = {};
initializePhoneMask({
  addEventListener: (type, handler) => {
    handlers[type] = handler;
  },
});
const phone = {
  value: "",
  selectionStart: 0,
  selectionEnd: 0,
  readOnly: false,
  matches: (selector) => selector === "[data-lr-phone]",
  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  },
};
const setPhone = (value, start = value.length, end = start) => {
  phone.value = value;
  phone.setSelectionRange(start, end);
};
const edit = (inputType, data = "") => {
  const event = { target: phone, inputType };
  handlers.beforeinput(event);
  let { selectionStart: start, selectionEnd: end } = phone;
  if (start === end) {
    if (inputType === "deleteContentBackward") start = Math.max(0, start - 1);
    if (inputType === "deleteContentForward")
      end = Math.min(phone.value.length, end + 1);
  }
  phone.value = phone.value.slice(0, start) + data + phone.value.slice(end);
  phone.setSelectionRange(start + data.length, start + data.length);
  handlers.input(event);
};

setPhone("+7 (124)");
edit("deleteContentBackward");
assert.equal(phone.value, "+7 (12");
for (const expected of ["+7 (1", "+7", ""]) {
  edit("deleteContentBackward");
  assert.equal(phone.value, expected);
}
for (const digit of "9212345678") edit("insertText", digit);
assert.equal(phone.value, "+7 (921) 234-56-78");
assert.equal(validatePhone(phone.value).error, "");
for (let remaining = 10; remaining >= 0; remaining--) {
  edit("deleteContentBackward");
  assert.equal(phone.value.replace(/\D/g, "").length, remaining);
}
assert.equal(phone.value, "");
assert.ok(validatePhone(phone.value).error);

// Every separator must let Backspace and Delete reach the neighboring digit.
const full = "+7 (921) 234-56-78";
for (const [inputType, positions] of [
  ["deleteContentBackward", [8, 9, 13, 16]],
  ["deleteContentForward", [2, 3, 7, 8, 12, 15]],
]) {
  for (const position of positions) {
    setPhone(full, position);
    const digitsBefore = full.slice(0, position).replace(/\D/g, "").length;
    const removed =
      digitsBefore - (inputType === "deleteContentBackward" ? 1 : 0);
    const digits = full.replace(/\D/g, "");
    edit(inputType);
    assert.equal(
      phone.value,
      formatPhone(digits.slice(0, removed) + digits.slice(removed + 1)),
    );
    assert.equal(
      phone.value.slice(0, phone.selectionStart).replace(/\D/g, "").length,
      removed,
    );
  }
}
setPhone(full, 4, 7);
edit("insertText", "812");
assert.equal(phone.value, "+7 (812) 234-56-78");
setPhone(full, 0, full.length);
edit("deleteContentBackward");
assert.equal(phone.value, "");
setPhone("", 0);
edit("insertFromPaste", "8 (921) 234-56-78");
assert.equal(phone.value, full);
setPhone("+7 (124)");
phone.readOnly = true;
handlers.beforeinput({ target: phone, inputType: "deleteContentBackward" });
assert.equal(phone.selectionStart, phone.value.length);
phone.readOnly = false;
// The custom mobile dialpad dispatches a plain input event.
setPhone("712");
handlers.input({ target: phone });
assert.equal(phone.value, "+7 (12");
setPhone("+");
handlers.input({ target: phone });
assert.equal(phone.value, "+7");
handlers.input({ target: { matches: () => false } });
handlers.beforeinput({ target: { matches: () => false } });
console.log("Phone deletion, selection, retyping, paste and dialpad: passed.");
