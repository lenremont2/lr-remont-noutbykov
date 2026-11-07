# Ванна, склад и ОТК — 7 ноября 2026

Встроенным image_gen созданы три отдельные иллюстрации для оставшихся карточек `lr-workshop-gallery`. Образ мастера, форма и подача взяты из утверждённого `workshop-v5-soldering-1280.webp`; логотип — из `lenremont-logo-patch.png`. Во всех сценах обе руки в специальных перчатках: в мокрой зоне — удлинённые защитные, на складе и ОТК — антистатические. Это сгенерированные иллюстрации, не документальные фотографии конкретного филиала и не результаты проверки клиентской техники.

## Файлы и сюжеты

| Карточка                      | Файл                                            | Размер   |    Байт |
| ----------------------------- | ----------------------------------------------- | -------- | ------: |
| Ультразвуковая ванна и стенды | `public/media/workshop-v5-ultrasonic-1280.webp` | 1280×720 | 217 972 |
| Свой склад запчастей в СПб    | `public/media/workshop-v5-parts-1280.webp`      | 1280×720 | 256 172 |
| Выходной стресс-контроль ОТК  | `public/media/workshop-v5-testing-1280.webp`    | 1280×720 | 215 630 |

Исходные PNG — 1672×941. Прежние v4 и первый кадр BGA сохранены. Изменены только три ссылки галереи; использование старого фото склада в других блоках не затрагивалось. Оборудование плагина, его исходники и боевой сайт не менялись; Gutenberg ZIP не пересобирались.

Ванна показана со съёмной корзиной и отключённой платой, без батареи и корпуса. На складе видны отдельные категории деталей в упаковке. ОТК показывает собранные ноутбуки на стендах с графиками нагрузки и температур. Вымышленные серийный номер, дата, подпись и отметки о прохождении удалены с бумажного чек-листа отдельной правкой.

## Проверка

`npm run quality` выполнен успешно: Astro — 0 ошибок и предупреждений (3 прежних информационных замечания), Prettier — успешно, сборка — 56 страниц. Все 37 существующих Node-тестов прошли.

На локальном сервере `http://127.0.0.1:4321/` проверены ширины 1440 и 375 px: все четыре исходных изображения и увеличенные версии загружаются в размере 1280×720, Enter открывает фото, Escape закрывает, фокус возвращается на соответствующую ссылку. Горизонтального переполнения страницы и ошибок JavaScript не обнаружено. Просмотрены готовые WebP и скриншоты трёх новых карточек на телефоне и галереи на компьютере.

Проверка выполнена через Playwright/Chromium: встроенный браузер недоступен из-за ошибки подключения native pipe. Для проверки увеличения фотографий использована локальная копия той же закреплённой GLightbox 3.3.1; доступность внешнего CDN этим запуском не проверялась. Отчёт и скриншоты сохранены во временной папке `C:/Users/User/AppData/Local/Temp/lr-gallery-v5-20261107/`.

## Справочные материалы для постановки

