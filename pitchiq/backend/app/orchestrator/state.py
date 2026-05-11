"""Shared task state stored in PostgreSQL"""

from typing import Optional, Dict, Any
from sqlalchemy import Column, String, JSON, DateTime, func
from datetime import datetime
from app.db.session import Base

class TaskState(Base):
    """Task state stored in database"""
    __tablename__ = "task_state"
    
    id = Column(String, primary_key=True)
    user_id = Column(String)
    status = Column(String, default="pending")  # pending, running, completed, failed
    input_data = Column(JSON)
    intermediate_results = Column(JSON, default={})
    final_result = Column(JSON)
    error_message = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "status": self.status,
            "input_data": self.input_data,
            "intermediate_results": self.intermediate_results,
            "final_result": self.final_result,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class StateManager:
    """Manages task state in database"""
    
    async def create_state(self, task_id: str, user_id: str, input_data: Dict[str, Any], db) -> TaskState:
        """Create new task state"""
        state = TaskState(id=task_id, user_id=user_id, input_data=input_data, status="pending")
        db.add(state)
        await db.commit()
        return state
    
    async def update_state(self, task_id: str, updates: Dict[str, Any], db) -> TaskState:
        """Update task state"""
        state = await db.get(TaskState, task_id)
        if state:
            for key, value in updates.items():
                setattr(state, key, value)
            await db.commit()
        return state
    
    async def get_state(self, task_id: str, db) -> Optional[TaskState]:
        """Get task state"""
        return await db.get(TaskState, task_id)
