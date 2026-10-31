# Jeu de test

Chaque ligne de `questions.jsonl` est une question :

| Champ | Rôle |
| --- | --- |
| `type` | `fact`, `calculate`, `compare` ou `unanswerable` (question piège sans réponse dans les rapports) |
| `company`, `year` | filtres (identifiant = nom du dossier dans `data/raw/`) |
| `pages` | page(s) du PDF où se trouve la bonne réponse → sert au Recall@5 et au MRR |
| `expected_numbers` | chiffres qui doivent apparaître dans la réponse, ex. `["36 7"]` → exactitude des chiffres |

Les 10 questions fournies sont des exemples : ouvrez les rapports, remplissez `pages` et `expected_numbers`,
puis complétez jusqu'à 30 questions (objectif final : 120). **Ne réutilisez jamais ces questions pour
entraîner un modèle** : elles servent uniquement à mesurer.

```bash
cd backend
python -m app.evaluate --mode simple   # RAG simple
python -m app.evaluate                 # système multi-agents
```

Comparez les deux résumés dans `eval/results/` : c'est votre étude d'ablation.
