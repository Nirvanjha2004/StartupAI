"""
Critic agent — scores quality and suggests improvements.

Serves two roles:
  1. Pipeline inference critic: called by the gateway pipeline to gate/refine
     LLM responses. Returns strict JSON {score, feedback} via run_critic().
  2. Agent-layer critic: used by the orchestrator pipeline to score drafts
     on multiple dimensions (clarity, relevance, tone) via score().
"""

from __future__ import annotations

import json
from typing import Any, Dict

from app.agents.base import BaseAgent
from app.utils.logger import get_logger

logger = get_logger("critic")

_INFERENCE_CRITIC_SYSTEM_PROMPT = """You are a strict quality evaluator for AI-generated sales outreach content.

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
    """Result from the inference critic."""

    def __init__(self, score: float, feedback: str, input_tokens: int, output_tokens: int):
        self.score = score
        self.feedback = feedback
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens


async def run_critic(original_prompt: str, current_response: str) -> CriticResult:
    """
    Run the inference critic on a prompt + response pair.

    Used by the gateway pipeline (both FREE and PREMIUM tiers).
    Always uses the cheap Groq model — never Claude.

    Returns CriticResult. On JSON parse failure, defaults to
    score=5.0 and feedback="Could not evaluate".
    """
    from app.config import settings
    from app.gateway.proxy import call_llm

    messages = [
        {"role": "system", "content": _INFERENCE_CRITIC_SYSTEM_PROMPT},
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
        score = max(1.0, min(10.0, score))
    except (json.JSONDecodeError, KeyError, ValueError, TypeError) as exc:
        logger.warning(
            "Critic returned invalid JSON (%s). Defaulting score=5.0. Raw: %s",
            exc,
            raw.text[:200],
        )
        score = 5.0
        feedback = "Could not evaluate"

    return CriticResult(
        score=score,
        feedback=feedback,
        input_tokens=raw.input_tokens,
        output_tokens=raw.output_tokens,
    )


class CriticAgent(BaseAgent):
    """
    Agent-layer critic used by the orchestrator pipeline.
    Scores drafts on multiple dimensions (clarity, relevance, tone).
    """

    def __init__(self):
        super().__init__(name="Critic", model="claude")
        self._setup_tools()

    def _setup_tools(self):
        self.add_tool({
            "name": "score_output",
            "description": "Score output on multiple dimensions",
            "parameters": {"output": "str", "criteria": "list"},
        })
        self.add_tool({
            "name": "suggest_improvements",
            "description": "Suggest improvements to output",
            "parameters": {"output": "str", "scores": "dict"},
        })

    async def score(self, output: str, criteria: list) -> Dict[str, float]:
        """Score output on given criteria, returns {criterion: 0-1}."""
        # TODO: Call LLM and parse per-criterion scores
        return {}

    async def _execute_task(self, task: str) -> str:
        """Evaluate and suggest improvements."""
        # TODO: Call LLM with critic tools
        return task
