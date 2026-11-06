import { initializeMaps } from "./maps.js";

export function formatPhone(value) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return value === "+" ? "+7" : "";
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  else if (!digits.startsWith("7")) digits = "7" + digits;
  digits = digits.slice(0, 11);
  let phone = "+7";
  if (digits.length > 1) phone += " (" + digits.slice(1, 4);
  if (digits.length >= 4) phone += ")";
  if (digits.length > 4) phone += " " + digits.slice(4, 7);
  if (digits.length > 7) phone += "-" + digits.slice(7, 9);
  if (digits.length > 9) phone += "-" + digits.slice(9, 11);
  return phone;
}

export function validatePhone(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits[0] === "8") digits = "7" + digits.slice(1);
  let error = "";
  if (!value.trim())
    error = "Укажите номер телефона, чтобы мы могли связаться с вами.";
  else if (/[^+0-9\s()-]/.test(value)) error = "Проверьте номер телефона.";
  else if (digits.length < 11)
    error = "Проверьте номер телефона: не хватает цифр.";
  else if (!/^7[0-9]{10}$/.test(digits) || /^(\d)\1{9}$/.test(digits.slice(1)))
    error = "Проверьте номер телефона.";
  return { value: "+" + digits, error };
}

export function initializePhoneMask(root) {
  root.addEventListener("beforeinput", (event) => {
    const phone = event.target;
    if (!phone.matches("[data-lr-phone]") || phone.readOnly) return;
    const { selectionStart: start, selectionEnd: end } = phone;
    if (start === null || start !== end) return;
    // Delete the adjacent digit together with mask separators.
    if (event.inputType === "deleteContentBackward") {
      const match = phone.value.slice(0, start).match(/\d\D*$/);
      if (match) phone.setSelectionRange(start - match[0].length, start);
    } else if (event.inputType === "deleteContentForward") {
      const match = phone.value.slice(start).match(/^\D*\d/);
      if (match) phone.setSelectionRange(start, start + match[0].length);
    }
  });
  root.addEventListener("input", (event) => {
    const phone = event.target;
    if (!phone.matches("[data-lr-phone]")) return;
    const trailingDigits = phone.value
      .slice(phone.selectionStart ?? phone.value.length)
      .replace(/\D/g, "").length;
    phone.value =
      event.inputType?.startsWith("delete") && phone.value === "+"
        ? ""
        : formatPhone(phone.value);
    let cursor = phone.value.length;
    let remaining = trailingDigits;
    while (cursor > 0 && remaining > 0) {
      cursor -= 1;
      if (/\d/.test(phone.value[cursor])) remaining -= 1;
    }
    phone.setSelectionRange(cursor, cursor);
  });
}

