(() => {
  const LS_KEY = "lawHelperMemos";
  const MIN_LEN = 2;

  let floatingEl = null;
  let pendingText = "";
  let pendingHl = null;
  let lastMemoHl = null;
  let getMode = () => "app";
  let getContext = () => "";
  let memoRender = null;

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

  function sortedMemos(list) {
    return list.slice().sort((a, b) => new Date(a.created) - new Date(b.created));
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

  const HL_S = "\uE000";
  const HL_E = "\uE001";

  function injectHighlights(text, highlights) {
    if (!highlights?.length) return text;
    let t = text;
    const uniq = [...new Set(highlights.map((h) => h.replace(/\s+/g, " ").trim()))]
      .filter((h) => h.length >= 2)
      .sort((a, b) => b.length - a.length);
    for (const phrase of uniq) {
      const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      t = t.replace(re, (match) => `${HL_S}${match}${HL_E}`);
    }
    return t;
  }

  function formatMemoHtml(raw, highlights) {
    let text = String(raw || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    text = injectHighlights(text, highlights);
    const blocks = splitLawBlocks(text);
    return `<div class="memo-law-body">${blocks.map(formatLawBlock).join("")}</div>`;
  }

  function splitLawBlocks(text) {
    const chunks = text.split(/(?=Статья\s+\d+(?:\.\d+)*)/i).map((s) => s.trim()).filter(Boolean);
    if (chunks.length) return chunks;
    return [text];
  }

  function formatLawBlock(block) {
    if (/^Статья\s+\d/i.test(block)) return formatArticleBlock(block);
    const parts = block.split(/(?=ч\.\s*\d+\s)/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      return `<div class="memo-article-block">${parts.map(formatPartBody).join("")}</div>`;
    }
    return `<div class="memo-article-block"><p class="law-p">${formatInline(block)}</p></div>`;
  }

  function formatArticleBlock(block) {
    const segments = block.split(/(?=ч\.\s*\d+\s)/i).map((s) => s.trim()).filter(Boolean);

    if (segments.length === 1 && /^Статья/i.test(segments[0])) {
      const seg = segments[0];
      const punishMatch = seg.match(/(Наказание:\s*.+)$/i);
      const punish = punishMatch ? punishMatch[1].trim() : "";
      const title = punish ? seg.slice(0, seg.indexOf(punish)).trim() : seg;
      let html = `<h3 class="law-article">${formatInline(title)}</h3>`;
      if (punish) html += `<p class="law-part memo-punish">${formatInline(punish)}</p>`;
      return `<div class="memo-article-block">${html}</div>`;
    }

    let html = "";
    let i = 0;
    if (segments.length && /^Статья/i.test(segments[0])) {
      html += `<h3 class="law-article">${formatInline(segments[0])}</h3>`;
      i = 1;
    }
    for (; i < segments.length; i += 1) html += formatPartBody(segments[i]);
    return `<div class="memo-article-block">${html}</div>`;
  }

  function formatPartBody(partText) {
    const punishIdx = partText.search(/Наказание:/i);
    let main = partText;
    let punish = "";
    if (punishIdx >= 0) {
      main = partText.slice(0, punishIdx).trim();
      punish = partText.slice(punishIdx).trim();
    }

    let html = "";
    const defPieces = main.split(
      /(?=(?:Объект|Субъект|Объективная сторона преступления|Субъективная сторона преступления|Примечание|Пример)\s*(?:—|-|:))/i
    ).map((s) => s.trim()).filter(Boolean);

    const pieces = defPieces.length > 1 ? defPieces : [main];
    for (const piece of pieces) {
      const subs = piece.split(/(?=([а-яёa-z]\)\s))/i).map((s) => s.trim()).filter(Boolean);
      const chunks = subs.length > 1 ? subs : [piece];
      for (const sub of chunks) {
        if (!sub) continue;
        const isSub = /^[а-яёa-z]\)/i.test(sub);
        const isDef = /^(Объект|Субъект|Объективная|Субъективная|Примечание|Пример)/i.test(sub);
        html += `<p class="law-part${isSub || isDef ? " memo-sub" : ""}">${formatInline(sub)}</p>`;
      }
    }
    if (punish) html += `<p class="law-part memo-punish">${formatInline(punish)}</p>`;
    return html;
  }

  function formatInline(text) {
    if (text.includes(HL_S)) {
      let out = "";
      let i = 0;
      while (i < text.length) {
        const start = text.indexOf(HL_S, i);
        if (start === -1) {
          out += formatInlinePlain(text.slice(i));
          break;
        }
        out += formatInlinePlain(text.slice(i, start));
        const end = text.indexOf(HL_E, start);
        if (end === -1) {
          out += formatInlinePlain(text.slice(start));
          break;
        }
        out += `<span class="memo-hl">${formatInlinePlain(text.slice(start + 1, end))}</span>`;
        i = end + 1;
      }
      return out;
    }
    return formatInlinePlain(text);
  }

  function formatInlinePlain(text) {
    let s = esc(text);
    s = s.replace(/(★+)/g, "<span class=\"memo-stars\">$1</span>");
    s = s.replace(/^(ч\.\s*\d+)/i, "<span class=\"memo-kw\">$1</span>");
    s = s.replace(/^(п\.\s*[а-яёa-z\d]+)/i, "<span class=\"memo-kw\">$1</span>");
    s = s.replace(/^(Наказание:)/i, "<span class=\"memo-kw\">$1</span>");
    s = s.replace(/^(Примечание|Пример|Исключение|Комментарий):/gi, "<span class=\"memo-kw\">$1</span>:");
    s = s.replace(
      /^(Объект|Субъект|Объективная сторона преступления|Субъективная сторона преступления)\s*(—|-)/i,
      "<span class=\"memo-kw\">$1</span> $2"
    );
    s = s.replace(/^([а-яёa-z]\))/i, "<span class=\"memo-kw\">$1</span>");
    return s;
  }

  function isEditableNode(node) {
    let el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    while (el) {
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return true;
      if (el.classList?.contains("memo-float")) return true;
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
    const m = range?.toString?.().match(/Статья\s+(\d+(?:\.\d+)*)/i);
    return m ? m[1] : "";
  }

  function detectLawLabel() {
    return document.querySelector(".law-tab.active")?.textContent?.trim() || "";
  }

  function buildContext() {
    const mode = getMode();
    const labels = {
      scenarios: "Сценарии", search: "Подбор", laws: "Законы",
      quiz: "Тренировка", memos: "Памятки",
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
      <button type="button" class="memo-float-btn" id="memoAddBtn" hidden>📌 В памятки</button>
      <button type="button" class="memo-float-btn memo-float-hl" id="memoHlBtn" hidden>🖍 Выделить жёлтым</button>`;
    document.body.appendChild(floatingEl);

    floatingEl.querySelector("#memoAddBtn").addEventListener("mousedown", (e) => e.preventDefault());
    floatingEl.querySelector("#memoHlBtn").addEventListener("mousedown", (e) => e.preventDefault());

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

    floatingEl.querySelector("#memoHlBtn").addEventListener("click", () => {
      if (pendingHl?.id && pendingHl?.text) {
        addMemoHighlight(pendingHl.id, pendingHl.text);
        flashToast("Выделено");
        window.dispatchEvent(new CustomEvent("memos-refresh"));
      }
      hideFloating();
      window.getSelection()?.removeAllRanges();
    });

    document.addEventListener("mousedown", (e) => {
      if (!floatingEl.hidden && !floatingEl.contains(e.target)) hideFloating();
    });
    document.addEventListener("scroll", hideFloating, true);
    return floatingEl;
  }

  function showFloating(rect, mode) {
    const el = ensureFloating();
    const addBtn = el.querySelector("#memoAddBtn");
    const hlBtn = el.querySelector("#memoHlBtn");
    addBtn.hidden = mode !== "add";
    hlBtn.hidden = mode !== "hl";
    el.hidden = false;
    const w = mode === "hl" ? 180 : 130;
    const top = Math.max(8, rect.top + window.scrollY - 44);
    const left = Math.min(window.innerWidth - w, Math.max(8, rect.left + window.scrollX + rect.width / 2 - w / 2));
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }

  function hideFloating() {
    if (floatingEl) floatingEl.hidden = true;
    pendingText = "";
    pendingHl = null;
  }

  function getMemoCellFromSelection(sel) {
    let node = sel.anchorNode;
    if (!node) return null;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return el?.closest?.(".memo-text-cell") || null;
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

    const memoCell = getMemoCellFromSelection(sel);
    if (getMode() === "memos" && memoCell) {
      const row = memoCell.closest("tr");
      pendingHl = { id: row?.dataset.id, text };
      lastMemoHl = pendingHl;
      pendingText = "";
      showFloating(rect, "hl");
      return;
    }

    if (getMode() === "memos") {
      hideFloating();
      return;
    }

    const wrap = document.querySelector(".wrap");
    if (!wrap || !wrap.contains(sel.anchorNode)) {
      hideFloating();
      return;
    }
    pendingText = text;
    pendingHl = null;
    showFloating(rect, "add");
  }

  function addMemoHighlight(id, phrase) {
    const p = phrase.replace(/\s+/g, " ").trim();
    if (p.length < MIN_LEN) return;
    const list = loadMemos();
    const memo = list.find((m) => m.id === id);
    if (!memo) return;
    memo.highlights = memo.highlights || [];
    if (!memo.highlights.includes(p)) memo.highlights.push(p);
    saveMemos(list);
  }

  function updateMemo(id, patch) {
    const list = loadMemos();
    const idx = list.findIndex((m) => m.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], ...patch };
    saveMemos(list);
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
      highlights: [],
      created: new Date().toISOString(),
    };
    const dup = list.some((m) => m.text === entry.text && m.source === entry.source);
    if (dup) return false;
    list.push(entry);
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

  function parseSource(source) {
    const parts = String(source || "").split("·").map((s) => s.trim()).filter(Boolean);
    return { from: parts[0] || "—", tag: parts.slice(1).join(" · ") || "—" };
  }

  function getSelectionText() {
    return (window.getSelection()?.toString() || "").replace(/\s+/g, " ").trim();
  }

  function highlightFromSelection(rowId) {
    let text = getSelectionText();
    if (text.length < MIN_LEN && lastMemoHl?.id === rowId) text = lastMemoHl.text;
    if (text.length < MIN_LEN) return false;
    addMemoHighlight(rowId, text);
    lastMemoHl = null;
    return true;
  }

  function memoActionBtn(cls, title) {
    return `<button type="button" class="memo-ib ${cls}" title="${esc(title)}" aria-label="${esc(title)}"></button>`;
  }

  window.initMemosViewer = function initMemosViewer(root) {
    let editingId = null;
    let editingFilter = "";

    function startEdit(row, memo, filter) {
      editingId = memo.id;
      editingFilter = filter;
      const cell = row.querySelector(".memo-text-cell");
      const content = cell.querySelector(".memo-cell-content");
      if (content) content.hidden = true;

      let editor = cell.querySelector(".memo-cell-editor");
      if (!editor) {
        editor = document.createElement("div");
        editor.className = "memo-cell-editor";
        cell.appendChild(editor);
      }
      editor.hidden = false;
      editor.innerHTML = "";
      const ta = document.createElement("textarea");
      ta.className = "memo-edit-area";
      ta.value = memo.text;
      editor.appendChild(ta);
      const tip = document.createElement("p");
      tip.className = "memo-edit-tip";
      tip.textContent = "Измени текст и нажми «Сохранить».";
      editor.appendChild(tip);
      const editBar = document.createElement("div");
      editBar.className = "memo-edit-bar";
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "memo-save-btn primary";
      saveBtn.textContent = "Сохранить";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "memo-cancel-btn memo-back-btn";
      cancelBtn.textContent = "Отмена";
      editBar.append(saveBtn, cancelBtn);
      editor.appendChild(editBar);

      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (saveEdit(memo.id, ta)) flashToast("Сохранено");
        editingId = null;
        render(editingFilter);
      });
      cancelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        editingId = null;
        render(editingFilter);
      });

      ta.focus();
    }

    function saveEdit(id, ta) {
      if (!id || !ta) return false;
      const val = ta.value.replace(/\r\n/g, "\n").trim();
      if (val.length < MIN_LEN) {
        flashToast("Слишком короткий текст");
        return false;
      }
      const memo = loadMemos().find((m) => m.id === id);
      if (!memo) return false;
      updateMemo(id, {
        text: val,
        highlights: (memo.highlights || []).filter((h) => val.toLowerCase().includes(h.toLowerCase())),
      });
      return true;
    }

    function render(filter = "") {
      const q = filter.trim().toLowerCase().replace(/ё/g, "e");
      let list = sortedMemos(loadMemos());
      if (q) {
        list = list.filter((m) =>
          [m.text, m.source, m.ref, ...(m.highlights || [])].join(" ")
            .toLowerCase().replace(/ё/g, "e").includes(q)
        );
      }

      root.innerHTML = `
        <div class="memo-toolbar">
          <input type="search" class="law-search memo-search" placeholder="Поиск по памяткам…" value="${esc(filter)}" />
          <span class="memo-count">${list.length} записей · выдели текст → маркер · двойной клик — редактировать</span>
          <button type="button" class="memo-clear-btn" id="memoClearAll"${list.length ? "" : " disabled"}>Очистить всё</button>
        </div>
        ${list.length ? `
        <div class="memo-table-wrap">
          <table class="memo-table">
            <colgroup>
              <col class="memo-col-date" />
              <col class="memo-col-from" />
              <col class="memo-col-ref" />
              <col class="memo-col-text" />
              <col class="memo-col-act" />
            </colgroup>
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
              ${list.map((m) => {
                const src = parseSource(m.source);
                const refCol = m.ref ? esc(m.ref) : esc(src.tag);
                return `
                <tr data-id="${esc(m.id)}">
                  <td class="memo-date">${esc(formatDate(m.created))}</td>
                  <td class="memo-from">${esc(src.from)}</td>
                  <td class="memo-ref-col">${refCol}</td>
                  <td class="memo-text-cell">
                    <div class="memo-cell-content">${formatMemoHtml(m.text, m.highlights)}</div>
                  </td>
                  <td class="memo-actions">
                    ${memoActionBtn("memo-ib-edit", "Редактировать")}
                    ${memoActionBtn("memo-ib-hl", "Выделить жёлтым")}
                    ${memoActionBtn("memo-ib-copy", "Копировать")}
                    ${memoActionBtn("memo-ib-del", "Удалить")}
                  </td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>` : `
        <div class="empty-state memo-empty">
          <p>Памяток пока нет.</p>
          <p>Открой «Законы», выдели статью → «В памятки».</p>
        </div>`}`;

      root.querySelector(".memo-search")?.addEventListener("input", (e) => render(e.target.value));

      root.querySelector("#memoClearAll")?.addEventListener("click", () => {
        if (list.length && confirm("Удалить все памятки?")) {
          clearLawMemos();
          render(filter);
        }
      });

      if (!root.dataset.memoClickBound) {
        root.dataset.memoClickBound = "1";

        root.addEventListener("mousedown", (e) => {
          if (e.target.closest(".memo-ib-hl, #memoHlBtn")) e.preventDefault();
        });

        root.addEventListener("click", (e) => {
          const filterVal = root.querySelector(".memo-search")?.value || "";

          const editBtn = e.target.closest(".memo-ib-edit");
          if (editBtn) {
            const row = editBtn.closest("tr");
            const memo = loadMemos().find((m) => m.id === row?.dataset.id);
            if (row && memo) startEdit(row, memo, filterVal);
            return;
          }

          const hlBtn = e.target.closest(".memo-ib-hl");
          if (hlBtn) {
            const row = hlBtn.closest("tr");
            if (row && highlightFromSelection(row.dataset.id)) {
              flashToast("Выделено");
              window.getSelection()?.removeAllRanges();
            } else {
              flashToast("Сначала выдели текст в строке");
            }
            render(filterVal);
            return;
          }

          const delBtn = e.target.closest(".memo-ib-del");
          if (delBtn) {
            const row = delBtn.closest("tr");
            if (row) deleteLawMemo(row.dataset.id);
            render(filterVal);
            return;
          }

          const copyBtn = e.target.closest(".memo-ib-copy");
          if (copyBtn) {
            const memo = loadMemos().find((m) => m.id === copyBtn.closest("tr")?.dataset.id);
            if (memo) {
              navigator.clipboard.writeText(memo.text)
                .then(() => flashToast("Скопировано"))
                .catch(() => flashToast("Не удалось скопировать"));
            }
          }
        });

        root.addEventListener("dblclick", (e) => {
          const cell = e.target.closest(".memo-text-cell");
          if (!cell || cell.querySelector(".memo-edit-area")) return;
          if (e.target.closest(".memo-actions, button")) return;
          const row = cell.closest("tr");
          const memo = loadMemos().find((m) => m.id === row?.dataset.id);
          if (row && memo) startEdit(row, memo, root.querySelector(".memo-search")?.value || "");
        });
      }

      if (editingId) {
        const row = root.querySelector(`tr[data-id="${editingId}"]`);
        const memo = loadMemos().find((m) => m.id === editingId);
        if (row && memo) startEdit(row, memo, filter);
      }

      const wrap = root.querySelector(".memo-table-wrap");
      if (wrap) wrap.scrollTop = wrap.scrollHeight;
    }

    memoRender = () => {
      if (editingId) return;
      render(root.querySelector(".memo-search")?.value || "");
    };
    render();
    window.addEventListener("memos-updated", memoRender);
    window.addEventListener("memos-refresh", () => {
      if (editingId) return;
      render(root.querySelector(".memo-search")?.value || "");
    });
  };
})();
