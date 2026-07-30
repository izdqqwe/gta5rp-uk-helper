# -*- coding: utf-8 -*-
"""Add memos tab and styles to index.html."""
from pathlib import Path

path = Path(__file__).resolve().parent.parent / "index.html"
html = path.read_text(encoding="utf-8")

html = html.replace("--quiz: #e67e22;", "--quiz: #e67e22; --memo: #2ecc71;")
html = html.replace("max-width: 680px;", "max-width: 780px;")

html = html.replace(
    ".main-tab.active.quiz { background: var(--quiz); color: #111; }",
    ".main-tab.active.quiz { background: var(--quiz); color: #111; }\n"
    "    .main-tab.active.memos { background: var(--memo); color: #111; }",
)

memo_css = """
    /* Memos */
    .memo-float {
      position: absolute; z-index: 9999;
      box-shadow: 0 8px 28px rgba(0,0,0,0.45);
    }
    .memo-float-btn {
      background: linear-gradient(135deg, var(--memo), #27ae60);
      color: #111; border: none; border-radius: 999px;
      padding: 8px 14px; font: inherit; font-weight: 700; font-size: 0.82rem;
      cursor: pointer; white-space: nowrap;
    }
    .memo-float-btn:hover { filter: brightness(1.08); }
    .memo-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(12px);
      background: var(--memo); color: #111; font-weight: 700; font-size: 0.88rem;
      padding: 10px 18px; border-radius: 999px; opacity: 0; pointer-events: none;
      transition: opacity 0.2s, transform 0.2s; z-index: 10000;
    }
    .memo-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    .memo-tab-badge {
      display: inline-block; min-width: 18px; margin-left: 4px; padding: 0 5px;
      background: rgba(0,0,0,0.25); border-radius: 999px; font-size: 0.7rem; font-weight: 800;
    }
    .main-tab.active.memos .memo-tab-badge { background: rgba(0,0,0,0.2); }
    .memo-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; }
    .memo-search { flex: 1; min-width: 180px; max-width: 360px; }
    .memo-count { font-size: 0.82rem; color: var(--muted); }
    .memo-clear-btn {
      background: transparent; border: 1px solid rgba(231,76,60,0.45); color: #ffb4ab;
      border-radius: 999px; padding: 7px 14px; font: inherit; font-size: 0.82rem; cursor: pointer;
    }
    .memo-clear-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .memo-table-wrap {
      overflow: auto; max-height: min(70vh, 640px);
      border: 1px solid var(--border); border-radius: 12px; background: var(--panel-2);
    }
    .memo-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
    .memo-table th {
      position: sticky; top: 0; background: var(--panel); text-align: left;
      padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 0.78rem;
      color: var(--muted); white-space: nowrap;
    }
    .memo-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .memo-table tr:last-child td { border-bottom: none; }
    .memo-table tr:hover td { background: rgba(46,204,113,0.04); }
    .memo-date { white-space: nowrap; color: var(--muted); font-size: 0.78rem; }
    .memo-src { white-space: nowrap; max-width: 140px; font-size: 0.78rem; color: var(--muted); }
    .memo-ref { white-space: nowrap; font-weight: 700; color: var(--accent); font-size: 0.78rem; }
    .memo-text { line-height: 1.45; min-width: 200px; }
    .memo-actions { white-space: nowrap; }
    .memo-copy, .memo-del {
      background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
      padding: 4px 8px; cursor: pointer; font-size: 0.85rem;
    }
    .memo-copy:hover { border-color: var(--memo); }
    .memo-del:hover { border-color: #e74c3c; color: #ffb4ab; }
    @media (max-width: 640px) {
      .memo-table th:nth-child(2), .memo-table td.memo-src { display: none; }
    }
"""

