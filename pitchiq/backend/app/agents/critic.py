"""Critic agent - scores quality and suggests improvements"""

from app.agents.base import BaseAgent
from typing import Dict, Any

class CriticAgent(BaseAgent):
    """Agent that evaluates and improves outputs"""
    
    def __init__(self):
        super().__init__(name="Critic", model="claude")
        self._setup_tools()
    
    def _setup_tools(self):
        """Register tools available to critic"""
        self.add_tool({
            "name": "score_output",
            "description": "Score output on multiple dimensions",
            "parameters": {
                "output": "str",
                "criteria": "list"
            }
        })
        self.add_tool({
            "name": "suggest_improvements",
            "description": "Suggest improvements to output",
            "parameters": {
                "output": "str",
                "scores": "dict"
            }
        })
    
    async def score(self, output: str, criteria: list) -> Dict[str, float]:
        """Score output on given criteria"""
        # Returns dict like {"clarity": 0.8, "relevance": 0.9, "tone": 0.7}
        prompt = f"""Score this output on the given criteria:
{output}

Criteria: {criteria}

Return JSON with scores 0-1 for each criterion."""
        
        # TODO: Call LLM and parse scores
        return {}
    
    async def _execute_task(self, task: str) -> str:
        """Evaluate and improve output"""
        prompt = f"""Evaluate and suggest improvements:
{task}

Provide detailed feedback and rewrite suggestions."""
        
        # TODO: Call LLM with critic tools
        return prompt
