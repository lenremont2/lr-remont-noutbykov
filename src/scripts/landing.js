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
  const track = slider.querySelector("[data-lr-review-track]");
  const frame = slider.querySelector("[data-lr-review-frame]");
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
    const { start, visible, end } = metrics();
    const currentLeft = destination ?? track.scrollLeft;
    previous.disabled = currentLeft < 2;
    next.disabled = currentLeft >= end - 2;
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
  const stop = () => {
    cancelAnimationFrame(animation);
    animation = undefined;
    destination = null;
    delete track.dataset.lrAnimating;
  };
  const goTo = (left) => {
    stop();
    const from = track.scrollLeft;
    const to = Math.min(metrics().end, Math.max(0, left));
    if (reducedMotion.matches || Math.abs(to - from) < 1) {
      track.scrollTo({ left: to, behavior: "instant" });
      return;
    }
    destination = to;
    track.dataset.lrAnimating = "true";
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
        update();
      }
    };
    animation = requestAnimationFrame(tick);
  };
  const move = (direction) => {
    const { visible, step } = metrics();
    const start = Math.round((destination ?? track.scrollLeft) / step);
    goTo((start + direction * visible) * step);
  };
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  track.addEventListener("scroll", update, { passive: true });
  let drag;
  track.addEventListener("pointerdown", (event) => {
    stop();
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      event.target.closest("a, button, input, textarea, select")
    )
      return;
    event.preventDefault();
    drag = {
      id: event.pointerId,
      x: event.clientX,
      left: track.scrollLeft,
      moved: false,
    };
    track.dataset.lrDragging = "true";
    track.setPointerCapture(event.pointerId);
  });
  const finishDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { id, left: startLeft, moved } = drag;
    drag = undefined;
    delete track.dataset.lrDragging;
    if (track.hasPointerCapture(id)) track.releasePointerCapture(id);
    if (moved) {
      const { step } = metrics();
      const delta = track.scrollLeft - startLeft;
      const fromIndex = Math.round(startLeft / step);
      let targetIndex = Math.round(track.scrollLeft / step);
      if (targetIndex === fromIndex && Math.abs(delta) >= 36) {
        targetIndex = fromIndex + Math.sign(delta);
      }
      goTo(targetIndex * step);
    }
  };
  track.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!(event.buttons & 1)) {
      finishDrag(event);
      return;
    }
    const distance = event.clientX - drag.x;
    drag.moved ||= Math.abs(distance) > 5;
    event.preventDefault();
    track.scrollTo({ left: drag.left - distance, behavior: "instant" });
  });
  track.addEventListener("pointerup", finishDrag);
  track.addEventListener("pointercancel", finishDrag);
  track.addEventListener("lostpointercapture", finishDrag);
  track.addEventListener("wheel", stop, { passive: true });
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
      move(event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      goTo(event.key === "Home" ? 0 : track.scrollWidth);
    }
  });
  if (typeof ResizeObserver !== "undefined")
    new ResizeObserver(() => {
      stop();
      update();
    }).observe(frame);
  slider.querySelector("[data-lr-review-controls]").hidden = false;
  update();
}

export function initializeRepairQuiz(quiz, updateContext) {
  const steps = Array.from(quiz.querySelectorAll("[data-lr-quiz-step]"));
  const questions = quiz.querySelector("[data-lr-quiz-questions]");
  const form = quiz.querySelector("[data-lr-form]");
  const previous = quiz.querySelector("[data-lr-quiz-prev]");
  const next = quiz.querySelector("[data-lr-quiz-next]");
  const progress = quiz.querySelector("[data-lr-quiz-progress]");
  const error = quiz.querySelector("[data-lr-quiz-error]");
  let current = 0;
  const show = (focus = true) => {
    steps.forEach((step, index) => {
      step.hidden = index !== current;
    });
    previous.hidden = current === 0;
    next.hidden = current === steps.length - 1;
    next.textContent =
      current === steps.length - 2 ? "Перейти к контактам" : "Далее";
    progress.textContent = `Шаг ${current + 1} из ${steps.length}`;
    error.textContent = "";
    if (focus) steps[current].querySelector("legend, h3").focus();
  };
  const forward = () => {
    if (current === steps.length - 1) return;
    if (!steps[current].querySelector("input:checked")) {
      error.textContent = "Выберите один из вариантов, чтобы продолжить.";
      steps[current].querySelector("input").focus();
      return;
    }
    current += 1;
    if (current === steps.length - 1) {
      for (const name of ["device_category", "symptom", "service_format"]) {
        form.elements[name].value = questions.querySelector(
          `input[name="${name}"]:checked`,
        ).value;
      }
      updateContext(form);
    }
    show();
  };
  next.addEventListener("click", forward);
  previous.addEventListener("click", () => {
    if (current === 0) return;
    current -= 1;
    show();
  });
  questions.addEventListener("submit", (event) => {
    event.preventDefault();
    forward();
  });
  questions.addEventListener("change", () => {
    error.textContent = "";
  });
  quiz.querySelector("[data-lr-quiz-navigation]").hidden = false;
  show(false);
}

