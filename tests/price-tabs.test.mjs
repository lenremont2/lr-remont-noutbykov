import assert from "node:assert/strict";
import { initializePriceTabs } from "../src/scripts/landing.js";

let focused;
const tabs = [0, 1].map((index) => ({
  id: `lr-price-tab-${index}`,
  attributes: {},
  listeners: {},
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
  addEventListener(name, callback) {
    this.listeners[name] = callback;
  },
  focus() {
    focused = this.id;
  },
}));
const panels = tabs.map(() => ({
  hidden: false,
  attributes: {},
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
}));
const tablist = {
  hidden: true,
  setAttribute() {},
  querySelectorAll: () => tabs,
};
const pricing = {
  dataset: {},
  querySelector: () => tablist,
  querySelectorAll: () => panels,
};
initializePriceTabs(pricing);
assert.equal(tablist.hidden, false);
assert.deepEqual(
  panels.map((panel) => panel.hidden),
  [false, true],
);
assert.deepEqual(
  tabs.map((tab) => tab.tabIndex),
  [0, -1],
);
assert.equal(panels[1].attributes["aria-labelledby"], tabs[1].id);
tabs[1].listeners.click();
assert.deepEqual(
  panels.map((panel) => panel.hidden),
  [true, false],
);
assert.equal(tabs[1].attributes["aria-selected"], "true");
let prevented = 0;
const press = (tab, key) =>
  tab.listeners.keydown({
    key,
    preventDefault() {
      prevented++;
    },
  });
press(tabs[1], "ArrowRight");
assert.equal(focused, tabs[0].id, "ArrowRight wraps to the first category");
press(tabs[0], "ArrowLeft");
assert.equal(focused, tabs[1].id, "ArrowLeft wraps to the last category");
press(tabs[1], "Home");
assert.equal(focused, tabs[0].id);
press(tabs[0], "End");
assert.equal(focused, tabs[1].id);
press(tabs[1], "Tab");
assert.equal(prevented, 4, "Tab keeps the normal reading order");
initializePriceTabs(pricing);
assert.deepEqual(
  panels.map((panel) => panel.hidden),
  [true, false],
  "Repeated initialization preserves the selected category",
);
assert.doesNotThrow(() => initializePriceTabs({ querySelector: () => null }));
