// Build a local test variant; the shared plugin repository is never modified.
import assert from "node:assert/strict";
import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const output = path.resolve("artifacts/gutenberg-2026-11-06");
const original =
  "C:/Users/User/Local Sites/testing-gutenberg/app/public/wp-content/plugins/lenremont-page-importer";
const plugin = path.join(output, "compat/lenremont-page-importer");
await mkdir(path.join(output, "compat"), { recursive: true });
const backup = path.join(output, "backup/plugin");
try {
  await access(backup);
} catch {
  await cp(original, backup, {
    recursive: true,
    force: false,
    errorOnExist: true,
  });
}
await cp(backup, plugin, { recursive: true });
async function patch(file, from, to) {
  const name = path.join(plugin, file);
  const source = await readFile(name, "utf8");
  assert(source.includes(from), "Unexpected plugin source: " + file);
  await writeFile(name, source.replace(from, to));
}
await patch(
  "lenremont-page-importer.php",
  "Version: 0.31.0",
  "Version: 0.31.3-laptop-test",
);
await patch(
  "includes/class-plugin.php",
  "const VERSION = '0.31.0'",
  "const VERSION = '0.31.3-laptop-test'",
);
const file = "assets/reference-blocks.js";
await patch(
  "includes/class-plugin.php",
  "'height','fill','stroke'",
  "'height','fill','fill-rule','clip-rule','stroke'",
);
await patch(
  "includes/class-plugin.php",
  "'polyline','polygon','g','use'",
  "'polyline','polygon','g','use','text'",
);
await patch(
  file,
  "'fieldset', 'legend', 'progress'];",
  "'fieldset', 'legend', 'progress', 'select', 'option', 'textarea', 'b', 'i', 'em', 'video', 'source', 'br', 'hr'];",
);
await patch(
  file,
  "fields = fields.concat([",
  "fields = fields.concat(['data-format', 'data-format-schema', 'data-format-illustration', 'data-device-category', 'data-symptom', 'checked', 'colspan', 'rowspan', 'novalidate', 'poster', 'preload', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'selected', 'multiple', 'rows', 'cols', 'minlength', 'srcset', 'sizes', 'start', 'open', ",
);
await patch(
  file,
  "aria-[a-z-]+|data-astro-cid-[a-z0-9]+",
  "aria-[a-z-]+|data-(?:lr|hop|sc)-[a-z0-9-]+|data-astro-cid-[a-z0-9]+",
);
await patch(
  file,
  "name === 'href' || name === 'src'",
  "name === 'href' || name === 'src' || name === 'poster'",
);
await patch(
  file,
  "if (name === 'type' && !/^(button|range|hidden|tel|text|checkbox|radio|submit|file)$/.test(value)) return;",
  "if (name === 'type' && !/^(button|range|hidden|tel|text|email|checkbox|radio|submit|file|video\\/mp4)$/.test(value)) return;",
);
await patch(
  file,
  "if (key === 'fetchpriority') key = 'fetchPriority';",
  "if (key === 'fetchpriority') key = 'fetchPriority';\n\t\t\tif (key === 'autoplay') key = 'autoPlay';\n\t\t\tif (key === 'playsinline') key = 'playsInline';\n\t\t\tif (key === 'colspan') key = 'colSpan';\n\t\t\tif (key === 'rowspan') key = 'rowSpan';\n\t\t\tif (key === 'novalidate') key = 'noValidate';",
);
await patch(
  file,
  "'hidden', 'disabled', 'required', 'inert', 'itemScope'",
  "'hidden', 'disabled', 'required', 'inert', 'itemScope', 'controls', 'autoPlay', 'muted', 'loop', 'playsInline', 'selected', 'multiple', 'open', 'checked', 'noValidate'",
);
await patch(
  file,
  "['a', 'button', 'form', 'dialog', 'noscript'].includes(tag)",
  "['a', 'button', 'form', 'dialog', 'noscript', 'select', 'option', 'textarea', 'video', 'source'].includes(tag)",
);
await patch(
  file,
  "return tag === 'input' ? el('input', props)",
  "return ['input', 'source', 'br', 'hr'].includes(tag) ? el(tag, props)",
);
await patch(file, "'small', 'summary'];", "'small', 'summary', 'option'];");
await patch(
  file,
  "tagName: textTags.includes(p.attributes.tag) ? p.attributes.tag : 'span', value: value",
  "tagName: p.attributes.tag !== 'option' && textTags.includes(p.attributes.tag) ? p.attributes.tag : 'span', value: value",
);
await patch(
  file,
  "delete props.inert;",
  "delete props.inert;\n\t\t\t\tif (props.id) props['data-lr-original-id'] = props.id;",
);
await patch(
  file,
  "if (p.attributes.raw) return p.attributes.text;",
  "if (p.attributes.raw) return p.attributes.text;\n\t\t\t\tif (p.attributes.tag === 'option') return el('option', propsFor(p.attributes.attributes), el(be.RichText.Content, { value: p.attributes.text }));",
);
await patch(
  file,
  "var href = p.attributes.attributes.href;",
  "var href = p.attributes.attributes.href;\n\t\t\t\tvar urlFields = ['href', 'src', 'poster'].filter(function (key) { return typeof p.attributes.attributes[key] === 'string'; });",
);
await patch(
  file,
  "inspector(href !== undefined ? el(c.TextControl, { label: 'Ссылка', value: href, onChange: function (v) { p.setAttributes({ attributes: Object.assign({}, p.attributes.attributes, { href: url(v) }) }); } })",
  "inspector(urlFields.length ? urlFields.map(function (key) { return el(c.TextControl, { key: key, label: ({href:'Ссылка',src:'Файл медиа',poster:'Постер видео'})[key], value: p.attributes.attributes[key], onChange: function (v) { var next = {}; next[key] = url(v); p.setAttributes({ attributes: Object.assign({}, p.attributes.attributes, next) }); } }); })",
);
// Frontend attributes are retained; unsupported handlers and script URLs still fail closed.
const shim = { exports: {} };
new Function("module", await readFile(path.join(plugin, file), "utf8"))(shim);
const clean = shim.exports.cleanAttributes;
assert.deepEqual(
  clean({
    "data-lr-quiz-open": "",
    "data-hop-lead-submit": "",
    onclick: "bad()",
    href: "javascript:bad()",
  }),
  { "data-lr-quiz-open": "", "data-hop-lead-submit": "", href: "" },
);
assert.equal(clean({ style: "background:url(bad)" }).style, undefined);
assert(
  shim.exports.tags.includes("select") && shim.exports.tags.includes("source"),
);
await patch(
  "includes/class-project-package.php",
  "'webp'=>'image/webp'",
  "'webp'=>'image/webp','mp4'=>'video/mp4'",
);
await patch(
  "includes/class-project-package.php",
  "} elseif (in_array($ext, array('woff'",
  "} elseif ('mp4' === $ext) {\n\t\t\tself::check(strlen($raw) >= 16 && substr($raw, 4, 4) === 'ftyp', 'Некорректный MP4.');\n\t\t} elseif (in_array($ext, array('woff'",
);
let packer = await readFile(
  "C:/Users/User/.codex/skills/lenremont-gutenberg/scripts/project-package.py",
  "utf8",
);
packer = packer.replace(
  "'.otf': 'font/otf', **MIMES",
  "'.otf': 'font/otf', '.mp4': 'video/mp4', **MIMES",
);
packer = packer.replace(
  "elif ext in {'.woff', '.woff2', '.ttf', '.otf'}:",
  "elif ext == '.mp4':\n        require(len(raw) >= 16 and raw[4:8] == b'ftyp', 'Invalid MP4 resource')\n    elif ext in {'.woff', '.woff2', '.ttf', '.otf'}:",
);
await writeFile(path.join(output, "compat/project-package.py"), packer);
console.log(
  "Local compatibility variant prepared; attribute regression checks passed.",
);
