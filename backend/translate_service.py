"""LLM-powered translation for admin-added content (products, categories, custom HTML).

Uses the Emergent universal LLM key + Claude Sonnet via the emergentintegrations library.
Translations are cached on the source document so we don't re-bill on each render.
"""
import os
import json
import logging
import asyncio
from typing import Dict, Optional, List
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
TARGET_LANGS = [
    ("nl", "Dutch"),
    ("de", "German"),
    ("fr", "French"),
    ("pt", "Portuguese (European)"),
]


def llm_configured() -> bool:
    return bool(EMERGENT_LLM_KEY)


async def translate_fields(name: str, description: str = "") -> Dict[str, Dict[str, str]]:
    """Translate a product's name + description into NL/DE/FR/PT.

    Returns {"nl": {"name": "...", "desc": "..."}, ...}. On failure returns {} so callers
    can fall back gracefully.
    """
    if not llm_configured():
        return {}
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception:
        logger.exception("emergentintegrations missing — translations disabled")
        return {}

    out: Dict[str, Dict[str, str]] = {}
    sys = (
        "You are a professional B2B technical-translation engine for an industrial precision-gauges "
        "and cutting-tools brand. Translate the supplied English product copy into the requested target "
        "language with these rules:\n"
        "1. Keep technical terms (ISO codes, dimensions, tolerances, units, material names) untranslated when "
        "they are standardised or English-customary.\n"
        "2. Use the formal-business register appropriate for the target language (Sie / Vous / V. Exa. / U).\n"
        "3. Output ONLY a strict JSON object — no preamble, no markdown — with keys 'name' and 'desc'.\n"
        "4. Never invent product features the source text does not mention."
    )
    user_text = (
        f"Source language: English\n"
        f"PRODUCT NAME: {name}\n"
        f"PRODUCT DESCRIPTION: {description}\n\n"
        "Return ONLY a JSON object {\"name\":\"…\",\"desc\":\"…\"} translated into the TARGET LANGUAGE specified."
    )

    # Run all 4 languages concurrently
    async def one(code: str, label: str) -> None:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"translate-{code}-{abs(hash(name+description)) % 10_000_000}",
                system_message=sys,
            ).with_model("anthropic", "claude-sonnet-4-6")
            msg = UserMessage(text=user_text + f"\nTARGET LANGUAGE: {label} ({code})")
            resp = await chat.send_message(msg)
            # Strip markdown fences if any
            text = (resp or "").strip()
            if text.startswith("```"):
                text = text.strip("`")
                if text.lower().startswith("json"):
                    text = text[4:].strip()
            data = json.loads(text)
            out[code] = {"name": str(data.get("name", "")).strip(), "desc": str(data.get("desc", "")).strip()}
        except Exception as e:
            logger.warning("Translate to %s failed: %s", code, e)

    await asyncio.gather(*(one(code, label) for code, label in TARGET_LANGS))
    return out
