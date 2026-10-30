import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyLeadContext,
  normalizeServiceFormat,
  leadDeviceCategory,
} from "../src/scripts/landing.js";

test("The four preview formats map to the existing lead contract", () => {
  for (const [input, expected] of [
    ["mobile", "mobile-lab"],
    ["home", "at-home"],
    ["center", "workshop"],
    ["courier", "courier"],
  ]) {
    assert.equal(normalizeServiceFormat(input), expected);
    assert.equal(normalizeServiceFormat(expected), expected);
  }
  assert.equal(normalizeServiceFormat("unknown"), "consultation");
});

test("MacBook category comes from explicit markup and survives format changes", () => {
  const scope = { dataset: { deviceCategory: "premium" } };
  const button = {
    closest: (selector) => {
      assert.equal(selector, "[data-device-category]");
      return scope;
    },
  };
  assert.equal(leadDeviceCategory(button), "premium");
  const form = {
    elements: {
      device_category: { value: "" },
      service_format: { value: "consultation" },
    },
  };
  applyLeadContext(form, { device_category: leadDeviceCategory(button) });
  applyLeadContext(form, { service_format: "courier" });
  assert.equal(form.elements.device_category.value, "premium");
  assert.equal(form.elements.service_format.value, "courier");
  assert.equal(leadDeviceCategory({ closest: () => null }), undefined);
  assert.equal(
    leadDeviceCategory({
      closest: () => ({ dataset: { deviceCategory: "unknown" } }),
    }),
    undefined,
  );
});

test("Symptom and generic CTA updates preserve the selected format and entered contact", () => {
  const values = {
    service_format: "mobile-lab",
    symptom: "",
    device_category: "premium",
    source: "hero",
    phone: "+7 (921) 234-56-78",
    visit_address: "Невский проспект, 1",
    requested_repair_place: "work",
  };
  const form = {
    elements: Object.fromEntries(
      Object.entries(values).map(([name, value]) => [name, { value }]),
    ),
  };
  applyLeadContext(form, {
    symptom: "Греется и выключается",
    source: "repair-case-cooling",
  });
  applyLeadContext(form, { source: "contact" });
  assert.equal(form.elements.service_format.value, "mobile-lab");
  assert.equal(form.elements.symptom.value, "Греется и выключается");
  assert.equal(form.elements.device_category.value, "premium");
  for (const name of ["phone", "visit_address", "requested_repair_place"])
    assert.equal(form.elements[name].value, values[name]);
});

test("Changing format preserves the symptom; clearing a symptom is explicit", () => {
  const form = {
    elements: {
      service_format: { value: "mobile-lab" },
      symptom: { value: "Не включается" },
    },
  };
  applyLeadContext(form, { service_format: "center" });
  assert.equal(form.elements.service_format.value, "workshop");
  assert.equal(form.elements.symptom.value, "Не включается");
  applyLeadContext(form, { symptom: "" });
  assert.equal(form.elements.symptom.value, "");
  assert.equal(form.elements.service_format.value, "workshop");
});
