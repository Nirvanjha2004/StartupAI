"""
Model Router — maps user tier to inference strategy and model.

Tier alone determines routing; no complexity classification needed.
"""

from __future__ import annotations

from typing import Literal, TypedDict

from app.config import settings


class RouteDecision(TypedDict):
    strategy: Literal["single_pass", "iterative"]
    model: str


def route(user_tier: Literal["free", "premium"]) -> RouteDecision:
    """
    Return the inference strategy and model for the given user tier.

    FREE    → single_pass  with GROQ_CHEAP_MODEL
    PREMIUM → iterative    with PREMIUM_MODEL
              (currently also Groq; swap config.PREMIUM_MODEL to Claude when ready)
    """
    if user_tier == "premium":
        return RouteDecision(
            strategy="iterative",
            model=settings.PREMIUM_MODEL,
        )
    return RouteDecision(
        strategy="single_pass",
        model=settings.GROQ_CHEAP_MODEL,
    )
