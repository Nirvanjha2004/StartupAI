"""
Task API endpoints.

POST /api/v1/task  — start a task (runs synchronously, returns full output)
GET  /api/v1/task/{task_id} — get task status and result
"""

from __future__ import annotations

from typing import Any, Dict, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.orchestrator.pipeline import AgentPipeline
from app.orchestrator.state import StateManager
from app.utils.logger import get_logger

logger = get_logger("api.tasks")

router = APIRouter()
state_manager = StateManager()


# ── Request / Response schemas ────────────────────────────────────────────────

class TaskRequest(BaseModel):
    task: str
    user_tier: Literal["free", "premium"] = "free"
    user_id: Optional[str] = None


class TaskStartResponse(BaseModel):
    task_id: str
    status: str
    message: str
    final_output: Optional[Dict[str, Any]] = None


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    plan: Optional[Dict[str, Any]] = None
    final_output: Optional[Dict[str, Any]] = None
    total_cost_usd: Optional[float] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/task", response_model=TaskStartResponse, summary="Run agent task")
async def run_task(
    request: TaskRequest,
    db: AsyncSession = Depends(get_db),
) -> TaskStartResponse:
    """
    Start a multi-agent task.

    Runs synchronously — waits for full completion and returns final_output.
    (Async job queue comes later.)
    """
    if not request.task.strip():
        raise HTTPException(status_code=422, detail="Task cannot be empty")

    logger.info("Starting task: %s (tier=%s)", request.task[:80], request.user_tier)

    pipeline = AgentPipeline()

    try:
        final_output = await pipeline.run(
            task=request.task,
            user_tier=request.user_tier,
            db=db,
            user_id=request.user_id,
        )
    except Exception as exc:
        logger.error("Task failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=f"Task execution failed: {exc}",
        )

    return TaskStartResponse(
        task_id=final_output["task_id"],
        status="completed",
        message="Task completed successfully",
        final_output=final_output,
    )


@router.get("/task/{task_id}", response_model=TaskStatusResponse, summary="Get task status")
async def get_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
) -> TaskStatusResponse:
    """Get task status and result by task_id."""
    task = await state_manager.get_task(task_id, db)

    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    return TaskStatusResponse(
        task_id=task.id,
        status=task.status,
        plan=task.plan,
        final_output=task.final_output,
        total_cost_usd=task.total_cost_usd,
        error_message=task.error_message,
        created_at=task.created_at.isoformat() if task.created_at else None,
    )
