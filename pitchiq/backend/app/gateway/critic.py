"""
Critic runner for the inference pipeline.

The critic always uses groq/llama-3.1-8b-instant regardless of user tier.
It receives the original prompt + current response and must reply in strict JSON:

    {"score": <float 1-10>, "feedback": "<one sentence>"}

No preamble, no markdown — only JSON.
"""

from __future__ import annotations

import json

from app.config import settings
from app.gateway.proxy import call_llm, NormalizedResponse
from app.utils.logger import get_logger

logger = get_logger("critic")

_CRITIC_SYSTEM_PROMPT = """You are a strict quality evaluator for AI-generated sales outreach content.

Evaluate the response to the given prompt and return ONLY a JSON object with no preamble, no markdown, no explanation:

{"score": <float between 1.0 and 10.0>, "feedback": "<one sentence describing the single most important improvement>"}

Scoring guide:
- 9-10: Exceptional, publish-ready
- 7-8.9: Good, minor polish needed
- 5-6.9: Acceptable but clearly improvable
- 3-4.9: Weak, significant issues
- 1-2.9: Poor, fundamental problems

Return ONLY the JSON object. Nothing else."""


class CriticResult:
    def __init__(self, score: float, feedback: str, raw_response: NormalizedResponse):
        self.score = score
        self.feedback = feedback
        self.raw_response = raw_response


async def run_critic(original_prompt: str, current_response: str) -> CriticResult:
    """
    Run the critic on a prompt + response pair.

    Returns a CriticResult. On JSON parse failure, defaults to score=5.0
    and feedback="Could not evaluate".
    """
    messages = [
        {"role": "system", "content": _CRITIC_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"ORIGINAL PROMPT:\n{original_prompt}\n\n"
                f"RESPONSE TO EVALUATE:\n{current_response}"
            ),
        },
    ]

    raw = await call_llm(model=settings.GROQ_CHEAP_MODEL, messages=messages)

    try:
        parsed = json.loads(raw.text.strip())
        score = float(parsed["score"])
        feedback = str(parsed["feedback"])
        # Clamp score to valid range
        score = max(1.0, min(10.0, score))
    except (json.JSONDecodeError, KeyError, ValueError, TypeError) as exc:
        logger.warning("Critic returned invalid JSON (%s). Defaulting score=5.0. Raw: %s", exc, raw.text[:200])
        score = 5.0
        feedback = "Could not evaluate"

    return CriticResult(score=score, feedback=feedback, raw_response=raw)
