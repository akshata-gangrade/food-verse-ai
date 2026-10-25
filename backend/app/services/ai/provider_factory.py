import logging
from app.core.config import get_settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.demo_provider import DemoProvider

logger = logging.getLogger("aahaar.ai.factory")
settings = get_settings()

_cached_provider: BaseAIProvider = None


def get_ai_provider() -> BaseAIProvider:
    global _cached_provider
    if _cached_provider is not None:
        return _cached_provider

    current_settings = get_settings()
    if current_settings.is_demo:
        logger.info("[AI] Running in DEMO MODE. Using DemoProvider.")
        _cached_provider = DemoProvider()
    else:
        active_prov = current_settings.active_provider
        if active_prov == "groq":
            try:
                from app.services.ai.groq_provider import GroqProvider
                logger.info(f"[AI] Running in LIVE AI MODE (Groq) with model: {current_settings.GROQ_MODEL}")
                _cached_provider = GroqProvider()
            except Exception as e:
                logger.error(f"[AI] Failed to initialize GroqProvider: {e}")
                raise RuntimeError(f"Failed to initialize live GroqProvider: {e}")
        else:
            try:
                from app.services.ai.gemini_provider import GeminiProvider
                logger.info(f"[AI] Running in LIVE AI MODE (Gemini) with model: {current_settings.GEMINI_MODEL}")
                _cached_provider = GeminiProvider()
            except Exception as e:
                logger.error(f"[AI] Failed to initialize GeminiProvider: {e}")
                raise RuntimeError(f"Failed to initialize live GeminiProvider: {e}")

    return _cached_provider


def reset_cached_provider():
    global _cached_provider
    _cached_provider = None
