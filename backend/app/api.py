"""API FastAPI. Lancer depuis backend/ :  uvicorn app.api:app --reload
Documentation interactive : http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .rag import answer
from .search import hybrid_search

app = FastAPI(title="RAG agentique multilingue", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # le front Next.js (jour 4)
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    company: str | None = None
    year: str | None = None


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/ask")
def ask(req: AskRequest) -> dict:
    return answer(req.question, req.company, req.year)


@app.get("/search")
def search(q: str, company: str | None = None, year: str | None = None, k: int = 5) -> list[dict]:
    return hybrid_search(q, k=k, company=company, year=year)