html = html.replace(
    "    .quiz-mistakes-btn { background: linear-gradient(135deg, #e74c3c, #c0392b) !important; color: #fff !important; }",
    "    .quiz-mistakes-btn { background: linear-gradient(135deg, #e74c3c, #c0392b) !important; color: #fff !important; }" + memo_css,
)

html = html.replace(
    '<button type="button" class="main-tab quiz" data-mode="quiz">Тренировка</button>',
    '<button type="button" class="main-tab quiz" data-mode="quiz">Тренировка</button>\n'
    '        <button type="button" class="main-tab memos" data-mode="memos">Памятки</button>',
)

html = html.replace(
    '<section class="card" id="quizSection" hidden>',
    '<section class="card" id="memosSection" hidden>\n'
    '      <label class="card-label">Мои памятки</label>\n'
    '      <div id="memosViewer"></div>\n'
    "    </section>\n\n"
    '    <section class="card" id="quizSection" hidden>',
)

html = html.replace(
    '<script src="quiz-viewer.js"></script>',
    '<script src="quiz-viewer.js"></script>\n  <script src="memos.js"></script>',
)

# setMode vars
html = html.replace(
    "const quizViewer = document.getElementById(\"quizViewer\");",
    "const quizViewer = document.getElementById(\"quizViewer\");\n"
    "    const memosSection = document.getElementById(\"memosSection\");\n"
    "    const memosViewer = document.getElementById(\"memosViewer\");",
)

html = html.replace(
    "let quizReady = false;",
    "let quizReady = false;\n    let memosReady = false;",
)

old = """      const isLaws = mode === "laws";
      const isQuiz = mode === "quiz";
      const isScenarios = mode === "scenarios";
      const isSearch = mode === "search";

      workSection.hidden = isLaws || isQuiz;
      lawsSection.hidden = !isLaws;
      quizSection.hidden = !isQuiz;
      result.hidden = isLaws || isQuiz;"""

new = """      const isLaws = mode === "laws";
      const isQuiz = mode === "quiz";
      const isMemos = mode === "memos";
      const isScenarios = mode === "scenarios";
      const isSearch = mode === "search";

      workSection.hidden = isLaws || isQuiz || isMemos;
      lawsSection.hidden = !isLaws;
      quizSection.hidden = !isQuiz;
      memosSection.hidden = !isMemos;
      result.hidden = isLaws || isQuiz || isMemos;"""

if old not in html:
    raise SystemExit("setMode visibility block not found")
html = html.replace(old, new)

old2 = """      } else if (isQuiz) {
        heroText.textContent = "Тесты по всем законам: экзамен, по теме, марафон и повтор ошибок.";
      } else {
        heroText.textContent = "Полные тексты законов штата San-Andreas.";
      }"""

new2 = """      } else if (isQuiz) {
        heroText.textContent = "Тесты по всем законам: экзамен, по теме, марафон и повтор ошибок.";
      } else if (isMemos) {
        heroText.textContent = "Сохранённые фрагменты: выдели текст → «В памятки».";
      } else {
        heroText.textContent = "Полные тексты законов штата San-Andreas.";
      }"""

html = html.replace(old2, new2)

init_block = """      if (isLaws && !lawsReady) {
        window.initLawsViewer?.(lawsViewer);
        lawsReady = true;
      }

      renderExamples();"""

new_init = """      if (isMemos && !memosReady) {
        window.initMemosViewer?.(memosViewer);
        memosReady = true;
      }

      if (isLaws && !lawsReady) {
        window.initLawsViewer?.(lawsViewer);
        lawsReady = true;
      }

      renderExamples();"""

html = html.replace(init_block, new_init)

html = html.replace(
    "    renderExamples();\n    initCategories().then(() => { setMode(\"scenarios\"); });",
    "    window.initMemosPicker?.({ getMode: () => mode });\n"
    "    renderExamples();\n"
    "    initCategories().then(() => { setMode(\"scenarios\"); });",
)

path.write_text(html, encoding="utf-8")
print("index.html memos patch OK")
