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
import { initializePageControls } from "./page-controls.js";
const require = createRequire("D:/works/lenremont-gutenberg/package.json");
const { chromium } = require("playwright");
const out = path.resolve("artifacts/gutenberg-2026-11-06/stock");
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
const preflight = JSON.parse(
  await readFile(path.join(out, "preflight.json"), "utf8"),
);
assert.equal(
  preflight.plugin,
  "0.31.0",
  "Build against the unchanged installed plugin",
);
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
      ({ html, slug, paths, controlsSource }) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const root = doc.querySelector("#hop-landing");
        if (!root) throw new Error("Missing landing root");
        root.classList.add("lr-gutenberg-root");
        root.querySelector("[data-lr-theme-switch]")?.remove();
        root.removeAttribute("data-lr-themeable");
        root
          .querySelectorAll('[fill-rule="evenodd"],[clip-rule="evenodd"]')
          .forEach((el) => el.classList.add("lr-gutenberg-evenodd"));
        // SVG labels remain editable text instead of extending the plugin's SVG sanitizer.
        for (const svg of root.querySelectorAll(".lr-format-route svg")) {
          const wrapper = doc.createElement("div");
          wrapper.className = "lr-gutenberg-route-svg";
          svg.replaceWith(wrapper);
          wrapper.append(svg);
          for (const label of svg.querySelectorAll("text")) {
            const span = doc.createElement("span");
            span.className =
              "lr-gutenberg-route-label" +
              (label.classList.contains("lr-format-route__destination")
                ? " lr-gutenberg-route-label--end"
                : "");
            span.textContent = label.textContent;
            wrapper.append(span);
            label.remove();
          }
        }
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
            if (/\.webm$/i.test(value))
              return (
                "/wp-content/uploads/lr-remont-noutbykov/" + value.slice(7)
              );
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
        const attrs = (e, kind) => {
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
          const settings = {};
          for (const name of Object.keys(original))
            if (!(name in clean)) {
              if (
                !/^(?:data-(?:lr|hop|sc)-[a-z0-9-]+|data-(?:format|format-schema|format-illustration|device-category|symptom)|srcset|sizes|colspan|rowspan|novalidate|checked|open|datetime)$/.test(
                  name,
                )
              )
                lost.push({ tag: e.tagName, name, value: original[name] });
              else {
                settings[name] = original[name];
                if (name.startsWith("data-")) {
                  const hooks = ["lr-gb-" + name];
                  if (/^[a-z0-9-]+$/i.test(original[name]))
                    hooks.push("lr-gb-" + name + "--" + original[name]);
                  clean.class = [clean.class || "", ...hooks].join(" ").trim();
                }
              }
            }
          if (kind || Object.keys(settings).length) {
            if (original["data-ui"])
              throw new Error("Existing UI configuration");
            clean["data-ui"] = JSON.stringify({
              lenremontPage: 1,
              kind: kind || "attributes",
              attributes: settings,
            });
          }
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
          const tag = e.localName === "b" ? "strong" : e.localName;
          if (e.hasAttribute("data-lr-workshop-map"))
            return create("core/shortcode", { text: "[dmap]" });
          if (tag === "svg") {
            const key = "svg-" + Object.keys(art).length;
            art[key] = e.outerHTML;
            return create("lenremont/art", { asset: key });
          }
          if (tag === "video") {
            const attributes = Object.fromEntries(
              [...e.attributes]
                .filter(
                  (a) =>
                    ![
                      "src",
                      "poster",
                      "class",
                      "controls",
                      "autoplay",
                      "muted",
                      "loop",
                      "playsinline",
                      "preload",
                    ].includes(a.name),
                )
                .map((a) => [a.name, a.value]),
            );
            const block = create("core/video", {
              src: link(
                e.getAttribute("src") ||
                  e.querySelector("source").getAttribute("src"),
              ),
              poster: e.hasAttribute("poster")
                ? link(e.getAttribute("poster"))
                : undefined,
              className: e.className,
              controls: e.hasAttribute("controls"),
              autoplay: e.hasAttribute("autoplay"),
              muted: e.hasAttribute("muted"),
              loop: e.hasAttribute("loop"),
              playsInline: e.hasAttribute("playsinline"),
              preload: e.getAttribute("preload") || "metadata",
            });
            e.textContent = "";
            return create(
              "lenremont/element",
              {
                tag: "div",
                attributes: {
                  class: "lr-gutenberg-video",
                  "data-ui": JSON.stringify({
                    lenremontPage: 1,
                    kind: "video",
                    attributes,
                  }),
                },
              },
              [block],
            );
          }
          const a = attrs(
            e,
            tag === "select" || tag === "time" ? tag : undefined,
          );
          if (e.localName === "b")
            a.class = [a.class || "", "lr-gutenberg-bold"].join(" ").trim();
          if (tag === "select")
            return create(
              "lenremont/element",
              {
                tag: "div",
                attributes: {
                  ...a,
                  class: [a.class || "", "lr-gutenberg-select"]
                    .join(" ")
                    .trim(),
                  role: "listbox",
                },
              },
              [...e.options].map((option) =>
                create("lenremont/text", {
                  tag: "span",
                  text: option.innerHTML.replace(/[\t\n\f\r ]+/g, " "),
                  attributes: {
                    ...attrs(option),
                    role: "option",
                    "data-name": option.value,
                    "aria-selected": String(option.selected),
                  },
                }),
              ),
            );
          if (tag === "time")
            return create("lenremont/text", {
              tag: "span",
              text: e.innerHTML,
              attributes: a,
            });
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
        rendered
          .querySelectorAll("[data-lr-map-surface],.lr-gb-data-lr-map-surface")
          .forEach((el) => {
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
        const savedOptions = [
          ...rendered.querySelectorAll('[role="option"]'),
        ].map((option) => [
          option.getAttribute("data-name"),
          option.textContent,
        ]);
        if (JSON.stringify(sourceOptions) !== JSON.stringify(savedOptions))
          throw new Error(
            "Select option values changed during Gutenberg serialization",
          );
        const enhance = new Function("return (" + controlsSource + ")")();
        const renderedRoot = rendered.querySelector("#hop-landing");
        enhance(renderedRoot);
        enhance(renderedRoot); // Repeated initialization must preserve values and avoid duplicates.
        const enhancedOptions = [
          ...renderedRoot.querySelectorAll("option"),
        ].map((option) => [option.getAttribute("value"), option.textContent]);
        if (JSON.stringify(sourceOptions) !== JSON.stringify(enhancedOptions))
          throw new Error("Page controls changed option values");
        [...root.querySelectorAll("option")].forEach((option, index) => {
          const saved = renderedRoot.querySelectorAll("option")[index];
          for (const { name, value } of option.attributes)
            if (
              name !== "class" &&
              name !== "style" &&
              saved.getAttribute(name) !== value
            )
              throw new Error("Option attribute changed: " + name);
        });
        const originalForms = [...root.querySelectorAll("form")];
        const enhancedForms = [...renderedRoot.querySelectorAll("form")];
        if (originalForms.length !== enhancedForms.length)
          throw new Error("Form count changed");
        originalForms.forEach((form, index) => {
          if (
            [...form.classList].some(
              (name) => !enhancedForms[index].classList.contains(name),
            )
          )
            throw new Error("Form classes changed");
          for (const { name, value } of form.attributes)
            if (
              name !== "style" &&
              name !== "class" &&
              enhancedForms[index].getAttribute(name) !== value
            )
              throw new Error("Form attribute changed: " + name);
          const fields = (el) =>
            [...el.querySelectorAll("input,select")].map((input) => [
              input.localName,
              input.name,
              input.getAttribute("value"),
              input.type,
              input.disabled,
              input.required,
            ]);
          if (
            JSON.stringify(fields(form)) !==
            JSON.stringify(fields(enhancedForms[index]))
          )
            throw new Error("Form controls changed");
        });
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
      { html, slug, paths, controlsSource: initializePageControls.toString() },
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
      } else if (/\.webm$/i.test(file)) {
        const directory = path.join(
          out,
          "media-transfer/wp-content/uploads/lr-remont-noutbykov",
          path.dirname(file),
        );
        await mkdir(directory, { recursive: true });
        await copyFile(
          "public/media/" + file,
          path.join(directory, path.basename(file)),
        );
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
  // The stock text block uses strong for the source's standalone bold price labels.
  for (const selector of [
    ".lr-symptoms__group-overlay",
    ".lr-symptoms__group-price",
  ])
    styles = styles.replaceAll(
      selector + " b",
      selector + " :is(b,strong.lr-gutenberg-bold)",
    );
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
  styles +=
    "#hop-landing .lr-gutenberg-video,#hop-landing .lr-gutenberg-video>.wp-block-video{display:contents}#hop-landing .lr-gutenberg-evenodd{fill-rule:evenodd;clip-rule:evenodd}#hop-landing .lr-gutenberg-select{min-height:42px;padding:10px;border:1px solid var(--lr-color-border);border-radius:6px}#hop-landing .lr-gutenberg-select [role=option]{display:none}#hop-landing .lr-gutenberg-select [aria-selected=true]{display:block}#hop-landing .lr-gutenberg-route-svg{position:relative;container-type:inline-size}#hop-landing .lr-gutenberg-route-label{position:absolute;top:90.38%;left:14.333%;transform:translate(-50%,-78%);font-size:6cqw;font-weight:500;line-height:1;white-space:nowrap}#hop-landing .lr-gutenberg-route-label--end{left:96%;transform:translate(-100%,-78%)}\n";
  await writeFile(path.join(pack, "resources/page.css"), styles);
  const editorCss =
    ".lr-gutenberg-root .wp-block{margin:0;max-width:none;position:static}\n" +
    styles
      .replaceAll("#hop-landing", ".lr-gutenberg-root")
      .replace(
        /\[(data-(?:lr|hop|sc)-[a-z0-9-]+|data-(?:format|format-schema|format-illustration|device-category|symptom))(?:=["']?([a-z0-9-]+)["']?)?\]/gi,
        (_, name, value) => ".lr-gb-" + name + (value ? "--" + value : ""),
      ) +
    "\n.lr-gutenberg-root .block-editor-inner-blocks,.lr-gutenberg-root .lr-art-editor{display:contents}.lr-gutenberg-root .lr-gutenberg-video>.wp-block-video{display:block}.lr-gutenberg-root .lr-gutenberg-video video{width:100%;height:100%;object-fit:cover}.lr-gutenberg-root .lr-gutenberg-select:is(.is-selected,.has-child-selected,:focus-within) [role=option]{display:block}\n";
  await writeFile(path.join(pack, "resources/editor.css"), editorCss);
  await copyFile("dist/_astro/" + js, path.join(pack, "resources/page.js"));
  await copyFile(
    "scripts/gutenberg/page-controls.js",
    path.join(pack, "resources/page-controls.js"),
  );
  await writeFile(
    path.join(pack, "resources/page-bootstrap.js"),
    'import {initializePageControls} from "./page-controls.js";\ninitializePageControls(document.querySelector("#hop-landing"));\nawait import("./page.js");\n',
  );
  resources["resources/page-controls.js"] = {};
  resources["resources/page-bootstrap.js"] = {};
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
          { file: "resources/page-bootstrap.js", type: "module" },
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
