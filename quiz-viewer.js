(() => {
  const CODE_META = {
    uk: { label: "УК", css: "uk" },
    pk: { label: "ПК", css: "pk" },
    adv: { label: "ЗА", css: "adv" },
    p1: { label: "П1", css: "p1" },
    fib: { label: "FIB", css: "fib" },
    ustav: { label: "Устав", css: "fib" },
    np: { label: "НП", css: "np" },
  };

  const LS_WRONG = "quizWrongIds";

  let quizCache = null;

  async function loadQuiz() {
    if (quizCache) return quizCache;
    try {
      const res = await fetch("data/quiz.json");
      if (res.ok) {
        quizCache = await res.json();
        return quizCache;
      }
    } catch {
      /* file:// or offline */
    }
    if (window.QUIZ_EMBEDDED) {
      quizCache = window.QUIZ_EMBEDDED;
      return quizCache;
    }
    return [];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getWrongIds() {
    try {
      return JSON.parse(localStorage.getItem(LS_WRONG) || "[]");
    } catch {
      return [];
    }
  }

  function saveWrongIds(ids) {
    localStorage.setItem(LS_WRONG, JSON.stringify([...new Set(ids)]));
  }

  window.initQuizViewer = function initQuizViewer(root) {
    let allQuestions = [];
    let deck = [];
    let index = 0;
    let score = 0;
    let answered = false;
    let codeFilter = "all";
    let mode = "exam";
    let wrongThisRun = [];

    function filterQuestions() {
      let pool = allQuestions;
      if (codeFilter !== "all") pool = pool.filter((q) => q.code === codeFilter);
      if (mode === "mistakes") {
        const wrongIds = new Set(getWrongIds());
        pool = pool.filter((q) => wrongIds.has(q.id));
      }
      return pool;
    }

    function buildDeck() {
      const pool = filterQuestions();
      if (!pool.length) return [];
      if (mode === "exam") return shuffle(pool).slice(0, Math.min(20, pool.length));
      return shuffle(pool);
    }

    function pct(n, total) {
      if (!total) return 0;
      return Math.round((n / total) * 100);
    }

    function renderSetup() {
      const counts = {};
      allQuestions.forEach((q) => {
        counts[q.code] = (counts[q.code] || 0) + 1;
      });
      const total = allQuestions.length;
      const wrongCount = getWrongIds().filter((id) => allQuestions.some((q) => q.id === id)).length;

      root.innerHTML = `
        <div class="quiz-setup">
          <p class="card-hint">${total} вопросов. <strong>УК — по каждой статье</strong> (звёзды, наказание, состав). Остальные кодексы — ключевые нормы. После ответа — разбор.</p>
          <div class="quiz-stats">
            <div class="quiz-stat"><strong>${total}</strong><span>всего</span></div>
            <div class="quiz-stat"><strong>${wrongCount}</strong><span>на повтор</span></div>
          </div>
          <div class="quiz-block">
            <span class="quiz-block-label">Режим</span>
            <div class="quiz-modes" id="quizModes">
              <button type="button" class="quiz-mode active" data-mode="exam">Экзамен · 20</button>
              <button type="button" class="quiz-mode" data-mode="topic">По теме · все</button>
              <button type="button" class="quiz-mode" data-mode="marathon">Марафон · все</button>
              <button type="button" class="quiz-mode${wrongCount ? "" : " disabled"}" data-mode="mistakes"${wrongCount ? "" : " disabled"}>Ошибки · ${wrongCount}</button>
            </div>
          </div>
          <div class="quiz-block">
            <span class="quiz-block-label">Тема</span>
            <div class="quiz-codes" id="quizCodes">
              <button type="button" class="filter-btn code all active" data-code="all">Все</button>
              <button type="button" class="filter-btn code uk" data-code="uk">УК <small>${counts.uk || 0}</small></button>
              <button type="button" class="filter-btn code pk" data-code="pk">ПК <small>${counts.pk || 0}</small></button>
              <button type="button" class="filter-btn code adv" data-code="adv">ЗА <small>${counts.adv || 0}</small></button>
              <button type="button" class="filter-btn code p1" data-code="p1">П1 <small>${counts.p1 || 0}</small></button>
              <button type="button" class="filter-btn code fib" data-code="fib">FIB <small>${counts.fib || 0}</small></button>
              <button type="button" class="filter-btn code fib" data-code="ustav">Устав <small>${counts.ustav || 0}</small></button>
              <button type="button" class="filter-btn code np" data-code="np">НП <small>${counts.np || 0}</small></button>
            </div>
          </div>
          <button type="button" class="primary quiz-start" id="quizStart">Начать</button>
        </div>`;

      root.querySelector("#quizModes").addEventListener("click", (e) => {
        const btn = e.target.closest(".quiz-mode");
        if (!btn || btn.disabled) return;
        mode = btn.dataset.mode;
        root.querySelectorAll(".quiz-mode").forEach((b) => b.classList.toggle("active", b === btn));
      });

      root.querySelector("#quizCodes").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-code]");
        if (!btn) return;
        codeFilter = btn.dataset.code;
        root.querySelectorAll("#quizCodes [data-code]").forEach((b) => b.classList.toggle("active", b === btn));
      });

      root.querySelector("#quizStart").addEventListener("click", startRun);
    }

    function renderEmpty(msg) {
      root.innerHTML = `<div class="empty-state"><p>${esc(msg)}</p><button type="button" class="primary quiz-start" id="quizBack">Назад</button></div>`;
      root.querySelector("#quizBack").addEventListener("click", renderSetup);
    }

    function startRun() {
      deck = buildDeck();
      if (!deck.length) {
        renderEmpty(mode === "mistakes" ? "Нет сохранённых ошибок для повтора." : "Нет вопросов по выбранному фильтру.");
        return;
      }
      index = 0;
      score = 0;
      wrongThisRun = [];
      answered = false;
      renderQuestion();
    }

    function renderQuestion() {
      const q = deck[index];
      const meta = CODE_META[q.code] || { label: q.code, css: "uk" };
      const progress = pct(index, deck.length);

      root.innerHTML = `
        <div class="quiz-run">
          <div class="quiz-top">
            <button type="button" class="quiz-back-btn" id="quizQuit">← Выход</button>
            <span class="quiz-progress-text">${index + 1} / ${deck.length}</span>
          </div>
          <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${progress}%"></div></div>
          <div class="quiz-q-meta"><span class="code-${meta.css}">${meta.label}</span>${q.ref ? `<span class="quiz-ref">ст. ${esc(q.ref)}</span>` : ""}</div>
          <h3 class="quiz-question">${esc(q.question)}</h3>
          <div class="quiz-options" id="quizOptions">
            ${q.options.map((opt, i) => `<button type="button" class="quiz-opt" data-i="${i}">${esc(opt)}</button>`).join("")}
          </div>
          <div class="quiz-feedback" id="quizFeedback" hidden></div>
          <button type="button" class="primary quiz-next" id="quizNext" hidden>Дальше</button>
        </div>`;

      root.querySelector("#quizQuit").addEventListener("click", renderSetup);

      const optionsEl = root.querySelector("#quizOptions");
      const feedbackEl = root.querySelector("#quizFeedback");
      const nextBtn = root.querySelector("#quizNext");

      optionsEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".quiz-opt");
        if (!btn || answered) return;
        answered = true;
        const picked = Number(btn.dataset.i);
        const ok = picked === q.correct;

        if (ok) score += 1;
        else {
          wrongThisRun.push(q);
          const stored = getWrongIds();
          if (!stored.includes(q.id)) stored.push(q.id);
          saveWrongIds(stored);
        }

        optionsEl.querySelectorAll(".quiz-opt").forEach((b, i) => {
          b.disabled = true;
          if (i === q.correct) b.classList.add("correct");
          else if (i === picked) b.classList.add("wrong");
        });

        feedbackEl.hidden = false;
        feedbackEl.className = `quiz-feedback ${ok ? "ok" : "bad"}`;
        feedbackEl.innerHTML = `
          <strong>${ok ? "Верно!" : "Неверно"}</strong>
          <p>${esc(q.explain)}</p>
          ${q.ref ? `<p class="quiz-ref-line">Статья: <strong>${esc(q.ref)}</strong></p>` : ""}`;
        nextBtn.hidden = false;
        nextBtn.textContent = index + 1 >= deck.length ? "Результат" : "Следующий";
      });

      nextBtn.addEventListener("click", () => {
        if (index + 1 >= deck.length) renderSummary();
        else {
          index += 1;
          answered = false;
          renderQuestion();
        }
      });
    }

    function renderSummary() {
      const total = deck.length;
      const wrongIds = getWrongIds();
      const cleared = deck.filter((q) => !wrongThisRun.some((w) => w.id === q.id)).map((q) => q.id);
      const newWrongIds = wrongIds.filter((id) => !cleared.includes(id));
      saveWrongIds([...newWrongIds, ...wrongThisRun.map((q) => q.id)]);

      const uniqueWrong = [...new Map(wrongThisRun.map((q) => [q.id, q])).values()];
      const grade =
        pct(score, total) >= 90 ? "Отлично!" :
        pct(score, total) >= 70 ? "Хорошо" :
        pct(score, total) >= 50 ? "Нужно подтянуть" : "Перечитай законы";

      root.innerHTML = `
        <div class="quiz-summary">
          <h3 class="quiz-summary-title">${grade}</h3>
          <div class="quiz-score-ring">
            <span class="quiz-score-num">${score}</span>
            <span class="quiz-score-of">из ${total}</span>
            <span class="quiz-score-pct">${pct(score, total)}%</span>
          </div>
          ${uniqueWrong.length ? `
            <div class="quiz-wrong-list">
              <h4>Разбор ошибок (${uniqueWrong.length})</h4>
              ${uniqueWrong.map((q) => {
                const meta = CODE_META[q.code] || { label: q.code, css: "uk" };
                return `<article class="quiz-wrong-card">
                  <div class="quiz-q-meta"><span class="code-${meta.css}">${meta.label}</span>${q.ref ? `<span class="quiz-ref">ст. ${esc(q.ref)}</span>` : ""}</div>
                  <p class="quiz-wrong-q">${esc(q.question)}</p>
                  <p class="quiz-wrong-a"><strong>Ответ:</strong> ${esc(q.options[q.correct])}</p>
                  <p class="quiz-wrong-e">${esc(q.explain)}</p>
                </article>`;
              }).join("")}
            </div>` : `<p class="card-hint" style="text-align:center">Без ошибок — так держать!</p>`}
          <div class="quiz-summary-actions">
            <button type="button" class="primary quiz-start" id="quizAgain">Ещё раз</button>
            <button type="button" class="quiz-back-btn" id="quizMenu">Меню</button>
            ${uniqueWrong.length ? `<button type="button" class="primary quiz-start quiz-mistakes-btn" id="quizRetryWrong">Повторить ошибки</button>` : ""}
          </div>
        </div>`;

      root.querySelector("#quizAgain").addEventListener("click", startRun);
      root.querySelector("#quizMenu").addEventListener("click", renderSetup);
      const retryBtn = root.querySelector("#quizRetryWrong");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          mode = "mistakes";
          codeFilter = "all";
          startRun();
        });
      }
    }

    loadQuiz().then((data) => {
      allQuestions = data;
      if (!allQuestions.length) {
        root.innerHTML = `<div class="warn">База тестов не загружена. Обнови страницу или проверь quiz-embed.js</div>`;
        return;
      }
      renderSetup();
    });
  };
})();
