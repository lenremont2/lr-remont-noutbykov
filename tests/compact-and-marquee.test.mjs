import assert from "node:assert/strict";
import { test } from "node:test";
import {
  updateVisitFields,
  validateVisitFields,
  updateFormReadiness,
} from "../src/scripts/landing.js";

test("Compact form sends a selected address without requiring one", () => {
  const field = (value = "") => ({
    value,
    disabled: false,
    required: true,
    removeAttribute() {},
    setAttribute() {},
    getAttribute() {
      return null;
    },
  });
  const address = field(""),
    place = field("");
  const elements = {
    service_format: field("at-home"),
    visit_address: address,
    requested_repair_place: place,
    phone: field("+7 (921) 234-56-78"),
    consent: { checked: true },
  };
  const nodes = new Map();
  const form = {
    elements,
    hasAttribute: (name) => name === "data-lr-compact-form",
    querySelector: (selector) => {
      if (!nodes.has(selector))
        nodes.set(selector, { hidden: false, textContent: "", disabled: true });
      return nodes.get(selector);
    },
  };
  for (const format of ["at-home", "mobile-lab", "courier", "workshop"]) {
    elements.service_format.value = format;
    updateVisitFields(form);
    assert.equal(elements.service_format.value, format);
    assert.equal(address.disabled, true);
    assert.equal(place.disabled, true);
    assert.equal(address.required, false);
    assert.equal(form.querySelector("[data-lr-visit-fields]").hidden, true);
    assert.equal(validateVisitFields(form), null);
    assert.equal(updateFormReadiness(form), true);
  }
  elements.service_format.value = "at-home";
  address.value = "Санкт-Петербург, Невский проспект, 1";
  updateVisitFields(form, true);
  assert.equal(form.querySelector("[data-lr-visit-fields]").hidden, true);
  assert.equal(address.disabled, false);
  assert.equal(address.required, false);
  assert.equal(place.disabled, true);
  assert.equal(updateFormReadiness(form), true);
  elements.service_format.value = "mobile-lab";
  updateVisitFields(form);
  assert.equal(address.disabled, true);

  elements.consent.checked = false;
  assert.equal(updateFormReadiness(form), false);
  elements.consent.checked = true;
  elements.phone.value = "+7 (921)";
  assert.equal(updateFormReadiness(form), false);
});
