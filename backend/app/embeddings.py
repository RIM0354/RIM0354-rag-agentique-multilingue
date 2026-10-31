"""Embeddings denses (sens) et creux (mots-clés) pour la recherche hybride."""
from functools import lru_cache

from fastembed import SparseTextEmbedding
from qdrant_client import models
from sentence_transformers import SentenceTransformer

from .config import DENSE_MODEL, SPARSE_MODEL


@lru_cache
def dense_model() -> SentenceTransformer:
    return SentenceTransformer(DENSE_MODEL)


@lru_cache
def sparse_model() -> SparseTextEmbedding:
    return SparseTextEmbedding(SPARSE_MODEL)


def embed_dense(texts: list[str]) -> list[list[float]]:
    vectors = dense_model().encode(texts, normalize_embeddings=True, batch_size=8, show_progress_bar=False)
    return [v.tolist() for v in vectors]


def embed_sparse(texts: list[str]) -> list[models.SparseVector]:
    return [
        models.SparseVector(indices=e.indices.tolist(), values=e.values.tolist())
        for e in sparse_model().embed(texts)
    ]


def embed_sparse_query(text: str) -> models.SparseVector:
    e = next(iter(sparse_model().query_embed(text)))
    return models.SparseVector(indices=e.indices.tolist(), values=e.values.tolist())
