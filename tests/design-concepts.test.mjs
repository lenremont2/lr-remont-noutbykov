import assert from "node:assert/strict";
import test from "node:test";
import { initializeDesignConcept } from "../src/scripts/landing.js";

function fixture() {
  const handlers = {};
  const views = ["0", "1", "2"].map((id) => ({
    dataset: { lrConceptView: id },
    hidden: id !== "0",
  }));
  const buttons = ["0", "1", "2"].map((id) => ({
    dataset: { lrConceptViewButton: id },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  }));
  const formats = ["mobile", "home", "center", "courier"];
  const images = formats.map((id) => ({
    dataset: { lrConceptFormatView: id },
    hidden: id !== "mobile",
  }));
  const descriptions = formats.map((id) => ({
    dataset: { lrConceptFormatDescription: id },
    hidden: id !== "mobile",
  }));
  const groups = {
    "[data-lr-concept-view]": views,
    "[data-lr-concept-view-button]": buttons,
    "[data-lr-concept-format-view]": images,
    "[data-lr-concept-format-description]": descriptions,
  };
  const concept = {
    addEventListener(type, handler) {
      handlers[type] = handler;
    },
    querySelectorAll(selector) {
      return groups[selector];
    },
  };
  initializeDesignConcept({
    querySelector() {
      return concept;
    },
  });
  return { handlers, views, buttons, images, descriptions };
}

test("lab selection shows one frame and synchronizes pressed states", () => {
  const { handlers, views, buttons } = fixture();
  handlers.click({
    target: {
      closest() {
        return buttons[1];
      },
    },
  });
  assert.deepEqual(
    views.map((view) => view.hidden),
    [true, false, true],
  );
  assert.deepEqual(
    buttons.map((button) => button.attributes["aria-pressed"]),
    ["false", "true", "false"],
  );
});

test("each format keeps its image and description synchronized", () => {
  const { handlers, images, descriptions } = fixture();
  for (const format of ["center", "courier", "home", "mobile"]) {
    handlers.change({
      target: {
        closest() {
          return { value: format };
        },
      },
    });
    assert.equal(images.filter((image) => !image.hidden).length, 1);
    assert.equal(
      images.find((image) => !image.hidden).dataset.lrConceptFormatView,
      format,
    );
    assert.equal(
      descriptions.filter((description) => !description.hidden).length,
      1,
    );
    assert.equal(
      descriptions.find((description) => !description.hidden).dataset
        .lrConceptFormatDescription,
      format,
    );
  }
});

test("unrelated interactions and pages without a concept are left alone", () => {
  initializeDesignConcept({
    querySelector() {
      return null;
    },
  });
  const { handlers, views } = fixture();
  handlers.click({
    target: {
      closest() {
        return null;
      },
    },
  });
  handlers.change({
    target: {
      closest() {
        return null;
      },
    },
  });
  assert.deepEqual(
    views.map((view) => view.hidden),
    [false, true, true],
  );
});