export function initializeReviewSlider(slider) {
  const swipe = slider.hasAttribute?.("data-lr-swipe-slider");
  const track =
    slider.querySelector("[data-lr-review-track]") ||
    slider.querySelector("[data-lr-swipe-track]");
  const frame = slider.querySelector("[data-lr-review-frame]") || track;
  const cards = Array.from(track.children);
  if (!cards.length) return;
  const previous = slider.querySelector("[data-lr-review-prev]");
  const next = slider.querySelector("[data-lr-review-next]");
  const position = slider.querySelector("[data-lr-review-position]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let animation;
  let destination = null;
  const metrics = () => {
    const step =
      cards.length > 1
        ? cards[1].offsetLeft - cards[0].offsetLeft
        : cards[0].offsetWidth;
    const visible = Math.max(1, Math.round((frame.clientWidth - 32) / step));
    const currentLeft = destination ?? track.scrollLeft;
    const start = Math.max(
      0,
      Math.min(cards.length - visible, Math.round(currentLeft / step)),
    );
    return { step, visible, start, end: track.scrollWidth - track.clientWidth };
  };
  const update = () => {
    if (swipe) return;
    const { start, visible, end } = metrics();
    const currentLeft = destination ?? track.scrollLeft;
    if (previous) previous.disabled = currentLeft < 2;
    if (next) next.disabled = currentLeft >= end - 2;
    if (position)
      position.textContent = `${start + 1}–${Math.min(cards.length, start + visible)} / ${cards.length}`;
    cards.forEach((card, index) => {
      const active = index >= start && index < start + visible;
      if (card.dataset.lrReviewActive !== String(active)) {
        card.dataset.lrReviewActive = String(active);
        card.inert = !active;
      }
    });
  };
  const stop = (preserveSnap = false) => {
    if (swipe && destination !== null)
      track.scrollTo({ left: track.scrollLeft, behavior: "instant" });
    cancelAnimationFrame(animation);
    animation = undefined;
    destination = null;
    if (!preserveSnap) delete track.dataset.lrAnimating;
    if (!drag) track.classList?.remove("lr-swipe-track--moving");
  };
  const goTo = (left, instant = false) => {
    stop(true);
    const from = track.scrollLeft;
    const to = Math.min(metrics().end, Math.max(0, left));
    if (swipe) {
      if (!instant && !reducedMotion.matches) destination = to;
      track.scrollTo({
        left: to,
        behavior: instant || reducedMotion.matches ? "instant" : "smooth",
      });
      update();
      return;
    }
    if (instant || reducedMotion.matches || Math.abs(to - from) < 1) {
      track.scrollTo({ left: to, behavior: "instant" });
      delete track.dataset.lrAnimating;
      update();
      return;
    }
    destination = to;
    track.dataset.lrAnimating = "true";
    track.classList?.add("lr-swipe-track--moving");
    update();
    const began = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - began) / 600);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      track.scrollTo({ left: from + (to - from) * eased, behavior: "instant" });
      if (progress < 1) animation = requestAnimationFrame(tick);
      else {
        destination = null;
        animation = undefined;
        delete track.dataset.lrAnimating;
        track.classList?.remove("lr-swipe-track--moving");
        update();
      }
    };
    animation = requestAnimationFrame(tick);
  };
  const move = (direction, instant = false) => {
    const { visible, step } = metrics();
    const start = Math.round((destination ?? track.scrollLeft) / step);
    goTo((start + direction * visible) * step, instant);
  };
  previous?.addEventListener("click", () => move(-1));
  next?.addEventListener("click", () => move(1));
  if (swipe)
    track.addEventListener("scrollend", () => {
      destination = null;
    });
  else track.addEventListener("scroll", update, { passive: true });
  let drag;
  let suppressClick = false;
  if (swipe)
    track.addEventListener(
      "click",
      (event) => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true,
    );
  track.addEventListener("pointerdown", (event) => {
    suppressClick = false;
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      event.target.closest(
        swipe
          ? "button, input, textarea, select, summary, details"
          : "a, button, input, textarea, select, summary, details",
      )
    ) {
      stop();
      return;
    }
    // Disable snap before taking over an in-flight animation.
    track.dataset.lrDragging = "true";
    stop();
    const link = swipe ? event.target.closest("a") : null;
    if (!link) event.preventDefault();
    drag = {
      id: event.pointerId,
      link,
      x: event.clientX,
      left: track.scrollLeft,
      moved: false,
    };
    track.classList?.add("lr-swipe-track--moving");
    if (!link) track.setPointerCapture(event.pointerId);
  });
  const finishDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { id, left: startLeft, moved } = drag;
    drag = undefined;
    if (track.hasPointerCapture(id)) track.releasePointerCapture(id);
    if (moved) suppressClick = true;
    if (!swipe) {
      const { step } = metrics();
      const delta = track.scrollLeft - startLeft;
      const fromIndex = Math.round(startLeft / step);
      let targetIndex = Math.round(track.scrollLeft / step);
      if (moved && targetIndex === fromIndex && Math.abs(delta) >= 36) {
        targetIndex = fromIndex + Math.sign(delta);
      }
      goTo(targetIndex * step);
    }
    delete track.dataset.lrDragging;
    if (destination === null) track.classList?.remove("lr-swipe-track--moving");
  };
  track.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!(event.buttons & 1)) {
      finishDrag(event);
      return;
    }
    const distance = event.clientX - drag.x;
    drag.moved ||= Math.abs(distance) > 5;
    if (drag.moved && !track.hasPointerCapture(event.pointerId))
      track.setPointerCapture(event.pointerId);
    event.preventDefault();
    track.scrollTo({ left: drag.left - distance, behavior: "instant" });
  });
  track.addEventListener("pointerup", finishDrag);
  track.addEventListener("pointerleave", (event) => {
    if (drag?.link && !drag.moved) finishDrag(event);
  });
  track.addEventListener("dragstart", (event) => {
    if (drag?.link) event.preventDefault();
  });
  track.addEventListener("pointercancel", finishDrag);
  track.addEventListener("lostpointercapture", finishDrag);
  track.addEventListener("wheel", () => stop(), { passive: true });
  reducedMotion.addEventListener("change", () => {
    if (destination !== null) {
      const left = destination;
      stop();
      track.scrollTo({ left, behavior: "instant" });
    }
  });
  track.addEventListener("keydown", (event) => {
    if (event.target !== track) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1, true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      goTo(event.key === "Home" ? 0 : track.scrollWidth, true);
    }
  });
  if (typeof ResizeObserver !== "undefined")
    new ResizeObserver(() => {
      stop();
      update();
    }).observe(frame);
  const controls = slider.querySelector("[data-lr-review-controls]");
  if (controls) controls.hidden = false;
  update();
  if (slider.hasAttribute?.("data-lr-auto-swipe"))
    initializeAutoSwipe(
      slider,
      () => {
        const { end, step } = metrics();
        if (track.scrollLeft >= end - 2) goTo(0);
        else goTo(Math.min(end, track.scrollLeft + step));
      },
      () => {
        stop();
        update();
      },
      reducedMotion,
    );
}

export function initializeAutoSwipe(slider, advance, stop, reducedMotion) {
  const track = slider.querySelector("[data-lr-swipe-track]");
  let timer;
  let paused = false;
  let visible = false;
  let hovered = false;
  const schedule = () => {
    clearTimeout(timer);
    if (
      !paused &&
      !hovered &&
      visible &&
      !document.hidden &&
      !reducedMotion.matches
    )
      timer = setTimeout(() => {
        advance();
        schedule();
      }, 4000);
  };
  const pauseByInteraction = () => {
    paused = true;
    stop();
    schedule();
  };
  track.addEventListener("pointerdown", pauseByInteraction, { passive: true });
  track.addEventListener("wheel", pauseByInteraction, { passive: true });
  track.addEventListener("focusin", pauseByInteraction);
  track.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      hovered = true;
      stop();
      schedule();
    }
  });
  track.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      hovered = false;
      schedule();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    schedule();
  });
  reducedMotion.addEventListener("change", () => {
    stop();
    schedule();
  });
  if (typeof IntersectionObserver !== "undefined")
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) stop();
        schedule();
      },
      { threshold: 0.5 },
    ).observe(track);
  schedule();
}

