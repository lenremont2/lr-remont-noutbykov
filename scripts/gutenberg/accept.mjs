// Integration tests run in their own headless browser; no production connection.
import assert from "node:assert/strict";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { wp } from "./local-wp.mjs";
const require = createRequire("D:/works/lenremont-gutenberg/package.json");
const { chromium } = require("playwright");
const out = path.resolve("artifacts/gutenberg-2026-11-06/stock");
const sourceRows = JSON.parse(
  await readFile(path.join(out, "source-map.json"), "utf8"),
);
await mkdir(path.join(out, "screenshots"), { recursive: true });
const snapshot = JSON.parse(
  await wp(["eval-file", path.resolve("scripts/gutenberg/verify-site.php")]),
);
assert.equal(snapshot.pages.length, 50);
assert.deepEqual(snapshot.failures, []);
const cookies = JSON.parse(
  await wp([
    "eval",
    'echo wp_json_encode(array(array("name"=>LOGGED_IN_COOKIE,"value"=>wp_generate_auth_cookie(get_current_user_id(),time()+3600,"logged_in")),array("name"=>AUTH_COOKIE,"value"=>wp_generate_auth_cookie(get_current_user_id(),time()+3600,"auth"))));',
  ]),
);
const browser = await chromium.launch({ channel: "chromium" });
const result = {
  site: snapshot.site,
  checkedAt: new Date().toISOString(),
  existingPagesUnchanged: snapshot.existingPagesUnchanged,
  pages: [],
};
if (process.argv.includes("--resume")) {
  const previous = JSON.parse(
    await readFile(path.join(out, "acceptance.json"), "utf8"),
  );
  assert.equal(previous.site, snapshot.site);
  result.pages = previous.pages;
}
const selected = new Set([
  "remont-noutbukov-spb",
  "remont-noutbukov-acer-spb",
  "remont-noutbukov-huawei-spb",
  "noutbuk-ne-vklyuchaetsya",
  "remont-macbook-spb",
]);
let page;
let activePage;
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await context.addCookies(
    cookies.map((item) => ({
      ...item,
      url: snapshot.site,
      httpOnly: true,
      sameSite: "Lax",
    })),
  );
  page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(90000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const saved of snapshot.pages) {
    if (result.pages.some((row) => row.id === saved.id)) continue;
    activePage = saved;
    const row = {
      id: saved.id,
      key: saved.key,
      url: saved.url,
      preview: saved.preview,
      editor: saved.edit,
      seo: true,
      parentId: saved.parentId,
      views: [],
    };
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(saved.edit, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => wp.data?.select("core/block-editor")?.getBlocks().length,
    );
    const guide = page
      .getByRole("dialog")
      .getByRole("button", { name: /Close|Закрыть/ });
    if ((await guide.count()) === 1 && (await guide.isVisible()))
      await guide.click();
    const validation = await page.evaluate(() => {
      const flat = (bs) => bs.flatMap((b) => [b, ...flat(b.innerBlocks || [])]);
      const blocks = flat(wp.data.select("core/block-editor").getBlocks());
      return {
        count: blocks.length,
        invalid: blocks
          .filter((b) => !b.isValid || !wp.blocks.getBlockType(b.name))
          .map((b) => b.name),
        html: blocks.filter((b) =>
          ["core/html", "core/freeform"].includes(b.name),
        ).length,
      };
    });
    assert.deepEqual(validation.invalid, [], saved.key);
    assert.equal(validation.html, 0);
    row.blocks = validation.count;
    // Exercise a real draft edit, then restore the exact project title before reopening.
    for (const title of [saved.title + " · проверка", saved.title]) {
      await page.evaluate(
        (title) => wp.data.dispatch("core/editor").editPost({ title }),
        title,
      );
      await page.keyboard.press("Control+s");
      try {
        await page.waitForFunction(
          () =>
            !wp.data.select("core/editor").isSavingPost() &&
            !wp.data.select("core/editor").isEditedPostDirty(),
        );
      } catch (error) {
        const stored = await wp([
          "post",
          "get",
          String(saved.id),
          "--field=post_title",
        ]);
        if (stored !== title) throw error;
        row.editorSaveResponseRecovered = true;
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForFunction(
          () => wp.data?.select("core/block-editor")?.getBlocks().length,
        );
      }
    }
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => wp.data?.select("core/block-editor")?.getBlocks().length,
    );
    assert.deepEqual(
      await page.evaluate(() => {
        const flat = (bs) =>
          bs.flatMap((b) => [b, ...flat(b.innerBlocks || [])]);
        return flat(wp.data.select("core/block-editor").getBlocks())
          .filter((b) => !b.isValid)
          .map((b) => b.name);
      }),
      [],
    );
    row.editorSaveReopen = true;
    const canvas =
      page.frames().find((frame) => frame.name() === "editor-canvas") || page;
    const editorRoot = canvas.locator(".lr-gutenberg-root");
    await editorRoot.waitFor();
    row.editorFont = await editorRoot.evaluate(
      (e) => getComputedStyle(e).fontFamily,
    );
    assert(
      row.editorFont.includes("LR Golos Text"),
      "Page CSS missing in editor: " + saved.key,
    );
    row.editorLayout = await editorRoot.evaluate((e) => ({
      display: getComputedStyle(e).display,
      heroDisplay: e.querySelector(".lr-hero,.lr-child-hero")
        ? getComputedStyle(e.querySelector(".lr-hero,.lr-child-hero")).display
        : null,
    }));
    assert.notEqual(row.editorLayout.display, "contents");
    assert.notEqual(row.editorLayout.heroDisplay, "contents");
    row.editorHeroIcons = await editorRoot.evaluate((root) =>
      [...root.querySelectorAll(".lr-hero__benefit-icon")].map((icon) => ({
        rule: getComputedStyle(icon.querySelector("path")).fillRule,
        offset: Math.abs(
          icon.getBoundingClientRect().left -
            icon.closest(".lr-hero__benefit").getBoundingClientRect().left,
        ),
      })),
    );
    assert.ok(
      row.editorHeroIcons.every(
        (icon) => icon.rule === "evenodd" && icon.offset < 1,
      ),
      saved.key + ": hero SVG/position",
    );
    assert.equal(
      await page.locator('script[src*="/resources/page-bootstrap.js"]').count(),
      0,
      "Frontend JS loaded in editor",
    );
    if (selected.has(saved.key))
      await page.screenshot({
        path: path.join(out, "screenshots", saved.key + "-editor.png"),
      });
    await page.goto(saved.preview, { waitUntil: "domcontentloaded" });
    await page.locator("#hop-landing").waitFor();
    row.staticLineBreaks = await page.evaluate(
      () =>
        [...document.querySelectorAll("#hop-landing br")].filter(
          (br) => !br.closest("#dmap"),
        ).length,
    );
    assert.equal(
      row.staticLineBreaks,
      sourceRows.find((source) => source.key === saved.key).explicitLineBreaks,
      saved.key + ": unexpected line breaks",
    );
    await page.evaluate(() => {
      document
        .querySelectorAll("#hop-landing img")
        .forEach((img) => (img.loading = "eager"));
    });
    await page.waitForFunction(() =>
      [...document.querySelectorAll("#hop-landing img")].every(
        (img) => img.complete,
      ),
    );
    if (selected.has(saved.key)) {
      await page.evaluate(() =>
        document.querySelectorAll("#hop-landing video").forEach((video) => {
          video.preload = "metadata";
          video.load();
        }),
      );
      await page.waitForFunction(() =>
        [...document.querySelectorAll("#hop-landing video")].every(
          (video) => video.readyState >= 1 || video.error,
        ),
      );
      row.video = await page.evaluate(() =>
        [...document.querySelectorAll("#hop-landing video")].map((video) => ({
          src: video.currentSrc,
          ready: video.readyState,
          error: video.error?.message || null,
        })),
      );
      assert(
        row.video.every((video) => video.ready >= 1 && !video.error),
        "Video did not decode",
      );
    }
    for (const width of [1440, 1024, 375]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() =>
        [...document.querySelectorAll("#hop-landing img")].every(
          (img) => img.complete,
        ),
      );
      const view = await page.evaluate(() => ({
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        brokenImages: [...document.querySelectorAll("#hop-landing img")]
          .filter((img) => !img.naturalWidth)
          .map((img) => img.src),
        rootCount: document.querySelectorAll("#hop-landing").length,
        themeSwitch: !!document.querySelector("[data-lr-theme-switch]"),
        forms: [...document.querySelectorAll("#hop-landing form")].map((f) => ({
          lead: f.hasAttribute("data-hop-lead-form"),
          fields: [...f.querySelectorAll("input,select")]
            .filter((i) => i.name)
            .map((i) => i.name),
        })),
      }));
      if (view.overflow)
        console.log(
          await page.evaluate(() => ({
            width: innerWidth,
            scroll: document.documentElement.scrollWidth,
            root: document
              .querySelector("#hop-landing")
              .getBoundingClientRect()
              .toJSON(),
            outside: [...document.querySelectorAll("#hop-landing *")]
              .filter(
                (e) =>
                  e.getBoundingClientRect().right > innerWidth + 1 &&
                  getComputedStyle(e).position !== "absolute",
              )
              .slice(0, 12)
              .map((e) => ({
                class: e.className,
                right: e.getBoundingClientRect().right,
                width: e.getBoundingClientRect().width,
              })),
          })),
        );
      assert.equal(view.overflow, false, saved.key + " overflow at " + width);
      assert.deepEqual(view.brokenImages, [], saved.key);
      assert.equal(view.rootCount, 1);
      assert.equal(view.themeSwitch, false);
      row.views.push(view);
      if (selected.has(saved.key) && width !== 1024)
        await page.screenshot({
          path: path.join(out, "screenshots", saved.key + "-" + width + ".png"),
          fullPage: true,
        });
    }
    const summary = page.locator(
      "#lr-faq details summary,.lr-service-faq details summary",
    );
    if (await summary.count()) {
      const first = summary.first();
      const opened = await first.evaluate((e) => e.parentElement.open);
      await first.focus();
      await first.press("Enter");
      assert.equal(await first.evaluate((e) => e.parentElement.open), !opened);
      row.faqKeyboard = true;
    }
    if (selected.has(saved.key)) {
      const quizLink = page.locator(".lr-hero [data-lr-quiz-open]");
      if (await quizLink.count()) {
        const trigger = quizLink.first();
        await trigger.focus();
        await trigger.press("Enter");
        await page.locator("[data-lr-quiz-modal][open]").waitFor();
        await page.keyboard.press("Escape");
        await page
          .locator("[data-lr-quiz-modal][open]")
          .waitFor({ state: "hidden" });
        assert(await trigger.evaluate((e) => e === document.activeElement));
        row.quizKeyboard = true;
      }
      const phone = page.locator("form:visible input[data-lr-phone]");
      if (await phone.count()) {
        const field = phone.first();
        if (await field.evaluate((e) => e.readOnly)) {
          const form = field.locator("xpath=ancestor::form[1]");
          await field.focus();
          for (const digit of "79991234567")
            await form.locator('[data-lr-digit="' + digit + '"]').click();
          assert.equal(await field.inputValue(), "+7 (999) 123-45-67");
          await form.locator('[data-lr-digit="clear"]').click();
          row.mobileDialpad = true;
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
        await field.fill("89991234567");
        assert.equal(await field.inputValue(), "+7 (999) 123-45-67");
        await field.fill("");
        row.phoneMask = true;
      }
    }
    row.errors = errors.splice(0);
    assert.deepEqual(row.errors, [], saved.key);
    result.pages.push(row);
    await writeFile(
      path.join(out, "acceptance.json"),
      JSON.stringify(result, null, 2),
    );
    console.log("PASS " + result.pages.length + "/50: " + saved.key);
  }
  const final = JSON.parse(
    await wp(["eval-file", path.resolve("scripts/gutenberg/verify-site.php")]),
  );
  assert.deepEqual(final.failures, []);
  await writeFile(
    path.join(out, "site-pages.json"),
    JSON.stringify(
      { ...final, pages: final.pages.map(({ content, ...rest }) => rest) },
      null,
      2,
    ),
  );
} catch (error) {
  if (activePage) {
    const stored = await wp([
      "post",
      "get",
      String(activePage.id),
      "--field=post_title",
    ]);
    if (stored === activePage.title + " · проверка")
      await wp([
        "post",
        "update",
        String(activePage.id),
        "--post_title=" + activePage.title,
      ]);
  }
  if (page)
    await page
      .screenshot({ path: path.join(out, "screenshots/failure.png") })
      .catch(() => {});
  await writeFile(path.join(out, "acceptance-error.txt"), String(error));
  throw error;
} finally {
  await browser.close();
}
