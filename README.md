# RAG agentique multilingue : analyste financier IA (Astrolabe)

Astrolabe répond en français, anglais et arabe à des questions sur les rapports financiers des sociétés cotées à la Bourse de Casablanca. Des agents IA cherchent les bons passages, calculent les ratios avec du code, vérifient la réponse et citent la page source de chaque chiffre.

**Stack** : Docling · BGE-M3 + BM25 · Qdrant · bge-reranker-v2-m3 · LangGraph · Llama 3.3 (Groq) · FastAPI · MCP · Langfuse · Next.js · Tailwind · Framer Motion · Supabase Auth · Docker

## Architecture

```
PDF (data/raw) ─► Docling ─► chunks + tableaux ─► BGE-M3 (sens) + BM25 (mots-clés) ─► Qdrant
                                                                                     │
Question ─► Garde-fou ─► Routeur ─► Chercheur (recherche hybride + reranking) ◄──────┘
                            │             │
                            │             ├─► Calculateur (le LLM extrait les chiffres, le code calcule)
                            │             ▼
                            │         Rédacteur ─► Vérificateur ──(non fidèle)──► Rédacteur
                            ▼                           │
                     Refus (hors sujet)          Réponse + citations [n] + page
```

Accès : API FastAPI (avec streaming des étapes), serveur MCP (Claude Desktop), front Next.js.

## Installation

Prérequis : Python 3.11 ou 3.12, Node.js 20+, Docker Desktop. Clés gratuites : [Groq](https://console.groq.com) (obligatoire), [Supabase](https://supabase.com) et [Langfuse](https://cloud.langfuse.com) (optionnels).

### 1. Back-end

```bash
cp .env.example .env              # puis remplir GROQ_API_KEY
docker compose up -d              # lance Qdrant

cd backend
python -m venv .venv
source .venv/bin/activate         # Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Indexer les rapports

Déposez les PDF dans `data/raw/<entreprise>/<annee>.pdf` (minuscules, sans espaces), par exemple `data/raw/cosumar/2023.pdf`.

```bash
python -m app.ingest --reset      # le premier lancement télécharge les modèles (2 à 3 Go)
python -m app.search "chiffre d'affaires consolidé" --company cosumar --year 2023
```

Vérifiez la qualité du parsing dans `data/processed/*.md` et les tableaux dans `data/tables/`.

### 3. Poser des questions

```bash
python -m app.rag "Quel est le chiffre d'affaires de Cosumar en 2023 ?"          # RAG simple
python -m app.agents "De combien a évolué le CA de Cosumar entre 2022 et 2023 ?"  # agents
uvicorn app.api:app --reload      # API sur http://localhost:8000/docs
```

### 4. Front-end

```bash
cd frontend
cp .env.local.example .env.local  # Supabase optionnel : sans clés, mode démo sans connexion
npm install
npm run dev                       # http://localhost:3000
```

Pages : accueil animé, connexion / inscription / mot de passe oublié / Google, chat avec les étapes des agents en direct, citations cliquables, mode sombre.

Pour activer la connexion : créez un projet Supabase, copiez l'URL et la clé `anon` dans `frontend/.env.local`, et le **JWT Secret** dans `.env` (`SUPABASE_JWT_SECRET`) pour que l'API vérifie les jetons. Pour Google, activez le fournisseur dans Supabase > Authentication > Providers.

### 5. Serveur MCP (Claude Desktop)

```bash
python -m app.mcp_server
```

Copiez `docs/claude_desktop_config.json` dans la configuration de Claude Desktop en remplaçant les chemins. Outils exposés : `list_indexed_companies`, `search_reports`, `ask_financial_analyst`.

### 6. Évaluation

```bash
python -m app.evaluate --mode simple   # RAG simple
python -m app.evaluate                 # agents
```

Mesures : Recall@5, MRR, chiffres exacts, fidélité (LLM juge), refus correct, latence. Voir `eval/README.md` pour compléter le jeu de test.

## Résultats

À compléter après l'évaluation sur les vrais rapports :

| Version | Recall@5 | MRR | Chiffres exacts | Fidélité | Refus correct | Latence |
| --- | --- | --- | --- | --- | --- | --- |
| RAG simple | | | | | | |
| Agents | | | | | | |

## Feuille de route (V2)

- GraphRAG avec Neo4j (relations entre entreprises, dirigeants, filiales)
- RAG multimodal avec ColPali (graphiques et tableaux scannés)
- Fine-tuning LoRA d'un petit modèle routeur, servi avec vLLM
- Déploiement Kubernetes, visionneuse PDF avec surlignage, tableau de bord des ratios

## Limites connues

- Les tableaux complexes ou scannés peuvent être mal extraits par Docling.
- La vérification de fidélité repose sur un LLM juge, qui peut lui-même se tromper.
- Outil d'aide à l'analyse : ce n'est pas un conseil en investissement.
