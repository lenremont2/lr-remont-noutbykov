# Изображения Hero брендов

Созданы 10 октября 2026 встроенным инструментом imagegen: по одному отдельному вызову для Acer, ASUS, Dell, HP, Lenovo, MSI, Samsung, Sony VAIO и Toshiba. Это сгенерированные изображения в фотографическом стиле, а не фотографии реальных заказов, помещений компании или подтверждение авторизации производителей.

Финальные файлы: `public/media/brand-*-hero.webp`, 768 × 1024, WebP, качество 82. Оригиналы PNG сохранены инструментом в каталоге Codex. Пути для каждой страницы записаны в `src/data/service-pages.json` в поле `heroImage`.

Брендовые страницы используют общий `src/components/sections/Hero.astro` с параметром `brand`: свой H1 и вводный текст, общие преимущества и контакты, фото вместо видео. Главная сохраняет H2 и прежнее видео; страницы неисправностей используют `ChildHero.astro`; MacBook остаётся самостоятельной страницей.

## Промпты

Для каждого файла использовалась следующая общая часть, затем описание из списка и заключительная фраза.

```text
Use case: photorealistic-natural. Asset type: portrait hero photograph for a Russian independent laptop repair landing page. Generate ONE single photorealistic editorial commercial photograph, portrait 3:4 composition. Consistent series style: laptop repair workbench in a calm premium independent workshop, warm light-gray antistatic mat, softly blurred neutral workshop background, daylight from left, muted graphite/silver and warm ivory palette, a tiny amber tool accent, natural material texture and realistic lens depth of field, no dramatic effects. The notebook is centered and fills the lower two-thirds, entire laptop safely inside the frame with 8% margins so it can be cropped, realistic hardware and keyboard. Black unlit screen with no UI or text. This is an illustrative scene, no claims of completed repairs, no company signage, no person face, no promotional captions, no watermarks, no extra logos. Subject:
```

- `public/media/brand-acer-hero.webp` (Acer): a graphite Acer-style everyday notebook, lowercase acer manufacturer mark on the bottom bezel, lid open 110 degrees, three-quarter front view, a technician's single gloved hand inspecting the side charging connector.

- `public/media/brand-asus-hero.webp` (ASUS): a slim brushed-silver ASUS-style ultrabook with small ASUS mark on bottom bezel, open 110 degrees, three-quarter view, a precision screwdriver and neatly arranged screws beside the notebook.

- `public/media/brand-dell-hero.webp` (Dell): a dark Dell-style business laptop with subtle circular DELL manufacturer mark on bottom bezel, open 110 degrees, view from the front-left, a multimeter placed behind it with probes resting on the workbench.

- `public/media/brand-hp-hero.webp` (HP): a silver HP-style laptop with a small round hp manufacturer mark on bottom bezel, open 110 degrees, front-right three-quarter view, detached AC charger next to the charging port and one gloved hand steadying the hinge.

- `public/media/brand-lenovo-hero.webp` (Lenovo): a matte black Lenovo ThinkPad-style notebook with red pointing stick and small Lenovo mark on bezel, open 110 degrees, three-quarter view, keyboard and a compact technician tool tray nearby.

- `public/media/brand-msi-hero.webp` (MSI): a graphite MSI-style performance notebook, discreet red MSI manufacturer emblem on bezel, open 110 degrees, front three-quarter view, cooling fan and copper heat pipe assembly placed separately beside it, plausible repair setup.

- `public/media/brand-samsung-hero.webp` (Samsung): a thin brushed-silver Samsung-style notebook with small SAMSUNG mark on bottom bezel, open 110 degrees, front-left view, a small USB drive and technician gloves resting neatly nearby.

- `public/media/brand-sony-hero.webp` (Sony VAIO): a classic silver Sony VAIO-style notebook with small SONY mark above the display and elegant VAIO mark on palm rest, open 110 degrees, three-quarter right view, detached AC adapter and a precision tool neatly beside it.

- `public/media/brand-toshiba-hero.webp` (Toshiba): a classic graphite Toshiba-style notebook with small TOSHIBA mark on bottom bezel, open 110 degrees, front-left view, keyboard and a small loose RAM module on an antistatic pouch next to the notebook.

Заключительная фраза каждого промпта:

```text
Make brand identity plausible and subtle; do not imply authorized brand service.
```
