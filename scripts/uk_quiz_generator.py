# -*- coding: utf-8 -*-
"""Generate UK quiz questions from data/laws/uk.txt — one+ per article/part."""
import json
import random
import re
from pathlib import Path

UK_PATH = Path(__file__).resolve().parent.parent / "data" / "laws" / "uk.txt"
ARTICLES_JSON = Path(__file__).resolve().parent.parent / "data" / "articles.json"

ZERO_WIDTH = "\u200b"


def clean(s: str) -> str:
    return s.replace(ZERO_WIDTH, "").strip()


def parse_uk(text: str) -> list[dict]:
    """Return list of entries: id, ref, title, stars, punishment, snippet."""
    chunks = re.split(r"(?=Статья\s+\d+(?:\.\d+)*)", text)
    entries = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk.startswith("Статья"):
            continue
        m = re.match(r"Статья\s+(\d+(?:\.\d+)*)\.?\s*(.*)", chunk, re.S)
        if not m:
            continue
        art_id = m.group(1)
        rest = m.group(2)
        first_line = clean(rest.split("\n", 1)[0])
        if "Утратила силу" in first_line:
            continue
        body = chunk[m.end() :]

        title = re.sub(r"\[.*?\]", "", first_line)
        title = re.sub(r"★+", "", title).strip(" ,.")

        # Parts: ч. N ... until next ч. or end
        part_blocks = re.split(r"(?=ч\.\s*\d+)", body)
        found_parts = False
        for block in part_blocks:
            pm = re.match(r"ч\.\s*(\d+)\s*(.*)", block, re.S)
            if not pm:
                continue
            part_num = pm.group(1)
            part_body = pm.group(2)
            if "Утратила силу" in part_body[:40]:
                continue
            stars = len(re.findall(r"★", part_body.split("Наказание")[0]))
            punish = extract_punishment(part_body)
            desc = extract_desc(part_body)
            ref = f"{art_id}.{part_num}" if "." not in art_id.split(".")[-1] or art_id.count(".") >= 1 else f"{art_id}.{part_num}"
            # normalize ref like articles.json: 6.2 + part 1 -> 6.2.1
            if art_id in {"6.1", "6.2", "12.7", "12.8", "15.1.1", "17.4"} or re.match(r"^\d+\.\d+$", art_id):
                ref = f"{art_id}.{part_num}"
            else:
                ref = art_id if part_num == "1" and not punish and not stars else f"{art_id}.{part_num}"

            if stars or punish or len(desc) > 25:
                found_parts = True
                entries.append({
                    "art_id": art_id,
                    "ref": ref,
                    "part": int(part_num),
                    "title": title or first_line[:80],
                    "stars": stars,
                    "punishment": punish,
                    "desc": desc[:200],
                })

        if not found_parts:
            stars = len(re.findall(r"★", body.split("Наказание")[0] + first_line))
            punish = extract_punishment(body)
            desc = extract_desc(first_line + "\n" + body)
            if "Утратила силу" in desc:
                continue
            snippet = extract_principle_snippet(body)
            entries.append({
                "art_id": art_id,
                "ref": art_id,
                "part": 0,
                "title": title or first_line[:80],
                "stars": stars,
                "punishment": punish,
                "desc": desc[:200] if desc else snippet,
                "principle": not stars and not punish,
            })
    return entries


def extract_punishment(text: str) -> str | None:
    m = re.search(
        r"Наказание:\s*(.+?)(?:\n|$)",
        text.replace(ZERO_WIDTH, ""),
        re.I,
    )
    if not m:
        return None
    p = clean(m.group(1))
    p = re.sub(r"\(\([^)]*\)\)", "", p).strip()
    return p[:120] if p else None


def extract_desc(text: str) -> str:
    t = clean(text.replace(ZERO_WIDTH, ""))
    t = re.sub(r"★+", "", t)
    t = re.sub(r"Наказание:.*", "", t, flags=re.I | re.S)
    t = re.sub(r"\[.*?\]", "", t)
    t = re.sub(r"\s+", " ", t).strip(" ,.")
    # drop leading "ч. N"
    t = re.sub(r"^ч\.\s*\d+\s*", "", t)
    return t[:180]


def extract_principle_snippet(body: str) -> str:
    m = re.search(r"ч\.\s*1\s+(.+?)(?:\n|$)", body.replace(ZERO_WIDTH, ""), re.S)
    if m:
        s = clean(m.group(1))
        return s[:160]
    return ""


