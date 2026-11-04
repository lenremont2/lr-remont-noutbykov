import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const evidence = "artifacts/landings-review-2026-11-03/approved";
mkdirSync(evidence, { recursive: true });
if (!existsSync(`${evidence}/baseline.html`)) writeFileSync(`${evidence}/baseline.html`, readFileSync("dist/index.html"));
const update = (file, transform) => writeFileSync(file, transform(readFileSync(file, "utf8")));
update("src/components/sections/BusinessTrust.astro", (s) => s.replace('class="lr-section lr-business-trust"', 'class:list={["lr-section lr-business-trust", {"lr-business-trust--reference": businessOnly}]}').replace('    <SectionHeading', `    {businessOnly ? (
      <article class="lr-business-card">
        <p class="lr-business-card__eyebrow">Корпоративное обслуживание в СПб и ЛО</p>
        <h2 id="lr-business-trust-title">Ремонт ноутбуков и компьютерного парка для бизнеса</h2>
        <p class="lr-business-card__lead">{home.business.lead}</p>
        <ul class="lr-business-card__terms">{home.business.items.map((item) => <li><h3>{item.title}</h3><p>{item.text}</p></li>)}</ul>
        <div class="lr-business-card__actions"><LeadButton label="Получить КП и счёт" source="business-trust" /><a class="lr-button lr-business-card__phone" href="tel:+78126404804">B2B-отдел: (812) 640-48-04</a></div>
      </article>
    ) : (<>
    <SectionHeading`).replace('  </div>\n</section>', '    </>)}\n  </div>\n</section>').replace('  </div>\r\n</section>', '    </>)}\r\n  </div>\r\n</section>'));
update("src/components/sections/DirectorMessage.astro", (s) => s.replace('const paragraphs =', 'interface Props { compact?: boolean; }\nconst { compact = false } = Astro.props;\nconst paragraphs =').replace('<section\n', `{compact ? (
<section id="lr-director" class="lr-director--compact" aria-labelledby="lr-director-title">
  <div class="lr-director--compact__heading">
    <img src="/media/director-sorokin-320.webp" width="68" height="68" alt="Денис Сорокин, директор Ленремонта" loading="lazy" />
    <div><p>Директор компании «Ленремонт»</p><h3 id="lr-director-title">Денис Сорокин: «{home.director.title}»</h3></div>
  </div>
  <blockquote>{home.director.quote}</blockquote>
  <LeadButton label="Обсудить ремонт ноутбука" source="director" />
</section>
) : (
<section\n`).replace(/<\/section>\s*$/, '</section>\n)}\n'));
update("src/components/sections/HomeProtection.astro", (s) => s.replace('<DirectorMessage />', '<DirectorMessage compact />'));
writeFileSync("src/components/sections/WorkshopGallery.astro", `---
import SectionHeading from "../ui/SectionHeading.astro";
import home from "../../data/home-copy.json";
const photos = ["soldering", "diagnostics", "parts", "testing"];
---
<section id="lr-workshop-gallery" class="lr-section lr-equipment-reference" data-lr-swipe-slider>
  <div class="lr-container">
    <div class="lr-equipment-reference__header">
      <SectionHeading title={home.equipment.title} lead={home.equipment.lead} eyebrow="Стационарная лабораторная база" />
      <div class="lr-slider-actions"><button type="button" data-lr-review-prev aria-label="Предыдущая рабочая зона">←</button><button type="button" data-lr-review-next aria-label="Следующая рабочая зона">→</button></div>
    </div>
    <div class="lr-equipment-reference__track" data-lr-swipe-track tabindex="0" role="region" aria-label="Оборудование и рабочие зоны" aria-roledescription="карусель">
      {home.equipment.items.map((item, index) => <article class="lr-equipment-reference__card">
        <a href={"/media/workshop-v4-" + photos[index] + "-1280.webp"} data-lr-photo-open aria-label={"Увеличить фото: " + item.title}>
          <img src={"/media/workshop-v4-" + photos[index] + "-1280.webp"} alt={item.title} width="1280" height="720" loading="lazy" decoding="async" />
        </a>
        <div><h3>{item.title}</h3><p>{item.text}</p></div>
      </article>)}
    </div>
  </div>
</section>
`);
