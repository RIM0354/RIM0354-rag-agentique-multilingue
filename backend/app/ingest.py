"""Jour 1 : lit les rapports PDF, les découpe et les indexe dans Qdrant.

Usage (depuis le dossier backend/) :
    python -m app.ingest                  # tous les PDF de data/raw
    python -m app.ingest --company cosumar  # une seule entreprise
    python -m app.ingest --reset          # recrée la collection avant d'indexer
    python -m app.ingest --skip-done      # saute les rapports déjà indexés
    python -m app.ingest --fast-tables    # tableaux en mode rapide (CPU sans GPU)
    python -m app.ingest --ocr            # active l'OCR (PDF scannés, beaucoup plus lent)

Arborescence attendue : data/raw/<entreprise>/<annee>.pdf
    ex. data/raw/maroc_telecom/2023.pdf
"""
import argparse
import os
import uuid
from pathlib import Path

from docling.chunking import HybridChunker
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
from docling.document_converter import DocumentConverter, PdfFormatOption
from qdrant_client import QdrantClient, models
from tqdm import tqdm

from .config import (
    COLLECTION, DENSE_DIM, DENSE_MODEL, MAX_TOKENS_PER_CHUNK,
    PROCESSED_DIR, QDRANT_URL, RAW_DIR, TABLES_DIR,
)
from .embeddings import embed_dense, embed_sparse

BATCH_SIZE = 32


def make_converter(ocr: bool, fast_tables: bool = False) -> DocumentConverter:
    """Les rapports AMMC sont des PDF numériques : sans OCR, la lecture est bien plus rapide sur CPU."""
    options = PdfPipelineOptions(do_ocr=ocr, do_table_structure=True)
    if fast_tables:  # 2 à 3 fois plus rapide sur CPU, tableaux un peu moins précis
        options.table_structure_options.mode = TableFormerMode.FAST
    options.accelerator_options.num_threads = os.cpu_count() or 4
    return DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)})


def already_indexed(client: QdrantClient, company: str, year: str) -> bool:
    flt = models.Filter(must=[
        models.FieldCondition(key="company", match=models.MatchValue(value=company)),
        models.FieldCondition(key="year", match=models.MatchValue(value=year)),
    ])
    return client.count(COLLECTION, count_filter=flt, exact=True).count > 0


def make_chunker() -> HybridChunker:
    """Découpe en respectant la structure : titres, paragraphes, tableaux entiers."""
    try:  # API récente de docling
        from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
        from transformers import AutoTokenizer

        tokenizer = HuggingFaceTokenizer(
            tokenizer=AutoTokenizer.from_pretrained(DENSE_MODEL), max_tokens=MAX_TOKENS_PER_CHUNK
        )
        return HybridChunker(tokenizer=tokenizer, merge_peers=True)
    except ImportError:  # anciennes versions
        return HybridChunker(tokenizer=DENSE_MODEL, max_tokens=MAX_TOKENS_PER_CHUNK, merge_peers=True)


def ensure_collection(client: QdrantClient, reset: bool) -> None:
    exists = client.collection_exists(COLLECTION)
    if exists and reset:
        client.delete_collection(COLLECTION)
        exists = False
    if not exists:
        client.create_collection(
            COLLECTION,
            vectors_config={"dense": models.VectorParams(size=DENSE_DIM, distance=models.Distance.COSINE)},
            sparse_vectors_config={"bm25": models.SparseVectorParams(modifier=models.Modifier.IDF)},
        )
        for field in ("company", "year"):
            client.create_payload_index(COLLECTION, field, models.PayloadSchemaType.KEYWORD)
        print(f"Collection '{COLLECTION}' créée.")


def page_of(chunk) -> int | None:
    for item in chunk.meta.doc_items:
        if item.prov:
            return item.prov[0].page_no
    return None


def is_table(chunk) -> bool:
    return any(str(item.label).lower().endswith("table") for item in chunk.meta.doc_items)


