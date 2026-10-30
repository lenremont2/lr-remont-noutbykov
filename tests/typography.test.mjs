import assert from "node:assert/strict";
import { test } from "node:test";
import { typographHtml, typographText } from "../src/utils/typography.mjs";

test("Russian text keeps short words and units together", () => {
  assert.equal(
    typographText("от 4 990 ₽, 1–3 дня"),
    "от\u00a04\u00a0990\u00a0₽, 1–3\u00a0дня",
  );
  assert.equal(
    typographText("Ремонт в мастерской — 500 ₽ за 1 год"),
    "Ремонт в\u00a0мастерской\u00a0— 500\u00a0₽ за\u00a01\u00a0год",
  );
  assert.equal(
    typographText("10-15 дней, можно ли отказаться"),
    "10–15\u00a0дней, можно\u00a0ли отказаться",
  );
});
test("Typography preserves phones, URLs, attributes, code and schema", () => {
  const html =
    '<a href="/test?x=1-2" aria-label="Ремонт в мастерской">Ремонт в мастерской</a><script type="application/ld+json">{"name":"Ремонт в мастерской"}</script><pre><code>в мастерской</code></pre><input value="0 ₽"><!-- в мастерской -->';
  const result = typographHtml(html);
  assert.equal(
    result,
    html.replace(">Ремонт в мастерской</a>", ">Ремонт в\u00a0мастерской</a>"),
  );
  assert.equal(
    typographText("Позвоните: +7 (812) 344-44-44"),
    "Позвоните: +7 (812) 344-44-44",
  );
  assert.equal(typographHtml(result), result, "Formatting is idempotent");
});
