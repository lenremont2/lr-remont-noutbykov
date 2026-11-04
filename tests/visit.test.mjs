import assert from "node:assert/strict";
import {
  updateVisitFields,
  validateVisitFields,
} from "../src/scripts/landing.js";

const field = (value = "") => ({
  value,
  disabled: true,
  required: false,
  attributes: {},
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
  getAttribute(name) {
    return this.attributes[name] ?? null;
  },
  removeAttribute(name) {
    delete this.attributes[name];
  },
});
const block = { hidden: true };
const addressError = { textContent: "" };
const placeError = { textContent: "" };
const form = {
  elements: {
    service_format: field("consultation"),
    visit_address: field(),
    requested_repair_place: field(),
  },
  querySelector(selector) {
    return {
      "[data-lr-visit-fields]": block,
      "[data-lr-visit-address-error]": addressError,
      "[data-lr-repair-place-error]": placeError,
    }[selector];
  },
};
const address = form.elements.visit_address;
const place = form.elements.requested_repair_place;

updateVisitFields(form);
assert.equal(block.hidden, true);
assert.equal(address.disabled, true);
assert.equal(address.required, false);
assert.equal(validateVisitFields(form), null);

form.elements.service_format.value = "at-home";
updateVisitFields(form);
assert.equal(block.hidden, false);
assert.equal(address.disabled, false);
assert.equal(address.required, true);
assert.equal(place.value, "home");
address.value = "   ";
assert.equal(validateVisitFields(form), address);
assert.ok(addressError.textContent);
assert.equal(address.attributes["aria-invalid"], "true");

address.value = "Санкт-Петербург, Невский проспект, 1";
place.value = "";
place.removeAttribute("aria-invalid");
assert.equal(validateVisitFields(form, address), null);
assert.equal(addressError.textContent, "");
assert.equal(address.attributes["aria-invalid"], "false");
assert.equal(
  placeError.textContent,
  "",
  "Editing address must not validate place",
);
assert.equal(place.getAttribute("aria-invalid"), null);
assert.equal(validateVisitFields(form, place), null);
assert.equal(
  placeError.textContent,
  "",
  "Untouched fields do not show early errors",
);
place.value = "work";
assert.equal(validateVisitFields(form), null);

form.elements.service_format.value = "mobile-lab";
updateVisitFields(form);
assert.equal(
  place.value,
  "work",
  "Switching format preserves the chosen place",
);
assert.ok(address.value.includes("Невский"));
place.value = "unknown";
assert.equal(validateVisitFields(form), place);
assert.ok(placeError.textContent);
place.value = "consultation";
assert.equal(validateVisitFields(form, place), null);
assert.equal(placeError.textContent, "");
assert.equal(place.attributes["aria-invalid"], "false");

form.elements.service_format.value = "courier";
updateVisitFields(form);
assert.equal(address.disabled, false, "Courier needs a pickup address");
assert.equal(
  place.disabled,
  true,
  "Courier does not need a repair-place choice",
);
address.value = "";
assert.equal(validateVisitFields(form), address);
address.value = "Санкт-Петербург, Невский проспект, 1";
assert.equal(validateVisitFields(form), null);
for (const format of ["workshop", "consultation"]) {
  form.elements.service_format.value = format;
  updateVisitFields(form);
  assert.equal(block.hidden, true);
  assert.equal(
    address.disabled,
    true,
    "Irrelevant address must not be submitted",
  );
  assert.equal(
    place.disabled,
    true,
    "Irrelevant preference must not be submitted",
  );
  assert.equal(address.required, false);
  assert.equal(place.required, false);
  assert.equal(validateVisitFields(form), null);
}
form.elements.service_format.value = "mobile-lab";
updateVisitFields(form);
assert.ok(
  address.value.includes("Невский"),
  "Hiding fields must not erase them",
);
assert.equal(place.value, "consultation");

place.value = "";
updateVisitFields(form);
assert.equal(place.value, "mobile-lab");

console.log(
  "Visit fields: conditional validation, disabled state and preserved values passed.",
);
