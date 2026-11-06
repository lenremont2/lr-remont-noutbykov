import assert from "node:assert/strict";
import { readMapMessage } from "../src/scripts/maps.js";
const source = {},
  token = "local-test";
const event = {
  origin: "https://maps.lenremontn8n.ru",
  source,
  data: {
    version: 1,
    token,
    type: "lenremont:map-selected",
    address: {
      method: "pin",
      label: "СПб, Невский проспект, 1",
      lat: 59.9,
      lon: 30.3,
    },
  },
};
assert.equal(
  readMapMessage(event, source, token).label,
  event.data.address.label,
);
assert.equal(
  readMapMessage(
    {
      ...event,
      data: { ...event.data, type: "lenremont:map-height", height: 420 },
    },
    source,
    token,
  ).height,
  420,
);
assert.equal(
  readMapMessage(
    {
      ...event,
      data: { ...event.data, type: "lenremont:map-height", height: 9999 },
    },
    source,
    token,
  ),
  null,
);
for (const patch of [
  { origin: "https://wrong.invalid" },
  { source: {} },
  { data: { ...event.data, token: "wrong" } },
  { data: { ...event.data, address: { ...event.data.address, lat: NaN } } },
  { data: { ...event.data, address: { ...event.data.address, lon: 100 } } },
])
  assert.equal(readMapMessage({ ...event, ...patch }, source, token), null);
console.log("Address map origin, frame, token and coordinates verified.");
