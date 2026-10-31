# RAG agentique multilingue : analyste financier IA (Astrolabe)

Astrolabe répond en français, anglais et arabe à des questions sur les rapports annuels des sociétés cotées à la Bourse de Casablanca, en citant la page source de chaque chiffre.

> Projet en cours de construction. Étape actuelle : **jour 2, RAG complet avec reranking et API**.

## Démarrage rapide (jour 1)

Prérequis : Python 3.11 ou 3.12, Docker Desktop.

```bash
# 1. Lancer la base vectorielle Qdrant
docker compose up -d

# 2. Créer l'environnement Python
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt

# 3. Copier la configuration
cp ../.env.example ../.env       # puis remplir GROQ_API_KEY

# 4. Déposer les PDF ici :  data/raw/<entreprise>/<annee>.pdf
#    ex. data/raw/maroc_telecom/2023.pdf   (noms en minuscules, sans espaces)

# 5. Indexer
python -m app.ingest --reset

# 6. Tester une recherche
python -m app.search "chiffre d'affaires consolidé" --company maroc_telecom --year 2023
```

Le premier lancement télécharge les modèles (environ 2 à 3 Go) : c'est normal qu'il soit long.

## Jour 2 : poser une question

```bash
# Dans backend/, avec GROQ_API_KEY rempli dans .env
python -m app.rag "Quel est le chiffre d'affaires de Maroc Telecom en 2023 ?" --company maroc_telecom

# Ou via l'API (documentation interactive sur http://localhost:8000/docs)
uvicorn app.api:app --reload
```

Pipeline : recherche hybride (30 candidats) → reranking **bge-reranker-v2-m3** (5 meilleurs) → **Llama 3.3 70B via Groq**, qui répond dans la langue de la question en citant chaque source [n], avec l'entreprise, l'année et la page.

## Ce que fait l'ingestion

1. **Docling** lit chaque PDF : texte, titres et tableaux, avec OCR pour les pages scannées.
2. Le Markdown extrait est sauvegardé dans `data/processed/` pour vérifier la qualité à l'oeil.
3. Chaque tableau est exporté en CSV dans `data/tables/` (pour l'agent calculateur).
4. Le document est découpé en chunks qui respectent la structure (un tableau n'est pas coupé), précédés de leurs titres de section.
5. Chaque chunk reçoit deux représentations : **BGE-M3** (sens, multilingue) et **BM25** (mots-clés), stockées dans **Qdrant** avec ses métadonnées (entreprise, année, page).
6. La recherche combine les deux classements par **fusion RRF** (recherche hybride).

## Architecture cible

Ingestion (Docling, BGE-M3, Qdrant) → agents LangGraph (chercheur, calculateur, vérificateur) → API FastAPI + serveur MCP → front Next.js animé avec connexion Supabase.

## Feuille de route

- **V1 (en cours)** : recherche hybride + reranking, agents LangGraph, garde-fous, serveur MCP, évaluation RAGAS et traces Langfuse, front Next.js avec connexion, déploiement Docker.
- **V2** : GraphRAG (Neo4j), RAG multimodal (ColPali), fine-tuning LoRA d'un petit modèle routeur servi avec vLLM, Kubernetes.
