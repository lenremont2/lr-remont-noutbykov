function initializeLanding() {
  const root = document.querySelector("#hop-landing");

  if (!(root instanceof HTMLElement) || root.dataset.lrInitialized === "true") {
    return;
  }

  root.dataset.lrInitialized = "true";

  const status = root.querySelector("[data-lr-starter-status]");
  if (status) {
    status.textContent = "JavaScript подключён";
  }

  let trigger = null;

  const findModal = (id) =>
    Array.from(root.querySelectorAll("[data-lr-modal]")).find(
      (modal) => modal.dataset.lrModal === id,
    );

  const openModal = (id, opener = null) => {
    const modal = findModal(id);
    if (!(modal instanceof HTMLDialogElement)) {
      return;
    }

    trigger = opener;
    if (!modal.open) {
      modal.showModal();
    }

    modal.querySelector("input, button, select, textarea")?.focus();
  };

  const closeModal = (modal) => {
    if (modal instanceof HTMLDialogElement && modal.open) {
      modal.close();
    }
  };

  const showQuizStep = (step) => {
    if (!(step instanceof HTMLElement)) {
      return;
    }

    step.hidden = false;
    step.querySelector("input")?.focus();
  };

  const showQuizMessage = (step) => {
    const message = step?.querySelector("[data-lr-quiz-message]");
    if (message) {
      message.textContent = "Выберите вариант, чтобы продолжить.";
    }
  };

  const saveQuizAnswers = (quiz) => {
    const answers = Array.from(
      quiz.querySelectorAll("[data-lr-quiz-answer]:checked"),
    ).map((input) => ({ name: input.name, value: input.value }));
    root.querySelectorAll("[data-lr-quiz-result]").forEach((input) => {
      input.value = JSON.stringify(answers);
    });
  };

  const resetQuiz = (quiz) => {
    quiz.querySelectorAll("[data-lr-quiz-answer]").forEach((input) => {
      input.checked = false;
    });
    quiz.querySelectorAll("[data-lr-quiz-message]").forEach((message) => {
      message.textContent = "";
    });
    quiz.querySelectorAll("[data-lr-quiz-step]").forEach((step, index) => {
      step.hidden = index !== 0;
    });
    quiz.querySelector("[data-lr-quiz-loading]").hidden = true;
    quiz.querySelector("[data-lr-quiz-ready]").hidden = true;
  };

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const opener = target.closest("[data-lr-modal-open]");
    if (opener instanceof HTMLElement) {
      openModal(opener.dataset.lrModalOpen, opener);
      return;
    }

    const closer = target.closest("[data-lr-modal-close]");
    if (closer) {
      closeModal(closer.closest("dialog"));
      return;
    }

    const next = target.closest("[data-lr-quiz-next]");
    if (next) {
      const currentStep = next.closest("[data-lr-quiz-step]");
      const answer = currentStep?.querySelector(
        "[data-lr-quiz-answer]:checked",
      );
      if (!answer) {
        showQuizMessage(currentStep);
        return;
      }

      currentStep.hidden = true;
      showQuizStep(currentStep.nextElementSibling);
      return;
    }

    const calculate = target.closest("[data-lr-quiz-calculate]");
    if (calculate) {
      const currentStep = calculate.closest("[data-lr-quiz-step]");
      const answer = currentStep?.querySelector(
        "[data-lr-quiz-answer]:checked",
      );
      if (!answer) {
        showQuizMessage(currentStep);
        return;
      }

      const quiz = calculate.closest("[data-lr-quiz]");
      if (!(quiz instanceof HTMLElement)) {
        return;
      }

      saveQuizAnswers(quiz);
      currentStep.hidden = true;
      const loading = quiz.querySelector("[data-lr-quiz-loading]");
      const ready = quiz.querySelector("[data-lr-quiz-ready]");
      loading.hidden = false;

      window.setTimeout(() => {
        loading.hidden = true;
        ready.hidden = false;
        ready.querySelector("input")?.focus();
      }, 900);
    }
  });

  root.querySelectorAll("[data-lr-modal]").forEach((modal) => {
    modal.addEventListener("close", () => {
      const quiz = modal.querySelector("[data-lr-quiz]");
      if (quiz instanceof HTMLElement) {
        resetQuiz(quiz);
      }
      trigger?.focus();
      trigger = null;
    });
  });

  root.querySelectorAll("[data-lr-lead-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (form.dataset.lrDemoForm !== "true") {
        return;
      }

      event.preventDefault();
      const message = form.querySelector("[data-lr-form-message]");
      if (message) {
        message.textContent =
          "Перед публикацией укажите formAction для отправки заявки.";
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeLanding, {
    once: true,
  });
} else {
  initializeLanding();
}