def save_tables(doc, company: str, year: str) -> int:
    """Exporte chaque tableau en CSV (utilisé par l'agent calculateur au jour 3)."""
    TABLES_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for i, table in enumerate(doc.tables):
        try:
            df = table.export_to_dataframe(doc=doc)
        except TypeError:
            df = table.export_to_dataframe()
        if df.empty:
            continue
        page = table.prov[0].page_no if table.prov else 0
        df.to_csv(TABLES_DIR / f"{company}_{year}_p{page:03d}_t{i:02d}.csv", index=False)
        count += 1
    return count


def ingest_pdf(pdf: Path, converter: DocumentConverter, chunker: HybridChunker, client: QdrantClient) -> int:
    company, year = pdf.parent.name, pdf.stem
    doc = converter.convert(pdf).document

    # Sauvegarde du Markdown pour vérifier la qualité du parsing à l'oeil
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    (PROCESSED_DIR / f"{company}_{year}.md").write_text(doc.export_to_markdown(), encoding="utf-8")
    n_tables = save_tables(doc, company, year)

    # On supprime d'abord les anciens chunks de ce rapport (ré-indexation propre)
    client.delete(
        COLLECTION,
        points_selector=models.Filter(must=[
            models.FieldCondition(key="company", match=models.MatchValue(value=company)),
            models.FieldCondition(key="year", match=models.MatchValue(value=year)),
        ]),
    )

    records = []
    for chunk in chunker.chunk(doc):
        records.append({
            "text": chunker.contextualize(chunk),  # le texte précédé de ses titres de section
            "company": company,
            "year": year,
            "page": page_of(chunk),
            "headings": chunk.meta.headings or [],
            "is_table": is_table(chunk),
            "source": str(pdf.relative_to(RAW_DIR)),
        })

    for start in range(0, len(records), BATCH_SIZE):
        batch = records[start:start + BATCH_SIZE]
        texts = [r["text"] for r in batch]
        dense, sparse = embed_dense(texts), embed_sparse(texts)
        client.upsert(COLLECTION, points=[
            models.PointStruct(id=str(uuid.uuid4()), vector={"dense": d, "bm25": s}, payload=r)
            for r, d, s in zip(batch, dense, sparse)
        ])

    print(f"  {company} {year} : {len(records)} chunks, {n_tables} tableaux exportés")
    return len(records)


def main() -> None:
    parser = argparse.ArgumentParser(description="Indexe les rapports PDF dans Qdrant")
    parser.add_argument("--company", help="n'indexer qu'une entreprise (nom du dossier)")
    parser.add_argument("--reset", action="store_true", help="recréer la collection")
    parser.add_argument("--skip-done", action="store_true", help="sauter les rapports déjà dans Qdrant")
    parser.add_argument("--ocr", action="store_true", help="activer l'OCR (lent, pour PDF scannés)")
    parser.add_argument("--fast-tables", action="store_true", help="lecture des tableaux en mode rapide")
    args = parser.parse_args()

    pdfs = sorted(RAW_DIR.glob(f"{args.company or '*'}/*.pdf"))
    if not pdfs:
        raise SystemExit(f"Aucun PDF trouvé dans {RAW_DIR}/<entreprise>/<annee>.pdf")

    client = QdrantClient(url=QDRANT_URL)
    ensure_collection(client, args.reset)
    converter, chunker = make_converter(args.ocr, args.fast_tables), make_chunker()
    if args.skip_done and not args.reset:
        pdfs = [p for p in pdfs if not already_indexed(client, p.parent.name, p.stem)]
        print(f"{len(pdfs)} rapport(s) restant(s) à indexer.")

    total, failed = 0, []
    for pdf in tqdm(pdfs, desc="Rapports"):
        try:
            total += ingest_pdf(pdf, converter, chunker, client)
        except Exception as exc:  # un PDF cassé ne doit pas bloquer les autres
            failed.append(pdf.name)
            print(f"  ÉCHEC {pdf} : {exc}")

    print(f"\nTerminé : {total} chunks indexés depuis {len(pdfs) - len(failed)} rapports.")
    if failed:
        print(f"Rapports en échec ({len(failed)}) : {', '.join(failed)}")


if __name__ == "__main__":
    main()
