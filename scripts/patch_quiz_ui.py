# -*- coding: utf-8 -*-
"""Patch index.html to add quiz tab and styles."""
from pathlib import Path

path = Path(__file__).resolve().parent.parent / "index.html"
html = path.read_text(encoding="utf-8")

html = html.replace("--scn: #a855f7;", "--scn: #a855f7; --quiz: #e67e22;")
html = html.replace("max-width: 520px; margin: 22px auto 0;", "max-width: 680px; margin: 22px auto 0;")
html = html.replace("font-size: 0.9rem;", "font-size: 0.82rem;", 1)

html = html.replace(
    ".main-tab.active.laws { background: var(--laws); color: #111; }",
    ".main-tab.active.laws { background: var(--laws); color: #111; }\n    .main-tab.active.quiz { background: var(--quiz); color: #111; }",
)

quiz_css = """
    /* Quiz tab */
    .quiz-setup { display: flex; flex-direction: column; gap: 16px; }
    .quiz-stats { display: flex; gap: 12px; justify-content: center; }
    .quiz-stat {
      flex: 1; max-width: 140px; text-align: center; background: var(--panel-2);
      border: 1px solid var(--border); border-radius: 12px; padding: 14px;
    }
    .quiz-stat strong { display: block; font-size: 1.6rem; color: var(--quiz); }
    .quiz-stat span { font-size: 0.78rem; color: var(--muted); }
    .quiz-block-label { display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 8px; color: var(--muted); }
    .quiz-modes { display: flex; flex-wrap: wrap; gap: 8px; }
    .quiz-mode {
      background: var(--panel-2); border: 1px solid var(--border); color: var(--muted);
      border-radius: 999px; padding: 8px 14px; font: inherit; font-size: 0.82rem; cursor: pointer;
    }
    .quiz-mode:hover { color: var(--text); }
    .quiz-mode.active { background: var(--quiz); border-color: var(--quiz); color: #111; font-weight: 700; }
    .quiz-mode.disabled { opacity: 0.45; cursor: not-allowed; }
    .quiz-codes { display: flex; flex-wrap: wrap; gap: 6px; }
    .quiz-codes small { opacity: 0.7; font-weight: 400; }
    button.primary.quiz-start { background: linear-gradient(135deg, var(--quiz), #d35400); color: #111; box-shadow: 0 4px 14px rgba(230,126,34,0.25); }
    .quiz-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .quiz-back-btn { background: none; border: none; color: var(--muted); font: inherit; cursor: pointer; padding: 4px 0; }
    .quiz-back-btn:hover { color: var(--text); }
    .quiz-progress-text { font-size: 0.85rem; color: var(--muted); font-weight: 600; }
    .quiz-progress { height: 6px; background: var(--panel-2); border-radius: 999px; overflow: hidden; margin-bottom: 16px; }
    .quiz-progress-fill { height: 100%; background: linear-gradient(90deg, var(--quiz), #f39c12); transition: width 0.25s; }
    .quiz-q-meta { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; font-size: 0.82rem; font-weight: 700; }
    .quiz-ref { color: var(--muted); font-weight: 500; }
    .quiz-question { margin: 0 0 16px; font-size: 1.05rem; line-height: 1.45; }
    .quiz-options { display: flex; flex-direction: column; gap: 8px; }
    .quiz-opt {
      text-align: left; background: var(--panel-2); border: 1px solid var(--border); color: var(--text);
      border-radius: 12px; padding: 12px 14px; font: inherit; line-height: 1.4; cursor: pointer; transition: all 0.15s;
    }
    .quiz-opt:hover:not(:disabled) { border-color: var(--quiz); background: rgba(230,126,34,0.08); }
    .quiz-opt.correct { border-color: #2ecc71; background: rgba(46,204,113,0.12); }
    .quiz-opt.wrong { border-color: #e74c3c; background: rgba(231,76,60,0.12); }
    .quiz-opt:disabled { cursor: default; opacity: 0.95; }
    .quiz-feedback { margin-top: 16px; padding: 14px; border-radius: 12px; line-height: 1.5; font-size: 0.9rem; }
    .quiz-feedback.ok { background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.35); }
    .quiz-feedback.bad { background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.35); }
    .quiz-feedback p { margin: 8px 0 0; color: #c8d4e4; }
    .quiz-ref-line { font-size: 0.82rem; color: var(--muted); }
    .quiz-next { margin-top: 14px; width: 100%; }
    .quiz-summary-title { text-align: center; margin: 0 0 8px; color: var(--quiz); }
    .quiz-score-ring {
      text-align: center; background: var(--panel-2); border: 1px solid var(--border);
      border-radius: 16px; padding: 24px; margin-bottom: 20px;
    }
    .quiz-score-num { display: block; font-size: 2.4rem; font-weight: 800; color: var(--quiz); }
    .quiz-score-of { color: var(--muted); font-size: 0.9rem; }
    .quiz-score-pct { display: block; margin-top: 6px; font-weight: 700; }
    .quiz-wrong-list h4 { margin: 0 0 12px; font-size: 0.95rem; }
    .quiz-wrong-card {
      background: var(--panel-2); border: 1px solid var(--border); border-left: 4px solid #e74c3c;
      border-radius: 12px; padding: 14px; margin-bottom: 10px;
    }
    .quiz-wrong-q { margin: 6px 0; font-weight: 600; }
    .quiz-wrong-a { margin: 0; font-size: 0.88rem; color: #a8e6c3; }
    .quiz-wrong-e { margin: 8px 0 0; font-size: 0.86rem; color: var(--muted); }
    .quiz-summary-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 18px; }
    .quiz-mistakes-btn { background: linear-gradient(135deg, #e74c3c, #c0392b) !important; color: #fff !important; }
"""

