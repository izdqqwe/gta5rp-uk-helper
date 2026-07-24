(() => {
  const MAX_STACKED_YEARS = 10;

  const TAGS = {
    kill_intentional: ["убил", "убила", "убили", "застрелил", "застрелила", "зарезал", "зарезала", "задушил", "задушила", "пристрелил", "лишил жизни", "расстрел"],
    attempt_kill: ["попытка убийств", "попытка убить", "попытался убить", "попыталась убить", "покушен", "посягательств", "попытка убийства"],
    kill_negligent: ["сбил", "сбила", "случайно убил", "по неосторожности", "неосторожн", "в аффекте", "аффект"],
    gov_employee: ["гос сотрудник", "гос. сотрудник", "государственн", "полиц", "коп", "копа", "lspd", "lscsd", "fib", "usss", "sang", "шериф", "правоохран", "военнослуж", "сотрудник lspd", "сотрудник fib", "департамент", "госа", " гос ", " госа", "госу", "госс", "гос."],
    on_duty: ["при исполнении", "на службе", "в форме", "служебн", "дежур", "патрул"],
    flee: ["скрыл", "скрывал", "убежал", "убегал", "уклон", "с места", "смылся", "взял ноги", "попытался скрыться", "скрыться", "уход от", "уходил от", "сбежал от", "уход от гос"],
    weapon: ["оружи", "пistolet", "пистолет", "ствол", "автомат", "gun", "огнестрел", "винтовк", "дробовик", "нож", "холодное оружие", "боеприпас"],
    gov_weapon: ["гос оружие", "гос. оружие", "оружие гос", "оружие гос.", "оруж гос", "государственн", "служебн оруж", "гос образц", "гос. образц", "спец средств", "спец. средств", "бронежилет", "таzer", "тазер", "дубинк", "гос имуществ", "гос структур", "гос. структур", "оружие гос структур", "оружие госов", "госовск", "госник", "госников"],
    attempt_police_life: ["покушен", "посягательств", "ранил коп", "ранил полиц", "стрелял в коп", "стрелял в полиц", "не убил коп", "не убил полиц"],
    robbery: ["ограбил", "ограбление", "грабеж", "грабил", "отобрал", "выбил", "разбой"],
    theft: ["украл", "кража", "воровал", "хищение", "тайно похитил", "своровал", "стянул", "тащил"],
    carjack: ["угнал", "угон", "завладел авто", "завладел машин", "угнал машин", "угнал тачк"],
    gov_carjack: ["гос транспорт", "гос. транспорт", "служебн машин", "полицейск машин", "государственн транспорт"],
    kidnap: ["похитил человек", "похищение", "заложник", "захватил человек", "похитил", "связал", "удержива"],
    illegal_entry: ["незаконно проник", "проникновен", "проник на", "проник в", "проникнут", "проник на объект", "залез на территор", "влез на охраняем", "влез на территор", "охраняем", "охраняему", "охраняемую", "охраняемой", "охраняемая", "охраняем территор", "на охраняем", "на территор", "залез на охраняем", "незаконное проникновен", "вторжени", "залез в", "залез на баз"],
    drugs_small: ["наркот", "трав", "марихуан", "каннаб", "3 грамм", "5 грамм", "кокаин", "мет"],
    drugs_large: ["25 грамм", "сбыт нарк", "продавал нарк", "оптов"],
    threat_kill: ["угроза убийств", "угрожал убить", "угрожал убийств"],
    insult_authority: ["оскорбил коп", "оскорбил полиц", "оскорбление представител", "нахуй коп", "оскорбил lspd", "унизил коп", "оскорбил гос", "оскорбление гос", "оскорбил", "оскорбление", "унизил", "хамил", "материл", "послал", "базарил", "нагрубил"],
    disobey: ["неповиновен", "не подчинился", "игнорировал требован", "не выполнил распоряжен", "отказался", "не слушался"],
    interfere_arrest: ["вмешался в задержан", "мешал задержан", "вмешательство в задержан", "помеха задержан", "помеха арест", "помешал задержан", "помешал арест", "мешал арест", "воспрепятствован", "помеха задержанию", "помеха аресту", "мешал копу задерж", "спасал от ареста", "выбил из рук"],
    interfere_arrest_official: ["помеха задержанию от гос", "помеха аресту от гос", "от госа", "гос мешал задержан", "коп мешал задержан", "должност мешал", "злоупотребил полномоч", "использован полномоч", "должностн лицо мешал", "вмешательство должност", "воспрепятствовал задержан"],
    bribe: ["взятк", "подкупил", "дал денег коп", "откат"],
    terrorism: ["террор", "взрыв", "поджог", "бомб"],
    extortion: ["вымог", "вымогательств", "требовал деньги под угроз"],
    fraud: ["мошеннич", "обманул", "развод", "скам"],
    damage_property: ["повредил имуществ", "сломал", "разбил", "уничтожил имуществ", "поджег машин", "вандал"],
    fake_docs: ["подделал документ", "фальшив", "поддельн удостоверен", "фейк лиценз"],
    false_report: ["ложный вызов", "ложн сообщ", "набрал 911", "фейк вызов"],
    evade_punishment: ["уклонение от отбыван", "сбежал из тюрьм", "не отбывает срок"],
  };

  const STEMS = {
    illegal_entry: ["проник", "влез", "залез", "вторж", "охраняем", "территор"],
    kill_intentional: ["убил", "убила", "убили", "застрел", "зареза", "задуш", "пристрел"],
    attempt_kill: ["покуш", "попыт", "посягат"],
    flee: ["скрыл", "убеж", "уклон", "сбеж", "уход"],
    weapon: ["оруж", "пistolet", "пистолет", "ствол", "автомат", "нож", "огнестр"],
    gov_weapon: ["гос оруж", "оружие гос", "гос структур", "госовск", "госник", "спец сред", "бронеж"],
    gov_employee: ["гос", "полиц", "коп", "lspd", "lscsd", "fib", "usss", "шериф", "правоохран"],
    theft: ["украл", "краж", "воровал", "стянул", "своровал", "хищен"],
    robbery: ["ограб", "грабеж", "грабил", "разбой", "отобрал"],
    carjack: ["угнал", "угон", "завладел"],
    drugs_small: ["наркот", "трав", "марихуан", "каннаб", "кокаин", "мет"],
    insult_authority: ["оскорб", "унизил", "хамил", "послал"],
    disobey: ["неповинов", "не подчин", "игнорир", "отказал"],
    kidnap: ["похит", "заложник", "захватил", "связал"],
    terrorism: ["террор", "взрыв", "бомб", "поджог"],
    fraud: ["мошенн", "обманул", "скам", "развод"],
    damage_property: ["сломал", "разбил", "уничтож", "повредил", "поджег"],
    bribe: ["взятк", "подкуп", "откат"],
  };

  const ARTICLE_KEYWORDS = {
    "6.2.1": ["убил", "убийств", "застрел", "зарезал", "задушил", "пристрелил", "лишил жизни", "смерть"],
    "6.3": ["тяжкое убийств", "убил двух", "убил коп", "убил полиц", "убил гос", "жесток", "найм"],
    "6.6": ["угроза убийств", "угрожал убить", "угрожал расправ"],
    "7.1": ["похитил", "похищен", "заложник", "захватил", "удержива", "связал"],
    "10.1": ["украл", "кража", "воровал", "своровал", "стянул", "хищен"],
    "10.3": ["грабеж", "грабил", "отобрал", "выбил", "открыто"],
    "10.4": ["разбой", "напал", "ограбил с оруж"],
    "10.5": ["угнал", "угон", "завладел", "тачк", "машин", "авто"],
    "10.6": ["сломал", "разбил", "уничтожил", "повредил", "поджег", "вандал"],
    "12.1": ["террор", "взрыв", "бомб", "поджог"],
    "12.7.1": ["проник", "проникновен", "залез", "влез", "вторж", "охраняем", "территор", "объект", "база", "забрался"],
    "12.7.2": ["особо охраняем", "военн", "fib", "форта", "склад улик"],
    "12.8.2": ["оружие", "пistolet", "пистолет", "ствол", "автомат", "нож", "огнестрел"],
    "12.8.1_special": ["гос оруж", "оружие гос", "гос структур", "госовск", "госник", "спец средств", "бронежилет", "таzer", "дубинк"],
    "13.2": ["наркот", "трав", "марихуан", "каннаб", "кокаин", "мет", "грамм"],
    "13.2.1": ["25 грамм", "сбыт нарк", "продавал нарк", "оптов"],
    "15.5": ["взятк", "подкупил", "откат"],
    "16.12": ["скрыл", "убежал", "уклон", "уход от", "сбежал", "скрывал", "с места", "погон"],
    "16.15": ["сбежал из тюрьм", "не отбывает", "побег"],
    "17.1": ["покушен", "попытка убийств", "посягательств", "стрелял в коп", "ранил коп", "попытался убить"],
    "17.2": ["ударил коп", "толкнул коп", "угрожал коп", "избил полиц"],
    "17.3": ["оскорбил", "оскорбление", "унизил", "хамил", "материл", "послал", "базарил", "оскорбил гос", "оскорбил полиц", "оскорбил коп"],
    "15.1.1.2": ["помеха задержан", "помеха арест", "вмешательство в задержан", "воспрепятствован", "злоупотребил полномоч", "должност", "от гос", "мешал задержан", "мешал арест"],
    "17.4": ["вмешался в задержан", "мешал задержан", "выбил из рук", "спасал от ареста", "помеха задержан", "помешал задержан"],
    "17.6": ["неповиновен", "не подчинился", "игнорировал", "отказался"],
    "17.8": ["поддел", "фальшив", "фейк", "лиценз", "удостоверен"],
    "17.9": ["ложный вызов", "фейк вызов", "911"],
  };

  const ARTICLES = {
    "6.2.1": { article: "6.2", part: 1, title: "Убийство (умышленное)", stars: 4, punishment: "4 года лишения свободы" },
    "6.2.2": { article: "6.2", part: 2, title: "Причинение смерти по неосторожности/в аффекте", stars: 3, punishment: "3 года лишения свободы" },
    "6.3": { article: "6.3", part: null, title: "Тяжкое убийство", stars: 5, punishment: "5 лет лишения свободы" },
    "6.6": { article: "6.6", part: null, title: "Угроза убийством или тяжким вредом здоровью", stars: 3, punishment: "3 года или штраф $30 000–50 000" },
    "7.1": { article: "7.1", part: null, title: "Похищение человека", stars: 5, punishment: "5 лет лишения свободы" },
    "10.1": { article: "10.1", part: null, title: "Кража (свыше $15 000)", stars: 3, punishment: "3 года лишения свободы" },
    "10.2": { article: "10.2", part: null, title: "Мошенничество", stars: 3, punishment: "3 года лишения свободы" },
    "10.2.1": { article: "10.2.1", part: null, title: "Вымогательство", stars: 3, punishment: "3 года лишения свободы" },
    "10.3": { article: "10.3", part: null, title: "Грабеж", stars: 3, punishment: "3 года лишения свободы" },
    "10.4": { article: "10.4", part: null, title: "Разбой", stars: 4, punishment: "4 года лишения свободы" },
    "10.5": { article: "10.5", part: null, title: "Неправомерное завладение ТС", stars: 3, punishment: "3 года лишения свободы" },
    "10.5.1": { article: "10.5.1", part: null, title: "Неправомерное завладение гос. ТС", stars: 4, punishment: "4 года лишения свободы" },
    "10.6": { article: "10.6", part: null, title: "Умышленное уничтожение чужого имущества", stars: 3, punishment: "3 года лишения свободы" },
    "12.1": { article: "12.1", part: null, title: "Терроризм", stars: 5, punishment: "5 лет лишения свободы" },
    "12.7.1": { article: "12.7", part: 1, title: "Незаконное проникновение на охраняемый объект", stars: 3, punishment: "3 года или штраф $20 000–50 000" },
    "12.7.2": { article: "12.7", part: 2, title: "Незаконное проникновение на особо охраняемый объект", stars: 4, punishment: "4 года или штраф $60 000–80 000" },
    "12.8.2": { article: "12.8", part: 2, title: "Незаконное хранение, ношение или использование оружия", stars: 4, punishment: "4 года или штраф $10 000–30 000" },
    "12.8.1_special": { article: "12.8.1", part: null, title: "Гос. оружие и спецсредства у гражданского лица", stars: 5, punishment: "5 лет лишения свободы", displayArticle: "12.8.1" },
    "13.2": { article: "13.2", part: null, title: "Наркотики от 3 грамм", stars: 4, punishment: "4 года или штраф $40 000–60 000" },
    "13.2.1": { article: "13.2.1", part: null, title: "Наркотики свыше 25 г или со сбытом", stars: 5, punishment: "5 лет лишения свободы" },
    "15.5": { article: "15.5", part: null, title: "Дача взятки", stars: 5, punishment: "5 лет лишения свободы" },
    "15.1.1.2": { article: "15.1.1", part: 2, title: "Вмешательство должностного лица в задержание/арест/разбирательство", stars: 5, punishment: "5 лет или штраф $40 000–90 000" },
    "16.12": { article: "16.12", part: null, title: "Уклонение от расследования, задержания и суда", stars: 4, punishment: "4 года лишения свободы" },
    "16.15": { article: "16.15", part: null, title: "Уклонение от отбывания наказания", stars: 4, punishment: "2–5 лет лишения свободы" },
    "17.1": { article: "17.1", part: null, title: "Посягательство на жизнь сотрудника правоохранительного органа", stars: 5, punishment: "5 лет лишения свободы" },
    "17.2": { article: "17.2", part: null, title: "Применение насилия/угроза в отношении сотрудника", stars: 4, punishment: "4 года лишения свободы" },
    "17.3": { article: "17.3", part: null, title: "Оскорбление представителя власти", stars: 3, punishment: "3 года или штраф $20 000–50 000" },
    "17.4": { article: "17.4", part: 1, title: "Вмешательство в процесс задержания", stars: 3, punishment: "3 года или штраф $10 000–50 000" },
    "17.6": { article: "17.6", part: null, title: "Неповиновение законному распоряжению", stars: 3, punishment: "3 года или штраф $10 000–50 000" },
    "17.8": { article: "17.8", part: null, title: "Подделка документов/лицензий", stars: 4, punishment: "4 года лишения свободы" },
    "17.9": { article: "17.9", part: null, title: "Ложный вызов о похищении/заложниках", stars: 4, punishment: "4 года лишения свободы" },
  };

  function normalize(text) {
    return text.toLowerCase().replace(/ё/g, "е").trim();
  }

  function splitClauses(text) {
    return text.split(/[+;,]|\s+и\s+|\n/).map((p) => p.trim()).filter(Boolean);
  }

  function detectTags(text) {
    const normalized = normalize(text);
    const found = new Set();
    for (const [tag, keywords] of Object.entries(TAGS)) {
      if (keywords.some((k) => normalized.includes(k))) found.add(tag);
    }
    for (const [tag, stems] of Object.entries(STEMS)) {
      if (found.has(tag)) continue;
      if (stems.some((s) => normalized.includes(s))) found.add(tag);
    }
    return found;
  }

  function articleLabel(data) {
    const base = data.displayArticle || data.article;
    return data.part != null ? `ст. ${base} ч.${data.part} УК SA` : `ст. ${base} УК SA`;
  }

  function yearsFromPunishment(punishment) {
    const match = punishment.match(/(\d+)\s*(?:лет|года|год)/);
    return match ? Number(match[1]) : 0;
  }

  function isAttemptOnLife(text, tags) {
    const normalized = normalize(text);
    return tags.has("attempt_kill") || tags.has("attempt_police_life") || (normalized.includes("попыт") && normalized.includes("убий"));
  }

  function scoreArticle(text, articleId) {
    const normalized = normalize(text);
    const data = ARTICLES[articleId];
    if (!data) return 0;
    const keywords = [...(ARTICLE_KEYWORDS[articleId] || []), ...data.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)];
    let score = 0;
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase().replace(/ё/g, "е");
      if (normalized.includes(kw)) score += Math.max(1, kw.length / 4);
    }
    return score;
  }

  function smartSearch(text, seen, limit = 4) {
    const normalized = normalize(text);
    const detentionContext = ["задержан", "арест", "помех", "вмешат", "аресту"].some((x) => normalized.includes(x));
    return Object.keys(ARTICLES)
      .filter((id) => !seen.has(id))
      .map((id) => {
        let score = scoreArticle(text, id);
        if (detentionContext && ["10.5.1", "12.8.1_special", "12.8.2", "12.10"].includes(id)) {
          if (!["угнал", "оруж", "пistolet", "пистолет", "транспорт", "машин", "авто", "ствол"].some((x) => normalized.includes(x))) {
            score *= 0.15;
          }
        }
        return [id, score];
      })
      .filter(([, score]) => score >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  function makeArticle(id, reason, smartMatch = false) {
    const data = ARTICLES[id];
    return {
      id,
      label: articleLabel(data),
      title: data.title,
      stars: data.stars,
      starsDisplay: "★".repeat(data.stars),
      punishment: data.punishment,
      reason,
      smartMatch,
    };
  }

  function applyRules(clause, tags, matched, seen, stackWeaponArticles) {
    const lower = normalize(clause);
    const isAttempt = isAttemptOnLife(clause, tags);
    const completedKill = tags.has("kill_intentional") && !isAttempt;
    const before = seen.size;

    function add(id, reason) {
      if (seen.has(id)) return;
      seen.add(id);
      matched.push(makeArticle(id, reason));
    }

    if (isAttempt && tags.has("gov_employee")) add("17.1", "Покушение / посягательство на жизнь гос. сотрудника (ст. 17.1)");
    else if (isAttempt && ["убий", "стрелял", "ранил", "покуш"].some((w) => lower.includes(w))) add("17.1", "Покушение / посягательство на жизнь");

    if (completedKill && tags.has("gov_employee")) add("6.3", "Убийство гос. сотрудника");
    else if (completedKill) add("6.2.1", "Умышленное причинение смерти");
    if (tags.has("kill_negligent") && !completedKill) add("6.2.2", "Смерть по неосторожности");

    if (tags.has("weapon") || tags.has("gov_weapon")) {
      add("12.8.2", "Незаконное хранение, ношение или использование оружия");
      if (tags.has("gov_weapon") && stackWeaponArticles) add("12.8.1_special", "Гос. оружие (вариант 3: обе статьи)");
      else if (tags.has("gov_weapon")) {
        const idx = matched.findIndex((a) => a.id === "12.8.2");
        if (idx >= 0) { matched.splice(idx, 1); seen.delete("12.8.2"); }
        add("12.8.1_special", "Государственное оружие или спецсредства");
      }
    }

    if (tags.has("flee")) add("16.12", "Уклонение от задержания");
    if (tags.has("evade_punishment")) add("16.15", "Уклонение от отбывания наказания");
    if (tags.has("robbery")) add(tags.has("weapon") || lower.includes("разбой") ? "10.4" : "10.3", tags.has("weapon") || lower.includes("разбой") ? "Разбой" : "Грабеж");
    if (tags.has("theft") && !tags.has("robbery")) add("10.1", "Кража");
    if (tags.has("carjack")) add(tags.has("gov_carjack") ? "10.5.1" : "10.5", "Угон транспорта");
    if (tags.has("damage_property")) add("10.6", "Повреждение имущества");
    if (tags.has("kidnap")) add("7.1", "Похищение человека");
    if (tags.has("threat_kill") && !completedKill && !isAttempt) add("6.6", "Угроза убийством");
    if (tags.has("drugs_large")) add("13.2.1", "Наркотики свыше 25 г");
    else if (tags.has("drugs_small")) add("13.2", "Наркотики");
    if (tags.has("insult_authority")) add("17.3", "Оскорбление представителя власти");
    if (tags.has("disobey")) add("17.6", "Неповиновение");
    if (tags.has("interfere_arrest_official") || (tags.has("interfere_arrest") && ["от гос", "должност", "полномоч", "злоупотреб"].some((x) => lower.includes(x)))) {
      add("15.1.1.2", "Вмешательство/помеха должностного лица в задержание или арест (ст. 15.1.1 ч.2)");
    } else if (tags.has("interfere_arrest")) {
      add("17.4", "Вмешательство в процесс задержания (гражданское лицо)");
    }
    if (tags.has("bribe")) add("15.5", "Дача взятки");
    if (tags.has("terrorism")) add("12.1", "Терроризм");
    if (tags.has("extortion")) add("10.2.1", "Вымогательство");
    if (tags.has("fraud")) add("10.2", "Мошенничество");
    if (tags.has("fake_docs")) add("17.8", "Подделка документов");
    if (tags.has("false_report")) add("17.9", "Ложный вызов");
    if (tags.has("illegal_entry")) {
      if (["особо охран", "fib", "военн", "форта"].some((x) => lower.includes(x))) add("12.7.2", "Особо охраняемый объект");
      else add("12.7.1", "Незаконное проникновение на охраняемый объект");
    }

    return seen.size === before;
  }

  function buildRpText(articles, maxStars, totalYears, cappedYears) {
    if (!articles.length) return "";
    const lines = ["Вам вменяется:"];
    articles.forEach((a) => lines.push(`- ${a.label} — ${a.title.toLowerCase()};`));
    lines[lines.length - 1] = lines[lines.length - 1].replace(/;$/, ".");
    lines.push(`Совокупность преступлений. Уровень розыска: ${"★".repeat(maxStars) || "—"}.`);
    if (totalYears > MAX_STACKED_YEARS) lines.push(`Наказание по совокупности: до ${cappedYears} лет (ст. 5.9 ч.4, максимум ${MAX_STACKED_YEARS} лет).`);
    else if (totalYears) lines.push(`Суммарный срок по статьям: до ${totalYears} лет.`);
    return lines.join("\n");
  }

  window.analyzeLaw = function analyzeLaw(text, stackWeaponArticles = true) {
    const clauses = splitClauses(text.trim());
    const allTags = new Set();
    const matched = [];
    const seen = new Set();
    const warnings = [];
    let usedSmartSearch = false;

    for (const clause of (clauses.length ? clauses : [text.trim()])) {
      const tags = detectTags(clause);
      tags.forEach((t) => allTags.add(t));
      const noRules = applyRules(clause, tags, matched, seen, stackWeaponArticles);
      if (noRules) {
        for (const [id, score] of smartSearch(clause, seen, 2)) {
          seen.add(id);
          matched.push(makeArticle(id, `Подобрано по смыслу: «${clause}» (умный поиск, score ${score.toFixed(1)})`, true));
          usedSmartSearch = true;
        }
      }
    }

    if (!matched.length) {
      for (const [id, score] of smartSearch(text, new Set(), 4)) {
        seen.add(id);
        matched.push(makeArticle(id, `Подобрано по смыслу всего описания (умный поиск, score ${score.toFixed(1)})`, true));
        usedSmartSearch = true;
      }
    }

    if (usedSmartSearch) {
      warnings.unshift("Часть статей подобрана умным поиском по смыслу текста — проверь квалификацию перед RP.");
    }
    if (!matched.length) {
      const suggestions = smartSearch(text, new Set(), 3);
      if (suggestions.length) {
        warnings.push(`Точного совпадения нет. Возможно: ${suggestions.map(([id]) => `ст. ${ARTICLES[id].article}`).join(", ")}. Опиши подробнее.`);
      } else {
        warnings.push("Не удалось подобрать статьи. Опиши: что сделал, кому, было ли оружие, скрылся ли.");
      }
    }

    const maxStars = matched.reduce((m, a) => Math.max(m, a.stars), 0);
    const totalYears = matched.reduce((s, a) => s + yearsFromPunishment(a.punishment), 0);
    const cappedYears = Math.min(totalYears, MAX_STACKED_YEARS);

    return {
      tags: [...allTags].sort(),
      warnings,
      maxStars,
      totalYears,
      cappedYears,
      usedSmartSearch,
      rpText: buildRpText(matched, maxStars, totalYears, cappedYears),
      articles: matched,
    };
  };
})();
