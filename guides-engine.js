(() => {
  let guidesCache = null;

  function normalize(text) {
    return text.toLowerCase().replace(/ё/g, "е").trim();
  }

  async function loadGuides() {
    if (guidesCache) return guidesCache;
    try {
      const res = await fetch("data/guides.json");
      if (res.ok) {
        guidesCache = await res.json();
        return guidesCache;
      }
    } catch {
      /* file:// or offline */
    }
    if (window.GUIDES_EMBEDDED) {
      guidesCache = window.GUIDES_EMBEDDED;
      return guidesCache;
    }
    return [];
  }

  function scoreGuide(text, guide) {
    const n = normalize(text);
    let score = 0;
    for (const kw of guide.keywords || []) {
      const k = kw.toLowerCase().replace(/ё/g, "е");
      if (n.includes(k)) score += Math.max(2, k.length / 3);
    }
    if (guide.category && n.includes(guide.category)) score += 1.5;
    for (const word of guide.title.toLowerCase().split(/\s+/)) {
      if (word.length > 4 && n.includes(word)) score += 0.5;
    }
    return score;
  }

  function audienceLabel(a) {
    return { cop: "для копа", criminal: "для задержанного", both: "для всех" }[a] || a;
  }

  function formatArticles(articles) {
    if (!articles) return "";
    const parts = [];
    if (articles.uk?.length) parts.push(`УК: ${articles.uk.join(", ")}`);
    if (articles.pk?.length) parts.push(`ПК: ${articles.pk.join(", ")}`);
    if (articles.adv?.length) parts.push(`ЗА: ${articles.adv.join(", ")}`);
    return parts.join(" · ");
  }

  window.analyzeGuides = async function analyzeGuides(text, category = null) {
    const guides = await loadGuides();
    const trimmed = text.trim();
    const warnings = [];

    let matched = guides
      .map((g) => ({ guide: g, score: trimmed ? scoreGuide(trimmed, g) : 0 }))
      .filter(({ guide, score }) => {
        if (category && category !== "all" && guide.category !== category) return false;
        if (!trimmed) return true;
        return score >= 1;
      })
      .sort((a, b) => b.score - a.score);

    if (trimmed) {
      matched = matched.filter((m) => m.score >= 1);
      if (!matched.length) {
        matched = guides
          .map((g) => ({ guide: g, score: scoreGuide(trimmed, g) }))
          .filter((m) => m.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);
        if (matched.length) {
          warnings.push("Точной ситуации нет — показаны близкие сценарии.");
        }
      } else {
        matched = matched.slice(0, 6);
      }
    } else if (category && category !== "all") {
      matched = matched.slice(0, 12);
    } else {
      matched = matched.slice(0, 8);
    }

    if (!matched.length) {
      warnings.push("Ничего не найдено. Попробуй: «как задержать», «неприкос», «прокурор нарушает», «миранда».");
    }

    const items = matched.map(({ guide, score }) => ({
      id: guide.id,
      title: guide.title,
      category: guide.category,
      audience: audienceLabel(guide.audience),
      steps: guide.steps || [],
      warn: guide.warn || "",
      rp: guide.rp || "",
      articles: formatArticles(guide.articles),
      score: trimmed ? score.toFixed(1) : null,
    }));

    let rpText = "";
    if (items.length === 1 && items[0].rp) {
      rpText = items[0].rp;
    } else if (items.length && items[0].steps?.length) {
      rpText = `Сценарий: ${items[0].title}\n\n${items[0].steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
      if (items[0].rp) rpText += `\n\nRP:\n${items[0].rp}`;
    }

    return {
      mode: "guides",
      code: "GUIDES",
      warnings,
      items,
      categories: [...new Set(guides.map((g) => g.category))].sort(),
      rpText,
      tags: matched.map((m) => m.guide.category),
    };
  };

  window.listGuideCategories = async function listGuideCategories() {
    const guides = await loadGuides();
    return [...new Set(guides.map((g) => g.category))].sort();
  };
})();
