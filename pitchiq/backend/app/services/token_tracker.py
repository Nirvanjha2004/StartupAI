"""Token usage and cost tracking per run"""

from typing import Optional, Dict, Any
from dataclasses import dataclass
from sqlalchemy import insert
from app.db.models import TokenUsage
import uuid

@dataclass
class TokenCost:
    """Token cost for a model"""
    input_cost_per_1k: float
    output_cost_per_1k: float

# Pricing as of 2024
PRICING = {
    "groq": TokenCost(0.0, 0.0),  # Free tier
    "claude-3-opus": TokenCost(0.015, 0.075),
    "claude-3-sonnet": TokenCost(0.003, 0.015),
}

class TokenTracker:
    """Tracks token usage and calculates costs"""
    
    @staticmethod
    def calculate_cost(
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> float:
        """Calculate cost for a request"""
        pricing = PRICING.get(model, TokenCost(0, 0))
        input_cost = (input_tokens / 1000) * pricing.input_cost_per_1k
        output_cost = (output_tokens / 1000) * pricing.output_cost_per_1k
        return input_cost + output_cost
    
    @staticmethod
    async def log_usage(
        user_id: str,
        task_id: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        db
    ) -> Dict[str, Any]:
        """Log token usage to database"""
        cost = TokenTracker.calculate_cost(model, input_tokens, output_tokens)
        
        usage = TokenUsage(
            id=str(uuid.uuid4()),
            user_id=user_id,
            task_id=task_id,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost
        )
        
        db.add(usage)
        await db.commit()
        
        return {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cost": cost,
            "model": model
        }
    
    @staticmethod
    async def get_user_stats(user_id: str, db) -> Dict[str, Any]:
        """Get usage stats for a user"""
        # TODO: Query aggregated usage
        return {
            "total_requests": 0,
            "total_tokens": 0,
            "total_cost": 0.0
        }