export function initializeRepairQuiz(quiz, updateContext) {
  const steps = Array.from(quiz.querySelectorAll("[data-lr-quiz-step]"));
  const location = quiz.querySelector("[data-lr-quiz-location]");
  const workshop = quiz.querySelector("[data-lr-quiz-workshop]");
  const address = quiz.querySelector("[data-lr-quiz-address]");
  const place = quiz.querySelector("[data-lr-quiz-place]");
  const questions = quiz.querySelector("[data-lr-quiz-questions]");
  const form = quiz.querySelector("[data-lr-form]");
  const previous = quiz.querySelector("[data-lr-quiz-prev]");
  const progress = quiz.querySelector("[data-lr-quiz-progress]");
  const meter = quiz.querySelector("[data-lr-quiz-meter]");
  const hint = quiz.querySelector("[data-lr-quiz-hint]");
  const error = quiz.querySelector("[data-lr-quiz-error]");
  const analysis = quiz.querySelector("[data-lr-quiz-analysis]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let pending = null;
  let current = 0;
  let keyboardChoice = false;
  let locationFormat = "";
  const selectedFormat = () =>
    questions.querySelector('input[name="service_format"]:checked')?.value;
  const route = () =>
    steps.filter(
      (step) => step !== location || selectedFormat() !== "consultation",
    );
  const showLocation = () => {
    const format = selectedFormat();
    const inWorkshop = format === "workshop";
    location
      .querySelectorAll("[data-lr-quiz-location-view]")
      .forEach((view) => {
        view.hidden =
          view.dataset.lrQuizLocationView !==
          (inWorkshop ? "workshops" : "address");
      });
    const title = {
      workshop: "В какую мастерскую вам удобно приехать?",
      "mobile-lab": "Куда приехать мобильной мастерской?",
      "at-home": "Куда приехать мастеру?",
      courier: "Откуда забрать ноутбук?",
    }[format];
    location.querySelector("[data-lr-quiz-location-title]").textContent = title;
    location.querySelector("[data-lr-quiz-address-label]").textContent = title;
    location.querySelector("[data-lr-quiz-place-field]").hidden =
      format === "courier";
    location.querySelector("[data-lr-quiz-location-confirm]").textContent =
      inWorkshop ? "Выбрать мастерскую" : "Подтвердить адрес";
    if (!workshop.value) workshop.value = form.elements.workshop_id.value;
    if (!address.value) address.value = form.elements.visit_address.value;
    if (format !== locationFormat) {
      place.value = format === "mobile-lab" ? "mobile-lab" : "home";
      locationFormat = format;
    }
  };
  const focusStep = (heading) => {
    heading.focus({ preventScroll: true });
    quiz.scrollIntoView({ block: "start", behavior: "instant" });
  };
  const show = (focus = true) => {
    const activeSteps = route();
    const step = activeSteps[current];
    analysis.hidden = true;
    questions.hidden = step === location || step === steps.at(-1);
    hint.hidden = questions.hidden;
    quiz.removeAttribute("aria-busy");
    steps.forEach((item) => {
      item.hidden = item !== step;
    });
    previous.hidden = current === 0;
    progress.textContent = `Шаг ${current + 1} из ${activeSteps.length}`;
    meter.value = current + 1;
    meter.max = activeSteps.length;
    error.textContent = "";
    if (step === location) showLocation();
    if (focus) focusStep(step.querySelector("legend, h3"));
  };
  const finish = () => {
    if (pending === null) return;
    clearTimeout(pending);
    pending = null;
    current = route().length - 1;
    updateContext(form);
    show(
      typeof document === "undefined" || quiz.contains(document.activeElement),
    );
  };
  const forward = () => {
    const activeSteps = route();
    const step = activeSteps[current];
    if (pending !== null || step === steps.at(-1)) return;
    if (step === location) {
      const field = selectedFormat() === "workshop" ? workshop : address;
      if (!field.value.trim()) {
        error.textContent =
          field === workshop
            ? "Выберите мастерскую, в которую привезёте ноутбук."
            : "Укажите населённый пункт, улицу и дом.";
        field.setAttribute("aria-invalid", "true");
        field.focus();
        return;
      }
      field.removeAttribute("aria-invalid");
      form.elements.workshop_id.value = workshop.value;
      form.elements.visit_address.value = address.value.trim();
      form.elements.requested_repair_place.value = place.value;
    } else if (!step.querySelector("input:checked")) {
      error.textContent = "Выберите один из вариантов, чтобы продолжить.";
      step.querySelector("input").focus();
      return;
    }
    for (const name of ["device_category", "symptom", "service_format"]) {
      const input = questions.querySelector(`input[name="${name}"]:checked`);
      if (input) form.elements[name].value = input.value;
    }
    if (current === activeSteps.length - 2) {
      const locationSummary = quiz.querySelector(
        "[data-lr-quiz-location-summary]",
      );
      locationSummary.hidden = selectedFormat() === "consultation";
      quiz.querySelector("[data-lr-quiz-location-label]").textContent =
        selectedFormat() === "workshop" ? "Мастерская" : "Адрес";
      quiz.querySelector("[data-lr-quiz-location-value]").textContent =
        selectedFormat() === "workshop"
          ? workshop.selectedOptions[0].textContent.trim()
          : form.elements.visit_address.value;
      quiz.querySelectorAll("[data-lr-quiz-answer]").forEach((answer) => {
        const input = questions.querySelector(
          `input[name="${answer.dataset.lrQuizAnswer}"]:checked`,
        );
        if (input)
          answer.textContent = input
            .closest("label")
            .querySelector("strong")
            .textContent.trim();
      });
      steps.forEach((step) => {
        step.hidden = true;
      });
      questions.hidden = true;
      hint.hidden = true;
      analysis.hidden = false;
      error.textContent = "";
      quiz.setAttribute("aria-busy", "true");
      progress.textContent = "Ответы выбраны";
      previous.hidden = false;
      pending = setTimeout(
        finish,
        reducedMotion.matches || keyboardChoice ? 0 : 900,
      );
      focusStep(analysis.querySelector("h3"));
      return;
    }
    current += 1;
    show();
  };
  location
    .querySelector("[data-lr-quiz-location-confirm]")
    .addEventListener("click", forward);
  previous.addEventListener("click", () => {
    if (pending !== null) {
      clearTimeout(pending);
      pending = null;
      show();
      return;
    }
    if (current === 0) return;
    current -= 1;
    show();
  });
  questions.addEventListener("submit", (event) => {
    event.preventDefault();
    forward();
  });
  questions.addEventListener("pointerdown", () => {
    keyboardChoice = false;
  });
  questions.addEventListener("keydown", (event) => {
    keyboardChoice = true;
    if (event.key === "Enter") {
      event.preventDefault();
      forward();
    }
  });
  location.addEventListener("pointerdown", () => {
    keyboardChoice = false;
  });
  location.addEventListener("keydown", (event) => {
    keyboardChoice = true;
    if (event.key === "Enter" && event.target === address) {
      event.preventDefault();
      forward();
    }
  });
  questions.addEventListener("click", (event) => {
    if (
      event.target.matches('input[type="radio"]') &&
      event.target.checked &&
      event.target.closest("[data-lr-quiz-step]") === route()[current]
    )
      forward();
  });
  questions.addEventListener("change", (event) => {
    error.textContent = "";
    if (
      event.target.matches('input[type="radio"]') &&
      event.target.closest("[data-lr-quiz-step]") === route()[current]
    )
      forward();
  });
  quiz.querySelector("[data-lr-quiz-toolbar]").hidden = false;
  meter.hidden = false;
  show(false);
}

export function initializeMapModal(root, selectLocation) {
  const dialog = root.querySelector('[data-lr-modal="map"]');
  if (!dialog) return;
  let opener;
  root.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-lr-map-open]");
    if (!trigger || dialog.open) return;
    event.preventDefault();
    opener = trigger;
    const type = trigger.dataset.lrMapOpen;
    const format = trigger.dataset.format;
    dialog.dataset.format = format;
    dialog.dataset.source = trigger.dataset.source;
    dialog.querySelector("[data-lr-modal-title]").textContent = {
      "at-home": "Выберите адрес для выезда мастера",
      "mobile-lab": "Куда приехать мастерской на колёсах?",
      workshop: "Выберите мастерскую",
      courier: "Откуда забрать ноутбук?",
    }[format];
    dialog.querySelectorAll("[data-lr-map-view]").forEach((view) => {
      view.hidden = view.dataset.lrMapView !== type;
    });
    dialog.showModal();
    dialog.scrollTop = 0;
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    opener?.focus({ preventScroll: true });
  });
  dialog.querySelectorAll("[data-lr-map-confirm]").forEach((button) => {
    button.addEventListener("click", () => {
      const slot = button.closest("[data-lr-map-slot]");
      const input = slot.querySelector(
        "[data-lr-map-workshop], [data-lr-map-address]",
      );
      const error = slot.querySelector("[data-lr-map-error]");
      if (!input.value.trim()) {
        error.textContent = "Выберите мастерскую или укажите адрес.";
        input.focus();
        return;
      }
      error.textContent = "";
      dialog.close();
      selectLocation({
        service_format: dialog.dataset.format,
        ...(slot.dataset.lrMapSlot === "workshops"
          ? { workshop_id: input.value }
          : { visit_address: input.value.trim() }),
        requested_repair_place:
          dialog.dataset.format === "mobile-lab" ? "mobile-lab" : "home",
        source: dialog.dataset.source || "map",
      });
    });
  });
  root.addEventListener(
    "wheel",
    (event) => {
      if (dialog.open && event.target === dialog) event.preventDefault();
    },
    { passive: false },
  );
  root.addEventListener(
    "touchmove",
    (event) => {
      if (dialog.open && event.target === dialog) event.preventDefault();
    },
    { passive: false },
  );
}