def stars_label(n: int) -> str:
    if n <= 0:
        return "без розыска (0 ★)"
    return f"{n} ({'★' * n})"


def make_options(correct: str, pool: list[str], rng: random.Random) -> tuple[list[str], int]:
    wrong = [p for p in pool if p and p != correct]
    rng.shuffle(wrong)
    opts = [correct] + wrong[:3]
    while len(opts) < 4:
        opts.append(f"Иное — см. ст. {rng.randint(1, 17)}.{rng.randint(1, 9)}")
    rng.shuffle(opts)
    return opts, opts.index(correct)


def generate_uk_questions(rng: random.Random | None = None) -> list[dict]:
    rng = rng or random.Random(42)
    text = UK_PATH.read_text(encoding="utf-8")
    entries = parse_uk(text)
    # enrich from articles.json
    if ARTICLES_JSON.exists():
        arts = {a["id"]: a for a in json.loads(ARTICLES_JSON.read_text(encoding="utf-8"))}
        for e in entries:
            aid = e["ref"]
            if aid in arts:
                a = arts[aid]
                if not e["stars"]:
                    e["stars"] = a.get("stars") or 0
                if not e["punishment"]:
                    e["punishment"] = a.get("punishment")
                if a.get("title"):
                    e["title"] = a["title"]

    punish_pool = [e["punishment"] for e in entries if e.get("punishment")]
    stars_pool = sorted({e["stars"] for e in entries if e.get("stars")})
    title_pool = [f"ст. {e['ref']}" for e in entries if e.get("title")]

    questions = []
    seen_keys = set()

    def add_q(qid, question, options, correct, explain, ref):
        key = (ref, question[:40])
        if key in seen_keys:
            return
        seen_keys.add(key)
        questions.append({
            "id": qid,
            "code": "uk",
            "question": question,
            "options": options,
            "correct": correct,
            "explain": explain,
            "ref": ref,
        })

    for i, e in enumerate(entries):
        ref = e["ref"]
        title = e.get("title") or ref
        desc = e.get("desc") or title

        if e.get("stars", 0) > 0:
            correct = stars_label(e["stars"])
            alt_stars = [s for s in stars_pool if s != e["stars"]]
            wrong = [stars_label(s) for s in rng.sample(alt_stars, min(3, len(alt_stars)))]
            opts = [correct] + wrong
            while len(opts) < 4:
                opts.append(stars_label(rng.choice(stars_pool)))
            rng.shuffle(opts)
            add_q(
                f"uk-a{i:03d}-stars",
                f"Сколько звёзд розыска у ст. {ref} ({title[:50]})?",
                opts,
                opts.index(correct),
                f"Ст. {ref}: {stars_label(e['stars'])}.",
                ref,
            )

        if e.get("punishment"):
            correct = e["punishment"]
            opts, ci = make_options(correct, punish_pool, rng)
            add_q(
                f"uk-a{i:03d}-pun",
                f"Наказание по ст. {ref} ({title[:45]})?",
                opts,
                ci,
                f"Ст. {ref}: {correct}",
                ref,
            )

        if len(desc) > 20 and e.get("stars", 0) > 0:
            correct_ref = f"ст. {ref}"
            others = [t for t in title_pool if t != correct_ref]
            rng.shuffle(others)
            opts = [correct_ref] + others[:3]
            rng.shuffle(opts)
            short = desc[:90] + ("…" if len(desc) > 90 else "")
            add_q(
                f"uk-a{i:03d}-id",
                f"К какой статье УК относится: «{short}»?",
                opts,
                opts.index(correct_ref),
                f"Это ст. {ref} — {title}.",
                ref,
            )

        if e.get("principle") and e.get("desc"):
            snippet = e["desc"][:100]
            other_snips = [x["desc"][:100] for x in entries if x is not e and x.get("desc") and len(x["desc"]) > 30]
            rng.shuffle(other_snips)
            wrong = other_snips[:3]
            while len(wrong) < 3:
                wrong.append("Норма не закреплена в УК San-Andreas")
            opts = [snippet[:100]] + wrong
            rng.shuffle(opts)
            add_q(
                f"uk-a{i:03d}-pr",
                f"Ст. {ref} УК — основная норма:",
                opts,
                opts.index(snippet[:100]),
                f"Ст. {ref}: {snippet[:140]}",
                ref,
            )

    return questions


if __name__ == "__main__":
    qs = generate_uk_questions()
    refs = {q["ref"] for q in qs}
    print(f"generated {len(qs)} uk questions, {len(refs)} unique refs")
