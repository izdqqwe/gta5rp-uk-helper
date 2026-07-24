from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from src.matcher import analyze_text

app = FastAPI(title="GTA 5 RP — УК San-Andreas Helper")
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    stackWeaponArticles: bool = True


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest) -> dict:
    return analyze_text(
        request.text.strip(),
        stack_weapon_articles=request.stackWeaponArticles,
    )


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
