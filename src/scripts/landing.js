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

function initializeLanding() {
  const root = document.querySelector("#hop-landing");
  if (!root || root.dataset.lrInitialized === "true") return;
  root.dataset.lrInitialized = "true";
  const compactSocial = matchMedia("(max-width: 599px)");
  const updateQr = () => {
    root.querySelectorAll("[data-lr-qr-disclosure]").forEach((details) => {
      details.open = !compactSocial.matches;
    });
  };
  updateQr();
  compactSocial.addEventListener("change", updateQr);
  const heroVideo = root.querySelector("[data-lr-hero-video]");
  if (heroVideo) {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateVideo = () => {
      heroVideo.autoplay = !reducedMotion.matches;
      if (reducedMotion.matches) heroVideo.pause();
      // If the browser blocks autoplay, the poster remains visible.
      else heroVideo.play().catch(() => {});
    };
    updateVideo();
    reducedMotion.addEventListener("change", updateVideo);
  }
  const modal = root.querySelector("[data-lr-modal=lead]");
  const modalForm = modal.querySelector("[data-lr-form]");
  const mobile = matchMedia("(max-width: 1023px)");
  const bar = root.querySelector("[data-lr-mobile-bar]");
  let opener;
  let heroGone = false;
  let contactVisible = false;
  let formFocused = false;
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
    courier: [
      "Передайте ноутбук курьеру",
      "Согласуем адрес, время и стоимость доставки.",
      "Заказать курьера",
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
      formFocused;
  };
  const updateContext = (form) => {
    const symptom = form.elements.symptom.value;
    const category = form.elements.device_category.value;
    const format = form.elements.service_format.value;
    const labels = [];
    if (symptom) labels.push(`Неисправность: ${symptom}`);
    if (category)
      labels.push(
        `Устройство: ${category === "premium" ? "MacBook и премиальные ультрабуки" : "Ноутбуки"}`,
      );
    if (format !== "consultation")
      labels.push(
        `Способ ремонта: ${{ "mobile-lab": "Мастерская на колёсах", courier: "С доставкой курьером", workshop: "В сервисном центре" }[format]}`,
      );
    form.querySelector("[data-lr-context]").hidden = labels.length === 0;
    form.querySelector("[data-lr-context-text]").textContent =
      labels.join(" · ");
    form.querySelector("[data-lr-context-change]").hidden = !symptom;
    form.querySelector("[data-lr-symptom-select]").value = symptom;
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
    form
      .querySelector("[data-lr-details]")
      .addEventListener("toggle", (event) => {
        event.target.querySelector("[data-lr-details-label]").textContent =
          event.target.open ? "Скрыть подробности" : "Добавить подробности";
      });
    form.addEventListener(
      "submit",
      (event) => {
        const phone = form.elements.phone;
        const consent = form.elements.consent;
        const { value, error: phoneError } = validatePhone(phone.value);
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
        if (phoneError || consentError) {
          event.preventDefault();
          event.stopImmediatePropagation();
          (phoneError ? phone : consent).focus();
          return;
        }
        phone.value = formatPhone(value);
        // The site's Lead Capture bridge owns submission and confirmed success.
      },
      { capture: true },
    );
  });
  root.querySelectorAll("[data-lr-nav]").forEach((nav) => {
    nav.open = !mobile.matches;
  });
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
      const format = target.dataset.format || "consultation";
      const [title, intro, submit] = modes[format];
      modal.querySelector("[data-lr-modal-title]").textContent = title;
      modal.querySelector("[data-lr-modal-intro]").textContent = intro;
      modalForm.querySelector("[data-hop-lead-submit]").textContent = submit;
      modalForm.elements.source.value = target.dataset.source;
      modalForm.elements.service_format.value = format;
      modalForm.elements.symptom.value = target.dataset.symptom || "";
      modalForm.elements.device_category.value = "";
      const workshop = format === "workshop";
      modalForm.querySelector("[data-lr-district]").hidden = !workshop;
      modalForm.elements.district.disabled = !workshop;
      modalForm.querySelector("[data-lr-details]").hidden = workshop;
      modalForm.elements.model.disabled = workshop;
      modalForm.elements.problem.disabled = workshop;
      modalForm.querySelector("[data-lr-symptom-picker]").hidden = true;
      if (target.dataset.source === "symptoms-other")
        modalForm.querySelector("[data-lr-details]").open = true;
      updateContext(modalForm);
      modal.showModal();
      modalForm.elements.phone.focus();
      updateBar();
    } else if (target.matches("[data-lr-modal-close]")) {
      modal.close();
    } else if (target.matches("[data-lr-context-change]")) {
      const picker = modalForm.querySelector("[data-lr-symptom-picker]");
      picker.hidden = !picker.hidden;
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
      form.querySelector("[data-lr-details]").open = true;
      form.elements.problem.focus({ preventScroll: true });
    }
    if (target.closest("[data-lr-nav]"))
      root.querySelector("[data-lr-nav]").open = !mobile.matches;
  });
  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-lr-symptom-select]")) {
      const form = event.target.closest("form");
      form.elements.symptom.value = event.target.value;
      updateContext(form);
    }
  });
  root.addEventListener("input", (event) => {
    const phone = event.target;
    if (!phone.matches("[data-lr-phone]")) return;
    const trailingDigits = phone.value
      .slice(phone.selectionStart ?? phone.value.length)
      .replace(/\D/g, "").length;
    phone.value = formatPhone(phone.value);
    let cursor = phone.value.length;
    let remaining = trailingDigits;
    while (cursor > 0 && remaining > 0) {
      cursor -= 1;
      if (/\d/.test(phone.value[cursor])) remaining -= 1;
    }
    phone.setSelectionRange(cursor, cursor);
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
