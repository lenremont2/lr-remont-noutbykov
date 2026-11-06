const mapOrigin = "https://maps.lenremontn8n.ru";

export function readMapMessage(event, source, token) {
  const data = event.data;
  if (
    event.origin !== mapOrigin ||
    event.source !== source ||
    !token ||
    !data ||
    data.version !== 1 ||
    data.token !== token
  )
    return null;
  if (data.type === "lenremont:map-ready") return { type: "ready" };
  if (data.type === "lenremont:map-height")
    return Number.isInteger(data.height) &&
      data.height >= 300 &&
      data.height <= 1800
      ? { type: "height", height: data.height }
      : null;
  if (data.type !== "lenremont:map-selected") return null;
  const address = data.address;
  if (
    !address ||
    !["search", "pin", "phone"].includes(address.method) ||
    typeof address.label !== "string" ||
    !address.label.trim() ||
    address.label.length > 300
  )
    return null;
  if (
    address.method !== "phone" &&
    (!Number.isFinite(address.lon) ||
      !Number.isFinite(address.lat) ||
      address.lon < 27.4 ||
      address.lon > 35.8 ||
      address.lat < 58.4 ||
      address.lat > 61.4)
  )
    return null;
  return { type: "selected", label: address.label.trim() };
}

export function initializeMaps(root) {
  const home =
    root.querySelector("#lr-map-workshops [data-lr-map-surface]") ||
    root.querySelector('[data-lr-map-slot="workshops"] [data-lr-map-surface]');
  const map = home?.querySelector("#dmap");
  const slots = [...root.querySelectorAll('[data-lr-map-slot="workshops"]')];
  const visible = (element) =>
    Boolean(element?.getClientRects().length) &&
    !element.closest("[hidden],dialog:not([open])");
  const refresh = () => {
    if (!map) return;
    const target =
      [...slots]
        .reverse()
        .find((slot) => visible(slot) && slot.closest("dialog[open]")) ||
      slots.find(
        (slot) => visible(slot) && slot.closest("[data-lr-quiz-location]"),
      ) ||
      home?.closest("[data-lr-map-slot]");
    const surface = target?.querySelector("[data-lr-map-surface]");
    if (surface && map.parentElement !== surface) {
      surface.append(map);
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }
  };
  // The native shortcode owns one map; move it between visible views instead of duplicating its IDs.
  new MutationObserver(refresh).observe(root, {
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "open"],
  });
  refresh();
  if (map) {
    new ResizeObserver(() => window.dispatchEvent(new Event("resize"))).observe(
      map,
    );
    const normalize = (value) =>
      value
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^а-яa-z0-9]/g, "");
    new MutationObserver(() => {
      const address = map.querySelector(".leaflet-popup-content")?.textContent;
      if (!address) return;
      const slot = map.closest("[data-lr-map-slot]");
      const select =
        slot
          .closest("[data-lr-quiz-location-view]")
          ?.querySelector("[data-lr-quiz-workshop]") ||
        slot.querySelector("[data-lr-map-workshop]");
      const option = [...(select?.options || [])].find(
        (option) =>
          option.value &&
          normalize(address).includes(
            normalize(option.dataset.lrWorkshopAddress),
          ),
      );
      if (option && select.value !== option.value) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }).observe(map, { subtree: true, childList: true, characterData: true });
  }
  root.querySelectorAll("[data-lr-address-map]").forEach((host) => {
    const slot = host.closest("[data-lr-map-slot]");
    const status = slot.querySelector("[data-lr-map-status]");
    const retry = slot.querySelector("[data-lr-map-retry]");
    const frame = document.createElement("iframe");
    frame.title = "Выберите адрес на карте";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    host.append(frame);
    let token = "",
      timer,
      started = false;
    const fail = () => {
      clearTimeout(timer);
      frame.hidden = true;
      status.textContent =
        "Карта недоступна. Укажите адрес в поле ниже или повторите загрузку.";
      retry.hidden = false;
    };
    const load = () => {
      started = true;
      clearTimeout(timer);
      token = [...crypto.getRandomValues(new Uint8Array(16))]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
      token = `${token.slice(0, 8)}-${token.slice(8, 12)}-4${token.slice(13, 16)}-a${token.slice(17, 20)}-${token.slice(20)}`;
      frame.hidden = false;
      retry.hidden = true;
      status.textContent = "Загружаем карту…";
      const url = new URL("/embed.html", mapOrigin);
      url.search = new URLSearchParams({
        parent: location.origin,
        token,
        mode: slot.closest("dialog") ? "popup" : "inline",
      });
      frame.src = url.href;
      timer = setTimeout(fail, 12000);
    };
    new ResizeObserver(() => {
      if (!started && visible(slot)) load();
    }).observe(slot);
    retry.addEventListener("click", load);
    frame.addEventListener("error", fail);
    window.addEventListener("message", (event) => {
      const result = readMapMessage(event, frame.contentWindow, token);
      if (!result) return;
      if (result.type === "height") {
        host.closest("[data-lr-map-surface]").style.height =
          `${result.height}px`;
        return;
      }
      clearTimeout(timer);
      if (result.type === "ready") {
        status.textContent =
          "Найдите дом или подвиньте карту под меткой. Подтвердите адрес.";
        return;
      }
      if (!visible(slot)) return;
      const input =
        slot
          .closest("[data-lr-quiz-location-view]")
          ?.querySelector("[data-lr-quiz-address]") ||
        slot.querySelector("[data-lr-map-address]");
      input.value = result.label;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      status.textContent = "Адрес выбран: " + result.label;
    });
  });
}
