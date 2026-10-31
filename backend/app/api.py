"""API FastAPI. Lancer depuis backend/ :  uvicorn app.api:app --reload
Documentation interactive : http://localhost:8000/docs
"""
import json
import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .agents import GRAPH, ask_agents, initial_state
from .rag import answer as simple_answer
from .search import hybrid_search, list_companies

app = FastAPI(title="RAG agentique multilingue", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


def current_user(authorization: str | None = Header(default=None)) -> str | None:
    """Vérifie le jeton Supabase envoyé par le front. Désactivé si SUPABASE_JWT_SECRET est vide (dev local)."""
    if not SUPABASE_JWT_SECRET:
        return None
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Connexion requise")
    import jwt  # PyJWT

    try:
        payload = jwt.decode(authorization.removeprefix("Bearer "), SUPABASE_JWT_SECRET,
                             algorithms=["HS256"], audience="authenticated")
    except jwt.PyJWTError as exc:
        raise HTTPException(401, "Jeton invalide ou expiré") from exc
    return payload.get("sub")


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    company: str | None = None
    year: str | None = None


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/companies")
def companies() -> list[str]:
    return list_companies()


@app.post("/ask")
def ask(req: AskRequest, _user: str | None = Depends(current_user)) -> dict:
    """Réponse complète du système multi-agents."""
    return ask_agents(req.question, req.company, req.year)


@app.post("/ask/simple")
def ask_simple(req: AskRequest, _user: str | None = Depends(current_user)) -> dict:
    """RAG simple sans agents (sert de point de comparaison dans l'évaluation)."""
    return simple_answer(req.question, req.company, req.year)


@app.post("/ask/stream")
def ask_stream(req: AskRequest, _user: str | None = Depends(current_user)) -> StreamingResponse:
    """Envoie chaque étape des agents en temps réel (Server-Sent Events), puis la réponse finale."""
    def events():
        state = initial_state(req.question, req.company, req.year)
        sent = 0
        for update in GRAPH.stream(state, stream_mode="updates"):
            for node, delta in update.items():
                if not delta:
                    continue
                state.update(delta)
                for step in state.get("steps", [])[sent:]:
                    yield f"event: step\ndata: {json.dumps({'node': node, 'label': step}, ensure_ascii=False)}\n\n"
                sent = len(state.get("steps", []))
        final = {"answer": state.get("answer") or state.get("draft", ""), "sources": state.get("sources", []),
                 "calculations": state.get("calculations", [])}
        yield f"event: final\ndata: {json.dumps(final, ensure_ascii=False)}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")


@app.get("/search")
def search(q: str, company: str | None = None, year: str | None = None, k: int = 5) -> list[dict]:
    return hybrid_search(q, k=k, company=company, year=year)
