(() => {
  const TAGS = {
    guarded: ["охраняем", "желт", "yellow", "холл", "lspd", "lscsd", "ems", "weazel", "wn", "капитолий", "government"],
    special: ["особо охраняем", "красн", "red", "fort", "занкудо", "zancudo", "fib офис", "авианос", "кайо", "cayo", "perico"],
    adjacent: ["прилегающ", "бел", "white", "белая зона", "парковк"],
    kpz: ["кпз", "клетк", "допросн", "коридор кпз"],
    fib: ["fib", "фрб", "федеральн расслед"],
    fort: ["форт", "занкудо", "zancudo", "national guard", "нац гвард"],
    carrier: ["авианос", "carrier", "1 мил", "миля от авианос"],
    cayo: ["кайо", "cayo", "perico", "перико"],
    capitol: ["капитолий", "capitol", "government", "правительств", "сенат"],
    court: ["суд", "заседан", "судья", "пристав", "зал суда"],
    lawyer_access: ["адвокат на кпз", "адвокат fib", "адвокат lspd", "5 минут покинуть"],
    pass: ["пропуск", "временный пропуск", "30 суток"],
    wrong_purpose: ["не та цель", "выгнали", "покинуть территор", "нет цели визит", "выдвор"],
    lspd_visit: ["cdwl", "лицензия оруж", "трудоустрой", "явка с повинной", "сдать нелег"],
    check_docs: ["документ", "удостоверяющ", "назвать причин", "проверить документ"],
    colors: ["белый", "желтый", "красный", "цвет зон", "визуализац"],
  };

  const ARTICLES = {
    "1.1": {
      article: "1", part: 1,
      title: "Основные понятия",
      requirement: "Охраняемый объект — ограниченный доступ для безопасности. Особо охраняемый — повышенная важность, только по разрешению. Прилегающий — белый на схеме.",
    },
    "2.1": {
      article: "2", part: 1,
      title: "Охраняемые объекты",
      requirement: "Капитолий; участки LSPD/LSCSD; EMS; Weazel News; иные объекты по НПА.",
      note: "Холл госучреждений + прилегающая территория FIB — только по законным целям визита. Сотрудник может потребовать покинуть при несоответствии цели.",
    },
    "2.2": {
      article: "2", part: 2,
      title: "Законные цели визита (открытый список)",
      requirement: "LSPD/LSCSD: CDWL, трудоустройство, заявление о правонарушении, явка с повинной, сдача нелегала. FIB: сдача нелегала, трудоустройство. Gov: секретарь, снятие судимости, лицензии, приём, трудоустройство, юр. помощь, выборы. EMS: медпомощь, документы, лицензии, трудоустройство. WN: СМИ, трудоустройство.",
    },
    "3.1": {
      article: "3", part: 1,
      title: "Особо охраняемые объекты",
      requirement: "Форт Занкудо; офис FIB; авианосец + воды 1 миля; Кайо-Перико + воды 1 миля (кроме аэропорта Кайо).",
    },
    "4.a": {
      article: "4", sub: "а",
      title: "Доступ: Форт Занкудo",
      requirement: "NG, Губернатор/Вице, Генпрокурор/зам., глава DNB/зам., госструктуры при спецоперации, ОГП по распоряжению генпрокурора.",
      note: "Иные — с генералитетом NG или пропуском от Генерала NG/зам./Губернатора. EMS — плановые проверки.",
    },
    "4.b": {
      article: "4", sub: "б",
      title: "Доступ: авианосец (+ 1 миля вод)",
      requirement: "NG, Губернатор/Вице, Генпрокурор/зам., глава DNB/зам. Госструктуры — при поставке материалов с авианосца.",
    },
    "4.v": {
      article: "4", sub: "в",
      title: "Доступ: офис FIB",
      requirement: "Губернатор/Вице, генпрокурор/зам., DNB, ОГП, FIB, EMS (проверки), руководство при задержании подчинённых, копы/военные с руководством FIB.",
      note: "Адвокаты — только КПЗ и путь в/из КПЗ по вызову (договор/приложение); после вызова — покинуть за 5 мин. Пропуск от Директора FIB/зам. или временный от Губернатора/Генпрокурора (до 30 сут.).",
    },
    "4.g": {
      article: "4", sub: "г",
      title: "Доступ: Капитолий (кроме холла)",
      requirement: "Сотрудники правительства, EMS (медпомощь/проверки), иные — с сопровождением правительства, участники заседания суда/сената или пропуск.",
      note: "Суд/сенат — не ранее 10 мин до начала; без цели на заседание могут выдворить.",
    },
    "4.d": {
      article: "4", sub: "д",
      title: "Доступ: LSPD / LSCSD / парковки (кроме холла)",
      requirement: "Губернатор/Вице, генпрокурор/зам., DNB, ОГП, копы при процессуальных действиях, адвокаты — КПЗ и путь в/из, IB на КПЗ, EMS, DB/CID на КПЗ для допроса, руководство при задержании подчинённых.",
      note: "Граждане — с PAI/SAI (CDWL/трудоустройство) или пропуск от Шефа/Шерифа/зам. или временный от Губернатора/Генпрокурора (до 30 сут.). Адвокат после вызова — покинуть за 5 мин.",
    },
    "4.d.kpz": {
      article: "4", sub: "д",
      title: "Что такое КПЗ",
      requirement: "Комната с клетками, допросные и коридоры рядом с ними.",
      note: "Исключение: раздевалка/оружейный склад Sheriff Paleto; служебная парковка и иные помещения LSPD без отношения к КПЗ.",
    },
    "4.e": {
      article: "4", sub: "е",
      title: "Доступ: здания EMS",
      requirement: "Губернатор/Вице, генпрокурор/зам., главы департаментов, ОГП, копы при вызове, EMS, иные — с сопровождением EMS (консультация, трудоустройство, справки) или пропуск главврача.",
    },
    "4.zh": {
      article: "4", sub: "ж",
      title: "Доступ: Кайо-Перико (+ 1 миля вод)",
      requirement: "Губернатор/Вице, генпрокурор/зам., DNB/зам., ОГП, госструктуры при исполнении.",
      note: "Аэропорт Кайо — открытая территория.",
    },
    "4.z": {
      article: "4", sub: "з",
      title: "Доступ: Weazel News",
      requirement: "Губернатор/Вице, генпрокурор/зам., главы департаментов, ОГП, копы при вызове, EMS, WN; иные — с пропуском Директора WN/зам.",
      note: "Посетители допускаются в холл WN. LSPD — беспрепятственный доступ на участки LSPD; Sheriff — на участки Sheriff.",
    },
    "5.1": {
      article: "5", part: 1,
      title: "Регламент посещения суда",
      requirement: "Допуск по документам; отказ — нет документов, отказ от досмотра, запрещённые предметы, неподобающий вид, опьянение, животные.",
      note: "Открытые заседания — нельзя отказать только за то, что не участник процесса. Закрытое — судья ограничивает доступ.",
    },
    "5.1.2": {
      article: "5", part: 1, sub: "1.2.2",
      title: "Выдворение из суда",
      requirement: "Пристав/судья может выдворить за нарушение порядка, телефон не на без звука, вмешательство в процесс, реплики.",
    },
    "6.1": {
      article: "6", part: 1,
      title: "Визуализация территорий",
      requirement: "Белый — прилегающие + холл (доступ всем). Жёлтый — охраняемые. Красный — особо охраняемые.",
      note: "На белых зонах коп/представитель организации может потребовать покинуть при нарушении закона.",
    },
    "7.1": {
      article: "7", part: 1,
      title: "Права сотрудников на прилегающих территориях",
      requirement: "Копы и военные вправе требовать назвать причину пребывания и проверять документы.",
    },
  };

  const KEYWORDS = {
    "1.1": ["охраняем", "особо охраняем", "прилегающ", "понят"],
    "2.1": ["охраняем объект", "капитолий", "lspd", "lscsd", "ems", "weazel", "холл"],
    "2.2": ["цель визит", "cdwl", "трудоустрой", "явка с повинной", "сдать нелег", "юридическ помощ"],
    "3.1": ["особо охраняем", "занкудо", "fib", "авианос", "кайо", "perico"],
    "4.a": ["форт", "занкудo", "zancudo", "national guard", "нац гвард"],
    "4.b": ["авианос", "carrier", "миля"],
    "4.v": ["fib офис", "fib кпз", "офис fib", "фрб"],
    "4.g": ["капитолий", "capitol", "сенат", "правительств"],
    "4.d": ["lspd", "lscsd", "sheriff", "шериф", "шеф полиц", "парковк", "pai", "sai"],
    "4.d.kpz": ["кпз", "клетк", "допросн", "раздевалк", "оружейный склад"],
    "4.e": ["ems", "больниц", "медицин", "главврач"],
    "4.zh": ["кайо", "cayo", "perico", "перико", "аэропорт кайо"],
    "4.z": ["weazel", "wn", "новост"],
    "5.1": ["суд", "заседан", "пристав", "досмотр в суд", "отказ в суд"],
    "5.1.2": ["выгнали из суда", "выдвор", "телефон в суде", "мешал суд"],
    "6.1": ["белый", "желтый", "красный", "цвет", "визуализац", "прилегающ"],
    "7.1": ["прилегающ", "назвать причин", "проверить документ", "белая зона"],
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
    return `${s} П1 УК SA`;
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
      code: "P1",
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

    if (tags.has("guarded") || tags.has("lspd_visit")) {
      add("2.1", "Охраняемые объекты — ст. 2 П1 УК");
      add("2.2", "Законные цели визита — ст. 2 П1 УК");
    }

    if (tags.has("special") || tags.has("fort") || tags.has("fib") || tags.has("carrier") || tags.has("cayo")) {
      add("3.1", "Особо охраняемые объекты — ст. 3 П1 УК");
    }

    if (tags.has("fort")) add("4.a", "Доступ на Форт Занкудo — ст. 4 п.а П1 УК");
    if (tags.has("carrier")) add("4.b", "Доступ на авианос — ст. 4 п.б П1 УК");
    if (tags.has("fib")) {
      add("4.v", "Доступ в офис FIB — ст. 4 п.в П1 УК");
    }
    if (tags.has("capitol")) add("4.g", "Доступ в Капитолий — ст. 4 п.г П1 УК");
    if (tags.has("guarded") && (lower.includes("lspd") || lower.includes("lscsd") || lower.includes("sheriff") || lower.includes("шериф"))) {
      add("4.d", "Доступ на участки LSPD/LSCSD — ст. 4 п.д П1 УК");
    }
    if (tags.has("kpz")) {
      add("4.d.kpz", "Что входит в КПЗ — прим. 6 ст. 4 П1 УК");
      add("4.d", "Доступ адвокатов/IB/DB на КПЗ — ст. 4 п.д П1 УК");
      if (lower.includes("fib")) add("4.v", "Адвокат на КПЗ FIB — ст. 4 п.в П1 УК");
    }
    if (tags.has("lawyer_access")) {
      add("4.v", "Адвокат: КПЗ FIB, 5 мин после вызова — ст. 4 п.в П1 УК");
      add("4.d", "Адвокат: КПЗ LSPD/LSCSD, 5 мин после вызова — ст. 4 п.д П1 УК");
    }
    if (tags.has("cayo")) add("4.zh", "Доступ на Кайо-Перико — ст. 4 п.ж П1 УК");
    if (lower.includes("weazel") || lower.includes("wn")) add("4.z", "Доступ Weazel News — ст. 4 п.з П1 УК");
    if (lower.includes("ems") || lower.includes("больниц")) add("4.e", "Доступ EMS — ст. 4 п.е П1 УК");

    if (tags.has("court")) {
      add("5.1", "Регламент суда — ст. 5 П1 УК");
    }
    if (tags.has("colors") || tags.has("adjacent")) {
      add("6.1", "Цвета зон: белый/жёлтый/красный — ст. 6 П1 УК");
    }
    if (tags.has("adjacent") || tags.has("check_docs")) {
      add("7.1", "Проверка на прилегающих — ст. 7 П1 УК");
    }
    if (tags.has("wrong_purpose")) {
      add("2.1", "Несоответствие цели визита — прим. 1 ст. 2 П1 УК");
      add("7.1", "Требование покинуть прилегающую — ст. 6–7 П1 УК");
    }
    if (tags.has("pass")) {
      add("4.d", "Пропуски до 30 суток — ст. 4 п.д П1 УК");
      add("4.v", "Пропуски FIB до 30 суток — ст. 4 п.в П1 УК");
    }
    if (tags.has("lspd_visit")) add("2.2", "Законная цель визита в LSPD — ст. 2 П1 УК");

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
    const lines = ["По Приложению №1 УК (закрытые территории) применимо:"];
    articles.forEach((a) => lines.push(`- ${a.label} — ${a.title};`));
    lines[lines.length - 1] = lines[lines.length - 1].replace(/;$/, ".");
    return lines.join("\n");
  }

  window.analyzeTerritories = function analyzeTerritories(text) {
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
      warnings.unshift("Часть статей подобрана умным поиском — проверь по тексту Приложения №1 УК.");
    }
    if (!matched.length) {
      warnings.push("Опиши: объект (FIB/LSPD/форт/кайо), цель визита, КПЗ, цвет зоны, суд, пропуск.");
    }

    return {
      code: "P1",
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
