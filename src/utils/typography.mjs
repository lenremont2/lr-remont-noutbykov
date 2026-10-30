// Build-time typography for rendered text only. URLs, attributes and code stay intact.
export function typographText(text) {
  if (!/[А-Яа-яЁё₽]/u.test(text)) return text;
  return text
    .replace(/(?<=\d)\s*-\s*(?=\d+\s*(?:мин|час|дн|лет|год|%|₽))/gu, "–")
    .replace(/[ \t\r\n]+(?:--|—|–|-)[ \t\r\n]+/gu, "\u00a0— ")
    .replace(
      /(?<![\p{L}\d])(в|во|к|ко|с|со|у|о|об|от|до|из|за|на|по|не|ни|и|а|но)[ \t\r\n]+(?=[А-Яа-яЁё\d«])/giu,
      "$1\u00a0",
    )
    .replace(/(?<=[А-Яа-яЁё])[ \t]+(?=(?:бы|ли|же)(?![А-Яа-яЁё]))/giu, "\u00a0")
    .replace(
      /(\d)[ \t]+(?=\d{3}(?:[ \u00a0]\d{3})*[ \u00a0]*(?:₽|руб\.))/gu,
      "$1\u00a0",
    )
    .replace(
      /(\d)[ \t]+(?=(?:₽|%|°C|кг|мм|см|м²|м³|мин(?:ут[аы]?)?|час(?:а|ов)?|день|дня|дней|год|года|лет|руб\.)(?![А-Яа-яЁё]))/gu,
      "$1\u00a0",
    )
    .replace(/№[ \t]+(?=\d)/gu, "№\u00a0")
    .replace(
      /(?:&quot;|&#34;)([^&]*[А-Яа-яЁё][^&]*)(?:&quot;|&#34;)/gu,
      "«$1»",
    );
}

export function typographHtml(html) {
  const tags = /<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>/gu;
  const rawTags = new Set([
    "script",
    "style",
    "pre",
    "code",
    "textarea",
    "svg",
    "math",
  ]);
  const rawStack = [];
  let result = "";
  let cursor = 0;
  for (const match of html.matchAll(tags)) {
    const text = html.slice(cursor, match.index);
    result += rawStack.length ? text : typographText(text);
    const tag = match[0];
    result += tag;
    const name = tag.match(/^<\/?([a-z][\w:-]*)/iu)?.[1].toLowerCase();
    if (rawTags.has(name)) {
      if (tag.startsWith("</")) rawStack.pop();
      else if (!tag.endsWith("/>")) rawStack.push(name);
    }
    cursor = match.index + tag.length;
  }
  const tail = html.slice(cursor);
  return result + (rawStack.length ? tail : typographText(tail));
}
