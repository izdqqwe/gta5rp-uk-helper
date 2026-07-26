(() => {
  const catalog = () => window.LAWS_EMBEDDED?.catalog || [];
  const texts = () => window.LAWS_EMBEDDED?.texts || {};

  function esc(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function classifyLine(line) {
    const t = line.trim();
    if (!t) return { kind: "blank" };
    if (/^(ГЛАВА|Глава|РАЗДЕЛ|ПРИЛОЖЕНИЕ|ПРЕАМБУЛА)/.test(t)) return { kind: "chapter", text: t };
    if (/^(Статья|[\d]+\.[\d]+\.\s)/.test(t)) return { kind: "article", text: t };
    if (/^(ч\.|п\.|а\)|б\)|в\)|г\)|д\)|е\)|ж\)|Примечание|Исключение|Комментарий)/i.test(t)) {
      return { kind: "part", text: t };
    }
    return { kind: "p", text: t };
  }

  function formatLawHtml(raw) {
    return raw
      .split("\n")
      .map((line) => {
        const c = classifyLine(line);
        if (c.kind === "blank") return "";
        if (c.kind === "chapter") return `<h2 class="law-chapter">${esc(c.text)}</h2>`;
        if (c.kind === "article") return `<h3 class="law-article">${esc(c.text)}</h3>`;
        if (c.kind === "part") return `<p class="law-part">${esc(c.text)}</p>`;
        return `<p class="law-p">${esc(c.text)}</p>`;
      })
      .join("\n");
  }

  function filterHtml(html, query) {
    const q = query.trim().toLowerCase().replace(/ё/g, "е");
    if (!q) return html;
    const parts = html.split(/(?=<h2|<h3|<p)/);
    return parts
      .filter((block) => {
        const plain = block.replace(/<[^>]+>/g, " ").toLowerCase().replace(/ё/g, "е");
        return !plain.trim() || plain.includes(q);
      })
      .join("");
  }

  window.initLawsViewer = function initLawsViewer(root, options = {}) {
    const data = window.LAWS_EMBEDDED;
    if (!data) {
      root.innerHTML = `<div class="warn">Тексты законов не загружены.</div>`;
      return;
    }

    let activeId = options.defaultId || catalog()[0]?.id || "uk";
    let searchQuery = "";

    function render() {
      const items = catalog();
      const meta = items.find((x) => x.id === activeId) || items[0];
      const raw = texts()[meta?.id] || "";
      const html = filterHtml(formatLawHtml(raw), searchQuery);

      root.innerHTML = `
        <div class="law-toolbar">
          <input type="search" class="law-search" placeholder="Поиск по тексту закона…" value="${esc(searchQuery)}" />
          <span class="law-meta">${esc(meta.title)} · ${raw.length.toLocaleString("ru")} симв.</span>
        </div>
        <div class="law-tabs" role="tablist">
          ${items
            .map(
              (it) =>
                `<button type="button" class="law-tab ${it.css}${it.id === meta.id ? " active" : ""}" data-law="${it.id}" role="tab">${esc(it.label)}</button>`
            )
            .join("")}
        </div>
        <div class="law-body" role="tabpanel">${html || `<p class="law-empty">Ничего не найдено по запросу «${esc(searchQuery)}».</p>`}</div>`;

      root.querySelector(".law-search")?.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        render();
        const inp = root.querySelector(".law-search");
        if (inp) {
          inp.focus();
          inp.setSelectionRange(inp.value.length, inp.value.length);
        }
      });

      root.querySelectorAll(".law-tab").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeId = btn.dataset.law;
          searchQuery = "";
          render();
        });
      });
    }

    render();
  };
})();
