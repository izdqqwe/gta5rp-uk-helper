(() => {
  const DEF_LINE =
    /^(?:[-•*]\s+)?(Объективная сторона преступления|Субъективная сторона преступления|Объект|Субъект|Примечание|Пример)\s*(?:—|-|:)\s*(.+)$/i;
  const DEF_SPLIT =
    /(?=(?:[-•*]\s+)?(?:Объективная сторона преступления|Субъективная сторона преступления|Объект|Субъект|Примечание|Пример)\s*(?:—|-|:))/i;

  const FALLBACK_TERMS = [
    "Объект",
    "Субъект",
    "Объективная сторона преступления",
    "Субъективная сторона преступления",
    "Наказание",
    "Состав преступления",
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function truncate(s, n) {
    const t = String(s || "").replace(/\s+/g, " ").trim();
    return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
  }

  function detectCode(memo) {
    const s = `${memo.source || ""} ${memo.ref || ""}`.toLowerCase().replace(/ё/g, "е");
    if (/\bук\b|уголовн|законы.*ук/.test(s) || (/^\d/.test(memo.ref || "") && !/\bпк\b/.test(s))) return "uk";
    if (/\bпк\b|процесс/.test(s)) return "pk";
    if (/\bза\b|адвокат/.test(s)) return "adv";
    if (/\bп1\b|террит/.test(s)) return "p1";
    if (/\bfib\b|фрб|устав/.test(s)) return "fib";
    if (/\bнп\b|неприкос/.test(s)) return "np";
    return "memo";
  }

  function parseDefinitionLines(text) {
    const raw = String(text || "").replace(/\r\n/g, "\n").trim();
    if (!raw) return [];
    const lines = raw.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
    let chunks = lines;
    if (lines.length === 1 && DEF_LINE.test(lines[0]) === false && DEF_SPLIT.test(lines[0])) {
      chunks = lines[0].split(DEF_SPLIT).map((s) => s.trim()).filter(Boolean);
    }
    const out = [];
    for (const line of chunks) {
      const m = line.match(DEF_LINE);
      if (m) out.push({ term: m[1], def: m[2].trim() });
    }
    return out;
  }

  function pickUnique(pool, exclude, n) {
    const ex = new Set(Array.isArray(exclude) ? exclude : [exclude]);
    const items = [...new Set(pool.filter((x) => x && !ex.has(x)))];
    return shuffle(items).slice(0, n);
  }

  function buildOptions(correct, pool, fallbacks, n = 4) {
    const need = n - 1;
    let wrong = pickUnique(pool, correct, need);
    if (wrong.length < need) {
      wrong = wrong.concat(pickUnique(fallbacks, [correct, ...wrong], need - wrong.length));
    }
    const options = shuffle([correct, ...wrong.slice(0, need)]);
    return { options, correct: options.indexOf(correct) };
  }

  function snippetQuestion(memo, allMemos) {
    const text = memo.text.replace(/\s+/g, " ").trim();
    if (text.length < 24) return null;
    const correct = truncate(text, 100);
    const pool = allMemos
      .filter((m) => m.id !== memo.id)
      .map((m) => truncate(m.text.replace(/\s+/g, " ").trim(), 100))
      .filter((s) => s.length >= 20 && s !== correct);
    const { options, correct: ci } = buildOptions(correct, pool, [
      "Статья утратила силу и не применяется.",
      "Наказание не предусмотрено данной нормой.",
      "Ответственность наступает только при наличии умысла.",
    ]);
    const ref = memo.ref ? `ст. ${memo.ref}` : "памятка";
    return {
      id: `memo-snippet-${memo.id}`,
      code: detectCode(memo),
      question: `Памятка · какая формулировка верна (${ref})?`,
      options,
      correct: ci,
      explain: text.length > 160 ? `${text.slice(0, 160)}…` : text,
      ref: memo.ref || "памятка",
      memoId: memo.id,
      fromMemo: true,
    };
  }

  function highlightQuestion(memo, phrase, allPhrases) {
    const p = phrase.replace(/\s+/g, " ").trim();
    if (p.length < 4) return null;
    const pool = allPhrases.filter((x) => x !== p);
    const { options, correct } = buildOptions(p, pool, FALLBACK_TERMS.map((t) => `${t} — …`));
    const ref = memo.ref ? `ст. ${memo.ref}` : "памятка";
    return {
      id: `memo-hl-${memo.id}-${p.slice(0, 24).replace(/\W/g, "")}`,
      code: detectCode(memo),
      question: `Памятка · что ты выделил как важное (${ref})?`,
      options: options.map((o) => truncate(o, 80)),
      correct,
      explain: `Выделено в памятке: «${p}»`,
      ref: memo.ref || "памятка",
      memoId: memo.id,
      fromMemo: true,
    };
  }

  window.buildMemoQuizQuestions = function buildMemoQuizQuestions(memos) {
    if (!memos?.length) return [];

    const questions = [];
    const seen = new Set();
    const allDefs = [];
    const allTerms = [];
    const allPhrases = [];

    memos.forEach((memo) => {
      parseDefinitionLines(memo.text).forEach((d) => {
        allDefs.push({ ...d, memoId: memo.id });
        allTerms.push(d.term);
      });
      (memo.highlights || []).forEach((h) => allPhrases.push(h.replace(/\s+/g, " ").trim()));
    });

    memos.forEach((memo) => {
      const code = detectCode(memo);
      const defs = parseDefinitionLines(memo.text);

      defs.forEach(({ term, def }) => {
        const id = `memo-term-${memo.id}-${term}`;
        if (seen.has(id)) return;
        seen.add(id);
        const { options, correct } = buildOptions(term, allTerms, FALLBACK_TERMS);
        questions.push({
          id,
          code,
          question: `Памятка · термин для: «${truncate(def, 110)}»?`,
          options,
          correct,
          explain: `${term} — ${def}`,
          ref: memo.ref || "памятка",
          memoId: memo.id,
          fromMemo: true,
        });

        const id2 = `memo-def-${memo.id}-${term}`;
        if (!seen.has(id2) && def.length >= 12) {
          seen.add(id2);
          const defPool = allDefs.filter((d) => d.def !== def).map((d) => truncate(d.def, 90));
          const { options: o2, correct: c2 } = buildOptions(truncate(def, 90), defPool, [
            "Общественные отношения, которым наносится вред.",
            "Внутреннее отношение лица к деянию.",
            "Внешнее проявление преступления.",
          ]);
          questions.push({
            id: id2,
            code,
            question: `Памятка · определение «${term}»:`,
            options: o2,
            correct: c2,
            explain: `${term} — ${def}`,
            ref: memo.ref || "памятка",
            memoId: memo.id,
            fromMemo: true,
          });
        }
      });

      (memo.highlights || []).forEach((hl) => {
        const q = highlightQuestion(memo, hl, allPhrases);
        if (q && !seen.has(q.id)) {
          seen.add(q.id);
          questions.push(q);
        }
      });

      if (!defs.length) {
        const q = snippetQuestion(memo, memos);
        if (q && !seen.has(q.id)) {
          seen.add(q.id);
          questions.push(q);
        }
      }
    });

    return questions;
  };
})();
