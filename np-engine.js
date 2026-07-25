(() => {
  const IMMUNE_LIST =
    "Губернатор и советник; Вице-Губернатор и советник; Глава Администрации Губернатора и зам.; главы департаментов правительства и зам.; судьи; Генпрокурор/зам./советники; руководители органов власти и зам., директор WN и зам.; Спикер Сената; сенаторы (с заседания до окончания).";

  const TAGS = {
    list: ["кто неприкос", "список неприкос", "перечень", "губернатор", "вице", "генпрокурор", "судья", "сенатор", "спикер", "weazel", "глава департамент"],
    immunity: ["неприкос", "неприкосновен", "иммунитет", "нельзя задержать", "нельзя досмотр", "нельзя обыск"],
    detain: ["задержал неприкос", "задержали губернator", "кафф неприкос", "наручники губернатор", "задержал судью"],
    search: ["обыск неприкос", "досмотр неприкос", "обыск машин", "досмотр авто", "кортеж"],
    motorcade: ["кортеж", "кorteж", "сопровождение usss", "usss", "secret service"],
    suspend: ["приостанов", "сняли неприкос", "отстранен", "ордер на арест", "72 час"],
    threat: ["угроза жизни", "убил", "посягательств на жизнь", "непосредственная угроза"],
    ai: ["access to investigation", "ордер ai", " ai ", "расследован неприкос", "досудебн"],
    judge: ["судья", "независимость суд", "давление на суд"],
    car: ["машину неприкос", "авто неприкос", "транспорт неприкос", "без согласия"],
    responsibility: ["ответственност неприкос", "коап", "административн", "этическ"],
    usss: ["usss", "secret service", "секретн служб"],
    senator: ["сенатор", "сенат", "заседан"],
    violation: ["нарушили неприкос", "незаконно задержали", "обжалован"],
  };

  const ARTICLES = {
    "1.1": {
      article: "1", part: 1,
      title: "Цели и задачи Закона",
      requirement: "Правовые, социальные и иные гарантии должностным лицам госорганов SA при исполнении обязанностей.",
    },
    "2.1": {
      article: "2", part: 1,
      title: "Перечень неприкосновенных лиц",
      requirement: IMMUNE_LIST,
    },
    "3.1": {
      article: "3", part: 1,
      title: "Неприкосновенность — определение",
      requirement: "Особый статус: особые права и особый порядок привлечения к уголовной, административной и иной ответственности.",
    },
    "4.1": {
      article: "4", part: 1,
      title: "Защита от ответственности",
      requirement: "Неприкосновенное лицо не может быть привлечено по УК, КоАП, ДК, Этическому кодексу — кроме случаев по закону.",
      note: "При приостановлении статуса — гарантии не действуют. Исключение: Спикер Сената может привлекать сенаторов к админ. ответственности.",
    },
    "4.2": {
      article: "4", part: 2,
      title: "Дисциплинарная ответственность",
      requirement: "Дисциплинарка — руководством по ТК и внутренним регламентам/уставам.",
    },
    "4.3": {
      article: "4", part: 3,
      title: "Этический/админ. кодекс",
      requirement: "Привлечение по Этическому, Дорожному или Админ. кодексу — НА Генпрокурора/зам. или по решению суда.",
    },
    "4.4": {
      article: "4", part: 4,
      title: "Гражданско-правовая ответственность",
      requirement: "Гражданско-правовая ответственность — по итогам гражданского судопроизводства.",
    },
    "4.5": {
      article: "4", part: 5,
      title: "Иск в гражданском суде",
      requirement: "Гарантии не распространяются, если подан иск/жалоба против неприкосновенного в гражданском судопроизводстве.",
    },
    "4.6": {
      article: "4", part: 6,
      title: "Автотранспорт неприкосновенного",
      requirement: "Служебный и личный автотранспорт + транспорт сопровождения — не досматривается и не обыскивается без согласия.",
    },
    "5.1": {
      article: "5", part: 1,
      title: "USSS в сопровождении",
      requirement: "Если неприкосновенное лицо в сопровождении USSS — статус неприкосновенности распространяется на представителей USSS.",
    },
    "5.2": {
      article: "5", part: 2,
      title: "USSS — спецведомство",
      requirement: "Региональное отделение USSS (Secret Service) — ведомство обеспечения безопасности неприкосновенных.",
    },
    "5.3": {
      article: "5", part: 3,
      title: "Кортеж",
      requirement: "Организованный кортеж с неприкосновенным лицом не может быть остановлен, досмотрен или обыскан при любых обстоятельствах.",
      note: "Дорожный кодекс и аналогичные НПА к кортежу не применяются.",
    },
    "6.1": {
      article: "6", part: 1,
      title: "Приостановление статуса",
      requirement: "а) С начала судебного заседания до оглашения решения; б) Отстранение от должности (до 72 ч) — руководитель/Генпрокурор/суд; в) Авторизован ордер на арест.",
    },
    "7.1": {
      article: "7", part: 1,
      title: "Запрет досмотра и задержания",
      requirement: "Нельзя досмотреть, обыскать или задержать — кроме когда незаконные действия несут непосредственную угрозу жизни и здоровью окружающих.",
    },
    "7.2": {
      article: "7", part: 2,
      title: "Задержание за посягательство на жизнь",
      requirement: "а) Незамедлительно доставить в правоохранительный орган; б) Уведомить лиц, уполномоченных выдать ордер на арест; в) Они решают об ордере и дальнейшей процедуре по ПК.",
      note: "О задержании в кратчайший срок — уведомить тех, кто решает о снятии статуса и ордере.",
    },
    "8.1": {
      article: "8", part: 1,
      title: "Ордер Access to Investigation (AI)",
      requirement: "Досудебные разбирательства и расследования в отношении неприкосновенного — только с ордером AI.",
    },
    "9.1": {
      article: "9", part: 1,
      title: "Независимость судей",
      requirement: "Независимость судей — основной принцип правосудия.",
    },
    "9.2": {
      article: "9", part: 2,
      title: "Ответственность судьи",
      requirement: "Судью нельзя привлечь к ответственности и оказывать давление — кроме случаев по закону.",
    },
    "9.3": {
      article: "9", part: 3,
      title: "Губернатор и суд",
      requirement: "Губернатор и исполнительная власть не могут влиять на судей.",
    },
    "9.4": {
      article: "9", part: 4,
      title: "Разделение властей",
      requirement: "Судебная власть самостоятельна и независима от исполнительной.",
    },
  };

  const KEYWORDS = {
    "2.1": ["губернатор", "вице", "генпрокурор", "судья", "сенатор", "спикер", "weazel", "глава департамент", "кто неприкос", "список"],
    "4.1": ["иммунитет", "нельзя привлеч", "коап", "ответственност"],
    "4.6": ["машин", "авто", "транспорт", "досмотр авто", "без согласия"],
    "5.1": ["usss", "сопровожден", "secret service"],
    "5.3": ["кортеж", "остановил кортеж", "досмотр кортеж"],
    "6.1": ["приостанов", "отстранен", "72 час", "ордер на арест", "судебн заседан"],
    "7.1": ["задержал", "досмотр", "обыск", "угроза жизни", "непосредственн угроз"],
    "7.2": ["убил", "посягательств", "жизнь", "ордер на арест", "уведом"],
    "8.1": ["access to investigation", " ai ", "ордер ai", "расследован"],
    "9.1": ["судья", "независимост", "давление"],
  };

  function normalize(text) {
    return text.toLowerCase().replace(/ё/g, "е").trim();
  }

  function detectTags(text) {
    const n = normalize(text);
    const found = new Set();
    for (const [tag, words] of Object.entries(TAGS)) {
      if (words.some((w) => n.includes(w))) found.add(tag);
    }
    return found;
  }

  function label(data) {
    let s = `ст. ${data.article}`;
    if (data.part != null) s += ` ч.${data.part}`;
    if (data.sub) s += ` п.${data.sub}`;
    return `${s} НП SA`;
  }

  function scoreArticle(text, id) {
    const n = normalize(text);
    const data = ARTICLES[id];
    const kws = [...(KEYWORDS[id] || []), ...(data.title || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3)];
    let score = 0;
    for (const kw of kws) {
      if (n.includes(kw.replace(/ё/g, "е"))) score += Math.max(1, kw.length / 4);
    }
    return score;
  }

  function makeArticle(id, reason, smartMatch = false) {
    const data = ARTICLES[id];
    return {
      id,
      code: "NP",
      label: label(data),
      title: data.title,
      punishment: data.requirement,
      requirement: data.requirement,
      note: data.note || "",
      stars: 0,
      starsDisplay: "—",
      reason,
      smartMatch,
    };
  }

  function applyRules(clause, tags, matched, seen) {
    const lower = normalize(clause);
    const before = seen.size;

    function add(id, reason) {
      if (seen.has(id)) return;
      seen.add(id);
      matched.push(makeArticle(id, reason));
    }

    if (tags.has("list") || tags.has("immunity") || tags.has("senator")) {
      add("2.1", "Перечень неприкосновенных — ст. 2.1 НП");
      add("3.1", "Определение неприкосновенности — ст. 3.1 НП");
    }

    if (tags.has("immunity") || tags.has("responsibility")) {
      add("4.1", "Защита от УК/КоАП/ДК — ст. 4.1 НП");
      add("4.3", "Админ/этика — только Генпрокурор или суд — ст. 4.3 НП");
    }

    if (tags.has("car") || tags.has("search")) {
      add("4.6", "Авто без согласия не досматривают — ст. 4.6 НП");
    }

    if (tags.has("motorcade") || tags.has("usss")) {
      add("5.1", "USSS наследует статус в сопровождении — ст. 5.1 НП");
      add("5.2", "USSS — спецведомство — ст. 5.2 НП");
    }

    if (tags.has("motorcade")) {
      add("5.3", "Кортеж нельзя остановить/досмотреть — ст. 5.3 НП");
    }

    if (tags.has("suspend")) {
      add("6.1", "Основания приостановления статуса — ст. 6.1 НП");
    }

    if (tags.has("detain") || tags.has("search") || tags.has("immunity")) {
      add("7.1", "Запрет досмотра/задержания — ст. 7.1 НП");
    }

    if (tags.has("threat") || (tags.has("detain") && /убил|жизн|убийств/.test(lower))) {
      add("7.2", "Задержание за посягательство на жизнь — ст. 7.2 НП");
    }

    if (tags.has("ai")) {
      add("8.1", "Расследование только с ордером AI — ст. 8.1 НП");
    }

    if (tags.has("judge")) {
      add("9.1", "Независимость судей — ст. 9.1 НП");
      add("9.2", "Нельзя давить на судью — ст. 9.2 НП");
      add("2.1", "Судьи — в перечне неприкосновенных — ст. 2.1 НП");
    }

    if (tags.has("violation")) {
      add("7.1", "Незаконное задержание неприкосновенного — ст. 7.1 НП");
      add("4.1", "Нарушение гарантий — ст. 4.1 НП");
    }

    if (lower.includes("губернатор") || lower.includes("генпрокур")) {
      add("2.1", "Губернатор/Генпрокурор в перечне — ст. 2.1 НП");
    }

    return seen.size === before;
  }

  function smartSearch(text, seen, limit = 4) {
    return Object.keys(ARTICLES)
      .filter((id) => !seen.has(id))
      .map((id) => [id, scoreArticle(text, id)])
      .filter(([, s]) => s >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  function buildRpText(articles) {
    if (!articles.length) return "";
    const lines = ["По Закону о неприкосновенности применимо:"];
    articles.forEach((a) => lines.push(`- ${a.label} — ${a.title};`));
    lines[lines.length - 1] = lines[lines.length - 1].replace(/;$/, ".");
    return lines.join("\n");
  }

  window.analyzeImmunity = function analyzeImmunity(text) {
    const clauses = text.trim().split(/[+;,]|\s+и\s+|\n/).map((p) => p.trim()).filter(Boolean);
    const allTags = new Set();
    const matched = [];
    const seen = new Set();
    const warnings = [];
    let usedSmartSearch = false;

    for (const clause of (clauses.length ? clauses : [text.trim()])) {
      const tags = detectTags(clause);
      tags.forEach((t) => allTags.add(t));
      const noRules = applyRules(clause, tags, matched, seen);
      if (noRules) {
        for (const [id, score] of smartSearch(clause, seen, 2)) {
          seen.add(id);
          matched.push(makeArticle(id, `Подобрано по смыслу: «${clause}» (score ${score.toFixed(1)})`, true));
          usedSmartSearch = true;
        }
      }
    }

    if (!matched.length) {
      for (const [id, score] of smartSearch(text, new Set(), 4)) {
        seen.add(id);
        matched.push(makeArticle(id, `Подобрано по смыслу (score ${score.toFixed(1)})`, true));
        usedSmartSearch = true;
      }
    }

    if (usedSmartSearch) {
      warnings.unshift("Часть статей подобрана умным поиском — проверь по тексту Закона о неприкосновенности.");
    }
    if (!matched.length) {
      warnings.push("Опиши: кто неприкос (губернатор/судья/сенатор), задержание, кортеж, USSS, ордер AI.");
    }

    return {
      code: "NP",
      tags: [...allTags].sort(),
      warnings,
      maxStars: 0,
      totalYears: 0,
      cappedYears: 0,
      rpText: buildRpText(matched),
      articles: matched,
    };
  };
})();
