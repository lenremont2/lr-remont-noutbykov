// Read-only rendered comparison of the local Gutenberg editor and front end.
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { wp } from "./local-wp.mjs";
import assert from "node:assert/strict";
const { chromium } = createRequire("D:/works/lenremont-gutenberg/package.json")(
  "playwright",
);
const out = "artifacts/gutenberg-2026-11-06/hero-audit/";
const phase = process.argv.includes("--candidate")
  ? "candidate"
  : process.argv.includes("--after")
    ? "after"
    : "before";
const snapshot = JSON.parse(await readFile(out + "before.json", "utf8"));
const sources = JSON.parse(
  await readFile("artifacts/gutenberg-2026-11-06/source-map.json", "utf8"),
);
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
    url: snapshot.site,
    httpOnly: true,
    sameSite: "Lax",
  })),
);
const page = await context.newPage();
if (phase === "candidate")
  await context.route("**/resources/editor.css?*", (route) =>
    route.fulfill({
      path: "artifacts/gutenberg-2026-11-06/project/resources/editor.css",
      contentType: "text/css",
    }),
  );
page.setDefaultTimeout(30000);
const result = { checkedAt: new Date().toISOString(), pages: [] };
const inspect = () => {
  const root = document.querySelector(
    '#hop-landing,[data-lr-original-id="hop-landing"]',
  );
  return {
    icons: [
      ...root.querySelectorAll(
        '#lr-hero .lr-hero__benefit-icon svg, [data-lr-original-id="lr-hero"] .lr-hero__benefit-icon svg',
      ),
    ].map((svg) => ({
      html: svg.outerHTML,
      fillRule: getComputedStyle(svg.querySelector("path")).fillRule,
      box: [
        svg.getBoundingClientRect().width,
        svg.getBoundingClientRect().height,
      ],
    })),
    mark: root.querySelector(".lr-hero__scene-mark")?.outerHTML,
    emptySvg: [...root.querySelectorAll("svg")].filter(
      (svg) =>
        !svg.querySelector(
          "path,circle,rect,line,polyline,polygon,ellipse,use,text",
        ),
    ).length,
    unresolvedUse: [...root.querySelectorAll("use")]
      .filter((use) => {
        const id = use.getAttribute("href") || use.getAttribute("xlink:href");
        return (
          id?.startsWith("#") &&
          !root.querySelector('[id="' + id.slice(1) + '"]')
        );
      })
      .map((use) => use.outerHTML),
    breaks: root.querySelectorAll("br").length,
    staticBreaks: [...root.querySelectorAll("br")].filter(
      (br) => !br.closest("#dmap"),
    ).length,
  };
};
try {
  for (const id of process.argv.includes("--main")
    ? [6219]
    : [6219, 6220, 6229, 6259, 6268]) {
    const saved = snapshot.pages.find((page) => page.id === id);
    const row = { id, key: saved.key };
    await page.goto(saved.preview, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.locator("#hop-landing[data-lr-initialized=true]").waitFor();
    await page.evaluate(() => document.fonts.ready);
    row.frontend = await page.evaluate(inspect);
    await page
      .locator("#lr-hero")
      .screenshot({ path: out + id + "-frontend-" + phase + ".png" });
    await page.goto(saved.edit, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForFunction(
      () => window.wp?.data?.select("core/block-editor")?.getBlocks().length,
    );
    const canvas = page.frameLocator('iframe[name="editor-canvas"]');
    await canvas.locator('[data-lr-original-id="hop-landing"]').waitFor();
    const frame = page
      .frames()
      .find((frame) => frame.name() === "editor-canvas");
    if (phase === "candidate")
      await frame.addStyleTag({
        content: (
          await readFile(
            "artifacts/gutenberg-2026-11-06/project/resources/editor.css",
            "utf8",
          )
        ).split("\n")[0],
      });
    row.editor = await frame.evaluate(inspect);
    if (id === 6219)
      console.log(
        await frame.evaluate(() => {
          const target = document.querySelector(".lr-hero__benefit-top"),
            rules = [];
          const walk = (list) => {
            for (const rule of list) {
              if (rule.selectorText && rule.style?.position) {
                try {
                  if (target.matches(rule.selectorText))
                    rules.push({
                      selector: rule.selectorText,
                      position: rule.style.position,
                      priority: rule.style.getPropertyPriority("position"),
                    });
                } catch {}
              }
              if (rule.cssRules) walk(rule.cssRules);
            }
          };
          for (const sheet of document.styleSheets) {
            try {
              walk(sheet.cssRules);
            } catch {}
          }
          return { inline: target?.getAttribute("style"), rules };
        }),
      );
    row.editor.positioning = await frame.evaluate(() =>
      [
        ...document.querySelectorAll(
          ".lr-hero__benefit-top,.lr-hero__benefit-icon,.lr-hero__benefit",
        ),
      ]
        .slice(0, 7)
        .map((el) => ({
          class: el.className,
          position: getComputedStyle(el).position,
          paddingLeft: getComputedStyle(el).paddingLeft,
          x: el.getBoundingClientRect().x,
          width: el.getBoundingClientRect().width,
        })),
    );
    await canvas
      .locator('[data-lr-original-id="lr-hero"]')
      .screenshot({ path: out + id + "-editor-" + phase + ".png" });
    if (row.editor.icons.length)
      await canvas
        .locator(".lr-hero__benefits")
        .screenshot({ path: out + id + "-icons-" + phase + ".png" });
    result.pages.push(row);
    if (phase === "after") {
      assert.deepEqual(
        row.editor.icons.map((icon) => icon.fillRule),
        row.frontend.icons.map((icon) => icon.fillRule),
      );
      assert.equal(
        row.frontend.staticBreaks,
        sources.find((source) => source.key === saved.key).explicitLineBreaks,
      );
      assert.ok(
        row.editor.positioning
          .filter((item) => item.class.includes("lr-hero__benefit-top"))
          .every((item) => item.position === "static"),
      );
      assert.ok(!row.frontend.mark?.includes("<br"));
    }
    console.log(
      JSON.stringify({
        id,
        frontRules: row.frontend.icons.map((icon) => icon.fillRule),
        editorRules: row.editor.icons.map((icon) => icon.fillRule),
        frontMark: row.frontend.mark,
        positioning: row.editor.positioning,
      }),
    );
  }
  await writeFile(
    out + phase + "-render.json",
    JSON.stringify(result, null, 2),
  );
} finally {
  await browser.close();
}
