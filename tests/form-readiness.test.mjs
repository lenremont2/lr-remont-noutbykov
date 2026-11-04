import assert from "node:assert/strict";
import { updateFormReadiness } from "../src/scripts/landing.js";

const button = { disabled: false };
const hint = { textContent: "" };
const form = {
  elements: {
    phone: { value: "" },
    consent: { checked: false },
    visit_address: { disabled: true, value: "" },
    requested_repair_place: { disabled: true, value: "" },
  },
  querySelector: (selector) =>
    selector === "[data-hop-lead-submit]" ? button : hint,
};
assert.equal(updateFormReadiness(form), false);
form.elements.phone.value = "+7 (921) 234-56-78";
assert.equal(updateFormReadiness(form), false, "Consent is mandatory");
form.elements.consent.checked = true;
assert.equal(updateFormReadiness(form), true);
form.elements.visit_address.disabled = false;
assert.equal(updateFormReadiness(form), false, "Pickup address is mandatory");
form.elements.visit_address.value = "   ";
assert.equal(updateFormReadiness(form), false);
form.elements.visit_address.value = "Санкт-Петербург, Невский проспект, 1";
assert.equal(updateFormReadiness(form), true);
form.elements.requested_repair_place.disabled = false;
assert.equal(updateFormReadiness(form), false);
form.elements.requested_repair_place.value = "home";
assert.equal(updateFormReadiness(form), true);
form.elements.consent.checked = false;
assert.equal(
  updateFormReadiness(form),
  false,
  "Revoking consent blocks submission again",
);
form.elements.consent.checked = true;
form.elements.phone.value = "+7 (921)";
assert.equal(
  updateFormReadiness(form),
  false,
  "Editing a complete number revalidates readiness",
);
