"""Appels au LLM (Llama 3.3 via Groq), avec traces Langfuse si les clés sont configurées."""
import json
import os
from functools import lru_cache

from groq import Groq

from .config import GROQ_API_KEY, LLM_MODEL

# Langfuse est optionnel : il trace chaque appel (latence, tokens, coût) si les clés existent.
if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
    from langfuse import observe
else:
    def observe(*_args, **_kwargs):
        return lambda fn: fn


@lru_cache
def client() -> Groq:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY manquant dans le fichier .env")
    return Groq(api_key=GROQ_API_KEY)


@observe(as_type="generation")
def chat(system: str, user: str, as_json: bool = False, temperature: float = 0.0) -> str:
    kwargs = {"response_format": {"type": "json_object"}} if as_json else {}
    completion = client().chat.completions.create(
        model=LLM_MODEL,
        temperature=temperature,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        **kwargs,
    )
    return completion.choices[0].message.content or ""


def chat_json(system: str, user: str) -> dict:
    """Demande une réponse JSON ; renvoie {} si le modèle ne respecte pas le format."""
    try:
        return json.loads(chat(system, user, as_json=True))
    except (json.JSONDecodeError, TypeError):
        return {}
