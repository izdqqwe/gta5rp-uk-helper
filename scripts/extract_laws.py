import json
import re
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\izdiz\.cursor\projects\c-Users-izdiz-gta5rp-uk-helper\agent-transcripts"
    r"\96014d4b-665d-4f1a-95d7-39593438c93a\96014d4b-665d-4f1a-95d7-39593438c93a.jsonl"
)
OUT = Path(__file__).resolve().parent.parent / "data" / "laws"

RULES = [
    ("uk", lambda t: t.startswith("ГЛАВА I. Уголовный закон")),
    ("pk", lambda t: "Процессуальный кодекс" in t or ("Глава I" in t and "задержан" in t.lower() and "Миранд" in t)),
    ("adv", lambda t: "Коллегия адвокатов" in t or ("адвокат" in t.lower() and "Глава I" in t and "Статья 1" in t)),
    ("p1", lambda t: t.strip().startswith("ПРИЛОЖЕНИЕ № 1") or "О ЗАКРЫТЫХ, ОХРАНЯЕМЫХ" in t),
    ("fib", lambda t: "Статья 1. Федеральное Расследовательское" in t),
    ("np", lambda t: "Об обеспечении неприкосновенности" in t),
    ("fib-ustav", lambda t: "1.1. Устав Федерального Расследовательского" in t),
]


def extract_query(text: str) -> str:
    m = re.search(r"<user_query>\n?(.*?)(?:</user_query>|$)", text, re.S)
    return m.group(1).strip() if m else ""


def main():
    found = {}
    for line in TRANSCRIPT.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        o = json.loads(line)
        if o.get("role") != "user":
            continue
        content = o.get("message", {}).get("content", [])
        if not content:
            continue
        raw = content[0].get("text", "")
        body = extract_query(raw)
        if not body or len(body) < 500:
            continue
        for law_id, pred in RULES:
            if pred(body):
                if law_id not in found or len(body) > len(found[law_id]):
                    found[law_id] = body

    OUT.mkdir(parents=True, exist_ok=True)
    for law_id, text in found.items():
        (OUT / f"{law_id}.txt").write_text(text, encoding="utf-8")
        print(law_id, len(text))

    print("total", len(found))


if __name__ == "__main__":
    main()
