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
SPARSE_MODEL = os.getenv("SPARSE_MODEL", "Qdrant/bm25")  # mots-clés (BM25)
RERANK_MODEL = os.getenv("RERANK_MODEL", "BAAI/bge-reranker-v2-m3")  # multilingue
MAX_TOKENS_PER_CHUNK = int(os.getenv("MAX_TOKENS_PER_CHUNK", "512"))

# LLM : Gemini (Google AI Studio) ou Groq. Par défaut, Gemini si sa clé est présente.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini" if GEMINI_API_KEY or not GROQ_API_KEY else "groq").lower()
_DEFAULT_MODELS = {"gemini": "gemini-3.8-flash", "groq": "llama-3.3-70b-versatile"}
LLM_MODEL = os.getenv("LLM_MODEL") or _DEFAULT_MODELS.get(LLM_PROVIDER, "gemini-3.8-flash")

# Embeddings denses : "gemini" (API, rien à télécharger) ou "local" (BGE-M3, 2,3 Go).
EMBED_PROVIDER = os.getenv("EMBED_PROVIDER", "gemini" if GEMINI_API_KEY else "local").lower()
GEMINI_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
DENSE_DIM = int(os.getenv("DENSE_DIM", "1536" if EMBED_PROVIDER == "gemini" else "1024"))

# Reranking : "local" (cross-encoder BGE, 2,3 Go), "llm" (le LLM trie les passages) ou "none".
RERANK_PROVIDER = os.getenv("RERANK_PROVIDER", "llm" if EMBED_PROVIDER == "gemini" else "local").lower()
