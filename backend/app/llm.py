"""Appels au LLM (Gemini ou Groq), avec traces Langfuse si les clés sont configurées.

Le fournisseur se choisit dans le .env avec LLM_PROVIDER (gemini ou groq).
"""
import json
import os
import time
from functools import lru_cache

from .config import GEMINI_API_KEY, GROQ_API_KEY, LLM_MODEL, LLM_PROVIDER

# Langfuse est optionnel : il trace chaque appel (latence, tokens, coût) si les clés existent.
if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
    from langfuse import observe
else:
    def observe(*_args, **_kwargs):
        return lambda fn: fn


@lru_cache
def gemini_client():
    from google import genai

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY manquant dans le fichier .env")
    return genai.Client(api_key=GEMINI_API_KEY)


@lru_cache
def groq_client():
    from groq import Groq

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY manquant dans le fichier .env")
    return Groq(api_key=GROQ_API_KEY)


def _chat_gemini(system: str, user: str, as_json: bool, temperature: float) -> str:
    from google.genai import types

    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=temperature,
        response_mime_type="application/json" if as_json else None,
    )
    response = gemini_client().models.generate_content(model=LLM_MODEL, contents=user, config=config)
    return response.text or ""


def _chat_groq(system: str, user: str, as_json: bool, temperature: float) -> str:
    kwargs = {"response_format": {"type": "json_object"}} if as_json else {}
    completion = groq_client().chat.completions.create(
        model=LLM_MODEL,
        temperature=temperature,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        **kwargs,
    )
    return completion.choices[0].message.content or ""


RETRYABLE = ("429", "500", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE", "overloaded")


def with_retry(fn, *args, attempts: int = 5, base_delay: float = 4.0):
    """Réessaie quand l'API est surchargée (503) ou limite le débit (429), avec un délai croissant."""
    for attempt in range(attempts):
        try:
            return fn(*args)
        except Exception as exc:  # noqa: BLE001
            if attempt == attempts - 1 or not any(code in str(exc) for code in RETRYABLE):
                raise
            time.sleep(base_delay * 2 ** attempt)


@observe(as_type="generation")
def chat(system: str, user: str, as_json: bool = False, temperature: float = 0.0) -> str:
    fn = _chat_groq if LLM_PROVIDER == "groq" else _chat_gemini
    return with_retry(fn, system, user, as_json, temperature)


def chat_json(system: str, user: str) -> dict:
    """Demande une réponse JSON ; renvoie {} si le modèle ne respecte pas le format."""
    try:
        return json.loads(chat(system, user, as_json=True))
    except (json.JSONDecodeError, TypeError):
        return {}
