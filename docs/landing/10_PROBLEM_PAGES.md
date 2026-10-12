# Страницы поломок: польза, рекомендации и изображения

10 октября 2026. Доработаны шесть страниц: отсутствие включения, перегрев, залитие, экран, зарядка и медленная работа/сбой загрузки.

## Подача страницы

Обновлено 12 октября 2026 года: компактный Hero с небольшим изображением на широком экране. Далее — одна статья с оглавлением: возможные причины, предупреждение перед самостоятельными действиями, безопасные проверки, выбор следующего шага и подготовка к обращению. Содержание индивидуально для каждой из шести неисправностей. На мобильном изображение и повторяющиеся условия Hero скрыты, чтобы быстрее перейти к рекомендациям. Оглавление отображается справа на широком экране; на телефоне к первым действиям ведёт ссылка в Hero.

После статьи идут способы передачи ноутбука, тематический прайс, гарантия, существующие отзывы, FAQ и перелинковка. Завершает страницу существующая форма обращения, которая обеспечивает также модальное окно и мобильную панель. Отдельного блока адресов на этих страницах нет: все три способа передачи открывают подходящий сценарий консультации через общий LeadButton. Цены и диагностика доступны без заявки.

Суммы, условия гарантии, реальные контакты, маршруты, H1 и SEO не изменены. Простые проверки доступны без формы. При жидкости, повреждении кабеля, вздутии или запахе гари не предлагаются повторные включения. Не предлагаются универсальный сброс питания, самостоятельная разборка, переустановка без обсуждения данных или покупка деталей по симптому.

## Источники рекомендаций

Использованы рекомендации производителей; общие действия адаптированы для неспециалиста. Конкретные процедуры зависят от модели, поэтому вместо комбинаций клавиш и времени удержания кнопок дана безопасная проверка снаружи. Рекомендации о передаче устройства и согласовании ремонта — редакционные решения на основе условий компании.

- [Dell: различия отсутствия питания, запуска и изображения](https://www.dell.com/support/kbdoc/en-us/000125609/resolve-no-power-no-post-no-boot-or-no-video-issues-with-your-dell-computer).
- [Dell: экран и внешний монитор](https://www.dell.com/support/kbdoc/en-us/000134946/how-to-troubleshoot-display-or-video-issues-on-dell-laptop-lcd-panel).
- [Dell: электробезопасность и действия после жидкости](https://www.dell.com/support/kbdoc/en-us/000137973/safety-precautions-when-working-with-electrical-equipment).
- [HP: вентиляция и снижение перегрева](https://support.hp.com/ee-en/document/ish_3894569-1692683-16).
- [HP: вздутие аккумулятора](https://support.hp.com/in-en/document/ish_4158581-4158704-16).
- [Microsoft: интеллектуальная зарядка](https://support.microsoft.com/en-us/windows/experience/power-battery/use-smart-charging-in-windows).
- [Microsoft: причины медленной работы Windows](https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows).
- [iFixit: после попадания жидкости](https://www.ifixit.com/News/41383/ask-ifixit-i-spilled-liquid-on-my-laptop-now-what).

## Изображения и промпты

Созданы встроенным imagegen: шесть отдельных вызовов, без входных изображений. Это сгенерированные иллюстрации в фотографическом стиле, а не реальные заказы или фотографии помещений компании. Оригиналы PNG сохраняются в каталоге Codex. Финальные локальные WebP: 1152 × 768, качество 82. Старые изображения карточек главной сохранены.

Общая часть каждого промпта:

```text
Use case: photorealistic-natural. Asset type: landscape 3:2 hero photograph for a Russian laptop fault repair page. Generate one photorealistic editorial photograph, 1536x1024 landscape composition, not a collage. Consistent series art direction: warm light-gray antistatic repair mat, softly blurred premium independent workshop background, natural daylight from left, graphite and silver hardware, warm ivory neutral palette with a tiny amber tool accent, plausible real materials and hardware details. Center the subject with breathing room and make the specific fault easily recognizable, not merely a generic laptop. This is a staged illustrative scene, never a completed repair or actual customer order. No company signs, no laptop manufacturer marks, no person face, no captions, no watermarks, no printed headings, no dramatic effects. Scene:
```

- `public/media/problem-no-power-hero.webp`: Notebook power failure illustration: a graphite notebook open at 110 degrees, completely black unlit display, a single technician fingertip pressing the dedicated round power button, disconnected AC adapter resting nearby, realistic keyboard and hands, no glowing LEDs.

- `public/media/problem-overheating-hero.webp`: Notebook cooling inspection illustration: notebook turned upside down with bottom cover already removed by a professional, sharply visible cooling fan with modest realistic dust lint and copper heat pipes, technician's one gloved hand using a soft small brush near the fan, close technical photograph. No smoke, no sparks, no fire.

- `public/media/problem-liquid-hero.webp`: Liquid-spill notebook illustration: an open graphite laptop with black unlit screen, tipped-over plain ceramic coffee cup next to it, realistic small coffee puddle flowing from the cup to a few keyboard keys, disconnected charging plug clearly visible at side. No hands, no powered-on screen, no sparks or excessive flooding.

- `public/media/problem-screen-hero.webp`: Damaged display notebook illustration: graphite laptop open at 110 degrees, realistic LCD spider crack in one corner and thin vertical color lines on an otherwise dark display, keyboard intact, three-quarter front view, a monitor cable lying unplugged nearby. No broken glass shards, no dramatic effects.

- `public/media/problem-charging-hero.webp`: Charging-fault notebook illustration: close three-quarter view of the side of a silver notebook on the mat, keyboard corner and part of black unlit display visible, loose barrel charging connector with visibly bent outer sleeve next to its port, tiny scuff at port, a gloved technician hand holds the disconnected plug carefully. No live electrical testing, no sparks, no melted components.

- `public/media/problem-slow-hero.webp`: Slow-start notebook illustration: open graphite laptop showing a plain small circular loading indicator on neutral slate-gray screen, no UI text or branded OS, compact external backup drive connected next to laptop, precision tools blurred in background. Calm three-quarter front view, no invented software interface.

## Проверки

Обязательные команды: `npm run quality`, `node tests/landing.test.mjs`, `node tests/service-pages.test.mjs`. Новые тесты проверяют отдельные изображения, предупреждения, инструкции, рекомендации, тему обращения и порядок блоков перед прайсом. Браузерная проверка выполняется на 360, 390, 768, 1280 и 1440 px. Рост конверсии требует отдельного измерения после публикации; редактирование текста не заменяет эксперимент.