Корзина и её расположение учитывают [описание аксессуаров Elma](https://www.elmaultrasonic.com/ultrasonic-cleaner/baskets/). Упаковка чувствительных компонентов — [обзор EOS/ESD Association](https://www.esda.org/esd-overview/esd-fundamentals/part-3-basic-esd-control-procedures-and-materials/). Содержание экранов нагрузочного тестирования опирается на назначение таких средств, описанное [PassMark](https://www.passmark.com/products/burnintest/); изображённые показания являются иллюстративными, использование конкретной программы сервисом не утверждается.

## Промпт: ультразвуковая ванна

Use case: photorealistic-natural with identity preservation.
Create one entirely NEW landscape 16:9 workshop photograph for the website card “Ультразвуковая ванна и стенды”. The scene must unmistakably show ultrasonic cleaning equipment for laptop circuit boards, rather than laptop disassembly.

Reference image 1 is ONLY the technician identity, clothing and practical workshop photography reference. Keep this same man: short light-brown hair, slight stubble, thin metal prescription spectacles, yellow cotton T-shirt and dark navy bib overalls. Reference image 2 is the exact small “ЛЕНРЕМОНТ” chest patch, one patch only. Do not copy the soldering scene, microscope or oscilloscope.

Primary subject: a real-looking rectangular stainless steel benchtop ultrasonic cleaner, large enough for a laptop motherboard, with an open tank, removable stainless wire-mesh basket, side handles, modest front time/temperature controls, and its lid resting safely behind. Show a detached, unpowered laptop motherboard supported inside the mesh basket, with its battery, fans, keyboard, casing and cables removed. The technician holds the basket by its two handles slightly above the tank rim, preparing or completing a cleaning step with the ultrasonic cycle stopped. His hands remain outside the tank and above the cleaning liquid. The board must be supported by the basket and not laid against the tank bottom. A small amount of clear aqueous cleaning solution is visible; no IPA/flammable solvent bottles, dramatic bubbles, steam, sparks, or magical glowing water.

Both hands wear appropriate blue chemical-resistant nitrile work gloves with extended cuffs, all fingertips covered, not bare hands or knitted ESD gloves in the wet area. Clear protective over-glasses may fit over his prescription glasses without changing his recognizable face. His grip and arm anatomy must be natural, both handles firmly held, no spare fingers.

Show a clearly separate dry bench area further behind, with an unpowered circuit-board test fixture, organized probes and a bench power supply, plus practical parts drawers and repair shelves. This should read as an actual electronics service workshop with a wet-cleaning station and separate dry diagnostic equipment, not a kitchen, jewelry counter or sterile hospital. One technician only, placed to the side so the ultrasonic tank and basket are dominant and fully visible. Medium-wide view, ordinary available workshop/daylight, natural materials and modest wear, moderately tidy working room. Preserve realistic skin, clothing folds, neutral colors and the photographic language of reference 1. No advertisement pose, text overlays, certification stickers, invented equipment brands, customer claims or watermark. This is an illustrative scene, not evidence of a named branch.

## Промпт: склад

Use case: photorealistic-natural with identity preservation.
Create ONE entirely NEW landscape 16:9 photograph for the service website card “Свой склад запчастей в СПб”. The visual story is a dedicated organized laptop spare-parts stockroom, not one workbench with a few RAM sticks.

Reference 1 supplies ONLY the identity of our technician and the natural workshop photo style: same light-brown short hair, subtle stubble, thin rectangular spectacles, yellow cotton T-shirt and navy bib overalls. Reference 2 is only the exact small “ЛЕНРЕМОНТ” chest patch. Do not reproduce the microscope, motherboard soldering activity, or the old camera composition.

Show a believable compact service-center stockroom with an aisle between several sturdy metal shelving units, visibly holding many categorized laptop parts. Make the stock, storage methods and depth of the room the principal subject; the same technician stands in the middle distance, no more than one third of the frame, naturally picking a small boxed SSD into an order tote while looking at the inventory, not at the camera. BOTH hands in close-fitting gray antistatic electronics work gloves with covered fingertips and darker palm grips.

The shelf contents must be specific and physically plausible: thin replacement laptop LCD panels upright in individually separated protective sleeves with foam corner guards; laptop keyboards in their protective bags; battery packs individually boxed with their terminals protected; cooling fan assemblies in small packages; laptop SO-DIMM RAM and M.2/2.5-inch SSDs in shielding bags or proper trays; small connector and hinge parts in organized drawers. Show recognizable differences in shape and packaging rather than a wall of random identical cardboard boxes. Exposed electronic parts must not be dumped loosely together. The nearest packing bench can have a few properly packaged RAM/SSD items, an open picking tote, and a barcode scanner, but it must not obscure the shelving.

Use only a few small simple bin labels such as “LCD”, “SSD”, “RAM”, “A1”, “B2”; no long gibberish text, invented stock totals, fake manufacturer logos, certificates or sales posters. No inflated warehouse scale, rows of desktop monitors, floating panels, dangerously piled loose batteries, plastic-wrapped entire customer laptops pretending to be spare parts, or decorative props. The aisle stays clear. Same modest service workshop architecture as reference 1, practical shelving, normal daylight and ceiling lights, worn but clean work surfaces, neutral realistic photography and moderate depth of field so the parts can be understood. One technician only. No text overlay or watermark. This is an illustrative stockroom photo, not documentary proof of an actual address.

## Промпт: ОТК

Use case: photorealistic-natural with identity preservation.
Create ONE entirely NEW landscape 16:9 photograph for a laptop repair website card “Выходной стресс-контроль ОТК”. It must clearly depict final hardware load/stability testing of repaired, fully assembled laptops, not routine browsing or a wallpaper desktop.

Reference 1 supplies ONLY the same technician's identity, clothing and natural workshop photo style: short light-brown hair, subtle stubble, thin rectangular metal spectacles, yellow cotton T-shirt, navy bib overalls. Reference 2 supplies the single exact small “ЛЕНРЕМОНТ” chest patch. The reference soldering equipment and pose must not carry over.

Show a practical final-test bench with two fully assembled laptops on firm ventilated or open support stands, their screens open and cooling air paths unobstructed. No open motherboard, soldering tools, repair disassembly or wet cleaning in this scene. Both laptops are visibly connected to appropriate mains power adapters by believable cables; a small cabled USB test peripheral may be connected to a real accessible USB port.

The nearest laptop screen must be easy to see from the camera: a realistic Windows-style hardware diagnostic application with several live time-series CPU/GPU load and temperature plots, a compact sensor table and small short labels “CPU”, “GPU”, “RAM”, “SSD”. The second laptop runs a clearly recognizable 3D graphics stress-test render alongside a small monitoring panel, not a game, web browser or scenery wallpaper. Use plausible monitoring data, no giant glowing infographic UI, impossible temperature values, promotional benchmark scores, fake “100% guaranteed” or finished PASS certificates. The photograph illustrates tests in progress, not a documented customer result. Keep screens physically attached to their laptops with ordinary bezels and realistic reflections.

The same technician sits at the side of the bench, no more than one third of the frame, carefully checking the graphs. One hand naturally operates a wired mouse beside the laptop, the other rests on the bench near the test checklist without blocking the screen or vents. BOTH hands wear close-fitting gray antistatic electronics technician gloves, fingertips fully covered with darker grip surfaces, matching reference 1. No bare fingers. Preserve convincing hand/wrist anatomy and cable connections.

Make it unmistakably a service workshop QC area: additional modest test workstations in the background, a few powered-off queued laptops on shelves, organized power adapters, parts drawers and tools. Medium-wide documentary photograph, equipment and screens are the main subject, moderate depth of field so the diagnostic displays remain readable. Ordinary workshop/daylight, neutral realistic colors, natural skin and fabric, slightly used working surfaces, no showroom styling, no dramatic cinematic grading, no advertising pose, no extra people, no watermarks or overlay text.

## Уточнение бумажного чек-листа

Edit ONLY the paper sheet on the clipboard in the lower foreground of this photo. Leave the physical clipboard and blue pen, paper perspective, lighting and shadows exactly where they are. Replace its current printed/handwritten form with a simple realistic blank quality-control checklist. Use just the heading “Контроль перед выдачей” and five short rows: “Нагрузка”, “Температуры”, “Питание”, “Порты”, “Батарея”. Each row has an EMPTY unchecked square. Remove every filled check mark, signature, handwritten note, serial number, model number, date and invented customer/job detail. The paper should clearly be a checklist ready to use, not a completed certificate or alleged customer test report.
Change NOTHING outside the paper sheet: preserve the same technician's face, hair, eyeglasses, yellow shirt, navy overalls and single ЛЕНРЕМОНТ patch; BOTH fully covered gray ESD work gloves and their hand poses; the two laptops, exact diagnostic screens and 3D stress test, all cables, stands, shelves, background, color and framing. One precise photorealistic local edit, no other additions.
