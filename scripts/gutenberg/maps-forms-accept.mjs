import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { writeFile, readdir, mkdir } from "node:fs/promises";
import { wp } from "./local-wp.mjs";
const { chromium } = createRequire("D:/works/lenremont-gutenberg/package.json")(
  "playwright",
);
const out = "artifacts/gutenberg-2026-11-06/stock/maps-forms/";
await mkdir(out, { recursive: true });
const cookies = JSON.parse(
  await wp([
    "eval",
    'echo wp_json_encode(array(array("name"=>LOGGED_IN_COOKIE,"value"=>wp_generate_auth_cookie(get_current_user_id(),time()+3600,"logged_in")),array("name"=>AUTH_COOKIE,"value"=>wp_generate_auth_cookie(get_current_user_id(),time()+3600,"auth"))));',
  ]),
);
const browser = await chromium.launch({ channel: "chromium" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
await context.addCookies(
  cookies.map((cookie) => ({
    ...cookie,
    url: "http://testing-gutenberg.local",
    httpOnly: true,
    sameSite: "Lax",
  })),
);
const page = await context.newPage();
const errors = [],
  requests = [];
const mapNetwork = [];
page.on("requestfailed", (request) => {
  if (request.url().startsWith("https://maps.lenremontn8n.ru/"))
    mapNetwork.push({
      path: new URL(request.url()).pathname,
      error: request.failure()?.errorText,
    });
});
page.on("response", (response) => {
  if (response.url().startsWith("https://maps.lenremontn8n.ru/"))
    mapNetwork.push({
      path: new URL(response.url()).pathname,
      status: response.status(),
    });
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (request.method() === "POST") requests.push(request.url());
});
await context.route("**/*", async (route) => {
  if (
    process.argv.includes("--candidate") &&
    /\/resources\/page\.js(?:\?|$)/.test(route.request().url())
  ) {
    const file = (await readdir("dist/_astro")).find((name) =>
      /^LandingLayout.*\.js$/.test(name),
    );
    return route.fulfill({
      path: "dist/_astro/" + file,
      contentType: "text/javascript",
    });
  }
  if (
    route.request().method() === "POST" &&
    new URL(route.request().url()).hostname !== "testing-gutenberg.local"
  )
    return route.abort();
  return route.continue();
});
try {
  await page.goto("http://testing-gutenberg.local/?page_id=6219&preview=true", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForSelector("#hop-landing[data-lr-initialized=true]");
  await page.locator("#lr-locations").scrollIntoViewIfNeeded();
  await page
    .locator("#dmap .leaflet-marker-icon")
    .first()
    .waitFor({ timeout: 30000 });
  await page.waitForFunction(() => {
    const tiles = [...document.querySelectorAll("#dmap img.leaflet-tile")];
    return (
      tiles.length > 0 &&
      tiles.every((tile) => tile.complete && tile.naturalWidth > 0)
    );
  });
  const mapHeights = await page
    .locator("#dmap")
    .evaluate((el) => [
      el.clientHeight,
      el.querySelector(".dmap-container").clientHeight,
      el.querySelector("#dmap_layout").clientHeight,
    ]);
  assert.ok(
    Math.max(...mapHeights) - Math.min(...mapHeights) < 3,
    JSON.stringify(mapHeights),
  );
  await page.screenshot({ path: out + "map-main.png" });
  console.log(
    JSON.stringify(
      await page.evaluate(() => ({
        maps: document.querySelectorAll("#dmap").length,
        tiles: document.querySelectorAll("#dmap .leaflet-tile-loaded").length,
        mapHeight: document.querySelector("#dmap").getBoundingClientRect()
          .height,
        hostHeight: document
          .querySelector("#lr-map-workshops [data-lr-map-surface]")
          .getBoundingClientRect().height,
        receiver: !!document.querySelector("#lr-laptop-local-receiver"),
      })),
    ),
  );
  console.log({ errors, requests });
  const flows = [];
  const load = async (id = 6219) => {
    await page.goto(
      `http://testing-gutenberg.local/?page_id=${id}&preview=true`,
      { waitUntil: "domcontentloaded", timeout: 90000 },
    );
    await page.waitForSelector("#hop-landing[data-lr-initialized=true]");
  };
  const fillContact = async (form) => {
    const field = form.locator('[name="phone"]');
    if ((await field.getAttribute("readonly")) !== null) {
      await field.click();
      for (const digit of "9991234567")
        await form.locator(`[data-lr-digit="${digit}"]`).click();
    } else await field.fill("+7 (999) 123-45-67");
    await form.locator('[name="consent"]').check();
  };
  const send = async (form) => {
    const response = page.waitForResponse(
      (r) =>
        r.url() === "http://testing-gutenberg.local/wp-admin/admin-ajax.php" &&
        r.request().postData()?.includes("lr_laptop_local_lead"),
    );
    await form.locator('[type="submit"]').click();
    return response;
  };
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const format of [
      "consultation",
      "workshop",
      "courier",
      "at-home",
      "mobile-lab",
    ]) {
      await load();
      const quiz = page.locator("[data-lr-quiz]");
      for (const [name, value] of [
        ["device_category", "standard"],
        ["symptom", "Физическая поломка"],
        ["service_format", format],
      ])
        await quiz
          .locator(`label:has(input[name="${name}"][value="${value}"])`)
          .click();
      if (format !== "consultation") {
        await quiz
          .locator("[data-lr-quiz-location]")
          .waitFor({ state: "visible" });
        console.log(
          "Location before validation",
          format,
          await quiz.locator("[data-lr-quiz-workshop]").inputValue(),
          await quiz.locator("[data-lr-quiz-address]").inputValue(),
        );
        await quiz.locator("[data-lr-quiz-location-confirm]").click();
        assert.ok(
          (await quiz.locator("[data-lr-quiz-error]").textContent()).trim(),
        );
        if (format === "workshop") {
          assert.equal(
            await page.locator("#lr-quiz-map-workshops #dmap").count(),
            1,
          );
          if (width === 1440) {
            await page.locator("#dmap .point-list a").first().click();
            await page.waitForFunction(
              () =>
                document.querySelector("[data-lr-quiz-workshop]").value ===
                "prosveshcheniya",
            );
          } else
            await quiz
              .locator("[data-lr-quiz-workshop]")
              .selectOption("prosveshcheniya");
        } else
          await quiz
            .locator("[data-lr-quiz-address]")
            .fill("Санкт-Петербург, Невский проспект, 1");
        await quiz.locator("[data-lr-quiz-location-confirm]").click();
      }
      const form = quiz.locator("[data-lr-form]");
      await form.waitFor({ state: "visible" });
      await fillContact(form);
      const start = requests.length;
      if (format === "consultation" && width === 1440) {
        await wp(["eval", 'set_transient("lr_local_lead_fail_next",true,60);']);
        assert.equal((await send(form)).status(), 503);
        await form
          .locator("[data-lr-form-message]")
          .filter({ hasText: "недоступен" })
          .waitFor();
        assert.equal(await form.isVisible(), true);
        assert.match(await form.locator('[name="phone"]').inputValue(), /999/);
      }
      assert.equal((await send(form)).status(), 200);
      await quiz.locator("[data-lead-success]").waitFor({ state: "visible" });
      const saved = JSON.parse(
        await wp([
          "eval",
          'echo wp_json_encode(get_transient("lr_local_lead_receipts_1"));',
        ]),
      ).at(-1);
      assert.equal(saved.service_format, format);
      assert.equal(saved.symptom, "Физическая поломка");
      assert.equal(saved.source, "quiz");
      if (format === "workshop")
        assert.equal(saved.workshop_id, "prosveshcheniya");
      else if (format !== "consultation")
        assert.equal(
          saved.visit_address,
          "Санкт-Петербург, Невский проспект, 1",
        );
      assert.equal(
        requests.length - start,
        format === "consultation" && width === 1440 ? 2 : 1,
      );
      flows.push({ width, format, serverReceipt: true });
      if (format === "workshop")
        await page.screenshot({ path: out + `quiz-success-${width}.png` });
      console.log(`Confirmed ${width}: ${format}`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load();
  await page.locator('[data-lr-map-open="workshops"]').click();
  await page.locator("[data-lr-map-workshop]").selectOption("prosveshcheniya");
  await page
    .locator('[data-lr-map-slot="workshops"] [data-lr-map-confirm]')
    .click();
  const modalForm = page.locator('[data-lr-modal="lead"] [data-lr-form]');
  assert.equal(
    await modalForm.locator('[name="workshop_id"]').inputValue(),
    "prosveshcheniya",
  );
  await fillContact(modalForm);
  const beforeDouble = requests.length;
  const confirmed = page.waitForResponse(
    (r) =>
      r.url() === "http://testing-gutenberg.local/wp-admin/admin-ajax.php" &&
      r.request().postData()?.includes("lr_laptop_local_lead"),
  );
  await modalForm.evaluate((form) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  assert.equal((await confirmed).status(), 200);
  await page
    .locator('[data-lr-modal="lead"] [data-lead-success]')
    .waitFor({ state: "visible" });
  assert.equal(requests.length - beforeDouble, 1);
  flows.push({ type: "map-to-form", doubleSubmitPrevented: true });
  await load();
  await page
    .locator('[data-lr-map-open="address"][data-format="courier"]')
    .click();
  await page.locator("#lr-map-address iframe").waitFor();
  await page
    .locator("#lr-map-address [data-lr-map-status]")
    .filter({ hasText: /Найдите дом|Карта недоступна/ })
    .waitFor({ timeout: 20000 });
  const mapStatus = await page
    .locator("#lr-map-address [data-lr-map-status]")
    .textContent();
  await page
    .locator("[data-lr-map-address]")
    .fill("Санкт-Петербург, Невский проспект, 1");
  await page.locator("#lr-map-address [data-lr-map-confirm]").click();
  assert.equal(
    await modalForm.locator('[name="visit_address"]').inputValue(),
    "Санкт-Петербург, Невский проспект, 1",
  );
  assert.equal(
    await modalForm.locator('[name="service_format"]').inputValue(),
    "courier",
  );
  for (const id of [6220, 6229, 6259, 6268]) {
    await load(id);
    const form = page.locator("#lr-contact [data-lr-form]");
    await fillContact(form);
    assert.equal((await send(form)).status(), 200);
    await page
      .locator("#lr-contact [data-lead-success]")
      .waitFor({ state: "visible" });
    const receipt = JSON.parse(
      await wp([
        "eval",
        'echo wp_json_encode(get_transient("lr_local_lead_receipts_1"));',
      ]),
    ).at(-1);
    assert.ok(receipt.quiz_service);
    assert.ok(receipt.service_name);
    flows.push({ id, type: "contact-form", serverReceipt: true });
  }
  const config = JSON.parse(
    await page.locator("#lr-laptop-local-receiver").textContent(),
  );
  const sample = {
    action: "lr_laptop_local_lead",
    _ajax_nonce: config.nonce,
    request_id: "a".repeat(32),
    phone: "+79991234567",
    consent: "yes",
  };
  assert.equal(
    (
      await context.request.post(config.url, {
        form: { ...sample, _ajax_nonce: "wrong" },
      })
    ).status(),
    403,
  );
  assert.equal(
    (
      await context.request.post(config.url, {
        form: { ...sample, phone: "123" },
      })
    ).status(),
    400,
  );
  assert.equal(
    (
      await context.request.post(config.url, {
        form: { ...sample, consent: "" },
      })
    ).status(),
    400,
  );
  const last = JSON.parse(
    await wp([
      "eval",
      'echo wp_json_encode(get_transient("lr_local_lead_receipts_1"));',
    ]),
  ).at(-1);
  const duplicate = await context.request.post(config.url, {
    form: { ...sample, ...last, request_id: last.id },
  });
  assert.equal((await duplicate.json()).data.duplicate, true);
  const anonymous = await browser.newContext();
  assert.ok(
    [400, 403].includes(
      (await anonymous.request.post(config.url, { form: sample })).status(),
    ),
  );
  await anonymous.close();
  await page.goto("http://testing-gutenberg.local/?page_id=2370&preview=true", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  const robotReference = await page.evaluate(() => ({
    map: !!document.querySelector("#dmap"),
    unexpandedQuiz: document.body.innerText.includes("[on_quiz_form"),
    forms: [...document.querySelectorAll("[data-hop-lead-form]")].map((form) =>
      [...form.elements].map((field) => field.name).filter(Boolean),
    ),
  }));
  assert.ok(
    requests.every(
      (url) => new URL(url).hostname === "testing-gutenberg.local",
    ),
  );
  assert.deepEqual(errors, []);
  await writeFile(
    out + "acceptance.json",
    JSON.stringify(
      {
        flows,
        candidate: process.argv.includes("--candidate"),
        mapStatus,
        mapNetwork,
        mapHeights,
        robotReference,
        receiverValidation: true,
        serverDuplicatePrevented: true,
        errors,
        localPosts: requests.length,
      },
      null,
      2,
    ),
  );
  console.log("Local forms/maps acceptance passed.");
  console.log(
    await page.evaluate(() => ({
      map: [
        ...document.querySelectorAll(
          "#dmap > *, #dmap_layout, #dmap .leaflet-control-attribution",
        ),
      ].map((e) => ({
        tag: e.tagName,
        class: e.className,
        height: e.getBoundingClientRect().height,
        top: e.getBoundingClientRect().top,
      })),
      radios: [
        ...document.querySelectorAll("[data-lr-quiz-questions] input"),
      ].map((e) => ({ name: e.name, value: e.value })),
      openers: [...document.querySelectorAll("[data-lr-map-open]")].map(
        (e) => ({
          type: e.dataset.lrMapOpen,
          format: e.dataset.format,
          text: e.textContent,
        }),
      ),
    })),
  );
} catch (error) {
  await page.screenshot({ path: out + "failure.png" });
  console.log(await page.locator("[data-lr-quiz]").innerText());
  throw error;
} finally {
  await browser.close();
}
