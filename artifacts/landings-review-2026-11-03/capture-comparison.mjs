import { createServer } from "node:http";
import { readFileSync, createReadStream, statSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, sep, extname } from "node:path";
import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const output = resolve("artifacts/landings-review-2026-11-03/comparison");
mkdirSync(join(output, "images"), { recursive: true });
const root = resolve("dist");
const media = resolve("public/media");
const assets = resolve("artifacts/landings-review-2026-11-03/reference/landings/assets");
const faces = readFileSync("src/styles/core/_fonts.scss", "utf8").replace(/^\/\/.*$/gm, "");
const reference = readFileSync("artifacts/landings-review-2026-11-03/reference/landings/2026-10-30_lr-remont-noutbukov-v2.html", "utf8")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<link\b[^>]*https:\/\/fonts\.[^>]*>/g, "")
  .replaceAll("https://lr-remont-noutbykov.vercel.app/media/", "/media/")
  .replaceAll("'Manrope'", "'LR Manrope'")
  .replaceAll("'Golos Text'", "'LR Golos Text'")
  .replaceAll("autoplay", "")
  .replace("</head>", `<style>${faces}\n.site-header,.sticky-mobile-bar{position:static!important}*{animation:none!important;transition:none!important}</style></head>`);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".mp4": "video/mp4", ".woff2": "font/woff2" };
const missing = new Set();
const server = createServer((request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (path === "/reference.html") { response.writeHead(200, { "Content-Type": types[".html"] }).end(reference); return; }
    const base = path.startsWith("/media/") ? media : path.startsWith("/assets/") ? assets : root;
    const relative = base === root ? path : path.replace(/^\/(media|assets)/, "");
    let file = resolve(base, "." + relative);
    if (file !== base && !file.startsWith(base + sep)) throw new Error("Outside root");
    if (statSync(file).isDirectory()) file = join(file, "index.html");
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(response);
  } catch { missing.add(request.url); response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}`;
const blocks = [
  ["01", "#top", "#lr-hero"], ["02", "#lr-what-we-fix", "#lr-symptoms"],
  ["03", ".brands-top-bar", "#lr-manufacturers"], ["04", "#lr-formats", "#lr-formats"],
  ["05", "#lr-reviews", "#lr-reviews"], ["06", "#lr-prices", "#lr-prices"],
  ["07", "#lr-quiz", "#lr-quiz"], ["08", null, "#lr-process"],
  ["09", "#lr-lab", "#lr-lab"], ["10", "#lr-equipment", "#lr-workshop-gallery"],
  ["11", "#lr-b2b", "#lr-business-trust"], ["12", "#lr-advantages", "#lr-guarantee"],
  ["13", "#lr-all-workshops", "#lr-locations"], ["14", null, "#lr-service-guide"],
  ["15", "#lr-faq", "#lr-faq"], ["16", "#lr-contact", "#lr-contact"],
  ["17", ".b2b-top-strip", null], ["18", ".site-header", null], ["19", ".sticky-mobile-bar", null],
];
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const approved = process.argv.includes("--approved");
const changed = new Set(["01", "02", "03", "04", "05", "10", "11", "12", "20"]);
const manifest = approved ? JSON.parse(readFileSync(join(output, "capture.json"), "utf8")).manifest.filter(item => !(item.kind === "site" && changed.has(item.id))) : [];
try {
  for (const width of [390, 1440]) {
    for (const kind of approved ? ["site"] : ["archive", "site"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${url}/${kind === "archive" ? "reference.html" : ""}`, { waitUntil: "networkidle" });
      await page.evaluate(async () => { await document.fonts.ready; for (const video of document.querySelectorAll("video")) { video.pause(); video.removeAttribute("autoplay"); video.load(); } });
      for (const [id, archiveSelector, siteSelector] of blocks) {
        if (approved && !changed.has(id)) continue;
        const selector = kind === "archive" ? archiveSelector : siteSelector;
        if (!selector) continue;
        const block = page.locator(selector);
        await block.scrollIntoViewIfNeeded();
        await block.evaluate(async (element) => { await Promise.all([...element.querySelectorAll("img")].map(async (image) => { image.loading = "eager"; await image.decode().catch(() => {}); })); });
        await block.screenshot({ path: join(output, "images", `${id}-${kind}-${width}.jpg`), type: "jpeg", quality: 83, animations: "disabled" });
        manifest.push({ id, kind, width, selector, text: (await block.textContent()).replace(/\s+/g, " ").trim() });
      }
      if (kind === "archive") await page.locator("#leadModal").evaluate((element) => { element.hidden = false; });
      else await page.locator('#lr-hero [data-source="hero-request"]').click();
      const modal = page.locator(kind === "archive" ? "#leadModal .modal-sheet" : '[data-lr-modal="lead"]');
      await modal.screenshot({ path: join(output, "images", `20-${kind}-${width}.jpg`), type: "jpeg", quality: 83 });
      manifest.push({ id: "20", kind, width, errors, text: (await modal.textContent()).replace(/\s+/g, " ").trim() });
      await page.close();
      console.log(`Captured ${kind} at ${width}`);
    }
  }
  writeFileSync(join(output, "capture.json"), JSON.stringify({ manifest, missing: [...missing], notes: "Archive scripts disabled; assets and both fonts local; sticky bars placed in document flow for unobstructed section screenshots; current site is the latest built snapshot including the unaccepted Hero edit." }, null, 2));
} finally { await browser.close(); await new Promise((done) => server.close(done)); }
