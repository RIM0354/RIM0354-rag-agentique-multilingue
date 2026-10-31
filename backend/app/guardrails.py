"""Garde-fous d'entrée : longueur, tentatives de prompt injection.

Le hors-sujet est détecté par l'agent routeur ; la fidélité des réponses par l'agent vérificateur.
"""
import re

MAX_QUESTION_CHARS = 1000

INJECTION_PATTERNS = [
    r"ignore (all |the )?(previous|above|prior) (instructions|rules)",
    r"ignore (les|tes|toutes les) (instructions|consignes|règles)",
    r"oublie (tes|les) (instructions|consignes|règles)",
    r"(system|developer) prompt",
    r"tu es maintenant|you are now|act as|joue le rôle",
    r"تجاهل (التعليمات|الأوامر)",
]
_INJECTION_RE = re.compile("|".join(INJECTION_PATTERNS), re.IGNORECASE)


def check_question(question: str) -> str | None:
    """Renvoie un message de refus si la question est rejetée, sinon None."""
    if len(question.strip()) < 3:
        return "La question est trop courte."
    if len(question) > MAX_QUESTION_CHARS:
        return f"La question dépasse {MAX_QUESTION_CHARS} caractères."
    if _INJECTION_RE.search(question):
        return "Je ne peux pas traiter cette demande : elle ressemble à une tentative de modifier mes instructions."
    return None
