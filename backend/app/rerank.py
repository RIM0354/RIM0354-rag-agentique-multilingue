"""Reranking : un cross-encoder relit la question avec chaque passage pour garder les meilleurs."""
from functools import lru_cache

from sentence_transformers import CrossEncoder

from .config import RERANK_MODEL


@lru_cache
def reranker() -> CrossEncoder:
    return CrossEncoder(RERANK_MODEL, max_length=512)


def rerank(query: str, hits: list[dict], top_k: int = 5) -> list[dict]:
    if not hits:
        return []
    scores = reranker().predict([(query, h["text"]) for h in hits], show_progress_bar=False)
    for hit, score in zip(hits, scores):
        hit["rerank_score"] = float(score)
    return sorted(hits, key=lambda h: h["rerank_score"], reverse=True)[:top_k]
