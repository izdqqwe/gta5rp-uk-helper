"""Build laws-embed.js from data/laws/*.txt for offline GitHub Pages."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAWS_DIR = ROOT / "data" / "laws"
OUT = ROOT / "laws-embed.js"

CATALOG = [
    {"id": "uk", "label": "УК", "title": "Уголовный кодекс San-Andreas", "css": "uk"},
    {"id": "pk", "label": "ПК", "title": "Процессуальный кодекс San-Andreas", "css": "pk"},
    {"id": "adv", "label": "ЗА", "title": "Закон об адвокатуре", "css": "adv"},
    {"id": "p1", "label": "П1", "title": "Приложение №1 — территории", "css": "p1"},
    {"id": "fib", "label": "FIB", "title": "Закон о Федеральном Расследовательском Бюро", "css": "fib"},
    {"id": "fib-ustav", "label": "Устав", "title": "Устав FIB", "css": "fib"},
    {"id": "np", "label": "НП", "title": "Закон о неприкосновенности", "css": "np"},
]


def clean(text: str) -> str:
    text = text.replace("\u200b", "")
    lines = []
    for line in text.splitlines():
        s = line.strip()
        if re.match(r"^[A-Za-z0-9_-]+\.(png|jpg|gif)$", s):
            continue
        if s in ("​", ""):
            lines.append("")
        else:
            lines.append(line.rstrip())
    return "\n".join(lines).strip()


def main():
    texts = {}
    for item in CATALOG:
        path = LAWS_DIR / f"{item['id']}.txt"
        if not path.exists():
            raise SystemExit(f"missing {path}")
        texts[item["id"]] = clean(path.read_text(encoding="utf-8"))
        print(item["id"], len(texts[item["id"]]))

    payload = {"catalog": CATALOG, "texts": texts}
    OUT.write_text(
        "window.LAWS_EMBEDDED = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print("wrote", OUT, "size", OUT.stat().st_size)


if __name__ == "__main__":
    main()
