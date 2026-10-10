# Страницы брендов и неисправностей

9 октября 2026. Пользователь подтвердил плоские URL .htm. Создаются статические страницы Astro; на WordPress ничего не публикуется. На каждой странице свой единственный #hop-landing.

## Шаблоны и редактирование

- `src/components/templates/BrandLanding.astro` — страницы производителей. Индивидуальные вступление, сценарии проверки, подготовка и FAQ берутся из `src/data/service-pages.json`.
- `src/components/templates/ProblemLanding.astro` — страницы неисправностей. Содержат признаки, действия до обращения, возможные причины, релевантные работы и собственный FAQ.
- `src/pages/[page].astro` — статическая маршрутизация двух наборов; бренд и неисправность не перемножаются в автоматически созданные комбинации.
- `src/pages/remont-macbook-spb.htm.astro` — самостоятельная композиция MacBook. Оба шаблона не используются. Общие контакты, таблица, гарантия и карты переиспользуются.
- `src/data/service-pages.ts` — пути, цены из исходного прайса и структурированные данные.
- `src/styles/sections/_service-pages.scss` — оформление новых страниц внутри #hop-landing.

Чтобы добавить страницу в один из двух шаблонов, заполните объект в соответствующем массиве JSON: slug без расширения, label, h1, title, description, lead и все тематические поля. slug должен быть уникальным. Пустые материалы и подстановка одного названия бренда в одинаковый SEO-текст не подходят. В priceWorks используются точные названия работ из основного прайса.

## Адреса

| Тип                         | URL                                    |
| --------------------------- | -------------------------------------- |
| Acer                        | /remont-noutbukov-acer-spb.htm         |
| ASUS                        | /remont-noutbukov-asus-spb.htm         |
| Dell                        | /remont-noutbukov-dell-spb.htm         |
| HP                          | /remont-noutbukov-hp-spb.htm           |
| Lenovo                      | /remont-noutbukov-lenovo-spb.htm       |
| MSI                         | /remont-noutbukov-msi-spb.htm          |
| Samsung                     | /remont-noutbukov-samsung-spb.htm      |
| Sony VAIO                   | /remont-noutbukov-sony-spb.htm         |
| Toshiba                     | /remont-noutbukov-toshiba-spb.htm      |
| Не включается               | /noutbuk-ne-vklyuchaetsya.htm          |
| Перегрев                    | /noutbuk-peregrevaetsya.htm            |
| Жидкость                    | /remont-noutbuka-posle-zalitiya.htm    |
| Экран                       | /remont-ekrana-noutbuka.htm            |
| Зарядка                     | /noutbuk-ne-zaryazhaetsya.htm          |
| Медленная работа / загрузка | /noutbuk-tormozit-ne-zagruzhaetsya.htm |
| MacBook, отдельная страница | /remont-macbook-spb.htm                |

Главная услуга доступна локально по `/` и `/remont-noutbukov-spb.htm`. Обе версии имеют canonical на существующий адрес основной услуги. Основной Hero сохраняет H2 по предыдущему указанию пользователя; новые страницы имеют H1.

ASUS использует проверенный существующий URL. Официальная ссылка ремонта Mac сейчас ведёт на `/remont-mac/`; новый адрес MacBook относится к этому проекту. Перед переносом в WP требуется сопоставить новые пути с существующими страницами и решить их замену/переадресацию. Redirect-конфигурация здесь не создаётся.

## SEO и валидность

У каждой новой страницы собственные Title, Description, H1 и абсолютный canonical. OG соответствует этим метаданным. Видимые хлебные крошки согласованы с BreadcrumbList. JSON-LD содержит Organization, WebPage и Service; вымышленные оценки, отзывы, наличие деталей и авторизация производителей отсутствуют. JSON сериализуется с экранированием символа `<`.

Навигация работает обычными ссылками; важные тексты и цены выводятся в статический HTML. На главной карточки шести неисправностей и названия производителей ведут на готовые страницы. Страницы также связаны между собой. В прайсе не создаются новые суммы. Формы сохраняют контракт Lead Capture; quiz_service содержит тему текущей страницы. Отправкой по-прежнему управляет обработчик сайта.

Техническая проверка: `npm run quality`, `node tests/landing.test.mjs`, `node tests/service-pages.test.mjs`. Проверяется уникальность SEO, H1, id, JSON-LD, якоря, внутренние маршруты, источник цен, локальные медиа, формы и изоляция CSS. Браузер отдельно подтверждает адаптивность и работу форм. Проверка в Search Console и фактическая индексация возможны после публикации.

## Источники и редакция

Бизнес-факты, контакты и стоимость взяты из утверждённых материалов проекта и `laptop-service.json`. Тематические тексты написаны для этого проекта: они описывают порядок проверки и вопросы клиента, а не статистику поломок бренда, результаты реальных заказов или гарантированное восстановление.

- [Официальная услуга Ленремонта](https://www.lenremont.ru/remont-noutbukov-spb.htm).
- [Существующая услуга ASUS](https://www.lenremont.ru/remont-noutbukov-asus-spb.htm).
- [Текущая услуга Mac](https://www.lenremont.ru/remont-mac/).
- [Apple: как определить модель](https://support.apple.com/ru-ru/102767).
- [Apple: компьютер Mac не включается](https://support.apple.com/ru-ru/102623).
- [Google: полезный контент](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- [Google: заголовки результатов поиска](https://developers.google.com/search/docs/appearance/title-link).
- [Google: canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- [Google: BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

Существующие иллюстрации неисправностей документированы в `07_GENERATED_SYMPTOMS.md`; реальные материалы компании остаются прежними. Фотографии не выдаются за ремонт конкретного бренда или завершённый заказ. MacBook показан имеющимся реальным кадром мобильной мастерской.