export function initializeQuizModal(root) {
  const dialog = root.querySelector("[data-lr-quiz-modal]");
  const home = root.querySelector("[data-lr-quiz-home]");
  const quiz = home?.querySelector("[data-lr-quiz]");
  if (!dialog || !quiz || typeof dialog.showModal !== "function") return;
  const slot = dialog.querySelector("[data-lr-quiz-slot]");
  let opener;
  let originalMinHeight;
  const outside = (event) => {
    const box = dialog.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  };
  root.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-lr-quiz-open]");
    if (!trigger || dialog.open) return;
    event.preventDefault();
    opener = trigger;
    originalMinHeight = home.style.minHeight;
    home.style.minHeight = `${home.getBoundingClientRect().height}px`;
    slot.append(quiz);
    dialog.showModal();
    dialog.scrollTop = 0;
    quiz
      .querySelector(
        "[data-lr-quiz-step]:not([hidden]) legend, [data-lr-quiz-step]:not([hidden]) h3, [data-lr-quiz-analysis]:not([hidden]) h3",
      )
      ?.focus({ preventScroll: true });
  });
  dialog.querySelector("[data-lr-quiz-close]").addEventListener("click", () => {
    dialog.close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dialog.close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && outside(event)) dialog.close();
  });
  dialog.addEventListener("close", () => {
    home.append(quiz);
    home.style.minHeight = originalMinHeight;
    opener?.focus({ preventScroll: true });
  });
  root.addEventListener(
    "wheel",
    (event) => {
      if (dialog.open && outside(event)) event.preventDefault();
    },
    { passive: false },
  );
  root.addEventListener(
    "touchmove",
    (event) => {
      if (dialog.open && event.target === dialog) event.preventDefault();
    },
    { passive: false },
  );
}

export function normalizeServiceFormat(value) {
  const aliases = { mobile: "mobile-lab", home: "at-home", center: "workshop" };
  const format = aliases[value] || value;
  return [
    "mobile-lab",
    "at-home",
    "workshop",
    "courier",
    "consultation",
  ].includes(format)
    ? format
    : "consultation";
}

// Only supplied context fields change; phone and visit preferences remain intact.
export function applyLeadContext(form, context) {
  for (const name of [
    "service_format",
    "symptom",
    "device_category",
    "source",
    "workshop_id",
    "visit_address",
    "requested_repair_place",
  ]) {
    if (context[name] === undefined) continue;
    form.elements[name].value =
      name === "service_format"
        ? normalizeServiceFormat(context[name])
        : context[name];
  }
}

export function leadDeviceCategory(element) {
  const category = element?.closest("[data-device-category]")?.dataset
    .deviceCategory;
  return ["standard", "premium"].includes(category) ? category : undefined;
}

