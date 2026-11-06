import assert from "node:assert/strict";
import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
} from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire("D:/works/lenremont-gutenberg/package.json");
const { chromium } = require("playwright");
const out = path.resolve("artifacts/gutenberg-2026-11-06");
const pack = path.join(out, "project");
await mkdir(path.join(pack, "pages"), { recursive: true });
await mkdir(path.join(pack, "resources/media/fonts"), { recursive: true });
await mkdir(path.join(pack, "media"), { recursive: true });
const data = JSON.parse(await readFile("src/data/service-pages.json", "utf8"));
const pages = [
  { slug: "remont-noutbukov-spb", label: "Ремонт ноутбуков" },
  ...data.brands,
  ...data.problems,
  data.macbook,
];
assert.equal(pages.length, 50);
const paths = Object.fromEntries(
  pages.map((p) => ["/" + p.slug + ".htm", p.slug]),
);
paths["/"] = pages[0].slug;
const runtime = JSON.parse(
  await readFile(path.join(out, "runtime.json"), "utf8"),
);
assert.equal(runtime.config.site, "http://testing-gutenberg.local/");
const browser = await chromium.launch({ channel: "chromium" });
const resources = {},
  media = {},
  inline = [],
  report = [];
const addResource = async (from, name) => {
  const dest = "resources/" + name;
  if (!resources[dest]) {
    await mkdir(path.dirname(path.join(pack, dest)), { recursive: true });
    await copyFile(from, path.join(pack, dest));
    resources[dest] = {};
  }
  return dest;
};
try {
  const page = await browser.newPage();
  await page.goto(runtime.config.site + "?rest_route=/", {
    waitUntil: "domcontentloaded",
  });
  await page.setContent(runtime.html, { waitUntil: "load" });
  await page.waitForFunction(() =>
    window.wp?.blocks?.getBlockType("lenremont/element"),
  );
  for (const entry of pages) {
    const slug = entry.slug;
    const html = await readFile("dist/" + slug + ".htm/index.html", "utf8");
    const result = await page.evaluate(
      ({ html, slug, paths }) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const root = doc.querySelector("#hop-landing");
        if (!root) throw new Error("Missing landing root");
        root.querySelector("[data-lr-theme-switch]")?.remove();
        root.removeAttribute("data-lr-themeable");
        if (!root.querySelector("[data-lr-workshop-map]")) {
          const surface = root.querySelector(
            '[data-lr-map-slot="workshops"] [data-lr-map-surface]',
          );
          if (surface) {
            const marker = doc.createElement("div");
            marker.setAttribute("data-lr-workshop-map", "");
            surface.append(marker);
          }
        }
        const art = {},
          styles = [],
          used = new Set(),
          lost = [],
          sectionNames = [];
        let count = 0;
        const link = (value) => {
          if (value.startsWith("/media/")) {
            used.add(value.slice(7));
            return /\.(webp|png|jpe?g|gif)$/i.test(value)
              ? "https://assets.invalid/" +
                  value
                    .slice(7)
                    .replace(/\.[^.]+$/, "")
                    .replaceAll("/", "-")
                    .replaceAll("_", "-")
              : "https://resources.invalid/resources/media/" + value.slice(7);
          }
          const [url, anchor] = value.split("#");
          return paths[url]
            ? "https://pages.invalid/" +
                paths[url] +
                (anchor ? "#" + anchor : "")
            : value;
        };
        const attrs = (e) => {
          const original = Object.fromEntries(
            [...e.attributes].map((a) => [a.name, a.value]),
          );
          if (original.style) {
            original["data-code"] = "lr-" + slug + "-" + count++;
            styles.push(
              `#hop-landing [data-code="${original["data-code"]}"]{${original.style}}`,
            );
            delete original.style;
          }
          for (const key of [
            "href",
            "src",
            "poster",
            "data-image",
            "data-lr-photo-open",
          ])
            if (original[key]) original[key] = link(original[key]);
          if (original.srcset)
            original.srcset = original.srcset
              .split(",")
              .map((candidate) => {
                const [url, ...descriptor] = candidate.trim().split(/\s+/);
                return [link(url), ...descriptor].join(" ");
              })
              .join(", ");
          const clean = LenremontReferenceBlocks.cleanAttributes(original);
          for (const name of Object.keys(original))
            if (!(name in clean))
              lost.push({ tag: e.tagName, name, value: original[name] });
          return clean;
        };
        const create = wp.blocks.createBlock;
        const text = (s) => create("lenremont/text", { raw: true, text: s });
        const children = (e) =>
          [...e.childNodes].flatMap((node) => {
            if (node.nodeType === 3)
              return node.textContent.trim() ? [text(node.textContent)] : [];
            if (node.nodeType !== 1) return [];
            return [convert(node)];
          });
        function convert(e) {
          const tag = e.localName;
          if (e.hasAttribute("data-lr-workshop-map"))
            return create("core/shortcode", { text: "[dmap]" });
          if (tag === "svg") {
            const key = "svg-" + Object.keys(art).length;
            art[key] = e.outerHTML;
            return create("lenremont/art", { asset: key });
          }
          const a = attrs(e);
          if (tag === "img")
            return create("lenremont/picture", { attributes: a });
          // RichText keeps inline formatting, links and line breaks as one editable text block.
          if (
            [
              "p",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "span",
              "strong",
              "small",
              "summary",
              "figcaption",
              "option",
            ].includes(tag) &&
            !e.querySelector("svg,img,input,button,select") &&
            !e.querySelector("[data-lr-photo-open]")
          ) {
            for (const el of e.querySelectorAll("[href],[src]"))
              for (const name of ["href", "src"])
                if (el.hasAttribute(name))
                  el.setAttribute(name, link(el.getAttribute(name)));
            // HTML indentation is collapsible space; RichText treats literal newlines as line breaks.
            const inline = e.cloneNode(true);
            const textNodes = doc.createTreeWalker(
              inline,
              NodeFilter.SHOW_TEXT,
            );
            while (textNodes.nextNode())
              textNodes.currentNode.nodeValue =
                textNodes.currentNode.nodeValue.replace(/[\t\n\f\r ]+/g, " ");
            if (
              (tag === "p" || /^h[1-6]$/.test(tag)) &&
              Object.keys(a).every((k) => ["class", "id"].includes(k))
            ) {
              return create(tag === "p" ? "core/paragraph" : "core/heading", {
                content: inline.innerHTML,
                className: a.class || "",
                anchor: a.id || "",
                ...(tag !== "p" ? { level: Number(tag[1]) } : {}),
              });
            }
            return create("lenremont/text", {
              tag,
              text: inline.innerHTML,
              attributes: a,
            });
          }
          if (!LenremontReferenceBlocks.tags.includes(tag))
            throw new Error("Unsupported element " + tag);
          if (e.parentElement === root) {
            const name =
              e.querySelector("h1,h2,h3")?.textContent.trim() ||
              a["aria-label"] ||
              a.id ||
              tag;
            sectionNames.push(name);
            return create(
              "core/group",
              {
                tagName: tag === "section" ? "section" : "div",
                className: "lr-gutenberg-section",
                layout: { type: "default" },
                metadata: { name },
              },
              [
                create(
                  "lenremont/element",
                  { tag, attributes: a },
                  children(e),
                ),
              ],
            );
          }
          return create(
            "lenremont/element",
            { tag, attributes: a },
            children(e),
          );
        }
        const blocks = [
          create(
            "lenremont/element",
            { tag: "main", attributes: attrs(root) },
            children(root),
          ),
        ];
        const serialized = wp.blocks.serialize(blocks);
        const flat = (bs) =>
          bs.flatMap((b) => [b, ...flat(b.innerBlocks || [])]);
        const parsed = flat(wp.blocks.parse(serialized));
        const invalid = parsed
          .filter((b) => !b.isValid)
          .map((b) => ({ type: b.name, issues: b.validationIssues }));
        if (invalid.length)
          throw new Error(
            "Invalid Gutenberg: " + JSON.stringify(invalid.slice(0, 2)),
          );
        if (parsed.length > 2500)
          throw new Error("Too many blocks: " + parsed.length);
        const rendered = new DOMParser().parseFromString(
          serialized.replace(
            /<!-- wp:lenremont\/art (\{[^]*?\}) \/-->/g,
            (_, json) => art[JSON.parse(json).asset],
          ),
          "text/html",
        );
        const sourceText = root.textContent.replace(/\s+/g, " ").trim();
        rendered.querySelectorAll("[data-lr-map-surface]").forEach((el) => {
          if (el.textContent.trim() === "[dmap]") el.textContent = "";
        });
        const outputText = rendered
          .querySelector("#hop-landing")
          .textContent.replace(/\s+/g, " ")
          .trim();
        if (sourceText.replace(/\s/g, "") !== outputText.replace(/\s/g, "")) {
          const a = sourceText.replace(/\s/g, ""),
            b = outputText.replace(/\s/g, "");
          let at = 0;
          while (at < a.length && a[at] === b[at]) at++;
          throw new Error(
            "Text changed during serialization: " +
              JSON.stringify({
                at,
                source: a.slice(at - 40, at + 90),
                output: b.slice(at - 40, at + 90),
              }),
          );
        }
        if (lost.length)
          throw new Error(
            "Attributes lost: " + JSON.stringify(lost.slice(0, 12)),
          );
        const sourceOptions = [...root.querySelectorAll("option")].map(
          (option) => [
            option.getAttribute("value"),
            option.textContent.replace(/[\t\n\f\r ]+/g, " "),
          ],
        );
        const savedOptions = [...rendered.querySelectorAll("option")].map(
          (option) => [option.getAttribute("value"), option.textContent],
        );
        if (JSON.stringify(sourceOptions) !== JSON.stringify(savedOptions))
          throw new Error(
            "Select option values changed during Gutenberg serialization",
          );
        if (
          rendered.querySelectorAll("br").length !==
          root.querySelectorAll("br").length
        )
          throw new Error("Line breaks changed during Gutenberg serialization");
        const expectedForms = [...root.querySelectorAll("form")].map((f) => ({
          attributes: attrs(f),
          inputs: [...f.querySelectorAll("input,select")].map((i) => ({
            tag: i.localName,
            name: i.name,
            value: i.getAttribute("value"),
            type: i.type,
          })),
        }));
        return {
          content: serialized,
          art,
          styles,
          used: [...used],
          blocks: parsed.length,
          explicitLineBreaks: root.querySelectorAll("br").length,
          sectionNames,
          forms: expectedForms,
          title: doc.title,
          description: doc.querySelector('meta[name="description"]').content,
          originalCanonical: doc.querySelector('link[rel="canonical"]').href,
          ogImageKey: (() => {
            const el = root.querySelector("video[poster],img");
            const url = el?.getAttribute("poster") || el?.getAttribute("src");
            return url?.startsWith("/media/")
              ? url
                  .slice(7)
                  .replace(/\.[^.]+$/, "")
                  .replaceAll("/", "-")
                  .replaceAll("_", "-")
              : null;
          })(),
        };
      },
      { html, slug, paths },
    );
    inline.push(...result.styles);
    const artName = "resources/art-" + slug + ".json";
    await writeFile(path.join(pack, artName), JSON.stringify(result.art));
    resources[artName] = {};
    for (const file of result.used) {
      if (/\.(webp|png|jpe?g|gif)$/i.test(file)) {
        const key = file
          .replace(/\.[^.]+$/, "")
          .replaceAll("/", "-")
          .replaceAll("_", "-");
        if (!media[key]) {
          const bytes = await readFile("public/media/" + file);
          const extension =
            bytes[0] === 0xff && bytes[1] === 0xd8
              ? ".jpg"
              : path.extname(file);
          const dest =
            "media/" + file.replaceAll("/", "-").replace(/\.[^.]+$/, extension);
          await copyFile("public/media/" + file, path.join(pack, dest));
          media[key] = { file: dest };
        }
      } else await addResource("public/media/" + file, "media/" + file);
    }
    await writeFile(
      path.join(pack, "pages/" + slug + ".blocks.html"),
      result.content
        .replaceAll("https://resources.invalid/resources", "{{resourcesUrl}}")
        .replaceAll("https://assets.invalid/", "asset://")
        .replaceAll("https://pages.invalid/", "page://"),
    );
    report.push({
      ...entry,
      key: slug,
      blocks: result.blocks,
      explicitLineBreaks: result.explicitLineBreaks,
      sections: result.sectionNames,
      forms: result.forms,
      title: result.title,
      description: result.description,
      originalCanonical: result.originalCanonical,
      ogImageKey: result.ogImageKey,
      artName,
    });
    console.log(slug + ": " + result.blocks + " editable blocks");
  }
  const built = await readdir("dist/_astro");
  const css = built.find((f) => /^LandingLayout\..*\.css$/.test(f));
  const js = built.find((f) => /^LandingLayout.*\.js$/.test(f));
  assert(css && js);
  let styles = await readFile("dist/_astro/" + css, "utf8");
  styles = styles.replaceAll("/media/", "./media/");
  const fontFiles = [...styles.matchAll(/\.\/media\/([^\s)"']+)/g)].map(
    (m) => m[1],
  );
  for (const file of new Set(fontFiles))
    await addResource("public/media/" + file, "media/" + file);
  styles +=
    "\n" +
    inline.join("\n") +
    "\n#hop-landing .lr-gutenberg-section{display:contents}#hop-landing .wp-block-group__inner-container{display:contents}\n";
  await writeFile(path.join(pack, "resources/page.css"), styles);
  const editorCss =
    '[data-lr-original-id="hop-landing"] .wp-block{margin:0;max-width:none;position:static}\n' +
    styles.replaceAll("#hop-landing", '[data-lr-original-id="hop-landing"]') +
    '\n[data-lr-original-id="hop-landing"] .block-editor-inner-blocks,[data-lr-original-id="hop-landing"] .lr-art-editor{display:contents}\n';
  await writeFile(path.join(pack, "resources/editor.css"), editorCss);
  await copyFile("dist/_astro/" + js, path.join(pack, "resources/page.js"));
  resources["resources/page.css"] = {};
  resources["resources/editor.css"] = {};
  resources["resources/page.js"] = {};
  // The same pinned lightbox version is shipped with the page instead of relying on a CDN.
  for (const [name, url] of [
    [
      "glightbox.min.js",
      "https://cdn.jsdelivr.net/npm/glightbox@3.3.1/dist/js/glightbox.min.js",
    ],
    [
      "glightbox.min.css",
      "https://cdn.jsdelivr.net/npm/glightbox@3.3.1/dist/css/glightbox.min.css",
    ],
  ]) {
    const response = await fetch(url);
    assert(response.ok, "Lightbox dependency failed");
    await writeFile(
      path.join(pack, "resources/" + name),
      new Uint8Array(await response.arrayBuffer()),
    );
    resources["resources/" + name] = {};
  }
  const common = Object.keys(resources).filter(
    (name) => !name.startsWith("resources/art-"),
  );
  const manifest = {
    format: "lenremont-project",
    version: 4,
    project: {
      slug: "lr-remont-noutbykov",
      title: "Ремонт ноутбуков — 50 страниц",
    },
    pages: report.map((r, index) => ({
      key: r.key,
      slug: r.slug,
      title: r.h1 || "Ремонт ноутбуков в Санкт-Петербурге",
      url: r.slug + ".htm",
      file: "pages/" + r.slug + ".blocks.html",
      format: "gutenberg",
      ...(index ? { parentId: "page://remont-noutbukov-spb" } : {}),
      seo: {
        title: r.title,
        description: r.description,
        breadcrumbsTitle: r.label,
        breadcrumbsUrl: "page://" + r.key,
        canonical: "page://" + r.key,
        ogTitle: r.title,
        ogDescription: r.description,
        ...(r.ogImageKey ? { ogImage: "asset://" + r.ogImageKey } : {}),
      },
      assets: {
        files: [...common, r.artName],
        styles: ["resources/glightbox.min.css", "resources/page.css"],
        editorStyles: ["resources/editor.css"],
        scripts: [
          { file: "resources/glightbox.min.js", type: "classic" },
          { file: "resources/page.js", type: "module" },
        ],
        data: { "legacy-art": r.artName },
      },
    })),
    media,
    resources,
  };
  await writeFile(
    path.join(pack, "project.json"),
    JSON.stringify(manifest, null, 2),
  );
  await writeFile(
    path.join(out, "source-map.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    "Prepared 50 pages, " +
      Object.keys(media).length +
      " images, " +
      Object.keys(resources).length +
      " resources.",
  );
} finally {
  await browser.close();
}
