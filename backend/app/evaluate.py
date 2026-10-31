"""Jour 6 : évaluation sur le jeu de test (eval/questions.jsonl).

Mesures :
  - Recall@5 et MRR : la bonne page est-elle dans les 5 premiers extraits, et à quel rang ?
  - Exactitude des chiffres : les nombres attendus apparaissent-ils dans la réponse ?
  - Fidélité : part des réponses dont toutes les affirmations sont appuyées par les extraits (LLM juge).
  - Refus correct : sur les questions sans réponse, le système refuse-t-il au lieu d'inventer ?
  - Latence moyenne.

Usage (depuis backend/) :
    python -m app.evaluate                 # système multi-agents
    python -m app.evaluate --mode simple   # RAG simple, pour l'étude d'ablation
    python -m app.evaluate --retrieval-only
"""
import argparse
import json
import re
import time

from .config import ROOT_DIR
from .llm import chat_json
from .rerank import rerank
from .search import hybrid_search

EVAL_FILE = ROOT_DIR / "eval" / "questions.jsonl"
RESULTS_DIR = ROOT_DIR / "eval" / "results"

REFUSAL_MARKERS = ["je n'ai trouvé", "ne contiennent pas", "pas d'information", "ne permet pas",
                   "not found", "do not contain", "لا تتوفر", "لم أجد", "ne peux pas"]

JUDGE_PROMPT = """Tu évalues la fidélité d'une réponse. Une réponse est fidèle si chaque affirmation
et chaque chiffre est appuyé par les extraits fournis. Réponds en JSON : {"faithful": true|false}"""


def normalize_number(text: str) -> str:
    return re.sub(r"[\s  ]", "", text).replace(",", ".")


def numbers_ok(answer: str, expected: list[str]) -> bool:
    flat = normalize_number(answer)
    return all(normalize_number(n) in flat for n in expected)


def retrieval_rank(item: dict) -> int | None:
    """Rang (1..5) du premier extrait sur la bonne page, ou None."""
    candidates = hybrid_search(item["question"], k=30, company=item.get("company"), year=item.get("year"))
    for rank, hit in enumerate(rerank(item["question"], candidates, top_k=5), 1):
        if hit["company"] == item.get("company") and hit["page"] in item.get("pages", []):
            return rank
    return None


def run(mode: str, retrieval_only: bool) -> dict:
    items = [json.loads(line) for line in EVAL_FILE.read_text(encoding="utf-8").splitlines() if line.strip()]
    if mode == "simple":
        from .rag import answer as ask
    else:
        from .agents import ask_agents as ask

    rows, ranks = [], []
    for item in items:
        row = {"id": item["id"], "type": item.get("type")}
        if item.get("pages"):
            rank = retrieval_rank(item)
            ranks.append(rank)
            row["rank"] = rank
        if not retrieval_only:
            start = time.perf_counter()
            result = ask(item["question"], item.get("company"), item.get("year"))
            row["latency_s"] = round(time.perf_counter() - start, 2)
            answer = result["answer"]
            row["answer"] = answer
            if item.get("type") == "unanswerable":
                row["refused"] = any(m in answer.lower() for m in REFUSAL_MARKERS)
            else:
                if item.get("expected_numbers"):
                    row["numbers_ok"] = numbers_ok(answer, item["expected_numbers"])
                excerpts = "\n\n".join(s["excerpt"] for s in result.get("sources", []))
                row["faithful"] = bool(chat_json(JUDGE_PROMPT, f"Extraits :\n{excerpts}\n\nRéponse :\n{answer}").get("faithful"))
        rows.append(row)
        print(f"  {item['id']:<6} {json.dumps({k: v for k, v in row.items() if k != 'answer'}, ensure_ascii=False)}")

    def rate(key: str) -> float | None:
        values = [r[key] for r in rows if key in r]
        return round(100 * sum(values) / len(values), 1) if values else None

    found = [r for r in ranks if r]
    summary = {
        "mode": mode,
        "questions": len(items),
        "recall_at_5_%": round(100 * len(found) / len(ranks), 1) if ranks else None,
        "mrr": round(sum(1 / r for r in found) / len(ranks), 3) if ranks else None,
        "chiffres_exacts_%": rate("numbers_ok"),
        "fidelite_%": rate("faithful"),
        "refus_correct_%": rate("refused"),
        "latence_moyenne_s": round(sum(r["latency_s"] for r in rows if "latency_s" in r) / max(1, sum("latency_s" in r for r in rows)), 2),
    }
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    out = RESULTS_DIR / f"{time.strftime('%Y%m%d-%H%M%S')}-{mode}.json"
    out.write_text(json.dumps({"summary": summary, "rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\nRésumé :", json.dumps(summary, ensure_ascii=False, indent=2), f"\nDétails : {out}", sep="\n")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["agents", "simple"], default="agents")
    parser.add_argument("--retrieval-only", action="store_true")
    args = parser.parse_args()
    run(args.mode, args.retrieval_only)


if __name__ == "__main__":
    main()
