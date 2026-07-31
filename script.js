(() => {
  "use strict";

  const STORAGE_KEY = "convite-julia-2026-state-v5";
  const MAIN_DATE = "2026-08-01";
  const STEP_COUNT = 8;
  const sendingMessages = [
    "Consultando o gatinho…",
    "Registrando decisões importantes…",
    "Atualizando o setor financeiro…",
    "Avisando o Iure para agir naturalmente…",
    "Finalizando a operação…"
  ];

  const defaultState = {
    step: 0,
    reaction: "",
    activity: "",
    dateMode: "",
    date: "",
    timeMode: "",
    time: "",
    preferences: [],
    note: "",
    responseId: "",
    sendStatus: "idle",
    completed: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const stages = $$(".stage");
  const progressWrap = $("#progressWrap");
  const progressBar = $("#progressBar");
  const progressLabel = $("#progressLabel");
  const progressPercent = $("#progressPercent");
  const liveRegion = $("#liveRegion");
  let sendMessageTimer = null;
  let holdTimer = null;
  let holdFinished = false;
  let state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved && typeof saved === "object" ? { ...defaultState, ...saved } : { ...defaultState };
    } catch (_) {
      return { ...defaultState };
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* armazenamento pode estar bloqueado */ }
  }

  function createResponseId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function setStep(step, options = {}) {
    const normalized = step === "error" ? "error" : Math.max(0, Math.min(9, Number(step)));
    $("#homeButton").hidden = normalized === 0;
    $(".security-tag").hidden = normalized !== 0;
    stages.forEach((stage) => {
      const active = String(stage.dataset.step) === String(normalized);
      stage.classList.toggle("is-active", active);
      stage.toggleAttribute("inert", !active);
      stage.setAttribute("aria-hidden", String(!active));
    });
    if (normalized === 0 || normalized === 8 || normalized === 9 || normalized === "error") {
      progressWrap.hidden = true;
    } else {
      progressWrap.hidden = false;
      const visibleStep = Math.min(Number(normalized), STEP_COUNT);
      const percent = Math.round((visibleStep / STEP_COUNT) * 100);
      progressLabel.textContent = `Etapa ${visibleStep} de ${STEP_COUNT}`;
      progressPercent.textContent = `${percent}%`;
      progressBar.style.width = `${percent}%`;
      progressBar.parentElement.setAttribute("aria-valuenow", String(percent));
    }
    if (typeof normalized === "number" && normalized <= 7) {
      state.step = normalized;
      saveState();
    }
    window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
    const heading = $(`[data-step="${normalized}"] h1, [data-step="${normalized}"] h2`);
    if (heading && options.focus !== false) {
      heading.setAttribute("tabindex", "-1");
      requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    }
    liveRegion.textContent = heading?.textContent || "Etapa atualizada.";
  }

  function choose(field, value, selector) {
    state[field] = value;
    $$(selector).forEach((button) => {
      const selected = button.dataset.value === value;
      button.setAttribute("aria-checked", String(selected));
      const marker = $("i", button);
      if (marker) marker.textContent = selected ? "✓" : "○";
    });
    saveState();
  }

  function formatDate(dateValue) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue || "")) return "";
    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12);
    if (Number.isNaN(date.getTime())) return "";
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
    const full = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
    return `${weekday}, ${full}`;
  }

  function getOtherDateMinimum() {
    const floor = new Date(2026, 7, 2, 12);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const min = today > floor ? today : floor;
    return `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, "0")}-${String(min.getDate()).padStart(2, "0")}`;
  }

  function validateDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && value >= getOtherDateMinimum();
  }

  function validateTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "") && value >= "18:00";
  }

  function restoreControls() {
    if (state.reaction) choose("reaction", state.reaction, '[data-field="reaction"]');
    if (state.activity) choose("activity", state.activity, '[data-field="activity"]');

    $$("[data-date-mode]").forEach((button) => {
      const selected = button.dataset.dateMode === state.dateMode;
      button.setAttribute("aria-checked", String(selected));
      const marker = $("i", button); if (marker) marker.textContent = selected ? "✓" : "○";
    });
    $("#otherDateWrap").hidden = state.dateMode !== "other";
    $("#otherDate").min = getOtherDateMinimum();
    $("#otherDate").value = state.dateMode === "other" ? state.date : "";

    $$("[data-time]").forEach((button) => {
      const selected = button.dataset.time === state.timeMode;
      button.setAttribute("aria-checked", String(selected));
    });
    $("#otherTimeWrap").hidden = state.timeMode !== "other";
    $("#otherTime").value = state.timeMode === "other" ? state.time : "";

    $$(".preferences-list input").forEach((input) => { input.checked = state.preferences.includes(input.value); });
    $("#note").value = state.note;
    $("#noteCount").textContent = `${state.note.length}/250`;
    updateStepButtons();
    updateWhatsAppLinks();
  }

  function updateStepButtons() {
    const step2Next = $('[data-step="2"] [data-next]'); if (step2Next) step2Next.disabled = !state.reaction;
    const step3Next = $('[data-step="3"] [data-next]'); if (step3Next) step3Next.disabled = !state.activity;
    const step4Next = $('[data-step="4"] [data-next]'); if (step4Next) step4Next.disabled = !state.date || (state.dateMode === "other" && !validateDate(state.date));
    const step5Next = $('[data-step="5"] [data-next]'); if (step5Next) step5Next.disabled = !validateTime(state.time);
  }

  function updateReview() {
    $("#summaryReaction").textContent = state.reaction;
    $("#summaryActivity").textContent = state.activity;
    $("#summaryDate").textContent = formatDate(state.date);
    $("#summaryTime").textContent = state.time;
    $("#summaryPreferences").textContent = state.preferences.length ? state.preferences.join(", ") : "Nenhuma exigência adicional. Um raro voto de confiança.";
    $("#summaryNote").textContent = state.note || "Nenhuma cláusula suspeita adicionada.";
    $("#successActivity").textContent = state.activity;
    $("#successDate").textContent = formatDate(state.date);
    $("#successTime").textContent = state.time;
  }

  function buildPayload() {
    if (!state.responseId) state.responseId = createResponseId();
    const payload = {
      responseId: state.responseId,
      invitationId: CONFIG.invitationId,
      recipient: CONFIG.recipientName,
      sender: CONFIG.senderName,
      reaction: state.reaction,
      activity: state.activity,
      date: state.date,
      formattedDate: formatDate(state.date),
      time: state.time,
      preferences: state.preferences,
      note: state.note.slice(0, 250),
      submittedAt: new Date().toISOString(),
      pageUrl: location.href
    };
    saveState();
    return payload;
  }

  function configuredScriptUrl() {
    const url = String(CONFIG.googleScriptUrl || "").trim();
    return /^https:\/\/.+\/exec(?:\?.*)?$/.test(url) && !url.includes("COLOCAR_URL");
  }

  async function sendResponse() {
    if (state.completed || state.sendStatus === "sending") {
      updateReview(); setStep(9); return;
    }
    if (!configuredScriptUrl()) {
      state.sendStatus = "not-configured"; saveState();
      $("#errorCopy").textContent = "O canal de envio ainda não foi configurado. Você pode voltar e conferir ou avisar o Iure pelo WhatsApp.";
      setStep("error");
      return;
    }

    state.sendStatus = "sending";
    saveState();
    setStep(8);
    let messageIndex = 0;
    $("#sendingMessage").textContent = sendingMessages[0];
    clearInterval(sendMessageTimer);
    sendMessageTimer = setInterval(() => {
      messageIndex = (messageIndex + 1) % sendingMessages.length;
      $("#sendingMessage").textContent = sendingMessages[messageIndex];
    }, 850);

    try {
      const body = JSON.stringify(buildPayload());
      let verified = false;
      try {
        const response = await fetch(CONFIG.googleScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, redirect: "follow" });
        if (response.ok) {
          const result = await response.json();
          if (!result?.success) throw new Error("safe-response-error");
          verified = true;
        } else throw new Error("unreadable-response");
      } catch (_) {
        await fetch(CONFIG.googleScriptUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body });
      }
      clearInterval(sendMessageTimer);
      state.sendStatus = verified ? "verified" : "sent-unverified";
      state.completed = true;
      state.step = 7;
      saveState();
      updateReview();
      $("#successCopy").textContent = verified
        ? "Suas escolhas foram registradas. Agora o Iure precisa cumprir suas funções como organizador e patrocinador oficial desta operação."
        : "Suas escolhas foram encaminhadas ao departamento responsável. Como o canal não entrega comprovante ao navegador, o botão de mensagem continua disponível para uma confirmação rápida.";
      setStep(9);
    } catch (_) {
      clearInterval(sendMessageTimer);
      state.sendStatus = "failed";
      saveState();
      $("#errorCopy").textContent = "Você pode tentar novamente ou avisar o Iure pelo WhatsApp.";
      setStep("error");
    }
  }

  function buildWhatsAppUrl(fallback = false) {
    const number = String(CONFIG.whatsappNumber || "").replace(/\D/g, "");
    if (!number || String(CONFIG.whatsappNumber).includes("COLOCAR")) return "";
    const preferences = state.preferences.length ? state.preferences.join(", ") : "nenhuma";
    const message = fallback
      ? `Oi! O pombo-correio digital falhou, então estou enviando por aqui:\n\nRolê: ${state.activity}\nData: ${formatDate(state.date)}\nHorário: ${state.time}\nPreferências: ${preferences}\nObservação: ${state.note || "nenhuma"}`
      : "Escolhas oficialmente registradas 👀 Agora é sua vez de organizar o rolê.";
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  function updateWhatsAppLinks() {
    const normal = buildWhatsAppUrl(false);
    const fallback = buildWhatsAppUrl(true);
    const normalButton = $("#whatsappButton");
    const fallbackButton = $("#fallbackWhatsapp");
    normalButton.hidden = !normal; if (normal) normalButton.href = normal;
    fallbackButton.hidden = !fallback; if (fallback) fallbackButton.href = fallback;
  }

  function addToCalendar() {
    if (!validateTime(state.time) || !/^\d{4}-\d{2}-\d{2}$/.test(state.date)) return;
    const [year, month, day] = state.date.split("-").map(Number);
    const [hour, minute] = state.time.split(":").map(Number);
    const start = `${year}${String(month).padStart(2,"0")}${String(day).padStart(2,"0")}T${String(hour).padStart(2,"0")}${String(minute).padStart(2,"0")}00`;
    const endDate = new Date(year, month - 1, day, hour + 2, minute);
    const end = `${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,"0")}${String(endDate.getDate()).padStart(2,"0")}T${String(endDate.getHours()).padStart(2,"0")}${String(endDate.getMinutes()).padStart(2,"0")}00`;
    const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Convite Julia//PT-BR","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${state.responseId || createResponseId()}@convite-julia`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"")}`,`DTSTART;TZID=America/Sao_Paulo:${start}`,`DTEND;TZID=America/Sao_Paulo:${end}`,"SUMMARY:Rolê com Iure","DESCRIPTION:Convite oficialmente aprovado pelo gatinho romântico.","END:VEVENT","END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "role-com-iure.ics"; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function startHold(event) {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    if (event.type === "keydown" && event.repeat) return;
    event.preventDefault();
    holdFinished = false;
    const button = $("#holdButton");
    button.classList.add("is-holding");
    button.setAttribute("aria-label", "Confirmando, continue segurando");
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      holdFinished = true;
      button.classList.remove("is-holding");
      button.setAttribute("aria-label", "Confirmação concluída");
      sendResponse();
    }, 1200);
  }

  function cancelHold(event) {
    if (event?.type === "keyup" && !["Enter", " "].includes(event.key)) return;
    clearTimeout(holdTimer);
    if (!holdFinished) {
      const button = $("#holdButton");
      button.classList.remove("is-holding");
      button.setAttribute("aria-label", "Segurar para confirmar");
      liveRegion.textContent = "Confirmação cancelada. Segure por um segundo e dois décimos.";
    }
  }

  function restart() {
    if (!confirm("Recomeçar o convite e apagar as escolhas atuais?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = { ...defaultState };
    location.reload();
  }

  function playRomanticTransition(nextStep) {
    const transition = $("#romanticTransition");
    transition.dataset.nextStep = String(nextStep);
    transition.hidden = false;
    requestAnimationFrame(() => {
      transition.classList.add("is-showing");
      $("#continueRomanticTransition").focus({ preventScroll: true });
    });
    liveRegion.textContent = "Alerta: níveis suspeitos de fofura detectados. O gatinho autorizou a abertura do convite.";
  }

  function closeRomanticTransition() {
    const transition = $("#romanticTransition");
    const nextStep = Number(transition.dataset.nextStep || 1);
    transition.classList.add("is-leaving");
    setTimeout(() => {
      transition.hidden = true;
      transition.classList.remove("is-showing", "is-leaving");
      setStep(nextStep);
    }, 220);
  }

  $("#openInvitation").addEventListener("click", () => {
    $(".opening-document").classList.add("is-opening");
    setTimeout(() => playRomanticTransition(1), 260);
  });

  $("#continueRomanticTransition").addEventListener("click", closeRomanticTransition);

  $("#suspiciousButton").addEventListener("click", (event) => {
    const reply = $("#suspicionReply");
    const willShow = reply.hidden;
    reply.hidden = !willShow;
    event.currentTarget.setAttribute("aria-expanded", String(willShow));
    event.currentTarget.textContent = willShow ? "TÁ BOM, ENTENDI" : "ISSO PARECE SUSPEITO";
    liveRegion.textContent = willShow ? reply.textContent.trim() : "Explicação sobre a suspeita fechada.";
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button, a");
    if (!button) return;
    if (button.dataset.action === "accept-terms") setStep(2);
    if (button.dataset.action === "lawyer") {
      $("#lawyerResult").hidden = false;
      button.textContent = "TÁ BOM, VAMOS CONTINUAR";
      button.dataset.action = "accept-terms";
      liveRegion.textContent = $("#lawyerResult").textContent.trim();
    }
    if (button.matches('[data-field="reaction"]')) {
      choose("reaction", button.dataset.value, '[data-field="reaction"]');
      $("#reactionFeedback").textContent = "Resposta registrada. O gatinho decidiu confiar em você.";
      updateStepButtons();
    }
    if (button.matches('[data-field="activity"]')) {
      choose("activity", button.dataset.value, '[data-field="activity"]');
      const feedback = {
        "Jantar/macarrão": "Boa escolha. O departamento financeiro já começou a calcular quantos pratos cabem no orçamento.",
        "Barzinho de rock": "Escolha registrada. O patrocinador está preparando o cartão e opiniões musicais que ninguém solicitou.",
        "Cafeteria/Padoca": "Escolha registrada. O café está garantido e o pão de queijo entrou oficialmente na negociação."
      };
      $("#activityFeedback").textContent = feedback[state.activity];
      updateStepButtons();
    }
    if (button.dataset.dateMode) {
      state.dateMode = button.dataset.dateMode;
      state.date = state.dateMode === "main" ? MAIN_DATE : "";
      $$("[data-date-mode]").forEach((item) => {
        const selected = item === button; item.setAttribute("aria-checked", String(selected)); $("i", item).textContent = selected ? "✓" : "○";
      });
      $("#otherDateWrap").hidden = state.dateMode !== "other";
      $("#dateError").textContent = "";
      saveState(); updateStepButtons();
      if (state.dateMode === "other") $("#otherDate").focus();
    }
    if (button.dataset.time) {
      state.timeMode = button.dataset.time;
      state.time = state.timeMode === "other" ? "" : state.timeMode;
      $$("[data-time]").forEach((item) => item.setAttribute("aria-checked", String(item === button)));
      $("#otherTimeWrap").hidden = state.timeMode !== "other";
      $("#timeError").textContent = "";
      saveState(); updateStepButtons();
      if (state.timeMode === "other") $("#otherTime").focus();
    }
    if (button.hasAttribute("data-next")) {
      const current = Number(button.closest(".stage").dataset.step);
      if (current === 6) updateReview();
      setStep(current + 1);
    }
    if (button.hasAttribute("data-back")) setStep(Number(button.closest(".stage").dataset.step) - 1);
    if (button.dataset.edit) setStep(Number(button.dataset.edit));
    if (button.dataset.action === "review-again" || button.dataset.action === "back-review") { updateReview(); setStep(7); }
    if (button.dataset.action === "retry") { state.sendStatus = "idle"; saveState(); sendResponse(); }
    if (button.dataset.action === "restart") restart();
  });

  $("#otherDate").addEventListener("input", (event) => {
    state.date = event.target.value;
    $("#dateError").textContent = state.date && !validateDate(state.date) ? `Escolha uma data a partir de ${formatDate(getOtherDateMinimum())}.` : "";
    saveState(); updateStepButtons();
  });

  $("#otherTime").addEventListener("input", (event) => {
    state.time = event.target.value;
    $("#timeError").textContent = state.time && !validateTime(state.time) ? "Esse horário ainda pertence ao expediente. Escolha algum momento depois das 18h." : "";
    saveState(); updateStepButtons();
  });

  $$(".preferences-list input").forEach((input) => input.addEventListener("change", () => {
    state.preferences = $$(".preferences-list input:checked").map((item) => item.value);
    saveState();
  }));

  $("#note").addEventListener("input", (event) => {
    state.note = event.target.value.slice(0, 250);
    $("#noteCount").textContent = `${state.note.length}/250`;
    saveState();
  });

  const holdButton = $("#holdButton");
  holdButton.addEventListener("pointerdown", startHold);
  holdButton.addEventListener("pointerup", cancelHold);
  holdButton.addEventListener("pointercancel", cancelHold);
  holdButton.addEventListener("pointerleave", cancelHold);
  holdButton.addEventListener("keydown", startHold);
  holdButton.addEventListener("keyup", cancelHold);
  holdButton.addEventListener("blur", cancelHold);
  holdButton.addEventListener("contextmenu", (event) => event.preventDefault());
  $("#calendarButton").addEventListener("click", addToCalendar);

  restoreControls();
  updateReview();
  if (state.completed) setStep(9, { instant: true, focus: false });
  else setStep(Math.min(state.step, 7), { instant: true, focus: false });
})();
