"""Движок квалификации действий по УК штата San-Andreas."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MAX_STACKED_YEARS = 10


@dataclass
class MatchedArticle:
    id: str
    article: str
    part: int | None
    title: str
    stars: int
    punishment: str
    reason: str
    display_article: str | None = None
    smart_match: bool = False

    @property
    def label(self) -> str:
        base = self.display_article or self.article
        if self.part is not None:
            return f"ст. {base} ч.{self.part} УК SA"
        return f"ст. {base} УК SA"

    @property
    def stars_display(self) -> str:
        return "★" * self.stars


@dataclass
class AnalysisResult:
    input_text: str
    tags: list[str] = field(default_factory=list)
    articles: list[MatchedArticle] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    max_stars: int = 0
    total_years: int = 0
    capped_years: int = 0
    rp_text: str = ""
    used_smart_search: bool = False


class LawMatcher:
    def __init__(self, stack_weapon_articles: bool = True) -> None:
        self.stack_weapon_articles = stack_weapon_articles
        self.tags_map: dict[str, list[str]] = self._load_json("tags.json")
        self.smart_config: dict = self._load_json("smart_search.json")
        self.article_keywords: dict[str, list[str]] = self._load_json("article_keywords.json")
        self.articles: dict[str, dict] = {
            item["id"]: item for item in self._load_json("articles.json")
        }

    @staticmethod
    def _load_json(name: str):
        with open(DATA_DIR / name, encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def _normalize(text: str) -> str:
        return text.lower().replace("ё", "е").strip()

    @staticmethod
    def _split_clauses(text: str) -> list[str]:
        parts = re.split(r"[+;,]|\s+и\s+|\n", text)
        return [p.strip() for p in parts if p.strip()]

    def detect_tags(self, text: str) -> set[str]:
        normalized = self._normalize(text)
        found: set[str] = set()

        for tag, keywords in self.tags_map.items():
            for keyword in keywords:
                if keyword in normalized:
                    found.add(tag)
                    break

        for tag, stems in self.smart_config.get("stems", {}).items():
            if tag in found:
                continue
            for stem in stems:
                if stem in normalized:
                    found.add(tag)
                    break

        return found

    def _article(self, article_id: str, reason: str, smart_match: bool = False) -> MatchedArticle:
        data = self.articles[article_id]
        return MatchedArticle(
            id=article_id,
            article=data["article"],
            part=data.get("part"),
            title=data["title"],
            stars=data["stars"],
            punishment=data["punishment"],
            reason=reason,
            display_article=data.get("displayArticle"),
            smart_match=smart_match,
        )

    def _years_from_punishment(self, punishment: str) -> int:
        match = re.search(r"(\d+)\s*(?:лет|года|год)", punishment)
        return int(match.group(1)) if match else 0

    def _is_attempt_on_life(self, text: str, tags: set[str]) -> bool:
        normalized = self._normalize(text)
        return (
            "attempt_kill" in tags
            or "attempt_police_life" in tags
            or ("попыт" in normalized and "убий" in normalized)
        )

    def _score_article(self, text: str, article_id: str) -> float:
        normalized = self._normalize(text)
        data = self.articles.get(article_id)
        if not data:
            return 0.0

        keywords = list(self.article_keywords.get(article_id, []))
        title_words = re.findall(r"[a-zA-Zа-яА-Я0-9]{3,}", data["title"].lower())
        keywords.extend(title_words)

        score = 0.0
        for keyword in keywords:
            kw = keyword.lower().replace("ё", "е")
            if kw in normalized:
                score += max(1.0, len(kw) / 4.0)
            elif len(kw) >= 5 and any(kw in token or token in kw for token in re.findall(r"[a-zA-Zа-яА-Я0-9]{4,}", normalized)):
                score += 0.75

        if data.get("note") and any(word in normalized for word in re.findall(r"[a-zA-Zа-яА-Я0-9]{4,}", data["note"].lower())):
            score += 0.5

        return score

    def _smart_search(self, text: str, seen_ids: set[str], limit: int = 4) -> list[tuple[str, float]]:
        normalized = self._normalize(text)
        detention_context = any(
            x in normalized for x in ["задержан", "арест", "помех", "вмешат", "аресту"]
        )
        scored: list[tuple[str, float]] = []
        for article_id in self.articles:
            if article_id in seen_ids:
                continue
            score = self._score_article(text, article_id)
            if detention_context and article_id in {"10.5.1", "12.8.1_special", "12.8.2", "12.10"}:
                if not any(
                    x in normalized
                    for x in ["угнал", "оруж", "пistolet", "пистолет", "транспорт", "машин", "авто", "ствол"]
                ):
                    score *= 0.15
            if score >= 1.0:
                scored.append((article_id, score))

        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[:limit]

    def _apply_rules(
        self,
        text: str,
        tags: set[str],
        matched: list[MatchedArticle],
        seen_ids: set[str],
        warnings: list[str],
    ) -> None:
        is_attempt = self._is_attempt_on_life(text, tags)
        completed_kill = "kill_intentional" in tags and not is_attempt

        def add(article_id: str, reason: str) -> None:
            if article_id in seen_ids:
                return
            seen_ids.add(article_id)
            matched.append(self._article(article_id, reason))

        if is_attempt and "gov_employee" in tags:
            add("17.1", "Покушение / посягательство на жизнь гос. сотрудника (ст. 17.1)")
        elif is_attempt and any(word in self._normalize(text) for word in ["убий", "стрелял", "ранил", "покуш"]):
            add("17.1", "Покушение / посягательство на жизнь (в т.ч. сотрудника)")

        if completed_kill and "gov_employee" in tags:
            add("6.3", "Убийство гос. сотрудника (при исполнении / в связи со службой)")
            if "on_duty" not in tags:
                warnings.append(
                    "Не указано «при исполнении» — по умолчанию применена ст. 6.3."
                )
        elif completed_kill:
            add("6.2.1", "Умышленное причинение смерти")

        if "kill_negligent" in tags and not completed_kill:
            add("6.2.2", "Смерть по неосторожности или в аффекте")

        if "weapon" in tags or "gov_weapon" in tags:
            add("12.8.2", "Незаконное хранение, ношение или использование оружия")
            if "gov_weapon" in tags and self.stack_weapon_articles:
                add("12.8.1_special", "Оружие/спецсредства государственного образца (вариант 3: обе статьи)")
            elif "gov_weapon" in tags:
                matched[:] = [a for a in matched if a.id != "12.8.2"]
                seen_ids.discard("12.8.2")
                add("12.8.1_special", "Государственное оружие или спецсредства")

        if "flee" in tags:
            add("16.12", "Попытка скрыться / уклонение от задержания")
        if "evade_punishment" in tags:
            add("16.15", "Уклонение от отбывания наказания")

        if "robbery" in tags:
            if "weapon" in tags or "разбой" in self._normalize(text):
                add("10.4", "Нападение с насилием ради хищения")
            else:
                add("10.3", "Открытое хищение имущества")
        if "theft" in tags and "robbery" not in tags:
            add("10.1", "Тайное хищение имущества")
        if "carjack" in tags:
            add("10.5.1" if "gov_carjack" in tags else "10.5", "Неправомерное завладение транспортом")
        if "damage_property" in tags:
            add("10.6", "Умышленное уничтожение/повреждение имущества")
        if "kidnap" in tags:
            add("7.1", "Похищение человека")
        if "threat_kill" in tags and not completed_kill and not is_attempt:
            add("6.6", "Угроза убийством или тяжким вредом здоровью")
        if "drugs_large" in tags:
            add("13.2.1", "Наркотики свыше 25 г или с целью сбыта")
        elif "drugs_small" in tags:
            add("13.2", "Незаконные наркотики от 3 г")
        if "insult_authority" in tags:
            add("17.3", "Оскорбление представителя власти")
        if "disobey" in tags:
            add("17.6", "Неповиновение законному распоряжению")
        if "interfere_arrest_official" in tags or (
            "interfere_arrest" in tags
            and any(
                x in self._normalize(text)
                for x in ["от гос", "должност", "полномоч", "злоупотреб"]
            )
        ):
            add(
                "15.1.1.2",
                "Вмешательство/помеха должностного лица в задержание или арест (ст. 15.1.1 ч.2)",
            )
        elif "interfere_arrest" in tags:
            add("17.4", "Вмешательство в процесс задержания (гражданское лицо)")
        if "bribe" in tags:
            add("15.5", "Дача взятки должностному лицу")
        if "terrorism" in tags:
            add("12.1", "Терроризм")
        if "extortion" in tags:
            add("10.2.1", "Вымогательство")
        if "fraud" in tags:
            add("10.2", "Мошенничество")
        if "fake_docs" in tags:
            add("17.8", "Подделка документов или лицензий")
        if "false_report" in tags:
            add("17.9", "Ложный вызов о заложниках/похищении")
        if "illegal_entry" in tags:
            if any(x in self._normalize(text) for x in ["особо охран", "fib", "военн", "форта", "бunker"]):
                add("12.7.2", "Незаконное проникновение на особо охраняемый объект")
            else:
                add("12.7.1", "Незаконное проникновение на охраняемый объект")

    def analyze(self, text: str) -> AnalysisResult:
        text = text.strip()
        clauses = self._split_clauses(text) or [text]
        all_tags: set[str] = set()
        matched: list[MatchedArticle] = []
        seen_ids: set[str] = set()
        warnings: list[str] = []
        used_smart = False

        for clause in clauses:
            tags = self.detect_tags(clause)
            all_tags |= tags
            before = len(seen_ids)
            self._apply_rules(clause, tags, matched, seen_ids, warnings)
            if len(seen_ids) == before:
                for article_id, score in self._smart_search(clause, seen_ids, limit=2):
                    seen_ids.add(article_id)
                    matched.append(
                        self._article(
                            article_id,
                            f"Подобрано по смыслу: «{clause}» (умный поиск, score {score:.1f})",
                            smart_match=True,
                        )
                    )
                    used_smart = True

        if not matched:
            for article_id, score in self._smart_search(text, set(), limit=4):
                seen_ids.add(article_id)
                matched.append(
                    self._article(
                        article_id,
                        f"Подобрано по смыслу всего описания (умный поиск, score {score:.1f})",
                        smart_match=True,
                    )
                )
                used_smart = True

        if used_smart:
            warnings.insert(
                0,
                "Часть статей подобрана умным поиском по смыслу текста — "
                "проверь квалификацию перед RP-зачитыванием.",
            )

        if not matched:
            suggestions = self._smart_search(text, set(), limit=3)
            if suggestions:
                hint = ", ".join(
                    f"ст. {self.articles[a]['article']}" for a, _ in suggestions
                )
                warnings.append(
                    f"Точного совпадения нет. Возможно имелись в виду: {hint}. "
                    "Попробуй переформулировать или добавить детали."
                )
            else:
                warnings.append(
                    "Не удалось подобрать статьи. Опиши: что сделал, кому, "
                    "было ли оружие, скрылся ли, кто жертва (гос/гражданин)."
                )

        result = AnalysisResult(
            input_text=text,
            tags=sorted(all_tags),
            articles=matched,
            warnings=warnings,
            used_smart_search=used_smart,
        )
        result.max_stars = max((a.stars for a in matched), default=0)
        years = [self._years_from_punishment(a.punishment) for a in matched]
        result.total_years = sum(years)
        result.capped_years = min(result.total_years, MAX_STACKED_YEARS)
        result.rp_text = self._build_rp_text(result)
        return result

    def _build_rp_text(self, result: AnalysisResult) -> str:
        if not result.articles:
            return ""

        lines = ["Вам вменяется:"]
        for article in result.articles:
            lines.append(f"- {article.label} — {article.title.lower()};")
        lines[-1] = lines[-1].rstrip(";") + "."
        lines.append(
            f"Совокупность преступлений. Уровень розыска: {('★' * result.max_stars) or '—'}."
        )
        if result.total_years:
            if result.total_years > MAX_STACKED_YEARS:
                lines.append(
                    f"Наказание по совокупности: до {result.capped_years} лет "
                    f"(ст. 5.9 ч.4, максимум {MAX_STACKED_YEARS} лет при задержании)."
                )
            else:
                lines.append(
                    f"Суммарный срок по статьям: до {result.total_years} лет."
                )
        return "\n".join(lines)


def analyze_text(text: str, stack_weapon_articles: bool = True) -> dict:
    matcher = LawMatcher(stack_weapon_articles=stack_weapon_articles)
    result = matcher.analyze(text)
    return {
        "input": result.input_text,
        "tags": result.tags,
        "warnings": result.warnings,
        "maxStars": result.max_stars,
        "totalYears": result.total_years,
        "cappedYears": result.capped_years,
        "rpText": result.rp_text,
        "usedSmartSearch": result.used_smart_search,
        "articles": [
            {
                "id": a.id,
                "label": a.label,
                "title": a.title,
                "stars": a.stars,
                "starsDisplay": a.stars_display,
                "punishment": a.punishment,
                "reason": a.reason,
                "smartMatch": a.smart_match,
            }
            for a in result.articles
        ],
    }
