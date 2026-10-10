import content from "./service-pages.json";
import copy from "./laptop-service.json";

export const brands = content.brands;
export const problems = content.problems;
export const macbook = content.macbook;
export type BrandPage = (typeof brands)[number];
export type ProblemPage = (typeof problems)[number];
export const homePath = "/remont-noutbukov-spb.htm";
export const standardPrices = [
  ...copy.prices.tables[0],
  ...copy.prices.tables[1],
];
export const macbookPrices = copy.prices.tables[2];
export const pagePath = (page: { slug: string }) => `/${page.slug}.htm`;

export function getSeo(page: {
  slug: string;
  title: string;
  description: string;
  h1: string;
  label: string;
}) {
  const origin = "https://www.lenremont.ru";
  const canonical = origin + pagePath(page);
  return {
    title: page.title,
    description: page.description,
    canonical,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": origin + "/#organization",
          name: "Ленремонт",
          url: origin + "/",
          telephone: "+78123444444",
        },
        {
          "@type": "WebPage",
          "@id": canonical + "#webpage",
          url: canonical,
          name: page.title,
          description: page.description,
          inLanguage: "ru-RU",
          mainEntity: { "@id": canonical + "#service" },
          breadcrumb: { "@id": canonical + "#breadcrumbs" },
        },
        {
          "@type": "Service",
          "@id": canonical + "#service",
          name: page.h1,
          url: canonical,
          description: page.description,
          provider: { "@id": origin + "/#organization" },
          areaServed: [
            { "@type": "City", name: "Санкт-Петербург" },
            { "@type": "AdministrativeArea", name: "Ленинградская область" },
          ],
        },
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumbs",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Ленремонт",
              item: origin + "/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Ремонт ноутбуков",
              item: origin + homePath,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: page.label,
              item: canonical,
            },
          ],
        },
      ],
    },
  };
}
