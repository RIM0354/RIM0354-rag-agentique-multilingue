"""Embeddings denses (sens) et creux (mots-clés) pour la recherche hybride.

Les embeddings denses viennent soit de l'API Gemini (EMBED_PROVIDER=gemini),
soit du modèle local BGE-M3 (EMBED_PROVIDER=local).
"""
import math
from functools import lru_cache

from fastembed import SparseTextEmbedding
from qdrant_client import models

from .config import DENSE_DIM, DENSE_MODEL, EMBED_PROVIDER, GEMINI_EMBED_MODEL, SPARSE_MODEL

GEMINI_BATCH = 50  # textes par requête à l'API


@lru_cache
def dense_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(DENSE_MODEL)


@lru_cache
def sparse_model() -> SparseTextEmbedding:
    return SparseTextEmbedding(SPARSE_MODEL)


def _normalize(v: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / norm for x in v]


def _gemini_embed(texts: list[str], task_type: str) -> list[list[float]]:
    from google.genai import types

    from .llm import gemini_client, with_retry

    config = types.EmbedContentConfig(task_type=task_type, output_dimensionality=DENSE_DIM)
    vectors: list[list[float]] = []
    for start in range(0, len(texts), GEMINI_BATCH):
        batch = texts[start:start + GEMINI_BATCH]
        # l'offre gratuite limite le débit : on réessaie en attendant
        result = with_retry(
            lambda b: gemini_client().models.embed_content(model=GEMINI_EMBED_MODEL, contents=b, config=config),
            batch, attempts=6, base_delay=5.0,
        )
        # en dessous de 3072 dimensions, Google demande de renormaliser les vecteurs
        vectors.extend(_normalize(list(e.values)) for e in result.embeddings)
    return vectors


def embed_dense(texts: list[str]) -> list[list[float]]:
    """Vecteurs des passages à indexer."""
    if EMBED_PROVIDER == "gemini":
        return _gemini_embed(texts, "RETRIEVAL_DOCUMENT")
    vectors = dense_model().encode(texts, normalize_embeddings=True, batch_size=8, show_progress_bar=False)
    return [v.tolist() for v in vectors]


def embed_dense_query(text: str) -> list[float]:
    """Vecteur d'une question (Gemini distingue questions et documents)."""
    if EMBED_PROVIDER == "gemini":
        return _gemini_embed([text], "RETRIEVAL_QUERY")[0]
    return embed_dense([text])[0]


def embed_sparse(texts: list[str]) -> list[models.SparseVector]:
    return [
        models.SparseVector(indices=e.indices.tolist(), values=e.values.tolist())
        for e in sparse_model().embed(texts)
    ]


def embed_sparse_query(text: str) -> models.SparseVector:
    e = next(iter(sparse_model().query_embed(text)))
    return models.SparseVector(indices=e.indices.tolist(), values=e.values.tolist())
