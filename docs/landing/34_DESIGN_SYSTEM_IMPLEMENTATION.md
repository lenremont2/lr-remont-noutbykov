# Внедрение дизайн-системы: рабочий журнал

29 октября 2026. Основа: [дизайн-система 32](32_DESIGN_SYSTEM_V2.md), [план внедрения 33](33_REDESIGN_IMPLEMENTATION_PLAN.md). Пользователь поручил внедрение системы и делегирование небольших задач субагентам.

Этот файл фиксирует работу и доказательства в существующей документации. Он не является runtime state, новым генератором токенов или отдельным процессом согласования. Спецификации и исходные данные сохраняют свои роли.

## 30.10: карты через плагин

Пользователь уточнил способ интеграции: карта всех мастерских и карта выбора адреса клиента будут вставляться через плагин, как на [странице ремонта роботов-пылесосов](https://www.lenremont.ru/remont-robotov-pylesosov.htm). Это решение заменяет временный Yandex search iframe из batch 2.

В `Locations.astro` подготовлены два отдельных места подключения: `#lr-map-workshops` / `data-lr-map-slot="workshops"` и `#lr-map-address` / `data-lr-map-slot="address"`. В локальном макете они явно обозначены как ожидающие подключения. Это статические контейнеры, не рабочие карты и не реализация плагина. Собственных карт, координат, поиска адреса, новых полей заявки и кода WordPress нет. Реальный embed и связь выбранного адреса с заявкой подключаются при интеграции существующего плагина; неизвестные шорткоды, ключи и токены не копируются из страницы-образца.

Проверки: `npm run quality` PASS, 77 Astro-файлов без ошибок/предупреждений, форматирование PASS, 56 страниц, сборка 13:37:00; после неё все 21 Node-тест PASS. В браузере просмотрены 1280/390 px: два явно обозначенных места подключения, iframe отсутствует, на 390 px горизонтального переполнения нет. Снимки: [1280](../../artifacts/design-system-v2/plugin-maps-2026-10-30/maps-1280.png), [390](../../artifacts/design-system-v2/plugin-maps-2026-10-30/maps-390.png). Проверки самого плагина и передачи адреса не заявляются.

## 30.10: batch 3 — 12 комментариев

Статус: `verified` в указанном проверенном объёме. Четыре rating-плитки стали неинтерактивными div: ссылки остались только на названиях трёх агрегаторов, у награды ссылки нет. Видимые названия колонок прайса убраны с сохранением шести семантических th scope=col и visually-hidden labels. У форматов по два преимущества; убраны нижние source/anchor галереи, подпись expertise и внешняя ссылка business. Director получил предоставленные пользователем портрет и три исходных SVG-path, идентичность слева под фото, новый текст и обычный lead-CTA. Полное guarantee-details удалено, оставлены год гарантии и два фактических условия. Шесть SEO-статей переведены в обычный текстовый поток.

npm run quality PASS: Astro 76 файлов, 0 errors / 0 warnings / 0 hints, global Prettier PASS, 56 страниц, build 13:19:42 Europe/Moscow. После этой сборки node --test tests/*.test.mjs: 21/21 PASS, 0 fail/skipped. Новые три signature-unit tests проверяют отсутствие мутации до intersection, reveal с disconnect после первого пересечения, static fallback при reduced motion и отсутствующем IntersectionObserver. Остальные проверки player/slider/lead/quiz/privacy/49 detail-маршрутов сохранены.

Независимые source/dist invariants PASS: пять data/route SHA-256 совпали с началом batch, все 18 троек работы/цены/срока сохранены; две таблицы, 19 time-inline и шесть col labels. Все слова шести SEO-статей и пять ссылок сохранились: SHA-256 normalized article text + href/anchor text до/после равен 277937f62c8dbc70d4dd8c550125defc41232b103f10a0eef2ff4dec732fec81. Три формы/политики, восемь QR, один квиз и целые anchors; награда отделена от трёх неизменённых aggregator-оценок.

Root production QA на 4324: актуальный портрет и три signature-path, реальные screenshots 320/390/768/1440 без page overflow; обе таблицы scrollWidth равен clientWidth. Четыре DIV-плитки, три name-only ссылки, award links=0; Tab Яндекс → 2ГИС показывает solid outline. Thead имеет высоту 0, семантические labels сохранены. Enter на director CTA открывает обычную форму с автофокусом phone; Escape возвращает focus CTA. Console errors=[]. [layout-checks.json](../../artifacts/design-system-v2/comments-batch3-2026-10-30/layout-checks.json).

Подпись поочерёдно проявляет три исходных штриха через opacity/translateY, 500ms с задержками 0/0,16/0,32s; это sequential stroke reveal, не прорисовка контура. Default static SVG подтверждён исходниками; три unit cases — intersection/reveal/disconnect, reduced motion без наблюдателя, отсутствующий IntersectionObserver. Runtime no-JS screenshot не подтверждён и не включается в browser PASS. CDP reduced-motion=true проверен реально: dataset-state отсутствует, у всех трёх paths opacity=1 и animation=none. Затем scriptExecutionDisabled восстановлен false, media features очищены, viewport сброшен. [signature-reduced-motion.json](../../artifacts/design-system-v2/comments-batch3-2026-10-30/signature-reduced-motion.json).

Снимки: [director 1440](../../artifacts/design-system-v2/comments-batch3-2026-10-30/director-1440.png), [390 portrait](../../artifacts/design-system-v2/comments-batch3-2026-10-30/director-390-portrait.png), [390 copy](../../artifacts/design-system-v2/comments-batch3-2026-10-30/director-390-copy.png), [320](../../artifacts/design-system-v2/comments-batch3-2026-10-30/director-320.png), [768](../../artifacts/design-system-v2/comments-batch3-2026-10-30/director-768.png), [reduced motion](../../artifacts/design-system-v2/comments-batch3-2026-10-30/director-reduced-motion-1440.png), [guarantee 1440](../../artifacts/design-system-v2/comments-batch3-2026-10-30/guarantee-1440.png), [guarantee 390](../../artifacts/design-system-v2/comments-batch3-2026-10-30/guarantee-390.png), [SEO](../../artifacts/design-system-v2/comments-batch3-2026-10-30/seo-1440.png), [reviews](../../artifacts/design-system-v2/comments-batch3-2026-10-30/reviews-1440.png), [prices 1440](../../artifacts/design-system-v2/comments-batch3-2026-10-30/prices-1440.png), [prices 390](../../artifacts/design-system-v2/comments-batch3-2026-10-30/prices-390.png), [formats 1440](../../artifacts/design-system-v2/comments-batch3-2026-10-30/formats-1440.png), [formats 390](../../artifacts/design-system-v2/comments-batch3-2026-10-30/formats-390.png).

DS-28 (реальные 200% и полный NVDA/VoiceOver), внешняя доставка заявки и field-метрики не закрыты; старый Lighthouse не характеризует эту версию. Исторические проверки ниже сохраняют прежний охват.

## 30.10: batch 2 — 29 комментариев

Статус: `verified` в указанном проверенном объёме. Сохранена выбранная визуальная система. Уточнены hero/золотой телефон, прозрачный заголовок отзывов и четыре плитки, интервалы, строка диагностики и тёмный заголовок Mac-прайса; видео lab получило preview/play с переходом к нативным controls. Переработаны formats/gallery/business/director, гарантия сведена к трём фактам с полными условиями в одном native details. Шесть адресных карточек и courier-блок заменены внешней картой с прямой fallback-ссылкой. На главной убран вопрос после FAQ и две подписи footer, переименованы телефон/мессенджеры; формы и QR сохранены. По пункту 24 пояснение предназначено для итогового чата, HomeSeo не менялся.

Четвёртая плитка отзывов — отдельная ссылка «Рейтинг брендов — 2026» на публичную статью Делового Петербурга; по подтверждённому решению пользователя без «№1». Три исходных aggregator-оценки остаются прежними и не подменены наградой. Карта — реальный Yandex search iframe: ll=30.2444107,60.010909 задаёт viewport по координатам проверенного филиала в reviews.sources, z=10; фактические места возвращает провайдер, собственные pins не создавались. На mobile изначально отображается provider search list; закрытие его штатным X показало городскую карту с placemarks. Это не custom map.

Техническая цепочка: npm run quality PASS в 12:07:00 Europe/Moscow — 75 Astro-файлов, 0 errors / 0 warnings / 0 hints, Prettier PASS, 56 страниц. После просмотра 320px root сократил home-only заголовки до двух строк и исправил specificity/16px padding диагностической строки; targeted copy/CSS Prettier PASS, latest build 56 страниц PASS в 12:16:36. После этой сборки node --test tests/*.test.mjs: 18/18 PASS, 0 fail/skipped. Четыре новых fake-video unit tests проверяют initial preview, play/native controls, ended и reject/error fallback, а также отсутствующие hooks; custom progress/seek/volume не добавлены.

Независимая сверка после latest build: все пять data/route-файлов и prices/timeline/benefits совпадают с batch baseline SHA-256; 18/18 троек работы/цены/срока сохранены. Две таблицы, отдельная строка диагностики 0 ₽, срочная 500 ₽, 19 time-inline, 49 detail-маршрутов с прежними SEO/JSON-LD и lead/privacy-контрактами; три формы, три политики, восемь QR, один квиз/H1/root. Проверены iframe title/lazy/referrerpolicy, прямой fallback, все исходные гарантийные/данные условия внутри details, home-only FAQ-изменение, отсутствие битых anchors.

Root browser QA dev и production: Enter на video play → paused=false, currentTime>0, controls=true, overlay hidden/display:none, focus VIDEO; Space останавливает видео. Карта загрузилась с Санкт-Петербургом и фактическими placemarks. На 320/390/768/1440 page client=scroll 305/375/753/1425; обе таблицы client=scroll 239/309/639/1204. Новые заголовки занимают не больше двух строк; восемь QR, четыре rating-плитки, gap 24px mobile/tablet и 32px desktop; border фактов 0, телефон золотой, rating-header прозрачный. Точные записи — [layout-checks.json](../../artifacts/design-system-v2/comments-batch2-2026-10-30/layout-checks.json).

Визуально desktop просмотрены reviews/prices/Mac/lab/gallery/business/director/guarantee/contact/map; на 390 — reviews/gallery/guarantee/business/map. Tablet подтверждён DOM-метриками: viewport API позднее работал ненадёжно, обрезанный 768px кадр удалён и не используется как доказательство. Space открывает/закрывает гарантийные условия; ArrowRight отзывов активирует вторую карточку, Home возвращает начало. Финальная production-консоль errors=[], broken images=[], открытых диалогов 0, lab paused=true; viewport/debug state сброшены. После перезапуска браузерной среды тот же built dist обслуживается локально Python HTTP на 4324; это не публикация и не экспорт.

Снимки: [reviews 1440](../../artifacts/design-system-v2/comments-batch2-2026-10-30/reviews-1440.png), [reviews 390](../../artifacts/design-system-v2/comments-batch2-2026-10-30/reviews-390.png), [prices 1440](../../artifacts/design-system-v2/comments-batch2-2026-10-30/prices-1440.png), [prices 390](../../artifacts/design-system-v2/comments-batch2-2026-10-30/prices-390.png), [Mac prices](../../artifacts/design-system-v2/comments-batch2-2026-10-30/mac-prices-1440.png), [guarantee 1440](../../artifacts/design-system-v2/comments-batch2-2026-10-30/guarantee-1440.png), [guarantee 390](../../artifacts/design-system-v2/comments-batch2-2026-10-30/guarantee-390.png), [map 1440](../../artifacts/design-system-v2/comments-batch2-2026-10-30/map-1440.png), [map 390](../../artifacts/design-system-v2/comments-batch2-2026-10-30/map-390.png), [gallery 1440](../../artifacts/design-system-v2/comments-batch2-2026-10-30/gallery-1440.png), [gallery 390](../../artifacts/design-system-v2/comments-batch2-2026-10-30/gallery-390.png), [video](../../artifacts/design-system-v2/comments-batch2-2026-10-30/video-1440.png), [director](../../artifacts/design-system-v2/comments-batch2-2026-10-30/director-1440.png), [business 390](../../artifacts/design-system-v2/comments-batch2-2026-10-30/business-390.png).

Focused Taste lint восьми файлов: 0 FAIL / 1 WARN о пяти русских тире, сохранённых в осмысленных ценовых условиях. Полный inspect не выполнялся; общий Taste score/полный «0 FAIL» не заявляется. Impeccable finish-review сохранил утверждённую идентичность; обнаруженные существенные проблемы трёхстрочных заголовков и padding исправлены. DS-28 (настоящие 200% и полный NVDA/VoiceOver), реальная доставка и field-метрики не закрыты; прежний Lighthouse не измеряет эту версию.

## 30.10: browser comments 1–22

Статус: `verified` в указанном проверенном объёме; финальные сборка, тесты, source/dist audit и браузерная приёмка root пройдены. Пункт 23 пропущен по решению пользователя; блок по координате без идентификации не удалялся. Этот checkpoint не закрывает глобальный DS-28.

| Комментарии | Изменение                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1           | Четыре преимущества первого экрана сформулированы для ремонта ноутбука                                                     |
| 2–4         | Подложка центральных отзывов возвращена; ratings-reference, hint и счётчик позиции удалены                                 |
| 5–9         | Прайс: только H2, lead и две открытые таблицы; удалены eyebrow, estimate, сроки/оплата, 24/7 и служебная подпись источника |
| 10–11       | Форматы: фото, название, 2–3 преимущества и действие; нижний trust-блок убран на главной                                   |
| 12–13       | Перестроены mobile lab и композиция gallery bento, сохранены исходные медиа                                                |
| 14–15       | На главной этапы показаны вертикальным списком, нижний CTA убран; брендовый accordion сохранён                             |
| 16–19       | Облегчены expertise и гарантийные факты; имя директора перенесено под фото, подпись о награждении убрана                   |
| 20–21       | Шесть компактных адресов и ссылка на общий справочник; дополнительные 18 карточек и раскрытие убраны                       |
| 22          | Дублирующий Symptoms удалён с главной; брендовая навигация и девять страниц неисправностей сохранены                       |

Связанные регрессии обновлены в landing/reviews/lead-context/service-pages: новый порядок секций, прайс без estimate, шесть адресов при проверке всех 24 исходных записей, брендовые Symptoms и достижимость problem-маршрутов через бренд. Reviews-тест работает без position и проверяет активные/inert карточки, paging, клавиатуру, drag и reduced motion. Lead/quiz/privacy/SEO проверки сохранены. Финальный npm run quality PASS: 74 Astro-файла, 0 errors / 0 warnings / 0 hints, global Prettier PASS, 56 страниц, build 11:30:33 Europe/Moscow. После этой сборки node --test tests/*.test.mjs: 14/14 PASS, 0 fail/skipped. Первичный sandbox spawn EPERM устранён повтором с require_escalated; это не дефект приложения.

После quality root исправил два выявленных CSS-дефекта: на 320px доля последней колонки прайса увеличена с 34 до 40% (таблица 239/239 вместо 239/241); compact format CTA сохраняет белый цвет при hover карточки. Targeted Prettier PASS, повторный build 56 страниц PASS в 11:33:31 Europe/Moscow. После этой сборки все 14 Node-тестов повторно PASS; последующий browser QA выполнялся без новых production-изменений.

Независимый финальный source/dist audit после 11:30:33: все 18 работ/цен/сроков сохранены; prices/timeline/benefits (3/3) и reviews/service-pages/workshops/service-pages.ts (4/4) совпадают с batch SHA-256. Обычная диагностика в мастерской 0 ₽ даже при отказе, срочная 500 ₽, отдельные запчасти, 19 time-inline и семантика таблиц сохранены (19 scope=row, 6 scope=col). Три формы с обязательным согласием и политикой, один квиз, один H1/root; локальные anchors целы, estimate удалён из HTML и JS.

Root browser QA финальной версии: на 320/360/390/768/1280/1440 client=scroll соответственно 305/345/375/753/1265/1425; обе таблицы client=scroll 239/279/309/639/1063/1204 на тех же ширинах. Все четыре CTA форматов белые, включая hover. На 1440 визуально просмотрены reviews/prices/formats/lab/bento/process/expertise/director/protection/locations; на 390 — formats/process/bento/locations. После просмотра галереи, директора и lab broken images=[]; console errors=[].

Клавиатура: Enter на hero-заявке → focus phone, Escape → закрытие; Enter на hero-квизе → первый шаг, Escape → закрытие; ArrowRight в отзывах → вторая активная карточка, Home → начало; Space на гарантийном summary открывает и закрывает условия. Доказательства: [layout-checks.json](../../artifacts/design-system-v2/comments-2026-10-30/layout-checks.json), [formats 1440](../../artifacts/design-system-v2/comments-2026-10-30/formats-1440.png), [formats 390](../../artifacts/design-system-v2/comments-2026-10-30/formats-390.png), [lab 1440](../../artifacts/design-system-v2/comments-2026-10-30/lab-1440.png), [process 1440](../../artifacts/design-system-v2/comments-2026-10-30/process-1440.png), [process 390](../../artifacts/design-system-v2/comments-2026-10-30/process-390.png), [gallery 1440](../../artifacts/design-system-v2/comments-2026-10-30/gallery-1440.png), [gallery 390](../../artifacts/design-system-v2/comments-2026-10-30/gallery-390.png), [reviews 1440](../../artifacts/design-system-v2/comments-2026-10-30/reviews-1440.png).

DS-28 (настоящий 200% zoom и полный NVDA/VoiceOver), реальная доставка и field-метрики остаются вне подтверждённой приёмки; прежний Lighthouse не измеряет эту версию.

## Новая итерация прайса главной

Статус: `verified` в проверенном ниже объёме. Заголовок секции: «Сколько стоит ремонт ноутбука»; сверху тёмный ориентир с тремя нативными вариантами. Полный прайс — две native details-группы: «Ноутбуки» открыта изначально, MacBook закрыта. Сценарии срока и условия оплаты — нативные раскрытия. Изменения prices/timeline/benefits JSON не поручены и не внесены.

Read-only baseline до этой правки: SHA-256 от JSON.stringify соответствующего объекта src/data/laptop-service.json, UTF-8, без пробельного форматирования:

| Объект   | SHA-256                                                          |
| -------- | ---------------------------------------------------------------- |
| prices   | 32d236dd1b8e214b154acabeafa455287d81c2278f8f66d13ff2c5916bb35934 |
| timeline | 3c67c45c052909c0036552f29d7ca3cbfe056a2df361560670fae93635d1d660 |
| benefits | fa48beafbfe789d6987c815fda5e8ebb49548d71df111911df58431e0b8fcb62 |

Исходные 18 троек «работа / цена / длительность» (первые 12 — ноутбуки, последние шесть — MacBook/премиальные ультрабуки):

| Работа                                            | Стоимость работы | Длительность                       |
| ------------------------------------------------- | ---------------- | ---------------------------------- |
| Очистка охлаждения с обновлением термоинтерфейсов | от 2 390 ₽       | от 1 часа                          |
| Установка новой клавиатуры                        | от 3 290 ₽       | 1–3 часа                           |
| Замена повреждённого разъёма зарядки              | от 3 290 ₽       | 1–2 часа                           |
| Установка нового аккумулятора                     | от 2 890 ₽       | от 1 часа                          |
| Установка новой матрицы экрана                    | от 3 190 ₽       | 40–60 минут                        |
| Восстановление системной платы                    | от 4 990 ₽       | 1–3 дня                            |
| Ремонт после попадания жидкости                   | от 5 090 ₽       | 1–2 дня                            |
| Переустановка Windows и драйверов                 | от 1 990 ₽       | от 1,5 часа                        |
| Установка SSD или HDD, перенос системы            | от 2 390 ₽       | от 15 минут + перенос              |
| Увеличение или замена оперативной памяти          | от 1 890 ₽       | от 15 минут                        |
| Восстановление прошивки BIOS                      | от 2 890 ₽       | 1–2 часа                           |
| Восстановление файлов или перенос данных          | от 2 890 ₽       | 2–5 дней / перенос — по объёму     |
| Обслуживание охлаждения с полной разборкой        | от 2 890 ₽       | 2–5 часов                          |
| Замена приклеенного аккумулятора                  | от 3 590 ₽       | 1–3 дня                            |
| Замена клавиатуры или верхней панели              | от 4 390 ₽       | 8–48 часов / топкейс — 3–10 дней   |
| Восстановление разъёма USB-C или MagSafe          | от 3 990 ₽       | 2–5 дней                           |
| Ремонт платы или цепей питания                    | от 4 990 ₽       | 1–3 дня / цепи питания — 3–10 дней |
| Восстановление macOS с переносом данных           | от 2 490 ₽       | 1–3 часа + перенос                 |

Read-only сверка verification после root build 21:07:51 Europe/Moscow: prices/timeline/benefits совпадают с тремя SHA-256 выше. В dist/index.html сохранены все 18 троек без потерь: две таблицы с caption и тремя scope=col каждая; scope=row у работ, 19 duration и 19 time-inline (18 работ плюс отдельная строка диагностики 0 ₽). «Ноутбуки — 12 видов работ» открыта, MacBook — шесть строк — закрыта; раскрытия срока и оплаты закрыты изначально.

Сохранены обычная диагностика в мастерской 0 ₽ даже при отказе, срочная 500 ₽, отдельный расчёт запчастей и общая согласуемая сумма; ссылка на прайс Ленремонта #price и дата 29.10.2026. Три сценария timeline и два payment-benefits содержат прежние заголовки, сроки и полные пояснения. Три CTA home-pricing-estimate сохраняют lead-hook/#lr-contact и исходные симптомы; конечный CTA — source home-pricing. Во всех трёх формах required consent и ссылка на политику обработки данных сохранены. Source/dist content PASS; src/tests verification не менял.

Root сообщил npm run quality PASS: 74 Astro-файла без errors/warnings/hints, global Prettier PASS, 56 страниц, build 21:07:19. После точного исправления лида «В ориентире» → «Указана стоимость работы…» повторная сборка 56 страниц завершилась в 21:07:51 Europe/Moscow; затем node --test tests/*.test.mjs — 14/14 PASS. Targeted Prettier изменённых production/test-файлов PASS.

Браузерная приёмка root: 1440/768/390/320 без overflow, client/scroll 1425/1425, 753/753, 375/375, 305/305; на 320 таблицы 239/239, priceOverflow=0. Три radio показывают 2 390 / 3 190 / 4 990 ₽; высота результата неизменна при переключении: 440,1875px desktop / 478,4375px mobile. ArrowDown, summary Space, CTA → modal phone focus и Escape PASS. Без JS native AX click screen-radio дал Value=1 и видимый результат от 3 190 ₽; отдельное подтверждение no-JS Mac-details не заявляется, поскольку вывод после click обрезан. Текущая консоль errors=[]; временная no-JS вкладка закрыта, основной preview 4324 оставлен на #lr-prices, viewport сброшен.

Снимки: [прайс 1440](../../artifacts/design-system-v2/final/pricing-after-1440.png), [прайс 390](../../artifacts/design-system-v2/final/pricing-after-390.png), [таблица 390](../../artifacts/design-system-v2/final/pricing-table-390.png). DS-28 остаётся in progress; все прежние Lighthouse — исторические показатели более ранней версии, новые lab/field-показатели этой итерации не измерены.

## Агрегаторы в блоке отзывов

По [указанному пользователем образцу](https://www.lenremont.ru/remont-robotov-pylesosov.htm) добавлены три карточки: Яндекс Карты, 2ГИС и Google. Крупная оценка, декоративные золотые звёзды, название площадки и число оценок; каждая карточка — нативная ссылка. На desktop три колонки, на mobile две. Карусель 25 индивидуальных отзывов сохранена.

Показатели скопированы из живого DOM страницы-образца и явно атрибутируются общей ссылкой «Показатели — по данным Ленремонта» с датой наблюдения. Это не независимая повторная проверка агрегаторов и не общий рейтинг сети. Новый массив aggregators хранится отдельно от двух прежних проверенных записей ratings; sources и items сохранены. Происхождение и границы проверки — [источники отзывов](../../artifacts/reviews-sources.md).

Статус `verified` в указанном объёме: npm run quality PASS, 74 Astro-файла — 0 errors/warnings/hints, global Prettier PASS, 56 страниц, build 20:57:18 Europe/Moscow; 14 Node-тестов PASS. Root проверил 1440/768/390/320: client=scroll 1425/753/375/305, внутреннего переполнения карточек на 390/320 нет. Tab переводит фокус между площадками с видимым контуром; пагинация отзывов на 768 работает 1–2 → 3–4 → 1–2. Console проекта 4324 warn/error — пустой список. Снимки: [1440](../../artifacts/design-system-v2/final/reviews-aggregators-1440.png), [390](../../artifacts/design-system-v2/final/reviews-aggregators-390.png). Прежние ограничения доступности, реальной доставки и полевых метрик сохраняются.

## Компактные преимущества первого экрана

По последнему запросу на главной остаются четыре основных преимущества без поясняющих абзацев: диагностика в мастерской — 0 ₽, смета до начала работ, гарантия на ремонт — 1 год, проверка перед оплатой. На desktop — два ряда по два пункта; на узком экране — одна колонка. Полная версия шести преимуществ сохраняется на брендовых страницах. Квиз, обычная форма и постоянно видимые QR сохраняют предыдущие сценарии.

Компактная версия — `verified`: npm run quality PASS, 74 Astro-файла без errors/warnings/hints, 56 страниц, build 20:47:58 Europe/Moscow. 14 Node-тестов PASS. Root проверил 1440/768/390/320 без горизонтального переполнения: client=scroll 1425/753/375/305. На 1440 четыре пункта образуют два ряда, поясняющих параграфов нет; на 390 все заголовки занимают одну строку, на 320 первый — две, остальные — одну. [Снимок компактной версии](../../artifacts/design-system-v2/final/home-facts-compact-1440.png). Прежние ограничения доступности и Lighthouse остаются в силе.

## Предыдущий checkpoint: действия, преимущества и QR главной

Статус: `verified`, после технической проверки и браузерной приёмки root. На восстановленном тёмном video hero основное действие «Узнать стоимость ремонта» открывает существующий квиз; второе «Оставить заявку» — обычный lead-диалог. Новый экземпляр квиза или формы не создаётся.

Root согласованно обновил шесть hero.bullets, каждый с пояснением: «Бесплатная диагностика» (обычная диагностика в мастерской — 0 ₽ даже при отказе), «Смета до начала работ», «Гарантия на ремонт — 1 год», «Мобильная мастерская у дома», «Доступ к файлам — с согласия», «Проверка перед оплатой». Последний пункт заменяет размытое обещание о согласовании срока. Это дополнительное согласованное изменение hero.bullets к историческим трём copy-правкам ниже; прежний data-hash checkpoint не является сверкой новой редакции.

SocialLinks: QR стали постоянно видимыми прямыми ссылками на каналы без details, две колонки mobile / четыре desktop. Реальные каналы, логотипы, QR и ссылки сохраняются. Исторические проверки закрытых QR-details не описывают новое представление.

Финальная приёмка этой итерации:

- npm run quality: exit 0; Astro 74 файла, 0 errors / 0 warnings / 0 hints, global Prettier PASS; 56 страниц, build 20:40:20 Europe/Moscow. После финального CSS и build node --test tests/*.test.mjs: 14/14 PASS.
- Root на 4324 проверил 1440/768/600/390/320: client=scroll соответственно 1425/753/585/375/305, без root overflow. Найденные на 320 дополнительные 5px у нижнего WhatsApp устранены вертикальным расположением иконки и подписи при <600px, без скрытия содержимого.
- Все восемь QR видны и загружены: четыре у hero и четыре в footer. На 390 — две колонки; на 1440 — четыре, код 256px.
- На 1440 primary открывает квиз, переход шага 1 → 2 работает, экземпляр один; secondary открывает обычную форму с фокусом на phone, Escape возвращает opener. На 320 оба правильных диалога взаимоисключающие. Console текущего проекта 4324: warn/error — пустой список.
- Снимки: [1440](../../artifacts/design-system-v2/final/home-qr-cta-1440.png), [390](../../artifacts/design-system-v2/final/home-qr-390.png).

Все прежние Lighthouse относятся к более ранней версии и не характеризуют текущий hero/QR; новые показатели производительности не измерены. Ограничения 200% browser zoom, полного NVDA/VoiceOver, реальной доставки и field INP сохраняются; DS-28 остаётся `in progress`.

## Предыдущий checkpoint: возврат первого экрана главной

Статус: `verified`, после технической проверки и браузерной приёмки root. Пользователь подтвердил возврат первого экрана главной к фактическому виду до внедрения: тёмная композиция, видео и прежний CTA вместо format-photo панели. Baseline H1: «Ремонт ноутбуков на дому или в сервисном центре», без eyebrow и обещания «40–90». Conversion восстановил Hero.astro/_home-hero.scss, foundations проверил регрессии; остальные секции и дочерние hero этим решением не отменяются.

Preview нужного проекта снова запущен root на [http://127.0.0.1:4324/](http://127.0.0.1:4324/). Порт 4322 занят другим параллельным проектом и не используется для этой проверки.

Приёмка возврата:

- npm run quality: exit 0; Astro 74 файла, 0 errors / 0 warnings / 0 hints, global Prettier PASS; 56 страниц, build 20:20:59 Europe/Moscow. После build node --test tests/*.test.mjs: 14/14 PASS.
- SHA-сверка 102 src: изменены только Hero.astro и _home-hero.scss, остальные 100 совпадают с предыдущим срезом; композиционные ожидания landing-теста обновлены отдельно.
- Root на 4324 проверил 1440/768/390/320: client/scroll соответственно 1425/1425, 753/753, 375/375, 305/305; overflow нет, один H1; desktop — две колонки.
- Видео: controls=true, muted=true, paused=false. CTA открывает диалог с фокусом на phone, Escape закрывает его и возвращает фокус CTA. Console warn/error нужного проекта — пустой список; старые Vite-ошибки другого проекта на 4322 к этой версии не относятся.
- Снимки после возврата: [1440](../../artifacts/design-system-v2/final/home-hero-restored-1440.png), [390](../../artifacts/design-system-v2/final/home-hero-restored-390.png).

Остальные сохранённые ниже hero-кадры, format-photo сценарии, прежние quality/test/source-freeze и Lighthouse — доказательства версии **до возврата hero**. Значения mobile LCP 2,182s / desktop 0,495s не характеризуют восстановленный первый экран; его новая лабораторная производительность не измерена. Исторические результаты сохраняются, статусы DS-групп ниже относятся к принятому внедрению до дополнительного решения. Ограничения 200% browser zoom, полного NVDA/VoiceOver, реальной доставки и field INP сохраняются; DS-28 остаётся `in progress`.

## Итог стабильной версии до возврата hero

До дополнительного решения о первом экране production-внедрение выполнено: главная, 39 брендов, девять неисправностей и отдельная MacBook используют выбранную систему. Preview: [http://127.0.0.1:4324/](http://127.0.0.1:4324/). **Полная приёмка всех требований доступности не объявляется:** DS-28 остаётся in progress из-за неподтверждённых настоящих 200% и полного NVDA/VoiceOver; реальная доставка заявки и field INP также не проверены.

### Последние команды и неизменность версии

| Команда / проверка           | Фактический результат                                                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm run quality              | Exit 0; Astro 74 файла: 0 errors / 0 warnings / 0 hints; Prettier PASS; 56 static pages, build 16:21:47 Europe/Moscow                                                                         |
| node --test tests/*.test.mjs | После финального build: 14/14 PASS, 0 FAIL/skipped                                                                                                                                            |
| Source/CSS audit             | 102 исходных файла; 0 unscoped selectors / 0 nested production custom properties; четыре изолированных LR Golos Text font-face                                                                |
| Generated-output audit       | 51 production-маршрут, 49 detail H1/Service JSON-LD, один H1/root на маршрут, правильные canonical; 104 формы с 11 именованными полями, 2712 локальных media references; пять noindex-preview |
| Font references / CSS        | 51 локальный Cyrillic preload, 0 внешних Google font references; три CSS bundles / 1423 scoped rules плюс четыре font-face                                                                    |
| Source freeze                | После шести финальных performance-прогонов 102/102 src, WOFF2/OFL, package.json и package-lock.json неизменны                                                                                 |

Доказательства: [quality.log](../../artifacts/design-system-v2/final/quality.log), [tests.log](../../artifacts/design-system-v2/final/tests.log), [source-audit.log](../../artifacts/design-system-v2/final/source-audit.log), [dist-audit.log](../../artifacts/design-system-v2/final/dist-audit.log), [source-freeze.log](../../artifacts/design-system-v2/final/source-freeze.log), [technical-summary.log](../../artifacts/design-system-v2/final/technical-summary.log). Этот code freeze завершил прежнюю версию; подтверждённый пользователем возврат hero выполняется отдельно и потребует новых проверок.

Данные: service-pages.json, reviews.json, workshops.json и service-pages.ts совпадают с исходными SHA-256. В laptop-service.json разрешены ровно process.items[0].text, process.items[2].text и faq.items[0].text; обратная подстановка трёх исходных строк в памяти восстанавливает полный baseline SHA-256. Цены/работы/даты/отзывы/адреса/маршруты не изменены. Обоснования трёх copy-полей приведены ниже.

### Браузерная приёмка root

- Главная: desktop 1440, tablet 768 (hero/price checkpoint), mobile 390; format radio и ArrowDown, четыре формата → соответствующий контекст, Escape → CTA. Workshop → at-home и повторное открытие сохраняют телефон; screen-цена → форма сохраняет courier и symptom. Проверенная высота price-панели 751 → 751px.
- Без JS: цена 2 390 → 3 190 ₽, формат center показывает собственное описание. Невалидные телефон/пустой адрес/несогласие дают три связанные ошибки, aria-invalid и focus на phone без внешней отправки. Reduced motion: transition 0s / animation none у проверенных hero/primary.
- Квиз: все четыре шага, premium + hardware + mobile-lab, один экземпляр, шаг/телефон сохраняются при переносе и повторном открытии; Escape возвращает opener. Нативные этапы: Space оставляет один открытый этап.
- Контент: 19 секций в сохранённом порядке; отзывы/источники/гарантия/директор/симптомы/SEO/FAQ просмотрены desktop/mobile. Enter раскрывает ещё 18 адресов: все 24 видимы, фото ровно одно. FAQ Space показывает ответ. У восьми QR уникальные имена; по умолчанию открытых ноль, Space открывает только VK и обратно закрывает его.
- Детальные страницы: Packard Bell 1440/390, HP 1440, Acer 390 (пять уникальных FAQ, полный ответ), залитие 1440/390 (одно предупреждение до CTA, живой #lr-first-aid), нет включения 390, MacBook 1440/390 (прайс/article/досье, premium сохраняется при workshop).
- MacBook nav: native details на 390 с summary 44px и семью ссылками по Space; на 1440 семь ссылок открыты. Исправлен dossier CTA overflow 13px на 320 без overflow:hidden. [browser-layout-320.json](../../artifacts/design-system-v2/final/browser-layout-320.json) подтверждает четыре семейства: inner 320, client/scroll 305, один H1, без overflow.
- Общие брендовые Benefits/RepairTimeline после завершающей очистки: 1440/768/390/320 — 3/2/1/1 колонки; shadow/transform/backdrop none, scroll===client, фото/текст читаемы. [brand-shared-checks.log](../../artifacts/design-system-v2/final/brand-shared-checks.log), [brand-benefits-320.png](../../artifacts/design-system-v2/final/brand-benefits-320.png).
- Console warn/error в пройденных сценариях: пустой список. Это проверенная выборка, не ручной просмотр всех 56 маршрутов и не полный screen-reader аудит.

Финальные изображения главной обновлены после последнего CSS: [1440](../../artifacts/design-system-v2/final/home-1440.png), [390](../../artifacts/design-system-v2/final/home-390.png). Остальные сохранённые checkpoint-кадры связаны ниже; они не переименовываются в финальные снимки непроверенных состояний.

### Шрифт и лабораторная производительность

Та же Golos Text Version 2.004 доставляется локально под CSS-именем LR Golos Text, веса 400–700, swap; четыре исходных WOFF2 96 848 Б, официальная неизменённая OFL. Preload один: Cyrillic. Root подтвердил фактический Golos Text SemiBold/customFont=true, прежние 66,96px/около 139px у H1; Network после reload — три нужных local subsets, без Google-запросов. [Происхождение и SHA-256](25_MEDIA_SOURCES.md), [OFL](../../public/media/fonts/OFL-Golos-Text.txt).

Последняя серия: Lighthouse 13.5.0 / Chrome 156, performance-only; три mobile + три desktop, simulate, чистый временный headless-профиль на запуск, без IAB/user profile. Во всех шести финальных прогонах нет warnings/runtime errors, конфигурация сопоставима с baseline. Browser/storage cold; OS/DNS/CDN caches не контролировались. Команды и профили полностью записаны в JSON.

| Метрика                | До шрифтов: mobile | Финальная mobile      | Финальная desktop     |
| ---------------------- | ------------------ | --------------------- | --------------------- |
| Simulated LCP, медиана | 2,942s             | 2,182s (2,114–2,197s) | 0,495s (0,492–0,496s) |
| CLS, медиана           | 0                  | 0                     | 0                     |
| TBT, медиана           | 27,5ms             | 212ms                 | 0ms                   |

Финальный mobile LCP меньше baseline на 760ms / 25,8%. Локальные цели LCP ≤2,5s и CLS ≤0,1 соблюдены во всех шести финальных прогонах. TBT вырос с 27,5 до 212ms: это диагностическая lab-метрика, не INP. Репрезентативный trace показывает Style/Layout 3303 → 1420ms и longest task 1217 → 563ms; более ранний FCP меняет окно TBT. Trace-величины не называются медианами или field-данными; утверждение «все метрики улучшились» не используется. Полный comparison содержит также FCP/SpeedIndex.

Актуальные результаты: [performance-final.json](../../artifacts/design-system-v2/final/performance-final.json), [performance-final-comparison.json](../../artifacts/design-system-v2/final/performance-final-comparison.json). [Baseline](../../artifacts/design-system-v2/final/performance-baseline.json) и [after-font](../../artifacts/design-system-v2/final/performance-after-fonts.json) сохранены как исторические срезы. Последние исходные отчёты — lighthouse-final-{mobile,desktop}-{1,2,3}.json в той же папке.

### Явные остатки

Настоящий 200% browser zoom / увеличение текста не подтверждены: Ctrl+Plus/Equal оставили zoom 1, OSTextScale включая mobile:true не изменил computed font/высоты; режимы сброшены. Это не PASS и не установленный дефект страницы. Полный NVDA/VoiceOver не запускался. Реальная доставка заявки без проверки внешнего обработчика не подтверждена. Полевые LCP/INP/CLS не измерялись; lab TBT не является INP. **Не все пункты полной приёмки закрыты: DS-28 остаётся in progress.**

## Статусы и ответственность

Используются только `pending`, `in progress`, `verified`. Статус `verified` ставится после относящихся к задаче проверок; написанный код или сообщение исполнителя сами по себе не подтверждают приёмку. `in progress` у группы означает открытый пакет работ, не завершение всех его подзадач.

| Владелец     | Область                                                                   |
| ------------ | ------------------------------------------------------------------------- |
| foundations  | Общие токены, контейнер, типографика и базовые контролы                   |
| conversion   | Hero, цены, форма, контекст заявки, поведение в landing.js                |
| service      | Форматы ремонта, мобильная мастерская, галерея, этапы, квиз               |
| content      | Отзывы, доказательства, гарантия, адреса, информационные секции           |
| templates    | Бренды, проблемы, MacBook, навигация и SEO-контракты                      |
| verification | Инвентаризация, статические и поведенческие проверки, независимая приёмка |

По итогам выполнения 31 из 32 DS-групп verified в указанном объёме. DS-28 in progress: частичные keyboard/reflow/reduced-motion/error проверки выполнены, настоящие 200% и полный screen reader не подтверждены. Отмеченные галочкой подзадачи относятся к фактическому объёму реализации и проверок; отдельные ограничения не преобразуются в PASS.

Root координирует порядок, разделение файлов, браузерные проверки и интеграцию. Владелец задачи согласует общий файл с root до параллельного редактирования. Это список областей ответственности, а не разрешение всем одновременно менять landing.js или _variables.scss.

## Этап 0: фактический baseline

Технический baseline снят до production-изменений 29 октября 2026. Финальный baseline build завершён в 13:58 по журналу локальной команды.

| Проверка                     | Статус   | Наблюдаемый результат                                                                                                                                        |
| ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Инструкции и инструменты     | verified | Прочитаны AGENTS.md, MASTER_DEVELOPMENT_PROMPT, Karpathy и Project UI. Astro 7.3.8; Sass 1.102.0; landing-kit 0.3.1; Prettier 3.9.6                          |
| Исходное рабочее дерево      | verified | Уже существовал большой набор modified/untracked файлов, включая макеты и контент. Reset/clean/checkout не выполнялись; чужие изменения не отменялись        |
| Маршруты из данных           | verified | 39 брендов, 9 проблем, отдельная MacBook, 2 главных маршрута, 5 preview: 56. Дублей маршрутов нет                                                            |
| npm run quality              | verified | Exit 0. Astro: 0 errors, 0 warnings, 1 прежний hint о secondaryHref в ChildHero. Prettier PASS. Static build: 56 страниц                                     |
| node --test tests/*.test.mjs | verified | 10/10 PASS. Первый запуск sandbox блокировал spawn EPERM; повтор с require_escalated прошёл. Это ограничение среды, не дефект приложения                     |
| Визуальный baseline          | verified | Root сохранил восемь кадров: artifacts/design-system-v2/baseline/{home,brand,problem,macbook}-{1440,390}.png. Это исходный вид, не проверка новой реализации |
| Неизменность содержания      | verified | SHA-256 пяти исходников данных/маршрутов сохранён в artifacts/design-system-v2/baseline/source-hashes.json; последующая сверка относится к итоговой приёмке  |
| Реальная доставка заявки     | pending  | Не проверялась; запуск внешней отправки не входит в автоматический baseline                                                                                  |

Тесты landing/service-pages читают dist: после реализации сначала завершается новая сборка, затем выполняются тесты. Нельзя запускать их параллельно с записью dist и считать полученный результат проверкой новой версии.

Checkpoint DS-01–10 принят root по техническим и браузерным проверкам ниже. DS-11–15 приняты root по следующему checkpoint. DS-16–22 находятся в работе: область content, текущий исполнитель verification; финальную техническую проверку выполняет другой агент.

Представители для последующих проверок выбираются из данных: короткий бренд, самый длинный H1 (сейчас Packard Bell), проблема с залитием, проблема отсутствия включения, отдельная MacBook. Фактические данные и порядок секций сохраняются; фото не заменяется фиктивной съёмкой.

## Этап 1: основание и первая заявка

### DS-01 — базовые и смысловые цвета

Владелец: foundations. Зависимость: технический baseline. Статус: `verified`.

- [x] DS-01a: ввести выбранные pearl/graphite/gold-примитивы на #hop-landing.
- [x] DS-01b: переназначить существующие semantic/component-токены, сохранив подходящие имена.
- [x] DS-01c: проверить контраст текста, полей, состояний и focus на светлом/тёмном; просмотреть потребителей всех семейств.

Приёмка: акцент #F2B632, не champagne; вторичный текст читаем, белый текст не оказался на золотой кнопке. Значения не объявляются в :root/body или случайно внутри секций.

### DS-02 — контейнер, типографика, радиусы

Владелец: foundations. Зависимость: DS-01. Статус: `verified`.

- [x] DS-02a: сохранить production max-width 1280px и согласовать поля mobile/tablet с системой.
- [x] DS-02b: задать общие роли H1/H2/H3, текста и подписи, нормализовать отступы и радиусы.
- [x] DS-02c: проверить SectionHeading, длинный бренд и переносы на 390/768/1440, дополнительно reflow 320.

Приёмка: нет сдавленной панели, обрезанного текста или горизонтального скролла страницы; переменные заголовки не зависят от ручного br.

### DS-03 — действия и поля

Владельцы: foundations (базовые стили), conversion (форма). Зависимость: DS-01/02. Статус: `verified`.

- [x] DS-03a: primary/secondary/link и видимые hover/pressed/focus по смысловой роли.
- [x] DS-03b: поля и сообщения ошибок с видимыми label, границами и связью aria-describedby.
- [x] DS-03c: проверить 56px primary/поля, удобные зоны закрытия, контраст на обоих фонах и сохранение ввода.

Приёмка: действие понятно, focus не обрезан, ошибка не только цветом; data-хуки и имена полей сохранены.

### DS-04 — первый экран

Владелец: conversion. Зависимость: DS-01–03. Статус: `verified`.

- [x] DS-04a: перенести выбранную композицию в production Hero без дублирующего шаблона.
- [x] DS-04b: сохранить предмет услуги/город, один H1, реальные медиа и начальный no-JS вариант.
- [x] DS-04c: проверить порядок чтения, четыре формата и доступный контакт на mobile/tablet/desktop.

Приёмка: hero узнаваем как выбранное направление; фото не отодвигает единственный контакт на несколько экранов.

### DS-05 — формат → контекст

Владелец: conversion. Зависимость: DS-04 и существующие обработчики формы. Статус: `verified`.

- [x] DS-05a: сопоставить mobile/home/center/courier с mobile-lab/at-home/workshop/courier.
- [x] DS-05b: передавать выбор через существующий контекст; показывать его и позволять изменить.
- [x] DS-05c: проверить консультацию без выбора, все форматы, повторное открытие и независимость source/формата.

Приёмка: формат не теряется и не подменяет symptom; телефон/адрес не сохраняются в URL, аналитике или localStorage.

### DS-06 — диалог и заявка

Владелец: conversion. Зависимость: DS-03/05. Статус: `verified`.

- [x] DS-06a: переоформить существующие LeadModal/LeadCapture/LeadForm без второго комплекта форм.
- [x] DS-06b: сохранить Escape/backdrop/close, focus return, scroll lock, условные поля и мобильный ввод.
- [x] DS-06c: пройти пустое/невалидное значение, смену формата, ошибку и повторное открытие без потери ввода.

Приёмка: контекст виден и изменяем, неактуальные поля выключены, интерфейс не показывает неподтверждённый успех.

## Этап 2: цена и информированный выбор

### DS-07 — панель ориентиров

Владелец: conversion. Зависимость: DS-01–03. Статус: `verified`.

- [x] DS-07a: перенести три нативных radio и связанную панель в HomePricing.
- [x] DS-07b: читать работу, цену и срок из исходных данных с устойчивым соответствием.
- [x] DS-07c: проверить все варианты, no-JS, клавиатуру, связанность результата и отсутствие скачков.

Приёмка: до выбора виден полезный пример; цена не вычисляется парсингом видимого текста и не называется сметой.

### DS-08 — условия стоимости

Владелец: conversion. Зависимость: DS-07. Статус: `verified`.

- [x] DS-08a: сохранить отдельную оплату деталей и зависимость от модели/диагностики.
- [x] DS-08b: сохранить различие обычной диагностики в мастерской и срочной услуги, скидки и оплату частями.
- [x] DS-08c: сверить условия с источником и видимость рядом с ценой на mobile.

Приёмка: бесплатность не распространена на любой выезд; короткий макет не вытеснил действующие условия.

### DS-09 — полный прайс

Владелец: conversion. Зависимость: DS-07/08. Статус: `verified`.

- [x] DS-09a: переоформить ServicePriceTable и PriceVerification с исходными строками.
- [x] DS-09b: сохранить связи заголовков/колонок и читаемость узкой версии.
- [x] DS-09c: проверить полный доступ без квиза/JS, реальные ссылки и дату сверки.

Приёмка: нет скролла всей страницы; полный прайс и его ограничения доступны, дата не генерируется автоматически.

### DS-10 — симптом → заявка

Владелец: conversion. Зависимость: DS-05/07–09. Статус: `verified`.

- [x] DS-10a: передать выбранную проблему через существующий context/data-контракт.
- [x] DS-10b: сохранить формат при смене симптома и симптом при смене формата.
- [x] DS-10c: добавить небольшую поведенческую регрессию и пройти цена → форма → смена формата.

Приёмка: человек видит запрос на консультацию, не автоматический диагноз или окончательную стоимость.

## Этап 3: форматы, медиа, процесс и квиз

### DS-11 — пояснение форматов

Владелец: service. Зависимость: DS-04/05. Статус: `verified`.

- [x] DS-11a: отделить пояснение RepairFormats от интерактивного выбора hero.
- [x] DS-11b: явно различить автомобиль, помещение клиента, сервис и курьера.
- [x] DS-11c: проверить условия и правильный контекст CTA на mobile/desktop.

Приёмка: нет второй копии панели выбора и смешения двух выездных сценариев.

### DS-12 — тёмная мобильная мастерская

Владелец: service. Зависимость: DS-01/02/11. Статус: `verified`.

- [x] DS-12a: перенести графитовую медиа-композицию в MobileLab с текущими local media.
- [x] DS-12b: сохранить controls/playsinline/poster/preload none без autoplay.
- [x] DS-12c: проверить crop, подписи, фокус и CTA mobile-lab на трёх ширинах.

Приёмка: реальное рабочее место понятно; видео не загружается целиком заранее и не перекрыто кнопкой.

### DS-13 — галерея

Владелец: service. Зависимость: DS-02/12. Статус: `verified`.

- [x] DS-13a: переоформить WorkshopGallery без изменения принадлежности кадров.
- [x] DS-13b: задать размеры, responsive source и lazy для некритических фото.
- [x] DS-13c: проверить crop/подписи на 390/768/1440, отсутствие скачков.

Приёмка: кадр конкретной мастерской не обозначен как интерьер любого адреса.

### DS-14 — этапы

Владелец: service. Зависимость: DS-02/03. Статус: `verified`.

- [x] DS-14a: оформить RepairProcess как нативные раскрывающиеся этапы с первым открытым.
- [x] DS-14b: сохранить смысл согласования работ и совместимый fallback details.
- [x] DS-14c: проверить Tab/Enter/Space, focus и отсутствие принудительного scroll.

Приёмка: этапы понятны без JS; общее действие не сбрасывает уже выбранный формат.

### DS-15 — квиз и его диалог

Владельцы: service (подача), conversion (общий JS-контракт). Зависимость: DS-03/06. Статус: `verified`.

- [x] DS-15a: оформить RepairQuiz/QuizCallout/QuizModal общими ролями системы.
- [x] DS-15b: сохранить один экземпляр формы, шаг, ответы и контакт при переносе.
- [x] DS-15c: пройти обратно/вперёд, Escape/backdrop/close, focus return и no-JS переход.

Приёмка: нет дублей ID/обработчиков и фиктивной «диагностики»; существующие quiz-регрессии проходят.

## Этап 4: доверие и остальная главная

### DS-16 — отзывы

Владелец: content. Зависимость: DS-01–03. Статус: `verified`.

- [x] DS-16a: оформить Reviews/ReviewCard с именем, предметом, датой и источником.
- [x] DS-16b: сохранить маркировку iMac и реальные рейтинги/даты проверки.
- [x] DS-16c: проверить длинный текст, раскрытие, слайдер/drag/keyboard и reduced motion.

Приёмка: общие отзывы не выдаются за отзывы о конкретном бренде; автопрокрутка не добавлена.

### DS-17 — экспертность и доказательства

Владелец: content. Зависимость: DS-02/12/13. Статус: `verified`.

- [x] DS-17a: выстроить разные композиции HomeExpertise и BusinessTrust.
- [x] DS-17b: сохранить действия проверки, документы, источники и корпоративные контакты.
- [x] DS-17c: проверить читаемость материалов/ссылок и отсутствие вымышленных статусов.

Приёмка: доказательства содержательны; нет стены декоративных бейджей и неподтверждённых авторизаций.

### DS-18 — директор и ответственность

Владелец: content. Зависимость: DS-02/17. Статус: `verified`.

- [x] DS-18a: оформить DirectorMessage с существующим текстом и портретом.
- [x] DS-18b: оформить HomeProtection/GuaranteeSupport с полными условиями и документами.
- [x] DS-18c: сверить контент и проверить читаемость/переходы на mobile.

Приёмка: новые слова не приписаны директору; гарантия не сведена к безусловному бейджу, исключённые материалы не возвращены.

### DS-19 — адреса и доставка

Владелец: content. Зависимость: DS-02/03. Статус: `verified`.

- [x] DS-19a: оформить Locations/WorkshopCard с адресом, ролью точки и режимом.
- [x] DS-19b: сохранить все записи, раскрытие остальных адресов и действующие маршруты/контакты.
- [x] DS-19c: проверить список на mobile, адреса текстом, клавиатуру и реальные ссылки.

Приёмка: все 24 текущие точки доступны; одинаковое оснащение каждой не обещается; тяжёлая карта не добавлена ради декора.

### DS-20 — навигация по услугам

Владельцы: content (главная), templates (связанные страницы). Зависимость: DS-02/03. Статус: `verified`.

- [x] DS-20a: оформить Symptoms/ManufacturerLinks/RelatedServices с содержательными названиями.
- [x] DS-20b: сохранить локальные логотипы, цены при наличии и существующие URL.
- [x] DS-20c: проверить все исходящие внутренние ссылки и фокус на узком экране.

Приёмка: навигация остаётся быстрой, без одинаковой огромной карточки на каждую ссылку и ложных авторизаций.

### DS-21 — информационный низ

Владелец: content. Зависимость: DS-02/06. Статус: `verified`.

- [x] DS-21a: переоформить HomeSeo/Faq с читаемой шириной строки и H2/H3.
- [x] DS-21b: сохранить полный текст и нативные независимые FAQ-раскрытия.
- [x] DS-21c: проверить финальный LeadCapture, контакты и мобильную панель без перекрытия.

Приёмка: информационный низ и форма доступны, не скрыты квизом или декоративным эффектом.

### DS-22 — ритм всей главной

Владелец: content; интеграция root. Зависимость: DS-04–21. Статус: `verified`.

- [x] DS-22a: сверить index.astro с утверждённой архитектурой и текущим BusinessTrust.
- [x] DS-22b: проверить соседние отступы, чередование фонов, повторы CTA и плотность.
- [x] DS-22c: последовательно просмотреть всю страницу desktop/mobile, а не только отдельные секции.

Приёмка: состав/порядок сохранены; нет цепочки одинаковых карточек или двух огромных тёмных панелей подряд.

## Этап 5: семейства детальных страниц

### DS-23 — бренды

Владелец: templates. Зависимость: DS-01–03/06/09. Статус: `verified`.

- [x] DS-23a: перенести BrandLanding/ChildHero через общие роли, не ручные 39 копий.
- [x] DS-23b: сохранить уникальные H1/lead/checks/prepare/FAQ и данные всех брендов.
- [x] DS-23c: проверить короткий/длинный бренд, максимальный FAQ, общий кадр и desktop/mobile.

Приёмка: нет фиктивных брендовых отзывов/фото; длинное название не сломало первый экран.

### DS-24 — неисправности

Владелец: templates. Зависимость: DS-01–03/06/09. Статус: `verified`.

- [x] DS-24a: оформить ProblemLanding с собственными предупреждениями и первыми действиями.
- [x] DS-24b: сохранить причины, рекомендации, подходящие priceWorks и уникальное содержание.
- [x] DS-24c: проверить залитие/отсутствие включения и программно все девять маршрутов.

Приёмка: срочные действия видны близко к началу, не спрятаны под галерею/FAQ; прайс релевантен проблеме.

### DS-25 — MacBook

Владелец: templates. Зависимость: DS-01–03/06/09. Статус: `verified`.

- [x] DS-25a: перевести macbook-page на общую палитру/роли без отдельного псевдо-Apple оформления.
- [x] DS-25b: сохранить собственный прайс, модели, данные и premium-контекст.
- [x] DS-25c: проверить desktop/mobile, контент и контакты/форму.

Приёмка: MacBook узнаётся как часть Ленремонта, без ложного официального статуса и подмены прайса.

### DS-26 — маршруты и SEO

Владелец: templates. Зависимость: DS-20/23–25. Статус: `verified`.

- [x] DS-26a: сверить slug и оба входных маршрута главной с baseline.
- [x] DS-26b: проверить Breadcrumbs/RelatedServices, title/description/canonical/JSON-LD и один H1/root.
- [x] DS-26c: пройти все маршруты из данных автоматическими проверками после build.

Приёмка: дизайн не меняет URL, поисковый смысл, уникальность и связи страниц.

## Этап 6: общая приёмка

### DS-27 — токены и исключения

Владелец: verification; исправления профильным владельцам. Зависимость: DS-01–26. Статус: `verified`.

- [x] DS-27a: найти старые прямые HEX/RGB, синие aliases, градиенты и вложенные переопределения.
- [x] DS-27b: подтвердить с владельцами назначение каждого сохраняемого исключения.
- [x] DS-27c: проверить compiled CSS: изоляция, keyframes lr-, переменные на корне и реальные потребители.

Приёмка: нет случайной старой палитры, глобальных selectors и второго независимого набора токенов.

### DS-28 — крайние состояния

Владелец: verification; браузер root. Зависимость: DS-01–26. Статус: `in progress`.

- [ ] DS-28a: проверить 320px, 200% текста, длинное/отсутствующее содержание.
- [ ] DS-28b: пройти error/loading/success там, где применимо, с сохранением ввода.
- [ ] DS-28c: пройти no-JS, reduced motion, keyboard и динамические панели с assistive technology.

Приёмка: критическое содержание доступно, нет перекрытого focus, ложного успеха или потери состояния. Непроверенные поверхности названы отдельно.

### DS-29 — загрузка и устойчивость

Владелец: verification; браузер root. Зависимость: DS-04/07/12/13/23–25. Статус: `verified`.

- [x] DS-29a: проверить размеры/приоритет hero, lazy остальных фото и preload видео.
- [x] DS-29b: измерить доступные показатели и проверить скачки при переключении.
- [x] DS-29c: проверить ошибки ресурсов/консоли и поведение при замедленной сети.

Приёмка: измеренное отделено от целевых бюджетов; локальный build не называется подтверждением полевых LCP/INP/CLS.

### DS-30 — регрессии сценариев

Владелец: verification; исправления conversion/service. Зависимость: DS-05/06/10/15/19/21. Статус: `verified`.

- [x] DS-30a: выполнить phone/visit/context/quiz/modal тесты после новой сборки.
- [x] DS-30b: пройти повторные открытия/смены выбора, сохранение состояния и мобильную панель.
- [x] DS-30c: проверить защиту от повторной инициализации, дубли ID/обработчиков и отсутствие влияния вне root.

Приёмка: исходные поведенческие контракты сохранены; новая связь контекста имеет небольшую регрессию.

### DS-31 — итоговые команды

Владелец: verification. Зависимость: DS-27–30 и остановка параллельных мутаций. Статус: `verified`.

- [x] DS-31a: выполнить npm run quality и дождаться завершения static build.
- [x] DS-31b: выполнить нужные Node-тесты по построенному dist.
- [x] DS-31c: сверить полный список маршрутов из актуальных данных и записать exit/status/ограничения.

Приёмка: реальные результаты PASS, без смешивания старого dist с новыми исходниками; предупреждения и подсказки не скрыты.

### DS-32 — документация и передача

Владелец: verification; итог root. Зависимость: DS-27–31. Статус: `verified`.

- [x] DS-32a: обновить статусы только по доказательствам и отметить реальные исключения в системе.
- [x] DS-32b: связать итоговые desktop/mobile материалы и точные результаты команд.
- [x] DS-32c: явно перечислить оставшиеся ограничения: screen reader/сеть/доставка, если они не подтверждены.

Приёмка: спецификация и внедрение не смешаны; не заявлено завершение обязательной непроверенной работы, WordPress/публикация не затронуты.

## Read-only инвентаризация legacy CSS

Снимок исходного состояния до внедрения. Наличие строки — кандидат для проверки владельцем, не автоматическое разрешение массовой замены. Номера строк изменятся при работе. Preview `_design-*` и `_style-review.scss` исключены из этого перечня: исторические варианты не должны незаметно определять production.

| Область / владелец                  | Файлы и наблюдение                                                                                                                    | Что проверить при миграции                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Основание / foundations             | core/_variables.scss: старые #172A40, #263B52, #2563A6, голубые/янтарные примитивы, синий success, синеватые overlay/shadow           | Перенести через семантику; не просто переименовать все синие цвета в золото                                      |
| Hero / conversion                   | sections/_home-hero.scss: локальные --lr-color-* на .lr-hero--home, #C6D4E5, #435971                                                  | Явные цвета потомков и focus на графите вместо вложенного изменения глобальных ролей                             |
| Общий hero / conversion+templates   | sections/_laptop-service.scss:76–85: --lr-color-* и радиусы на .lr-hero, #EFF3F7, #53657A, #D9E2EC, #F4B942                           | Не оставить старую локальную палитру поверх новых root-токенов                                                   |
| Общие секции / content              | sections/_laptop-service.scss:521–522: локальный border в .lr-guarantee и #EDF3FA; :717/:810/:853: lr-blue; :1124: rgb(23 42 64)      | Перевести гарантию/тексты/разделители на общие роли, проверить фактических потребителей                          |
| Соцсети / conversion+content        | sections/_laptop-service.scss:1337–1349: вложенные --lr-social-hover, яркие brand HEX и два linear-gradient                           | Определить функциональные брендовые знаки отдельно от декоративного hover; переменные не объявлять внутри кнопок |
| Форматы / service                   | sections/_formats.scss: синие/янтарные aliases, тени в покое и hover, rgb(23 42 64)                                                   | Убрать случайные карточные тени; выбор и focus задавать смысловыми ролями                                        |
| Квиз / service                      | sections/_quiz.scss: голубые фоны/рамки, синий selected и accent-color                                                                | Сохранить контраст radio/selected; не заменять синий текст малоконтрастным золотым                               |
| Главная / content                   | sections/_home-content.scss:144/179 и _home-service.scss:116: lr-blue-50                                                              | Проверить нейтральные поверхности и ритм секций                                                                  |
| Дочерние / templates                | sections/_brand-pages.scss и _child-pages.scss: многочисленные lr-blue-50/100/200/700                                                 | Единая семантика для фонов, ссылок, границ и предупреждений; уникальное содержание не менять                     |
| MacBook / templates                 | sections/_macbook-page.scss: отдельные --lr-mac-* и --lr-color-* на .lr-mac-page, синий accent, собственные тени, градиент около :350 | Устранить независимую цветовую систему в пользу общих ролей; проверить contrast subtle-текста                    |
| Вспомогательные / templates+content | sections/_security.scss: синие роли и rgb(37 99 166); _timeline.scss: gradient и прямой white!important; _quality.scss: прямой white  | Определить тёмные поверхности, не раздавать белый текст без проверки фона                                        |
| Маски / verification                | sections/_repair-cases.scss: mask-image с #000                                                                                        | Чёрный в alpha-маске не равен старой палитре; не заменять автоматически. Сам блок сейчас неактивен на главной    |

Дополнительные контракты тестов: landing.test.mjs исходно ожидает H2#lr-hero-title, один data-lr-hero-video и три формы. При новом hero устаревшие композиционные assertions адаптируются адресно; содержательные, SEO и Lead Capture проверки сохраняются. hero-video.test.mjs проверяет старый muted-autoplay helper и не доказывает отсутствие autoplay у новых медиа.

## Доказательства checkpoint DS-01–10

Техническая проверка verification: npm run quality — exit 0; Astro 0 errors / 0 warnings / прежний hint secondaryHref; Prettier PASS; 56 страниц. После завершения сборки node --test tests/*.test.mjs — 13/13 PASS. SHA-256 данных/маршрутов — 5/5 без изменений. Тесты lead-context проверяют alias/canonical mapping, сохранение формата, симптома, premium-категории и введённого контакта; содержательные, SEO и Lead Capture контракты сохранены.

Браузерные наблюдения root, dev 4322:

- 1440/768/390: нет горизонтального overflow страницы.
- Все четыре формата дают правильные видимые подписи контекста.
- Workshop → at-home сохраняет телефон; повторное открытие также сохраняет ввод.
- Цена screen → форма сохраняет ранее выбранный courier и выбранный symptom.
- Высота ценового блока при проверенном переключении: 751 → 751px.
- ArrowDown переключает radio, focus виден золотым контуром 3px; Escape возвращает фокус на CTA.
- Без JS цена переключается 2 390 → 3 190 ₽.
- Найденный stale-description hero без JS исправлен CSS :has; повторный нативный выбор center показал соответствующий текст.

Материалы root: artifacts/design-system-v2/checkpoint/. Статус verified здесь относится к проверенному checkpoint первого сценария, не к полной приёмке всех семейств и всей доступности. Полный screen reader, реальная доставка заявки и полевые performance-метрики не проверены. Reflow 320px, 200% текста и полная межстраничная сверка остаются в DS-27–31; ещё не выполненные подзадачи не отмечаются галочкой автоматически.

## Дополнение к scope DS-21: спокойные социальные контакты

Scope согласован root и выполняется в content-пакете. Фактический компонент — sections/SocialLinks.astro, QuickContacts только включает его. Активные стили находятся в sections/_laptop-service.scss; отдельный _social-links.scss сейчас не импортирован landing.scss и не должен подключаться ради этой задачи.

- DS-21d: удалить декоративное разрастание фона social-icon до scale(26), включая постоянную заливку в max-width 599px, 650ms transform и локальные --lr-social-hover на кнопках.
- DS-21e: заменить inline --lr-social-color и вложенные переменные классами/корневыми примитивами, сохранив узнаваемые SVG-знаки; брендовый цвет ограничить самой иконкой, а hover оставить спокойным нейтральным.
- DS-21f: сохранить VK, Telegram, MAX, WhatsApp, их href, подписи, локальные QR SVG, native QR-disclosure и контактный fallback; проверить клавиатуру, reduced motion и QR на mobile.

Этот дополнительный локальный пакет не добавляет каналов, виджетов, новых ссылок или библиотек. Shared SCSS и корневые токены согласуются с root перед редактированием.

## Доказательства checkpoint DS-11–15

Техническая проверка verification: npm run quality — exit 0; Astro 0 errors / 0 warnings / прежний hint secondaryHref, Prettier PASS, static build 56 страниц. После build все Node-тесты — 13/13 PASS.

Четыре исходных файла данных/маршрутов совпадают с baseline SHA-256. В laptop-service.json изменены только process.items[0].text и process.items[2].text: убрано обещание двух минут и уточнена обычная бесплатная диагностика в мастерской. Строгое подтверждение: обратная подстановка двух исходных строк в памяти восстановила SHA-256 всего baseline-файла. Исходный baseline не перезаписан.

Root просмотрел MobileLab, Process, Formats и Gallery на 1440/390; четыре формата сохранены. У видео preload none, controls, без autoplay. Space на details даёт один открытый этап. Пройдены все четыре шага квиза: premium + hardware + mobile-lab доходят до формы; экземпляр один, шаг и телефон сохраняются при переносе и повторном открытии, Escape возвращает opener. Исправленный padding модальной панели повторно проверен: доступная ширина 297px вместо 250px, Escape работает.

Дополнительно root подтвердил общий reflow 320px без overflow, reduced-motion с transition 0s/animation none у hero и primary. Невалидная попытка ввода (phone 123, пустой адрес, без согласия) показала три связанные ошибки, aria-invalid true и фокус на телефоне; внешней отправки не было.

200% не подтверждены: Ctrl+Plus/Ctrl+Equal не изменили browser zoom 1; Emulation.setEmulatedOSTextScale({scale:2}) поддержана, но computed font/высоты не изменились. Масштабы сброшены. Это ограничение проверки, не PASS и не установленный дефект страницы. Полный NVDA/VoiceOver, доставка заявки и field-метрики не подтверждены.

## Доказательства следующих этапов

DS-16–22 реализованы content-исполнителем и приняты root после независимого технического checkpoint и desktop/mobile проверки. Статус verified относится к наблюдаемым сценариям ниже, ограничения полного аудита сохраняются. Изменения:

- Reviews: открытые источники рейтингов, нейтральные знаки и аватары, текст 16px/метаданные 14px, без рамки вокруг всей карусели и scale/opacity-анимации отдельных отзывов. Геометрия слайдера и data-хуки сохранены.
- HomeExpertise/BusinessTrust: убраны декоративные надзаголовки и линии у открытого текста; проверка результата, корпоративные контакты и ограничения запчастей сохранены.
- Director/HomeProtection/GuaranteeSupport: сохранены текст/источник портрета и все условия, убраны золотые боковые линии; порядок гарантийного обращения остаётся настоящим ol.
- Locations: компактные адресные строки вместо стены белых карточек, единственное реальное фото остаётся у своего адреса, native details остальных точек сохранён.
- Symptoms/ManufacturerLinks: компактные ссылки с исходными иллюстрациями/ценами без gradient overlay, более компактные логотипы и читаемые текстовые ссылки.
- HomeSeo/Faq: две читаемые редакционные колонки на desktop, нативные независимые FAQ-раскрытия с summary 20px; текст и внутренние ссылки сохранены.
- SocialLinks: удалены обе scale(26) заливки, вложенные hover-переменные и inline custom property; четыре брендовых примитива добавлены только на #hop-landing. SVG, каналы, подписи, ссылки и QR сохранены.

По первому обзору root QR-disclosure по умолчанию закрыт, summary доступен на desktop, размер кода ограничен 256px. Conversion отдельно убрал принудительное раскрытие через JS. Единственная последующая правка после технического checkpoint: summary получил aria-label «QR-код {канал}», чтобы различать каналы с assistive technology. Нативное переключение и ссылки не менялись; targeted Prettier PASS. Production content после этой правки стабилен.

Промежуточная проверка исполнителя: targeted Prettier PASS; Sass успешно скомпилирован в памяти, все compiled selectors изолированы #hop-landing; вложенных social-переменных нет; scale(26)/--lr-social-hover/inline social variables в активном коде нет. Данные и маршруты не менялись; четыре SHA совпадают напрямую, laptop-service совпадает с baseline после обратной подстановки только двух ранее разрешённых process-строк в памяти. Общая сборка/Node-тесты и новые браузерные кадры на этом шаге не выполнялись исполнителем.

Независимый checkpoint foundations: npm run quality PASS, 56 страниц, 0 errors / 0 warnings / прежний hint; Node-тесты после build 13/13 PASS. В compiled production main нет вложенных переменных и неограниченных selectors. Данные отличаются от baseline только двумя ранее разрешёнными process.text.

Desktop-обзор root: отзывы и источники, гарантия и директор, компактные адреса с details остальных 18 точек, симптомы без overlay, SEO в двух колонках и FAQ просмотрены. Сохранён порядок 19 секций; на странице 8 QR-disclosure, изначально открытых 0. Mobile/интерактивная приёмка root: на 390px просмотрены адреса, SEO и FAQ, overflow отсутствует; Enter раскрыл 18 дополнительных адресов, все 24 .lr-workshop-card реально видимы, фото ровно одно. Space открыл читаемый FAQ-ответ. Это не подтверждение полного screen reader-аудита.

Последующая разрешённая copy-правка: в src/data/laptop-service.json → faq.items[0].text, вопрос «Можно узнать стоимость по телефону?», удалено только слово «бесплатной» из фразы «после бесплатной диагностики ДО начала работ». Теперь «после диагностики ДО начала работ»: точная смета не обещает бесплатность любого выездного формата. Следующий FAQ сохраняет объяснение обычной бесплатной диагностики именно в мастерской. Цена/услуга не изменены. Targeted Prettier PASS.

Это третье допустимое copy-поле относительно baseline после process.items[0].text и process.items[2].text. Проверка в памяти: обратная подстановка ровно этих трёх строк восстановила SHA-256 всего baseline laptop-service.json; остальные четыре source hashes совпадают напрямую. Baseline не перезаписан. После этой правки production content стабилен и дальше исполнителем не меняется.

Template-пакет и завершающая миграция общих Benefits/RepairTimeline приняты по финальным доказательствам. DS-01–27 и DS-29–31 verified. DS-28 остаётся in progress: настоящее увеличение до 200% и полный NVDA/VoiceOver не подтверждены. DS-32 verified: четыре документа синхронизированы, targeted Prettier и проверка всех локальных ссылок пройдены. Прежние checkpoint ниже сохраняются как история; фактический итог последней версии приведён в начале журнала.

Предварительные наблюдения root по этапу 5:

- Packard Bell: 1440/390; HP: 1440. Просмотр положительный, точные H1 и canonical сохранены, горизонтального overflow нет. Это выборка, не ручной просмотр всех брендовых страниц.
- Залитие: 390. Предупреждение видно после lead и до CTA, в visible text встречается ровно один раз; вторичное действие ведёт к #lr-first-aid.
- MacBook/premium-контекст и технический checkpoint получены ниже; повторный performance-замер ожидается после локальных шрифтов.
- 200% через OSTextScale повторены даже с mobile:true: размеры/высоты H1 и lead не изменились, режим сброшен. Browser zoom остаётся 1. Это не PASS увеличения текста.
- Реальные NVDA/VoiceOver, доставка заявки и field INP не проверены.

Следующие результаты записываются с DS-ID, фактической командой или браузерным сценарием и ограничениями.

## Приёмка template-пакета и технический checkpoint перед локальными шрифтами

Root проверил фактическую выборку:

| Маршрут / семейство | Размеры  | Наблюдение                                                                                 |
| ------------------- | -------- | ------------------------------------------------------------------------------------------ |
| Packard Bell        | 1440/390 | Точный H1 и canonical сохранены, overflow отсутствует                                      |
| HP                  | 1440     | Положительный desktop-просмотр, точный H1/canonical                                        |
| Acer                | 390      | Пять уникальных FAQ, Space открывает полный исходный ответ                                 |
| Залитие             | 1440/390 | Предупреждение видно после lead до CTA ровно один раз; вторичный CTA ведёт к #lr-first-aid |
| Нет включения       | 390      | Проверен собственный сценарий неисправности                                                |
| MacBook             | 1440/390 | Сохранены прайс, article и досье; premium сохраняется при выборе workshop                  |

MacBook mobile-навигация сокращена до native details: на 390 закрытый summary 44px, Space раскрывает семь исходных ссылок; на 1440 семь ссылок открыты. На 320 обнаруженный реальный overflow 13px у dossier CTA исправлен без overflow:hidden. Итоговый [browser-layout-320.json](../../artifacts/design-system-v2/final/browser-layout-320.json) содержит четыре семейства: главная, Packard Bell, залитие, MacBook; у каждого innerWidth 320, clientWidth/scrollWidth 305, overflow false, один H1.

QR-disclosure имеет уникальные доступные имена; Space открывает только VK и повторно закрывает его. На главной восемь QR, по умолчанию открытых ноль. Console warn/error в пройденных root-сценариях: пустой список. Это наблюдение ограничено пройденными сценариями, не всей возможной работой сайта.

Независимая техническая проверка foundations после MacBook CTA-исправления:

- npm run quality: exit 0, Astro 74 файла, **0 errors / 0 warnings / 0 hints**, Prettier PASS, static build 56 страниц, завершение 15:26:09 Europe/Moscow. [quality.log](../../artifacts/design-system-v2/final/quality.log).
- Затем node --test tests/*.test.mjs: exit 0, **14/14 PASS**, 0 FAIL/skipped. [tests.log](../../artifacts/design-system-v2/final/tests.log).
- Снимок 101 исходного файла: только ожидаемая CSS-правка MacBook dossier CTA относительно предыдущего stable-снимка; production CSS: **0 unscoped selectors / 0 nested custom properties**. Четыре data hashes без изменений, laptop-service отличается только тремя разрешёнными copy-полями. [source-audit.log](../../artifacts/design-system-v2/final/source-audit.log), [source-files-sha256.log](../../artifacts/design-system-v2/final/source-files-sha256.log).
- Generated-output audit: **51 production-маршрут**, 49 уникальных detail H1/Service JSON-LD, по одному H1/root, правильные canonical, **104 формы** с 11 именованными полями каждая, **2712 локальных media references**, пять noindex-preview, три CSS-bundle / 1434 scoped rules, 0 failures. Autoplay-helper hooks в production: 0. [dist-audit.log](../../artifacts/design-system-v2/final/dist-audit.log).

Сводка: [technical-summary.log](../../artifacts/design-system-v2/final/technical-summary.log). Это checkpoint до последующего локального переноса шрифтов. После изменения font-delivery нужна новая проверка последней версии; этот запуск не выдаётся за неё.

Сохранённые изображения: [главная 1440](../../artifacts/design-system-v2/final/home-1440.png), [главная 390](../../artifacts/design-system-v2/final/home-390.png), [hero 768 checkpoint](../../artifacts/design-system-v2/checkpoint/hero-768.png), [процесс 1440](../../artifacts/design-system-v2/checkpoint/process-1440.png), [квиз 390](../../artifacts/design-system-v2/checkpoint/quiz-modal-390.png), [ошибки формы 390](../../artifacts/design-system-v2/checkpoint/form-error-390.png), [no-JS цена](../../artifacts/design-system-v2/checkpoint/no-js-price-390.png), [no-JS формат](../../artifacts/design-system-v2/checkpoint/no-js-format-390.png). Для остальных перечисленных ручных просмотров отдельный сохранённый скриншот здесь не заявляется.

## История DS-29: baseline и переход к локальным шрифтам

[performance-baseline.json](../../artifacts/design-system-v2/final/performance-baseline.json) — лабораторный baseline production preview http://127.0.0.1:4324/ после редизайна, до локальных шрифтов. Lighthouse 13.5.0, Chrome 156.0.8078.73, performance-only, отдельный headless Chrome с временным чистым профилем на запуск; IAB/user profile не используется. В статистике три валидных mobile и три desktop-прогона, throttling-method simulate; browser/storage cold, OS/DNS/CDN caches не контролировались. Дополнительный служебный прогон в медианы не входит. Точные команды и профили сохранены в JSON.

| Профиль | Simulated LCP: медиана (диапазон) | CLS: медиана | TBT: медиана |
| ------- | --------------------------------- | ------------ | ------------ |
| Mobile  | 2,942s (1,832–3,013s)             | 0            | 27,5ms       |
| Desktop | 0,588s (0,586–0,939s)             | 0,00015      | 0ms          |

Mobile LCP превышает внутреннюю цель 2,5s. Соблюдение этого бюджета пока не подтверждено. Trace связывает задержку с внешним Google Fonts CSS и цепочкой CSS→WOFF2: отмечены render-blocking CSS около 921ms и задержка рендера LCP-текста около 1331ms. На этом этапе начат предусмотренный планом перенос той же Golos Text на локальные WOFF2 с официальной OFL. Перенос и завершающая компонентная очистка впоследствии выполнены; актуальный результат — performance-final.json и итоговый раздел в начале журнала, не промежуточный after-font срез.

Это simulated lab LCP/CLS и диагностический TBT, не field Core Web Vitals и не INP. Отдельный PerformanceTimeline в доступном raw CDP интерфейсе не поддержан; Network/Performance.getMetrics дают другие показатели и не подменяют LCP/CLS.

## Готовность к финальной приёмке

Таблица фиксирует последнюю стабильную версию после локальных шрифтов и очистки общих компонентов. Неподтверждённые поверхности сохранены отдельно; не все пункты полной доступностной приёмки закрыты.

| Финальное доказательство                        | Статус   | Фактический объём                                                                                                                                                 |
| ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Бренды, проблемы и MacBook                      | verified | 49 detail-маршрутов статически; браузерная выборка Packard Bell/HP/Acer/залитие/нет включения/MacBook, без заявления о ручном просмотре всех страниц              |
| Последний npm run quality                       | verified | 74 файла: 0 errors / 0 warnings / 0 hints; Prettier PASS; 56 страниц, build 16:21:47                                                                              |
| Node-тесты после build                          | verified | 14/14 PASS; выполнялись после завершения последней сборки                                                                                                         |
| Маршруты, SEO и данные                          | verified | 51 production route, 49 detail H1/Service JSON-LD, 104 формы; исходные данные отличаются ровно тремя разрешёнными copy-полями                                     |
| Render 1440px                                   | verified | Главная и перечисленные представители; финальный home-1440.png и shared-component проверка                                                                        |
| Render 768px                                    | verified | Hero/price checkpoint и финальная computed-проверка shared Benefits/Timeline: две колонки, scroll===client. Ручной просмотр всех семейств на tablet не заявляется |
| Render 390px                                    | verified | Главная и перечисленная template-выборка; контекст/формы/квиз/details/FAQ; финальный home-390.png                                                                 |
| Reflow 320px                                    | verified | Четыре семейства в browser-layout-320.json; финальные shared-компоненты также без overflow, одна колонка                                                          |
| Взаимодействия                                  | verified | Подтверждённые root/test сценарии format/price/context/phone/visit/quiz/modal/details/FAQ/reviews/QR/reduced-motion; границы описаны в итоговом разделе           |
| Local lab performance и ресурсы                 | verified | Финальные три mobile + три desktop; LCP/CLS цели соблюдены в этих шести прогонах, TBT отдельно; field INP не измерен                                              |
| Настоящий 200% browser zoom / увеличение текста | pending  | Не подтверждено: browser zoom остался 1, OSTextScale не изменил computed font, режимы сброшены. DS-28 остаётся in progress                                        |
| Полный NVDA/VoiceOver                           | pending  | Полный screen-reader сценарий не выполнен; DOM/ARIA/клавиатура не объявляются его заменой. DS-28 остаётся in progress                                             |
| Реальная доставка заявки и field INP            | pending  | Внешняя доставка без backend-проверки и полевые показатели не подтверждены; лабораторный TBT не равен INP                                                         |

### Что синхронизировать после финальных фактов

1. В документе 32 заменить устаревшее вступление «основные страницы ещё не переделаны» и таблицу «Ещё не реализовано» фактическим охватом production. Не менять утверждённую визуальную идею.
2. В документе 32 актуализировать статус примитивов, совместимые aliases, четыре функциональных social-цвета и фактические роли контейнера/типографики/радиусов. Значения сверить с последним кодом, а не с ранним макетом.
3. В документе 32 уточнить разделы о передаче формата/симптома в форму: рабочая production-связь уже проверена, исторические preview не следует автоматически считать интегрированными формами.
4. В документе 32 отразить нативные закрытые QR-disclosure, доступные имена каналов, локальные исключения и границы проверенной доступности/производительности. Целевые бюджеты не заменять выдуманными измерениями.
5. Документ 33 сохранить как план с исходной точкой: заменить вводное описание «в текущей задаче создаётся спецификация» ссылкой на фактический журнал 34; таблицу исходных разрывов подписать как состояние до внедрения.
6. В документе 02 сохранить историческую палитру и ссылки на 32/33/34, но после подтверждения миграции убрать устаревшее утверждение, что основные страницы ещё не мигрированы. Историческое тело не переписывать под новый результат.
7. В документе 34 собрать единый итог: точные команды и их порядок, маршруты/семейства, размеры и ссылки на реально существующие кадры, взаимодействия, три copy-поля, принятые исключения и ограничения. Закрывать DS-23–32 только по переданным доказательствам.
8. Выполнить targeted Prettier изменённых документов и проверить их локальные ссылки. Не менять production ради финального текста; при последующей кодовой правке предыдущая сборка не выдаётся за последнюю.

### Разрешённые copy-отличия для итоговой сверки

| Поле laptop-service.json | Изменение                                                                                                  | Основание                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| process.items[0].text    | Вместо обещания «За 2 минуты определим вероятную причину» — уточнение модели, симптомов и удобного формата | Консультация не имитирует дистанционный диагноз и не даёт необоснованного срока |
| process.items[2].text    | Согласование работ/запчастей/сметы; обычная диагностика именно в мастерской бесплатна даже при отказе      | Различить условия диагностики и не распространить их на любой выезд             |
| faq.items[0].text        | Удалено только слово «бесплатной» из фразы о согласовании сметы после диагностики                          | Следующий FAQ отдельно объясняет бесплатную обычную диагностику в мастерской    |

Цены, работы, отзывы, адреса, даты источников, service-pages.json и service-pages.ts сохраняются. Исходный source-hashes.json остаётся baseline; его нельзя перезаписывать, чтобы искусственно получить зелёную сверку.

## Завершающая проверка документации

Документы 02/32/33/34 синхронизированы после финального GO без production-правок. Targeted Prettier PASS; проверены 52 локальные ссылки на существующие документы, лицензию, изображения и отчёты — отсутствующих нет. Документ 32 содержит актуальное имя LR Golos Text, происхождение/OFL/preload и последний performance-срез; 33 явно хранит исходный план со ссылкой на этот журнал; 02 остаётся исторической палитрой. DS-32 verified.

Последние figures: mobile LCP 2,182s / CLS 0 / TBT 212ms; desktop LCP 0,495s / CLS 0 / TBT 0. Промежуточные after-font цифры не подменяют финальные. DS-28 остаётся in progress; все пункты полной доступностной приёмки не объявлены закрытыми.