export function initializeQuizModal(root, onToggle = () => {}) {
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
        "[data-lr-quiz-step]:not([hidden]) legend, [data-lr-quiz-step]:not([hidden]) h3",
      )
      ?.focus({ preventScroll: true });
    onToggle();
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
    onToggle();
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
  const active = ["mobile-lab", "at-home"].includes(
    form.elements.service_format.value,
  );
  form.querySelector("[data-lr-visit-fields]").hidden = !active;
  for (const name of ["visit_address", "requested_repair_place"]) {
    const field = form.elements[name];
    field.disabled = !active;
    field.required = active;
    if (!active) field.removeAttribute("aria-invalid");
  }
  if (!active) {
    form.querySelector("[data-lr-visit-address-error]").textContent = "";
    form.querySelector("[data-lr-repair-place-error]").textContent = "";
  }
  if (active && !form.elements.requested_repair_place.value) {
    form.elements.requested_repair_place.value =
      form.elements.service_format.value === "at-home" ? "home" : "mobile-lab";
  }
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
  video.controls = false;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  const updateVideo = () => {
    video.autoplay = !reducedMotion.matches;
    if (reducedMotion.matches) video.pause();
    else video.play().catch(() => {});
  };
  updateVideo();
  reducedMotion.addEventListener("change", updateVideo);
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

export function initializeLanding() {
  const root = document.querySelector("#hop-landing");
  if (!root || root.dataset.lrInitialized === "true") return;
  root.dataset.lrInitialized = "true";
  initializeDesignConcept(root);
  initializePhoneMask(root);
  root
    .querySelectorAll("[data-lr-review-slider]")
    .forEach(initializeReviewSlider);
  const heroVideo = root.querySelector("[data-lr-hero-video]");
  if (heroVideo) initializeHeroVideo(heroVideo);
  root
    .querySelectorAll("[data-lr-video-player]")
    .forEach(initializeVideoPlayer);
  root.querySelectorAll("[data-lr-signature]").forEach(initializeSignature);
  const modal = root.querySelector("[data-lr-modal=lead]");
  // Editorial previews share this layout without the lead-form interface.
  if (!modal) return;
  const quizModal = root.querySelector("[data-lr-quiz-modal]");
  const modalForm = modal.querySelector("[data-lr-form]");
  const mobile = matchMedia("(max-width: 1023px)");
  const bar = root.querySelector("[data-lr-mobile-bar]");
  let opener;
  let heroGone = false;
  let contactVisible = false;
  let formFocused = false;
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
      "Сообщите ближайшее метро или район. Поможем выбрать сервис для вашего ноутбука.",
      "Подобрать мастерскую",
    ],
  };
  const updateBar = () => {
    bar.hidden =
      !mobile.matches ||
      !heroGone ||
      contactVisible ||
      modal.open ||
      quizModal?.open ||
      formFocused;
  };
  const updateContext = (form) => {
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
      form.closest("[data-lr-quiz]"),
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
    const workshop = format === "workshop";
    form.querySelector("[data-lr-district]").hidden = !workshop;
    form.elements.district.disabled = !workshop;
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
    modal.querySelector("[data-lr-modal-intro]").textContent = intro;
    modalForm.querySelector("[data-hop-lead-submit]").textContent = submit;
  };
  const updatePhoneMode = (form) => {
    const phone = form.elements.phone;
    phone.readOnly = mobile.matches && phone.dataset.lrNative !== "true";
    phone.inputMode = phone.readOnly ? "none" : "tel";
    if (!mobile.matches) form.querySelector("[data-lr-dialpad]").hidden = true;
  };
  root.querySelectorAll("[data-lr-form]").forEach((form) => {
    form.querySelector("[data-hop-lead-submit]").disabled = false;
    updatePhoneMode(form);
    updateVisitFields(form);
    const recheckVisitField = (event) => {
      if (event.target.matches("[data-lr-visit-field]"))
        validateVisitFields(form, event.target);
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
  initializeQuizModal(root, updateBar);
  mobile.addEventListener("change", () => {
    root.querySelectorAll("[data-lr-form]").forEach(updatePhoneMode);
    root.querySelectorAll("[data-lr-nav]").forEach((nav) => {
      nav.open = !mobile.matches;
    });
    updateBar();
  });
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
      modalForm.elements.phone.focus();
      updateBar();
    } else if (target.matches("[data-lr-modal-close]")) {
      (target.closest("[data-lr-quiz-modal]") || modal).close();
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
      else if (digit === "+") {
        if (!phone.value) phone.value = "+";
      } else if (phone.value.replace(/\D/g, "").length < 11)
        phone.value += digit;
      phone.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (target.matches("[data-lr-native-phone]")) {
      const form = target.closest("form");
      form.elements.phone.dataset.lrNative = "true";
      updatePhoneMode(form);
      form.querySelector("[data-lr-dialpad]").hidden = true;
      form.elements.phone.focus();
    } else if (target.matches("[data-lr-phone-done]")) {
      const form = target.closest("form");
      form.querySelector("[data-lr-dialpad]").hidden = true;
      form.elements.consent.focus();
    } else if (target.matches("[data-lr-question]")) {
      const form = root.querySelector("#lr-contact [data-lr-form]");
      form.elements.phone.focus({ preventScroll: true });
    }
    if (target.closest("[data-lr-nav]"))
      root.querySelector("[data-lr-nav]").open = !mobile.matches;
  });
  root.addEventListener("change", (event) => {
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
    formFocused = Boolean(event.target.closest("[data-lr-form]"));
    if (event.target.matches("[data-lr-phone]") && event.target.readOnly)
      event.target.closest("form").querySelector("[data-lr-dialpad]").hidden =
        false;
    updateBar();
  });
  root.addEventListener("focusout", () =>
    queueMicrotask(() => {
      formFocused = Boolean(root.querySelector("[data-lr-form]:focus-within"));
      updateBar();
    }),
  );
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
    updateBar();
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.matches("[data-lr-hero-cta]"))
          heroGone =
            !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        else contactVisible = entry.isIntersecting;
      });
      updateBar();
    });
    observer.observe(root.querySelector("[data-lr-hero-cta]"));
    observer.observe(root.querySelector("#lr-contact"));
  }
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
