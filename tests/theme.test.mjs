import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { readFileSync } from "./read-normalized.mjs";
import { compile } from "sass";
import { parse } from "postcss";

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
      ["text", "surface-alt", 4.5],
      ["muted", "surface-alt", 4.5],
      ["text", "section-tint", 4.5],
      ["muted", "section-tint", 4.5],
      ["link-on-tint", "section-tint", 4.5],
      ["text", "section-muted", 4.5],
      ["muted", "section-muted", 4.5],
      ["link-on-tint", "section-muted", 4.5],
      ["text", "section-accent", 4.5],
      ["muted", "section-accent", 4.5],
      ["link-on-tint", "section-accent", 4.5],
      ["text", "accent-soft", 4.5],
      ["muted", "accent-soft", 4.5],
      ["link-on-tint", "surface-alt", 4.5],
      ["link-on-tint", "accent-soft", 4.5],
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
  assert.equal(new Set(working).size, 52);
  for (const path of working) {
    const html = readFileSync(
      new URL(`../dist/${path}`, import.meta.url),
      "utf8",
    );
    assert.match(html, /<main\b[^>]*\bdata-lr-themeable(?:[\s=>])/, path);
    assert.doesNotMatch(html, /lr-theme-switch/, path);
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
