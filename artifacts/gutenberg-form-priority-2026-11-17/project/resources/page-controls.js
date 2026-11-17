// Page-owned enhancement of editable controls; the WordPress plugin stays unchanged.
export function initializePageControls(root) {
  for (const placeholder of [root, ...root.querySelectorAll("[data-ui]")]) {
    const encoded = placeholder.getAttribute("data-ui");
    if (!encoded?.startsWith('{"lenremontPage":1,')) continue;
    const settings = JSON.parse(encoded);
    let target = placeholder;
    if (settings.kind === "select") {
      target = document.createElement("select");
      for (const { name, value } of placeholder.attributes)
        if (name !== "data-ui" && name !== "role")
          target.setAttribute(name, value);
      for (const item of placeholder.querySelectorAll('[role="option"]')) {
        const option = new Option(
          item.textContent,
          item.getAttribute("data-name"),
          false,
          item.getAttribute("aria-selected") === "true",
        );
        for (const { name, value } of item.attributes)
          if (!["data-name", "role", "aria-selected"].includes(name))
            option.setAttribute(name, value);
        target.add(option);
      }
      target.classList.remove("lr-gutenberg-select");
      placeholder.replaceWith(target);
    } else if (settings.kind === "video") {
      const figure = placeholder.querySelector("figure");
      target = figure.querySelector("video");
      for (const name of figure.classList)
        if (!name.startsWith("wp-block-")) target.classList.add(name);
      placeholder.replaceWith(target);
    } else if (settings.kind === "time") {
      target = document.createElement("time");
      for (const { name, value } of placeholder.attributes)
        target.setAttribute(name, value);
      target.append(...placeholder.childNodes);
      placeholder.replaceWith(target);
    }
    target.setAttribute("data-ui", encoded);
  }
  // Restore metadata after replacing controls so the new option nodes receive it too.
  for (const target of [root, ...root.querySelectorAll("[data-ui]")]) {
    const encoded = target.getAttribute("data-ui");
    if (!encoded?.startsWith('{"lenremontPage":1,')) continue;
    const settings = JSON.parse(encoded);
    for (const [name, value] of Object.entries(settings.attributes)) {
      if (
        !/^(?:data-[a-z0-9-]+|aria-[a-z-]+|id|width|height|srcset|sizes|colspan|rowspan|novalidate|checked|open|datetime)$/.test(
          name,
        ) ||
        typeof value !== "string"
      )
        throw new Error("Invalid page control setting");
      target.setAttribute(name, value);
    }
    target.removeAttribute("data-ui");
  }
}
