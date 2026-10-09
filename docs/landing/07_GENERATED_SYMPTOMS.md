# Изображения неисправностей

Созданы 9 октября 2026 встроенным инструментом imagegen. Иллюстрации неисправностей, а не фотографии реальных заказов. В проекте: WebP 768 × 512, качество 82; шесть файлов вместе — около 172 КиБ.

Общая часть каждого промпта:

Generate a photorealistic editorial product photograph for a Russian laptop repair landing page, wide landscape composition 3:2. Consistent series: unbranded graphite-gray laptop on warm off-white workbench, soft daylight, muted warm gray palette with tiny amber accent, natural materials, technically plausible laptop, uncluttered studio background, centered object, no people, no logos, no captions, no text or labels, no dramatic special effects. This is a problem illustration, never portray repair success.

К общей части добавлялся один из следующих промптов, каждая картинка — отдельный вызов:

- public/media/symptom-no-power.webp: Laptop open at 110 degrees, completely black unlit screen, a person's fingertip pressing the power button in the top corner of the keyboard, close three-quarter view; only the hand enters frame. Show power failure clearly.
- public/media/symptom-overheating.webp: Laptop turned upside down with rear cover removed, close-up of dusty cooling fan and copper heat pipes clogged with realistic lint; focus on cooling system, small dark keyboard laptop edge visible. No smoke or fire.
- public/media/symptom-liquid.webp: Open laptop on desk, tipped-over plain cup nearby with small spilled coffee puddle and a few realistic droplets across keyboard. Black unlit display. No hands. The spill must clearly originate from cup.
- public/media/symptom-screen.webp: Open laptop with physically cracked LCD screen with thin diagonal fracture pattern and a small patch of vertical color lines. Three-quarter front view. No interface or lettering, dark screen mostly.
- public/media/symptom-charging.webp: Close detailed view of laptop side with damaged loose charging socket and disconnected barrel charger plug adjacent, laptop keyboard corner visible, no sparks. Show charging port and cable prominently.
- public/media/symptom-slow.webp: Open laptop on desk displaying only a subtle plain circular progress spinner at center of neutral slate-gray screen, no text or icons, no operating system branding. Keyboard and compact portable external drive with connected cable visible, paused work feeling.

Карточки получают цену соответствующей работы из существующего прайса через priceWork; цены в карточках не дублируются. Запчасти оплачиваются отдельно, полная сумма согласуется после диагностики.

В Locations.astro два элемента data-lr-map-placeholder (workshops, pickup) предназначены для замены шорткодами на этапе WordPress. До подключения доступны официальный список мастерских, телефон и существующая форма курьера. Интерактивная карта и WordPress сейчас не реализуются.
