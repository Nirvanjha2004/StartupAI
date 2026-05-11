"""Task API endpoints"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import uuid
from app.orchestrator.pipeline import Pipeline
from app.orchestrator.state import StateManager

router = APIRouter()
state_manager = StateManager()

class TaskRequest(BaseModel):
    company: str
    contact_name: str
    context: Optional[str] = None
    tone: Optional[str] = "professional"

class TaskResponse(BaseModel):
    task_id: str
    status: str
    created_at: str

@router.post("/run")
async def run_task(request: TaskRequest, background_tasks: BackgroundTasks):
    """Start a new task execution"""
    task_id = str(uuid.uuid4())
    
    # TODO: Store in DB via state_manager
    
    # Run pipeline in background
    background_tasks.add_task(_execute_pipeline, task_id, request.dict())
    
    return TaskResponse(
        task_id=task_id,
        status="pending",
        created_at="2024-01-01T00:00:00"  # TODO: actual timestamp
    )

@router.get("/task/{task_id}")
async def get_task_result(task_id: str):
    """Get task result and execution details"""
    # TODO: Query from DB
    return {
        "task_id": task_id,
        "status": "completed",
        "result": {
            "email_draft": "...",
            "sentiment": "positive",
            "tokens_used": 1234
        }
    }

@router.get("/tasks")
async def list_tasks(user_id: str):
    """List user's tasks"""
    # TODO: Query from DB
    return {"tasks": []}

async def _execute_pipeline(task_id: str, input_data: dict):
    """Background task execution"""
    pipeline = Pipeline()
    try:
        # TODO: Update state to "running"
        result = await pipeline.run(str(input_data))
        # TODO: Save result to DB
    except Exception as e:
        # TODO: Update state to "failed" with error
        print(f"Pipeline error for {task_id}: {e}")
