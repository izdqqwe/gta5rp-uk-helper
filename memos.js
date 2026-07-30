(() => {
  const LS_KEY = "lawHelperMemos";
  const MIN_LEN = 2;

  let floatingEl = null;
  let pendingText = "";
  let getMode = () => "app";
  let getContext = () => "";

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadMemos() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveMemos(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("memos-updated", { detail: { count: list.length } }));
  }

  function uid() {
    return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString("ru-RU", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function isEditableNode(node) {
    let el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    while (el) {
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return true;
      if (el.classList?.contains("memo-float") || el.id === "memosViewer") return true;
      el = el.parentElement;
    }
    return false;
  }

  function detectArticleRef(range) {
    let node = range?.commonAncestorContainer;
    if (!node) return "";
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (el) {
      if (el.matches?.("h3.law-article")) {
        const m = el.textContent.match(/(\d+(?:\.\d+)+)/);
        return m ? m[1] : el.textContent.trim().slice(0, 40);
      }
      el = el.parentElement;
    }
    return "";
  }

  function detectLawLabel() {
    const active = document.querySelector(".law-tab.active");
    return active?.textContent?.trim() || "";
  }

  function buildContext() {
    const mode = getMode();
    const labels = {
      scenarios: "Сценарии",
      search: "Подбор",
      laws: "Законы",
      quiz: "Тренировка",
      memos: "Памятки",
    };
    let ctx = labels[mode] || mode;
    if (mode === "laws") {
      const law = detectLawLabel();
      if (law) ctx += ` · ${law}`;
    }
    const extra = getContext();
    if (extra) ctx += ` · ${extra}`;
    return ctx;
  }

  function ensureFloating() {
    if (floatingEl) return floatingEl;
    floatingEl = document.createElement("div");
    floatingEl.className = "memo-float";
    floatingEl.hidden = true;
    floatingEl.innerHTML = `
      <button type="button" class="memo-float-btn" id="memoAddBtn">📌 В памятки</button>`;
    document.body.appendChild(floatingEl);
    floatingEl.querySelector("#memoAddBtn").addEventListener("mousedown", (e) => e.preventDefault());
    floatingEl.querySelector("#memoAddBtn").addEventListener("click", () => {
      const sel = window.getSelection();
      const ref = sel?.rangeCount ? detectArticleRef(sel.getRangeAt(0)) : "";
      if (pendingText) {
        const ok = window.addLawMemo(pendingText, { ref });
        if (!ok) flashToast("Уже в памятках");
      }
      hideFloating();
      sel?.removeAllRanges();
    });
    document.addEventListener("mousedown", (e) => {
      if (!floatingEl.hidden && !floatingEl.contains(e.target)) hideFloating();
    });
    document.addEventListener("scroll", hideFloating, true);
    return floatingEl;
  }

  function showFloating(rect, text) {
    const el = ensureFloating();
    pendingText = text;
    el.hidden = false;
    const top = Math.max(8, rect.top + window.scrollY - 44);
    const left = Math.min(window.innerWidth - 160, Math.max(8, rect.left + window.scrollX + rect.width / 2 - 70));
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }

  function hideFloating() {
    if (floatingEl) floatingEl.hidden = true;
    pendingText = "";
  }

  function onSelectionChange() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      hideFloating();
      return;
    }
    const text = sel.toString().replace(/\s+/g, " ").trim();
    if (text.length < MIN_LEN) {
      hideFloating();
      return;
    }
    if (isEditableNode(sel.anchorNode)) {
      hideFloating();
      return;
    }
    const wrap = document.querySelector(".wrap");
    if (!wrap || !wrap.contains(sel.anchorNode)) {
      hideFloating();
      return;
    }
    let range;
    try {
      range = sel.getRangeAt(0);
    } catch {
      hideFloating();
      return;
    }
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      hideFloating();
      return;
    }
    showFloating(rect, text);
  }

  window.addLawMemo = function addLawMemo(text, meta = {}) {
    const trimmed = String(text || "").replace(/\s+/g, " ").trim();
    if (trimmed.length < MIN_LEN) return false;
    const list = loadMemos();
    const ref = meta.ref || detectArticleRef(window.getSelection()?.getRangeAt?.(0));
    const entry = {
      id: uid(),
      text: trimmed,
      source: meta.source || buildContext(),
      ref: ref || meta.ref || "",
      created: new Date().toISOString(),
    };
    const dup = list.some((m) => m.text === entry.text && m.source === entry.source);
    if (dup) return false;
    list.unshift(entry);
    saveMemos(list);
    flashToast("Добавлено в памятки");
    return true;
  };

  window.deleteLawMemo = function deleteLawMemo(id) {
    saveMemos(loadMemos().filter((m) => m.id !== id));
  };

  window.clearLawMemos = function clearLawMemos() {
    saveMemos([]);
  };

  window.getLawMemoCount = function getLawMemoCount() {
    return loadMemos().length;
  };

  function flashToast(msg) {
    let t = document.getElementById("memoToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "memoToast";
      t.className = "memo-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(flashToast._tm);
    flashToast._tm = setTimeout(() => t.classList.remove("show"), 1800);
  }

  window.initMemosPicker = function initMemosPicker(options = {}) {
    getMode = options.getMode || getMode;
    getContext = options.getContext || getContext;
    document.addEventListener("mouseup", onSelectionChange);
    document.addEventListener("keyup", onSelectionChange);
    updateTabBadge();
    window.addEventListener("memos-updated", updateTabBadge);
  };

  function updateTabBadge() {
    const n = loadMemos().length;
    const tab = document.querySelector('.main-tab[data-mode="memos"]');
    if (!tab) return;
    let badge = tab.querySelector(".memo-tab-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "memo-tab-badge";
      tab.appendChild(badge);
    }
    badge.textContent = n > 0 ? String(n) : "";
    badge.hidden = n === 0;
  }

  window.initMemosViewer = function initMemosViewer(root) {
    function render(filter = "") {
      const q = filter.trim().toLowerCase().replace(/ё/g, "e");
      let list = loadMemos();
      if (q) {
        list = list.filter((m) =>
          [m.text, m.source, m.ref].join(" ").toLowerCase().replace(/ё/g, "e").includes(q)
        );
      }

      root.innerHTML = `
        <p class="card-hint">Выдели текст на любой вкладке → нажми <strong>«В памятки»</strong>. Всё хранится в браузере на этом устройстве.</p>
        <div class="memo-toolbar">
          <input type="search" class="law-search memo-search" placeholder="Поиск по памяткам…" value="${esc(filter)}" />
          <span class="memo-count">${list.length} записей</span>
          <button type="button" class="memo-clear-btn" id="memoClearAll"${list.length ? "" : " disabled"}>Очистить всё</button>
        </div>
        ${list.length ? `
        <div class="memo-table-wrap">
          <table class="memo-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Откуда</th>
                <th>Статья</th>
                <th>Текст</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${list.map((m) => `
                <tr data-id="${esc(m.id)}">
                  <td class="memo-date">${esc(formatDate(m.created))}</td>
                  <td class="memo-src">${esc(m.source)}</td>
                  <td class="memo-ref">${m.ref ? esc(m.ref) : "—"}</td>
                  <td class="memo-text">${esc(m.text)}</td>
                  <td class="memo-actions">
                    <button type="button" class="memo-copy" title="Копировать">📋</button>
                    <button type="button" class="memo-del" title="Удалить">✕</button>
                  </td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>` : `
        <div class="empty-state">
          <p>Памяток пока нет.</p>
          <p style="font-size:0.85rem">Открой «Законы» или «Подбор», выдели важный фрагмент — появится кнопка «В памятки».</p>
        </div>`}`;

      root.querySelector(".memo-search")?.addEventListener("input", (e) => render(e.target.value));

      root.querySelector("#memoClearAll")?.addEventListener("click", () => {
        if (list.length && confirm("Удалить все памятки?")) {
          clearLawMemos();
          render(filter);
        }
      });

      root.querySelectorAll(".memo-del").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = btn.closest("tr");
          if (row) deleteLawMemo(row.dataset.id);
          render(filter);
        });
      });

      root.querySelectorAll(".memo-copy").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const row = btn.closest("tr");
          const text = row?.querySelector(".memo-text")?.textContent;
          if (!text) return;
          try {
            await navigator.clipboard.writeText(text);
            flashToast("Скопировано");
          } catch {
            flashToast("Не удалось скопировать");
          }
        });
      });
    }

    render();
    window.addEventListener("memos-updated", () => render(root.querySelector(".memo-search")?.value || ""));
  };
})();
