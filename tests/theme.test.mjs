import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { readFileSync } from "./read-normalized.mjs";
import { compile } from "sass";
import { parse } from "postcss";
import { initializeThemePreview } from "../src/scripts/landing.js";

const attribute = "data-wp-dark-mode-active";

test("Theme tokens keep text and input borders above their contrast thresholds", () => {
  const base = {};
  const dark = {};
  for (const [file, values] of [
    ["_variables.scss", base],
    ["_themes.scss", dark],
  ]) {
    const css = compile(
      fileURLToPath(new URL(`../src/styles/core/${file}`, import.meta.url)),
    ).css;
    parse(css).walkRules((rule) => {
      if (
        rule.selector === "#hop-landing" ||
        rule.selector.includes("html[data-wp-dark-mode-active]")
      ) {
        rule.walkDecls((declaration) => {
          values[declaration.prop] = declaration.value;
        });
      }
    });
  }
  const luminance = (color) =>
    color
      .slice(1)
      .match(/../g)
      .map((channel) => parseInt(channel, 16) / 255)
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (sum, channel, index) =>
          sum + channel * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  for (const [theme, values] of [
    ["light", base],
    ["dark", { ...base, ...dark }],
  ]) {
    const color = (role) => {
      let value = values[`--lr-color-${role}`];
      while (value.startsWith("var(")) value = values[value.slice(4, -1)];
      return value === "#fff" ? "#ffffff" : value;
    };
    for (const [foreground, background, minimum] of [
      ["text", "bg", 4.5],
      ["text", "surface", 4.5],
      ["muted", "surface", 4.5],
      ["link", "surface", 4.5],
      ["danger", "surface", 4.5],
      ["danger", "danger-soft", 4.5],
      ["control-border", "surface", 3],
      ["accent-contrast", "accent", 4.5],
      ["diagnostic-price", "diagnostic-bg", 3],
      ["on-dark", "director-bg", 4.5],
      ["document-text", "document-bg", 4.5],
    ]) {
      const a = luminance(color(foreground));
      const b = luminance(color(background));
      const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(
        contrast >= minimum,
        `${theme}: ${foreground}/${background} = ${contrast.toFixed(2)}`,
      );
    }
  }
});

function fixture(dark = false) {
  const attributes = new Map(dark ? [[attribute, ""]] : []);
  const events = new Map();
  const button = {
    dataset: {},
    hidden: true,
    setAttribute: (name, value) => attributes.set(name, value),
    addEventListener: (name, callback) => events.set(name, callback),
  };
  const html = {
    hasAttribute: (name) => attributes.has(name),
    toggleAttribute(name) {
      if (attributes.has(name)) attributes.delete(name);
      else attributes.set(name, "");
    },
  };
  const root = {
    querySelector: () => button,
    ownerDocument: { documentElement: html },
  };
  return { root, button, html, attributes, events };
}

test("Theme preview follows the host attribute and preserves existing attributes", () => {
  const originalObserver = globalThis.MutationObserver;
  let synchronize;
  let subscriptions = 0;
  let expectedHtml;
  globalThis.MutationObserver = class {
    constructor(callback) {
      synchronize = callback;
    }
    observe(target, options) {
      assert.equal(target, expectedHtml);
      assert.deepEqual(options, {
        attributes: true,
        attributeFilter: [attribute],
      });
      subscriptions += 1;
    }
  };
  try {
    for (const initiallyDark of [false, true]) {
      const { root, button, html, attributes, events } = fixture(initiallyDark);
      expectedHtml = html;
      attributes.set("lang", "ru");
      initializeThemePreview(root);
      assert.equal(button.hidden, false);
      assert.equal(attributes.get("aria-checked"), String(initiallyDark));
      const initialSubscriptions = subscriptions;
      initializeThemePreview(root);
      assert.equal(subscriptions, initialSubscriptions);
      assert.equal(events.size, 1);
      for (const expected of [!initiallyDark, initiallyDark]) {
        events.get("click")();
        assert.equal(html.hasAttribute(attribute), expected);
        assert.equal(attributes.get("aria-checked"), String(expected));
      }
      html.toggleAttribute(attribute);
      synchronize();
      assert.equal(attributes.get("aria-checked"), String(!initiallyDark));
      attributes.set(attribute, "false");
      synchronize();
      assert.equal(
        attributes.get("aria-checked"),
        "true",
        "Presence selects dark mode",
      );
      assert.equal(attributes.get("lang"), "ru");
    }
    assert.doesNotThrow(() =>
      initializeThemePreview({ querySelector: () => null }),
    );
    assert.equal(subscriptions, 2, "No observer without the preview control");
  } finally {
    if (originalObserver === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = originalObserver;
  }
});

test("All working routes include theme support, historical previews opt out", () => {
  const pages = JSON.parse(
    readFileSync(
      new URL("../src/data/service-pages.json", import.meta.url),
      "utf8",
    ),
  );
  const working = [
    "index.html",
    "remont-noutbukov-spb.htm/index.html",
    "remont-macbook-spb.htm/index.html",
    ...[...pages.brands, ...pages.problems].map(
      (page) => `${page.slug}.htm/index.html`,
    ),
  ];
  assert.equal(working.length, 51);
  for (const path of working) {
    const html = readFileSync(
      new URL(`../dist/${path}`, import.meta.url),
      "utf8",
    );
    assert.match(html, /<main\b[^>]*\bdata-lr-themeable(?:[\s=>])/, path);
    assert.equal((html.match(/data-lr-theme-switch/g) || []).length, 1, path);
    assert.match(html, /role="switch" aria-checked="false"/, path);
  }
  for (const route of [
    "style-review",
    "design-directions",
    "design-directions/focus",
    "design-directions/lab",
    "design-directions/service",
  ]) {
    const html = readFileSync(
      new URL(`../dist/${route}/index.html`, import.meta.url),
      "utf8",
    );
    assert.ok(!html.includes("data-lr-themeable"), route);
    assert.ok(!html.includes("data-lr-theme-switch"), route);
  }
});
