"""
Task event emitter — pushes SSE events to Redis list.

Key: task_events:{task_id}
Each value: JSON string of the event.
Sentinel: "DONE" pushed when pipeline finishes.
TTL: 1 hour after task completes.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import redis as redis_sync

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("events")

_redis: Optional[redis_sync.Redis] = None


def _get_redis() -> redis_sync.Redis:
    global _redis
    if _redis is None:
        _redis = redis_sync.from_url(settings.REDIS_URL, decode_responses=False)
    return _redis


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _push(task_id: str, event: Dict[str, Any]) -> None:
    """Push a JSON event to the Redis list. Silently ignores errors."""
    try:
        key = f"task_events:{task_id}"
        _get_redis().rpush(key, json.dumps(event))
        # Refresh TTL on every push — 1 hour
        _get_redis().expire(key, 3600)
    except Exception as exc:
        logger.warning("Event push failed (non-fatal): %s", exc)


def emit_task_started(task_id: str, message: str = "Task received. Analyzing...") -> None:
    _push(task_id, {"type": "task_started", "message": message, "timestamp": _now()})


def emit_plan_ready(task_id: str, agents: List[str]) -> None:
    agent_str = " → ".join(agents)
    _push(task_id, {
        "type": "plan_ready",
        "message": f"Plan created. Agents required: {agent_str}",
        "agents": agents,
        "timestamp": _now(),
    })


def emit_agent_started(task_id: str, agent: str, message: str) -> None:
    _push(task_id, {
        "type": "agent_started",
        "agent": agent,
        "message": message,
        "timestamp": _now(),
    })


def emit_agent_log(task_id: str, agent: str, message: str) -> None:
    _push(task_id, {
        "type": "agent_log",
        "agent": agent,
        "message": message,
        "timestamp": _now(),
    })


def emit_agent_completed(
    task_id: str,
    agent: str,
    message: str,
    tokens: int = 0,
    cost_usd: float = 0.0,
    latency_ms: int = 0,
) -> None:
    _push(task_id, {
        "type": "agent_completed",
        "agent": agent,
        "message": message,
        "tokens": tokens,
        "cost_usd": cost_usd,
        "latency_ms": latency_ms,
        "timestamp": _now(),
    })


def emit_task_completed(
    task_id: str,
    total_cost_usd: float,
    total_tokens: int,
    critic_score: float,
) -> None:
    score_str = f"{critic_score:.1f}/10" if critic_score > 0 else "n/a"
    _push(task_id, {
        "type": "task_completed",
        "message": f"All agents completed — ${total_cost_usd:.4f} · {score_str}",
        "total_cost_usd": total_cost_usd,
        "total_tokens": total_tokens,
        "critic_score": critic_score,
        "timestamp": _now(),
    })
    # Push sentinel
    try:
        _get_redis().rpush(f"task_events:{task_id}", "DONE")
    except Exception:
        pass


def emit_task_failed(task_id: str, message: str) -> None:
    _push(task_id, {
        "type": "task_failed",
        "message": message,
        "timestamp": _now(),
    })
    try:
        _get_redis().rpush(f"task_events:{task_id}", "DONE")
    except Exception:
        pass
