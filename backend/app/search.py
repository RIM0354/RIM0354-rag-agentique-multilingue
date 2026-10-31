"""Recherche hybride (sens + mots-clés) avec fusion RRF. Le reranking arrive au jour 2.

Test rapide (depuis backend/) :
    python -m app.search "chiffre d'affaires 2023" --company maroc_telecom
"""
import argparse

from qdrant_client import QdrantClient, models

from .config import COLLECTION, QDRANT_URL
from .embeddings import embed_dense, embed_sparse_query


def build_filter(company: str | None = None, year: str | None = None) -> models.Filter | None:
    conditions = [
        models.FieldCondition(key=key, match=models.MatchValue(value=value))
        for key, value in (("company", company), ("year", year)) if value
    ]
    return models.Filter(must=conditions) if conditions else None


def hybrid_search(query: str, k: int = 5, company: str | None = None, year: str | None = None,
                  client: QdrantClient | None = None) -> list[dict]:
    client = client or QdrantClient(url=QDRANT_URL)
    flt = build_filter(company, year)
    result = client.query_points(
        COLLECTION,
        prefetch=[
            models.Prefetch(query=embed_dense([query])[0], using="dense", limit=30, filter=flt),
            models.Prefetch(query=embed_sparse_query(query), using="bm25", limit=30, filter=flt),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=k,
        with_payload=True,
    )
    return [{"score": p.score, **p.payload} for p in result.points]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("query")
    parser.add_argument("--company")
    parser.add_argument("--year")
    parser.add_argument("-k", type=int, default=5)
    args = parser.parse_args()

    for i, hit in enumerate(hybrid_search(args.query, args.k, args.company, args.year), 1):
        kind = "TABLEAU" if hit["is_table"] else "texte"
        print(f"\n#{i}  {hit['company']} {hit['year']}  page {hit['page']}  ({kind}, score {hit['score']:.3f})")
        print(hit["text"][:400].replace("\n", " ") + " ...")


if __name__ == "__main__":
    main()