export function updateVisitFields(form) {
  const active =
    !form.hasAttribute?.("data-lr-compact-form") &&
    ["mobile-lab", "at-home", "courier"].includes(
      form.elements.service_format.value,
    );
  form.querySelector("[data-lr-visit-fields]").hidden = !active;
  for (const name of ["visit_address", "requested_repair_place"]) {
    const field = form.elements[name];
    const enabled =
      active &&
      (name === "visit_address" ||
        form.elements.service_format.value !== "courier");
    field.disabled = !enabled;
    field.required = enabled;
    if (!enabled) field.removeAttribute("aria-invalid");
  }
  if (!active) {
    form.querySelector("[data-lr-visit-address-error]").textContent = "";
    form.querySelector("[data-lr-repair-place-error]").textContent = "";
  }
  if (
    active &&
    !form.elements.requested_repair_place.disabled &&
    !form.elements.requested_repair_place.value
  ) {
    form.elements.requested_repair_place.value =
      form.elements.service_format.value === "at-home" ? "home" : "mobile-lab";
  }
}

export function updateFormReadiness(form) {
  const phoneReady = !validatePhone(form.elements.phone.value).error;
  const consentReady = form.elements.consent.checked;
  const address = form.elements.visit_address;
  const place = form.elements.requested_repair_place;
  const visitReady =
    (address.disabled || Boolean(address.value.trim())) &&
    (place.disabled ||
      ["home", "work", "mobile-lab", "consultation"].includes(place.value));
  const submit = form.querySelector("[data-hop-lead-submit]");
  submit.disabled =
    form.getAttribute?.("aria-busy") === "true" ||
    !(phoneReady && consentReady && visitReady);
  form.querySelector("[data-lr-form-ready]").textContent = !phoneReady
    ? "Введите номер телефона полностью."
    : !visitReady
      ? "Укажите адрес и место ремонта."
      : !consentReady
        ? "Подтвердите согласие, чтобы отправить заявку."
        : "Всё готово — можно отправить заявку.";
  return !submit.disabled;
}

export function validateVisitFields(form, editedField = null) {
  const address = form.elements.visit_address;
  const place = form.elements.requested_repair_place;
  const addressError =
    !address.disabled && !address.value.trim()
      ? "Укажите населённый пункт, улицу и дом для выезда."
      : "";
  const placeError =
    !place.disabled &&
    !["home", "work", "mobile-lab", "consultation"].includes(place.value)
      ? "Выберите место ремонта или уточнение при звонке."
      : "";
  let invalid = null;
  for (const [field, selector, error] of [
    [address, "[data-lr-visit-address-error]", addressError],
    [place, "[data-lr-repair-place-error]", placeError],
  ]) {
    if (
      editedField &&
      (field !== editedField || field.getAttribute("aria-invalid") !== "true")
    )
      continue;
    form.querySelector(selector).textContent = error;
    field.setAttribute("aria-invalid", String(Boolean(error)));
    if (error && !invalid) invalid = field;
  }
  return invalid;
}

export function initializeHeroVideo(video) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const playButton = video.parentElement?.querySelector("[data-lr-hero-play]");
  const preview = video.parentElement?.querySelector("[data-lr-hero-preview]");
  const reveal = () => {
    if (video.paused || video.readyState < 2) return;
    video.dataset.lrPlaying = "true";
    if (preview) preview.dataset.lrLoaded = "true";
  };
  const revealOnFrame = () => {
    if (video.requestVideoFrameCallback)
      video.requestVideoFrameCallback(reveal);
    else reveal();
  };
  let attempt = 0;
  video.controls = false;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  const updateVideo = () => {
    const currentAttempt = ++attempt;
    video.autoplay = !reducedMotion.matches;
    if (playButton) playButton.hidden = true;
    if (!video.autoplay) video.pause();
    else if (video.error || video.networkState === 3) {
      if (playButton) playButton.hidden = false;
      return;
    } else if (video.paused)
      video.play().catch(() => {
        if (playButton && currentAttempt === attempt) playButton.hidden = false;
      });
  };
  playButton?.addEventListener("click", () => {
    playButton.hidden = true;
    // A failed <source> can report NETWORK_NO_SOURCE without setting video.error.
    if (video.error || video.networkState === 3) video.load();
    video
      .play()
      .then(() => {
        playButton.hidden = true;
      })
      .catch(() => {
        playButton.hidden = false;
      });
  });
  video.addEventListener("playing", () => {
    if (playButton) playButton.hidden = true;
    revealOnFrame();
  });
  video.addEventListener("pause", () => {
    if (
      playButton &&
      video.dataset.lrPlaying &&
      video.readyState >= 2 &&
      !reducedMotion.matches
    )
      playButton.hidden = false;
  });
  video.addEventListener("error", () => {
    if (playButton) playButton.hidden = false;
  });
  updateVideo();
  if (!video.paused && video.readyState >= 2) revealOnFrame();
  reducedMotion.addEventListener("change", updateVideo);
  if (typeof document !== "undefined")
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") updateVideo();
    });
}

export function initializeVideoPlayer(player) {
  const video = player.querySelector("[data-lr-player-video]");
  const play = player.querySelector("[data-lr-player-play]");
  if (!video || !play) return;
  const showPreview = () => {
    video.controls = false;
    play.hidden = false;
    play.disabled = false;
  };
  const showNativeControls = () => {
    video.controls = true;
    play.hidden = true;
    play.disabled = false;
  };
  video.addEventListener("playing", showNativeControls);
  video.addEventListener("ended", showPreview);
  video.addEventListener("error", showNativeControls);
  play.addEventListener("click", async () => {
    play.disabled = true;
    try {
      await video.play();
    } catch {
      // Native controls remain available if playback cannot start.
    }
    showNativeControls();
    video.focus();
  });
  showPreview();
}

export function initializeSignature(signature) {
  if (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    typeof IntersectionObserver === "undefined"
  )
    return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      signature.dataset.lrSignatureRevealed = "true";
      observer.disconnect();
    },
    { threshold: 0.4 },
  );
  observer.observe(signature);
}

export function initializePriceTabs(pricing) {
  const tablist = pricing.querySelector("[data-lr-price-tabs]");
  if (!tablist || pricing.dataset.lrPriceTabsReady) return;
  const tabs = Array.from(tablist.querySelectorAll("[data-lr-price-tab]"));
  const panels = Array.from(pricing.querySelectorAll("[data-lr-price-panel]"));
  if (tabs.length < 2 || tabs.length !== panels.length) return;
  const select = (index) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  };
  tablist.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      tabs[next].focus({ preventScroll: true });
    });
  });
  select(0);
  pricing.dataset.lrPriceTabsReady = "true";
  tablist.hidden = false;
}

