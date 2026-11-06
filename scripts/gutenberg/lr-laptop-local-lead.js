(() => {
  const config = JSON.parse(
    document.querySelector("#lr-laptop-local-receiver").textContent,
  );
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (
      !form.matches(
        "#hop-landing [data-hop-lead-form], #hop-gutenberg [data-hop-lead-form]",
      ) ||
      event.defaultPrevented
    )
      return;
    event.preventDefault();
    if (form.getAttribute("aria-busy") === "true") return;
    const status = form.querySelector(
      "[data-lr-form-message], [data-lr-form-status]",
    );
    const button = form.querySelector('[type="submit"]');
    const data = new FormData(form);
    if (!form.dataset.localRequestId)
      form.dataset.localRequestId = [
        ...crypto.getRandomValues(new Uint8Array(16)),
      ]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
    data.set("request_id", form.dataset.localRequestId);
    data.set("action", "lr_laptop_local_lead");
    data.set("_ajax_nonce", config.nonce);
    data.set("page_path", location.pathname);
    data.set(
      "cta_source",
      data.get("source") || data.get("cta_source") || "contact",
    );
    form.setAttribute("aria-busy", "true");
    button.disabled = true;
    if (status) status.textContent = "Отправляем…";
    try {
      const response = await fetch(config.url, {
        method: "POST",
        body: data,
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (
        !response.ok ||
        !result.success ||
        result.data?.received !== true ||
        result.data.id !== form.dataset.localRequestId
      )
        throw new Error(
          result.data?.message || "Не удалось отправить. Повторите попытку.",
        );
      form.hidden = true;
      const success = form
        .closest("[data-lead-root]")
        .querySelector("[data-lead-success]");
      success.hidden = false;
      const message = success.querySelector("p") || success;
      message.textContent =
        "Локальная тестовая заявка принята сервером. Сообщения в CRM и почту не отправлялись.";
    } catch (error) {
      if (status) {
        status.hidden = false;
        status.textContent = error.message;
      }
    } finally {
      form.removeAttribute("aria-busy");
      button.disabled = false;
    }
  });
})();
