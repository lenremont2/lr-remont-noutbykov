function auditTheme() {
  const rgb = (value) => {
    const channels = value.match(/[\d.]+/g)?.map(Number);
    return channels?.length >= 3
      ? [channels[0], channels[1], channels[2], channels[3] ?? 1]
      : null;
  };
  const mix = (foreground, background) =>
    foreground
      .slice(0, 3)
      .map(
        (value, i) =>
          value * foreground[3] + background[i] * (1 - foreground[3]),
      );
  const luminance = (color) =>
    color
      .map((value) => value / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      )
      .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  const bad = [];
  let checked = 0;
  let complex = 0;
  for (const element of document.querySelectorAll("#hop-landing *")) {
    if (
      !Array.from(element.childNodes).some(
        (node) => node.nodeType === 3 && node.textContent.trim(),
      ) ||
      element.closest(
        '[hidden],[aria-hidden="true"],.lr-visually-hidden,button:disabled',
      ) ||
      !element.checkVisibility({ checkOpacity: true })
    )
      continue;
    const style = getComputedStyle(element);
    let background = [255, 255, 255];
    let image = false;
    const ancestors = [];
    for (let parent = element; parent; parent = parent.parentElement)
      ancestors.unshift(parent);
    for (const parent of ancestors) {
      const parentStyle = getComputedStyle(parent);
      const color = rgb(parentStyle.backgroundColor);
      if (color) background = mix(color, background);
      if (parentStyle.backgroundImage !== "none") image = true;
    }
    if (image) {
      complex += 1;
      continue;
    }
    const foreground = rgb(style.color);
    if (!foreground) continue;
    const foregroundLuminance = luminance(mix(foreground, background));
    const backgroundLuminance = luminance(background);
    const ratio =
      (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    const threshold =
      parseFloat(style.fontSize) >= 24 ||
      (parseFloat(style.fontSize) >= 18.666 && Number(style.fontWeight) >= 700)
        ? 3
        : 4.5;
    checked += 1;
    if (ratio + 0.01 < threshold)
      bad.push({
        tag: element.tagName,
        cls: element.className?.baseVal ?? element.className,
        text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 90),
        ratio: +ratio.toFixed(2),
        threshold,
        foreground: style.color,
        background,
      });
  }
  const root = document.querySelector("#hop-landing");
  const button = root.querySelector("[data-lr-theme-switch]");
  const rect = button?.getBoundingClientRect();
  return {
    width: innerWidth,
    overflow: document.documentElement.scrollWidth > innerWidth,
    theme: document.documentElement.hasAttribute("data-wp-dark-mode-active")
      ? "dark"
      : "light",
    background: getComputedStyle(root).backgroundColor,
    checked,
    complex,
    bad,
    switch: button
      ? {
          checked: button.getAttribute("aria-checked"),
          width: rect.width,
          height: rect.height,
          right: innerWidth - rect.right,
          bottom: innerHeight - rect.bottom,
        }
      : null,
  };
}