export function initializeThemePreview(root) {
  const button = root.querySelector("[data-lr-theme-switch]");
  if (!button || button.dataset.lrInitialized === "true") return;
  button.dataset.lrInitialized = "true";
  const html = root.ownerDocument.documentElement;
  const attribute = "data-wp-dark-mode-active";
  const synchronize = () => {
    button.setAttribute("aria-checked", String(html.hasAttribute(attribute)));
  };
  synchronize();
  button.hidden = false;
  button.addEventListener("click", () => {
    html.toggleAttribute(attribute);
    synchronize();
  });
  new MutationObserver(synchronize).observe(html, {
    attributes: true,
    attributeFilter: [attribute],
  });
}

export function initializePhotoLightbox(root) {
  if (!root.querySelector("[data-lr-photo-open]")) return;
  if (root.dataset.lrPhotoInitialized === "true") return;
  root.dataset.lrPhotoInitialized = "true";
  root.addEventListener("click", (event) => {
    const link = event.target.closest?.("[data-lr-photo-open]");
    if (
      !link ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      typeof globalThis.GLightbox !== "function"
    )
      return;
    event.preventDefault();
    const reducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const lightbox = globalThis.GLightbox({
      selector: null,
      elements: [
        {
          href: link.href,
          type: "image",
          alt: link.querySelector("img")?.alt || "",
          title: "",
          description: "",
        },
      ],
      openEffect: reducedMotion ? "none" : "zoom",
      closeEffect: reducedMotion ? "none" : "zoom",
    });
    lightbox.on("close", () => {
      lightbox.destroy();
      link.focus({ preventScroll: true });
    });
    lightbox.open();
  });
}

