"""
Tiered inference pipeline — the core of the LLM gateway.

FREE tier:
  1. Check semantic cache → return on hit
  2. Call Groq llama-3.1-8b-instant
  3. Run critic once (Groq)
  4. Return response + quality_score regardless of score
  5. Store in cache

PREMIUM tier:
  1. Check semantic cache → return on hit
  2. Call Claude Sonnet
  3. Run critic (Groq)
  4. If score >= 8.5 → return
  5. If score < 8.5 → append feedback, rewrite with Claude
  6. Repeat until score >= 8.5 OR max 5 iterations
  7. Return best response with iteration count
  8. Store in cache
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.gateway import cache as semantic_cache
from app.gateway.critic import run_critic
from app.gateway.proxy import call_llm
from app.gateway.router import route
from app.services.token_tracker import record_usage
from app.utils.logger import get_logger

# Fallback model when primary call fails
_FALLBACK_MODEL = settings.CLAUDE_QUALITY_MODEL

logger = get_logger("pipeline")


@dataclass
class PipelineResult:
    response: str
    model_used: str
    quality_score: float
    iterations: int
    cached: bool
    estimated_cost_usd: float
    note: Optional[str] = None


async def run_inference(
    prompt: str,
    messages: list[dict],
    user_tier: str,
    db: AsyncSession,
    user_id: Optional[str] = None,
    task_id: Optional[str] = None,
) -> PipelineResult:
    """
    Execute the full tiered inference pipeline.

    Args:
        prompt:     The user's prompt text (used for cache key and critic).
        messages:   Full conversation history in OpenAI format.
        user_tier:  "free" or "premium".
        db:         Async DB session for cache + token tracking.
        user_id:    Optional user identifier for token tracking.
        task_id:    Optional task identifier for token tracking.

    Returns:
        PipelineResult with all metadata.
    """
    decision = route(user_tier)
    model = decision["model"]
    strategy = decision["strategy"]

    # ── 1. Semantic cache check ──────────────────────────────────────────────
    cached_result = await semantic_cache.cache_get(prompt, db)
    if cached_result:
        return PipelineResult(
            response=cached_result.response_text,
            model_used=cached_result.model_used,
            quality_score=cached_result.quality_score,
            iterations=0,
            cached=True,
            estimated_cost_usd=0.0,
            note=_tier_note(user_tier),
        )

    # ── 2. LLM call + critic loop ────────────────────────────────────────────
    if strategy == "single_pass":
        result = await _run_free_pipeline(prompt, messages, model, db, user_id, task_id)
    else:
        result = await _run_premium_pipeline(prompt, messages, model, db, user_id, task_id)

    # ── 3. Store in cache ────────────────────────────────────────────────────
    await semantic_cache.cache_set(
        prompt=prompt,
        response_text=result.response,
        model_used=result.model_used,
        quality_score=result.quality_score,
        db=db,
    )

    return result


# ── Free tier ────────────────────────────────────────────────────────────────

async def _run_free_pipeline(
    prompt: str,
    messages: list[dict],
    model: str,
    db: AsyncSession,
    user_id: Optional[str],
    task_id: Optional[str],
) -> PipelineResult:
    total_cost = 0.0

    # LLM call — fallback to Claude if Groq fails
    try:
        llm_response = await call_llm(model=model, messages=messages)
    except Exception as exc:
        logger.warning("Primary model %s failed (%s), falling back to %s", model, exc, _FALLBACK_MODEL)
        llm_response = await call_llm(model=_FALLBACK_MODEL, messages=messages)

    cost = await record_usage(
        model_used=llm_response.model,
        input_tokens=llm_response.input_tokens,
        output_tokens=llm_response.output_tokens,
        db=db,
        user_id=user_id,
        task_id=task_id,
    )
    total_cost += cost

    # Critic — single pass, result shown to user but does NOT gate the response
    critic_result = await run_critic(prompt, llm_response.text)
    critic_cost = await record_usage(
        model_used=settings.GROQ_CHEAP_MODEL,
        input_tokens=critic_result.raw_response.input_tokens,
        output_tokens=critic_result.raw_response.output_tokens,
        db=db,
        user_id=user_id,
        task_id=task_id,
    )
    total_cost += critic_cost

    return PipelineResult(
        response=llm_response.text,
        model_used=llm_response.model,
        quality_score=critic_result.score,
        iterations=1,
        cached=False,
        estimated_cost_usd=total_cost,
        note="Upgrade to Premium for iterative refinement",
    )


# ── Premium tier ─────────────────────────────────────────────────────────────

async def _run_premium_pipeline(
    prompt: str,
    messages: list[dict],
    model: str,
    db: AsyncSession,
    user_id: Optional[str],
    task_id: Optional[str],
) -> PipelineResult:
    total_cost = 0.0
    current_messages = list(messages)  # mutable copy

    best_response: str = ""
    best_score: float = 0.0
    best_model: str = model
    iteration = 0
    note: Optional[str] = None

    for iteration in range(1, settings.MAX_CRITIC_ITERATIONS + 1):
        # LLM call — fallback to Claude if primary fails
        try:
            llm_response = await call_llm(model=model, messages=current_messages)
        except Exception as exc:
            logger.warning("Primary model %s failed (%s), falling back to %s", model, exc, _FALLBACK_MODEL)
            llm_response = await call_llm(model=_FALLBACK_MODEL, messages=current_messages)

        cost = await record_usage(
            model_used=llm_response.model,
            input_tokens=llm_response.input_tokens,
            output_tokens=llm_response.output_tokens,
            db=db,
            user_id=user_id,
            task_id=task_id,
        )
        total_cost += cost

        # Critic
        critic_result = await run_critic(prompt, llm_response.text)
        critic_cost = await record_usage(
            model_used=settings.GROQ_CHEAP_MODEL,
            input_tokens=critic_result.raw_response.input_tokens,
            output_tokens=critic_result.raw_response.output_tokens,
            db=db,
            user_id=user_id,
            task_id=task_id,
        )
        total_cost += critic_cost

        logger.info(
            "Premium iteration %d/%d — score=%.1f feedback=%s",
            iteration,
            settings.MAX_CRITIC_ITERATIONS,
            critic_result.score,
            critic_result.feedback,
        )

        # Track best response
        if critic_result.score > best_score:
            best_score = critic_result.score
            best_response = llm_response.text
            best_model = llm_response.model

        # Exit if quality threshold met
        if critic_result.score >= settings.PREMIUM_QUALITY_THRESHOLD:
            break

        # Append feedback and ask for a rewrite
        current_messages = current_messages + [
            {"role": "assistant", "content": llm_response.text},
            {
                "role": "user",
                "content": (
                    f"The previous response scored {critic_result.score:.1f}/10. "
                    f"Feedback: {critic_result.feedback}. "
                    "Please rewrite the response addressing this feedback."
                ),
            },
        ]
    else:
        # Loop exhausted without hitting threshold
        note = "Max iterations reached"
        logger.info("Premium pipeline hit max iterations. Best score: %.1f", best_score)

    return PipelineResult(
        response=best_response,
        model_used=best_model,
        quality_score=best_score,
        iterations=iteration,
        cached=False,
        estimated_cost_usd=total_cost,
        note=note,
    )


def _tier_note(user_tier: str) -> Optional[str]:
    if user_tier == "free":
        return "Upgrade to Premium for iterative refinement"
    return None
