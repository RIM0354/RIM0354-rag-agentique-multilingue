"""Configuration centrale du projet, lue depuis le fichier .env."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

# Dossiers de données
RAW_DIR = ROOT_DIR / "data" / "raw"            # PDF : data/raw/<entreprise>/<annee>.pdf
PROCESSED_DIR = ROOT_DIR / "data" / "processed"  # Markdown extrait (pour vérifier le parsing)
TABLES_DIR = ROOT_DIR / "data" / "tables"        # Tableaux en CSV (pour l'agent calculateur, jour 3)

# Qdrant (base vectorielle)
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION = os.getenv("QDRANT_COLLECTION", "rapports")

# Modèles d'embeddings
DENSE_MODEL = os.getenv("DENSE_MODEL", "BAAI/bge-m3")   # multilingue FR / EN / AR, 1024 dimensions
DENSE_DIM = 1024
SPARSE_MODEL = os.getenv("SPARSE_MODEL", "Qdrant/bm25")  # mots-clés (BM25)
RERANK_MODEL = os.getenv("RERANK_MODEL", "BAAI/bge-reranker-v2-m3")  # multilingue
MAX_TOKENS_PER_CHUNK = int(os.getenv("MAX_TOKENS_PER_CHUNK", "512"))

# LLM (utilisé à partir du jour 2)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