export function initializeLanding() {
  const root = document.querySelector("#hop-landing");
  if (!root || root.dataset.lrInitialized === "true") return;
  root.dataset.lrInitialized = "true";
  initializeThemePreview(root);
  initializeDesignConcept(root);
  initializeHomeScroll(root);
  initializePhoneMask(root);
  root
    .querySelectorAll("[data-lr-review-slider]")
    .forEach(initializeReviewSlider);
  root
    .querySelectorAll("[data-lr-swipe-slider]")
    .forEach(initializeReviewSlider);
  initializePhotoLightbox(root);
  const heroVideo = root.querySelector("[data-lr-hero-video]");
  if (heroVideo) initializeHeroVideo(heroVideo);
  root
    .querySelectorAll("[data-lr-video-player]")
    .forEach(initializeVideoPlayer);
  root.querySelectorAll("[data-lr-signature]").forEach(initializeSignature);
  root.querySelectorAll("[data-lr-pricing]").forEach(initializePriceTabs);
  const modal = root.querySelector("[data-lr-modal=lead]");
  // Editorial previews share this layout without the lead-form interface.
  if (!modal) return;
  const modalForm = modal.querySelector("[data-lr-form]");
  const mobile = matchMedia("(max-width: 1023px)");
  const dialpadDevice = matchMedia(
    "(max-width: 1023px), (hover: none) and (pointer: coarse)",
  );
  let opener;
  let leadContext = {
    service_format: "consultation",
    symptom: "",
    device_category:
      leadDeviceCategory(root.querySelector("[data-lr-page-context]")) || "",
  };
  const modes = {
    consultation: [
      "Узнайте стоимость ремонта",
      "Оставьте номер — уточним модель и симптомы, сориентируем по цене. Полную стоимость согласуем после диагностики.",
      "Узнать стоимость ремонта",
    ],
    "mobile-lab": [
      "Вызовите мастерскую к дому или работе",
      "Уточним задачу и согласуем адрес и время приезда.",
      "Вызвать мастерскую",
    ],
    "at-home": [
      "Вызовите мастера домой или в офис",
      "Укажите адрес и пожелания. Согласуем возможность работ на месте и время приезда.",
      "Вызвать мастера",
    ],
    courier: [
      "Передайте ноутбук курьеру",
      "Согласуем адрес, время и стоимость доставки.",
      "Вызвать курьера",
    ],
    workshop: [
      "Найдём удобную мастерскую",
      "Выберите адрес. При звонке уточним возможность ремонта вашей модели.",
      "Подобрать мастерскую",
    ],
  };
  const updateContext = (form) => {
    const compact = form.hasAttribute("data-lr-compact-form");
    const symptom = form.elements.symptom.value;
    const category = form.elements.device_category.value;
    const format = form.elements.service_format.value;
    updateVisitFields(form);
    const labels = [];
    if (symptom) labels.push(`Неисправность: ${symptom}`);
    if (category)
      labels.push(
        `Устройство: ${category === "premium" ? "MacBook и премиальные ультрабуки" : "Ноутбуки"}`,
      );
    if (format !== "consultation")
      labels.push(
        `Способ ремонта: ${{ "mobile-lab": "Мастерская на колёсах", "at-home": "Мастер дома или в офисе", courier: "С доставкой курьером", workshop: "В сервисном центре" }[format]}`,
      );
    form.querySelector("[data-lr-context]").hidden = labels.length === 0;
    form.querySelector("[data-lr-context-text]").textContent =
      labels.join(" · ");
    form.querySelector("[data-lr-context-change]").hidden = Boolean(
      compact || form.closest("[data-lr-quiz]"),
    );
    const symptomSelect = form.querySelector("[data-lr-symptom-select]");
    if (
      symptom &&
      !Array.from(symptomSelect.options).some(
        (option) => option.value === symptom,
      )
    ) {
      symptomSelect.add(new Option(symptom, symptom));
    }
    form.querySelector("[data-lr-symptom-select]").value = symptom;
    form.querySelector("[data-lr-format-select]").value = format;
    const workshop =
      (!compact || Boolean(form.closest("[data-lr-quiz]"))) &&
      format === "workshop";
    form.querySelector("[data-lr-district]").hidden =
      !workshop || Boolean(form.elements.workshop_id.value);
    form.elements.district.disabled =
      !workshop || Boolean(form.elements.workshop_id.value);
    form.querySelector("[data-lr-workshop-picker]").hidden = !workshop;
    form.elements.workshop_id.disabled = !workshop;
    form.querySelector("[data-lr-address-label]").textContent =
      format === "courier"
        ? "Откуда забрать ноутбук?"
        : "Куда приехать — к дому или работе";
    form.querySelector("[data-lr-repair-place-field]").hidden =
      format === "courier";
    updateFormReadiness(form);
  };
  const shareContext = (context) => {
    leadContext = { ...leadContext, ...context };
    root.querySelectorAll("[data-lr-form]").forEach((form) => {
      if (form.closest("[data-lr-quiz]")) return;
      applyLeadContext(form, leadContext);
      updateContext(form);
    });
    const [title, intro, submit] = modes[leadContext.service_format];
    modal.querySelector("[data-lr-modal-title]").textContent = title;
    modal.querySelector("[data-lr-modal-intro]").textContent =
      modalForm.hasAttribute("data-lr-compact-form")
        ? "Диагностика — 0 ₽ даже при отказе. Адрес и детали уточним при звонке."
        : intro;
    modalForm.querySelector("[data-hop-lead-submit]").textContent = submit;
  };
  const updatePhoneMode = (form) => {
    const phone = form.elements.phone;
    const compact = form.hasAttribute("data-lr-compact-form");
    phone.readOnly = compact ? dialpadDevice.matches : mobile.matches;
    phone.inputMode = phone.readOnly ? "none" : "tel";
    if (!mobile.matches) form.querySelector("[data-lr-dialpad]").hidden = true;
    if (compact)
      form.querySelector("[data-lr-dialpad]").hidden = !phone.readOnly;
  };
  root.querySelectorAll("[data-lr-form]").forEach((form) => {
    updatePhoneMode(form);
    updateVisitFields(form);
    updateFormReadiness(form);
    const recheckVisitField = (event) => {
      if (
        event.target === form.elements.phone &&
        event.target.getAttribute("aria-invalid") === "true"
      ) {
        const error = validatePhone(event.target.value).error;
        form.querySelector("[data-lr-phone-error]").textContent = error;
        event.target.setAttribute("aria-invalid", String(Boolean(error)));
      }
      if (event.target === form.elements.consent && event.target.checked) {
        form.querySelector("[data-lr-consent-error]").textContent = "";
        event.target.removeAttribute("aria-invalid");
      }
      if (event.target.matches("[data-lr-visit-field]"))
        validateVisitFields(form, event.target);
      updateFormReadiness(form);
    };
    form.addEventListener("input", recheckVisitField);
    form.addEventListener("change", recheckVisitField);
    form.addEventListener(
      "submit",
      (event) => {
        const phone = form.elements.phone;
        const consent = form.elements.consent;
        const { value, error: phoneError } = validatePhone(phone.value);
        const visitInvalid = validateVisitFields(form);
        const consentError = consent.checked
          ? ""
          : "Подтвердите согласие на обработку персональных данных.";
        form.querySelector("[data-lr-phone-error]").textContent = phoneError;
        form.querySelector("[data-lr-consent-error]").textContent =
          consentError;
        phone.setAttribute("aria-invalid", String(Boolean(phoneError)));
        consent.setAttribute("aria-invalid", String(Boolean(consentError)));
        const message = form.querySelector("[data-lr-form-message]");
        message.textContent = "";
        if (phoneError || visitInvalid || consentError) {
          event.preventDefault();
          event.stopImmediatePropagation();
          (phoneError ? phone : visitInvalid || consent).focus();
          return;
        }
        phone.value = formatPhone(value);
        if (!form.elements.visit_address.disabled)
          form.elements.visit_address.value =
            form.elements.visit_address.value.trim();
        // The site's Lead Capture bridge owns submission and confirmed success.
      },
      { capture: true },
    );
  });
  if (leadContext.device_category) shareContext({});
  root.querySelectorAll("[data-lr-nav]").forEach((nav) => {
    nav.open = !mobile.matches;
  });
  root
    .querySelectorAll("[data-lr-quiz]")
    .forEach((quiz) => initializeRepairQuiz(quiz, updateContext));
  initializeQuizModal(root);
  initializeMapModal(root, (context) => {
    shareContext(context);
    opener = root.querySelector("[data-lr-map-open]");
    modal.showModal();
    modalForm.elements.phone.focus();
  });
  initializeMaps(root);
  window.addEventListener("submit", (event) => {
    const form = event.target;
    if (!form.matches("#hop-landing [data-lr-form]") || event.defaultPrevented)
      return;
    event.preventDefault();
    form.querySelector("[data-lr-form-message]").textContent =
      "Отправка временно недоступна. Позвоните по телефону на странице или повторите попытку позже.";
  });
  mobile.addEventListener("change", () => {
    root.querySelectorAll("[data-lr-form]").forEach(updatePhoneMode);
    root.querySelectorAll("[data-lr-nav]").forEach((nav) => {
      nav.open = !mobile.matches;
    });
  });
  dialpadDevice.addEventListener("change", () => updatePhoneMode(modalForm));
  root.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("a, button");
    if (!target) return;
    if (target.matches("[data-lr-lead-open]")) {
      event.preventDefault();
      opener = target;
      const context = {};
      const category = leadDeviceCategory(target);
      if (category) context.device_category = category;
      if (target.matches("[data-lr-selected-format]")) {
        const selected = root.querySelector("[data-lr-service-format]:checked");
        context.service_format = normalizeServiceFormat(selected?.value);
      } else if (target.dataset.format !== undefined) {
        context.service_format = normalizeServiceFormat(target.dataset.format);
      }
      if (target.dataset.symptom !== undefined)
        context.symptom = target.dataset.symptom;
      shareContext(context);
      applyLeadContext(modalForm, {
        source: target.dataset.source || "contact",
      });
      modalForm.querySelector("[data-lr-context-picker]").hidden = true;
      modalForm
        .querySelector("[data-lr-context-change]")
        .setAttribute("aria-expanded", "false");
      updateContext(modalForm);
      modal.showModal();
      (modalForm.hasAttribute("data-lr-compact-form")
        ? modalForm.elements.phone
        : modalForm.elements.service_format.value === "workshop"
          ? modalForm.elements.workshop_id
          : !modalForm.elements.visit_address.disabled
            ? modalForm.elements.visit_address
            : modalForm.elements.phone
      ).focus();
    } else if (target.matches("[data-lr-modal-close]")) {
      target.closest("dialog")?.close();
    } else if (target.matches("[data-lr-context-change]")) {
      const picker = target
        .closest("form")
        .querySelector("[data-lr-context-picker]");
      picker.hidden = !picker.hidden;
      target.setAttribute("aria-expanded", String(!picker.hidden));
      if (!picker.hidden) picker.querySelector("select").focus();
    } else if (target.matches("[data-lr-digit]")) {
      const form = target.closest("form");
      const phone = form.elements.phone;
      const digit = target.dataset.lrDigit;
      if (digit === "⌫")
        phone.value = phone.value.replace(/\D/g, "").slice(0, -1);
      else if (digit === "clear") {
        phone.value = "";
        form.querySelector("[data-lr-phone-error]").textContent = "";
        phone.removeAttribute("aria-invalid");
      } else if (phone.value.replace(/\D/g, "").length < 11)
        phone.value += digit;
      phone.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (target.matches("[data-lr-question]")) {
      const form = root.querySelector("#lr-contact [data-lr-form]");
      form.elements.phone.focus({ preventScroll: true });
    }
    if (target.closest("[data-lr-nav]"))
      root.querySelector("[data-lr-nav]").open = !mobile.matches;
  });
  root.addEventListener("change", (event) => {
    if (event.target.name === "workshop_id") {
      const form = event.target.closest("form");
      form.querySelector("[data-lr-district]").hidden = Boolean(
        event.target.value,
      );
      form.elements.district.disabled = Boolean(event.target.value);
    }
    if (event.target.matches("[data-lr-service-format]")) {
      const value = event.target.value;
      shareContext({ service_format: normalizeServiceFormat(value) });
    }
    if (event.target.matches("[data-lr-format-select]")) {
      const form = event.target.closest("form");
      const format = normalizeServiceFormat(event.target.value);
      if (form.closest("[data-lr-quiz]")) {
        applyLeadContext(form, { service_format: format });
        updateContext(form);
      } else shareContext({ service_format: format });
    }
    if (event.target.matches("[data-lr-symptom-select]")) {
      const form = event.target.closest("form");
      if (form.closest("[data-lr-quiz]")) {
        applyLeadContext(form, { symptom: event.target.value });
        updateContext(form);
      } else shareContext({ symptom: event.target.value });
    }
  });
  root.addEventListener("focusin", (event) => {
    if (event.target.matches("[data-lr-phone]") && event.target.readOnly)
      event.target.closest("form").querySelector("[data-lr-dialpad]").hidden =
        false;
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      const box = modal.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        modal.close();
    }
  });
  root.addEventListener(
    "wheel",
    (event) => {
      if (!modal.open) return;
      const box = modal.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        event.preventDefault();
    },
    { passive: false },
  );
  root.addEventListener(
    "touchmove",
    (event) => {
      if (modal.open && event.target === modal) event.preventDefault();
    },
    { passive: false },
  );
  modal.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      modal.querySelectorAll(
        'a[href], button, input:not([type="hidden"]), textarea, select, summary',
      ),
    ).filter((el) => !el.disabled && el.getClientRects().length);
    const first = focusable[0],
      last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  modal.addEventListener("close", () => {
    opener?.focus();
  });
}

