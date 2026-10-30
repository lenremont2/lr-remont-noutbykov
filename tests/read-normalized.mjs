import { readFileSync as readRawFileSync } from "node:fs";

// Content checks ignore the breaking/nonbreaking choice; typography has its own tests.
export function readFileSync(...args) {
  const content = readRawFileSync(...args);
  return typeof content === "string"
    ? content.replace(/\u00a0/gu, " ")
    : content;
}