html = html.replace(
    "    .empty-state p { margin: 0 0 8px; }",
    "    .empty-state p { margin: 0 0 8px; }" + quiz_css,
)

html = html.replace(
    '<button type="button" class="main-tab laws" data-mode="laws">Законы</button>',
    '<button type="button" class="main-tab laws" data-mode="laws">Законы</button>\n'
    '        <button type="button" class="main-tab quiz" data-mode="quiz">Тренировка</button>',
)

html = html.replace(
    '<section class="card" id="result" hidden>',
    '<section class="card" id="quizSection" hidden>\n'
    '      <label class="card-label">Тренировка по законам</label>\n'
    '      <div id="quizViewer"></div>\n'
    "    </section>\n\n"
    '    <section class="card" id="result" hidden>',
)

html = html.replace(
    '<script src="guides-embed.js"></script>',
    '<script src="guides-embed.js"></script>\n'
    '  <script src="quiz-embed.js"></script>\n'
    '  <script src="quiz-viewer.js"></script>',
)

html = html.replace(
    'const lawsSection = document.getElementById("lawsSection");',
    'const lawsSection = document.getElementById("lawsSection");\n'
    '    const quizSection = document.getElementById("quizSection");\n'
    '    const quizViewer = document.getElementById("quizViewer");',
)

html = html.replace(
    "let lawsReady = false;",
    "let lawsReady = false;\n    let quizReady = false;",
)

old = """      const isLaws = mode === "laws";
      const isScenarios = mode === "scenarios";
      const isSearch = mode === "search";

      workSection.hidden = isLaws;
      lawsSection.hidden = !isLaws;
      result.hidden = isLaws;"""

new = """      const isLaws = mode === "laws";
      const isQuiz = mode === "quiz";
      const isScenarios = mode === "scenarios";
      const isSearch = mode === "search";

      workSection.hidden = isLaws || isQuiz;
      lawsSection.hidden = !isLaws;
      quizSection.hidden = !isQuiz;
      result.hidden = isLaws || isQuiz;"""

if old not in html:
    raise SystemExit("setMode block not found")
html = html.replace(old, new)

old2 = """      } else {
        heroText.textContent = "Полные тексты законов штата San-Andreas.";
      }

      if (isLaws && !lawsReady) {"""

new2 = """      } else if (isQuiz) {
        heroText.textContent = "Тесты по всем законам: экзамен, по теме, марафон и повтор ошибок.";
      } else {
        heroText.textContent = "Полные тексты законов штата San-Andreas.";
      }

      if (isQuiz && !quizReady) {
        window.initQuizViewer?.(quizViewer);
        quizReady = true;
      }

      if (isLaws && !lawsReady) {"""

if old2 not in html:
    raise SystemExit("heroText block not found")
html = html.replace(old2, new2)

path.write_text(html, encoding="utf-8")
print("index.html patched OK")