export function initializeHomeScroll(root) {
  const hero = root.querySelector("[data-lr-depth-scene]");
  const journey = root.querySelector("[data-lr-repair-journey]");
  if (!journey) return;
  const steps = Array.from(journey.querySelectorAll("[data-lr-journey-step]"));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let frame;
  let current = -1;
  const update = () => {
    frame = undefined;
    const height = window.innerHeight;
    if (hero) {
      const heroBounds = hero.getBoundingClientRect();
      if (heroBounds.bottom > 0 && heroBounds.top < height) {
        const progress = reducedMotion.matches
          ? 0
          : Math.max(0, Math.min(1, -heroBounds.top / heroBounds.height));
        hero.style.setProperty("--lr-depth", progress.toFixed(3));
      }
    }
    const bounds = journey.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= height) return;
    let index = 0;
    steps.forEach((step, i) => {
      if (step.getBoundingClientRect().top < height * 0.6) index = i;
    });
    if (index === current) return;
    current = index;
    journey.dataset.lrActiveStep = String(index);
    steps.forEach((step, i) => {
      step.dataset.lrCurrent = String(i === index);
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  reducedMotion.addEventListener("change", schedule);
  update();
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initializeLanding, {
      once: true,
    });
  else initializeLanding();
}

export function initializeDesignConcept(root) {
  const concept = root.querySelector("[data-lr-concept]");
  if (!concept) return;
  concept.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lr-concept-view-button]");
    if (!button) return;
    const selected = button.dataset.lrConceptViewButton;
    concept.querySelectorAll("[data-lr-concept-view]").forEach((view) => {
      view.hidden = view.dataset.lrConceptView !== selected;
    });
    concept
      .querySelectorAll("[data-lr-concept-view-button]")
      .forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
  });
  concept.addEventListener("change", (event) => {
    const radio = event.target.closest("[data-lr-concept-format]");
    if (!radio) return;
    concept
      .querySelectorAll("[data-lr-concept-format-view]")
      .forEach((view) => {
        view.hidden = view.dataset.lrConceptFormatView !== radio.value;
      });
    concept
      .querySelectorAll("[data-lr-concept-format-description]")
      .forEach((text) => {
        text.hidden = text.dataset.lrConceptFormatDescription !== radio.value;
      });
  });
}
