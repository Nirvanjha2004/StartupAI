"""Planner agent - breaks down tasks into subtasks"""

from app.agents.base import BaseAgent

class PlannerAgent(BaseAgent):
    """Agent that creates execution plans for tasks"""
    
    def __init__(self):
        super().__init__(name="Planner", model="claude")
        self._setup_tools()
    
    def _setup_tools(self):
        """Register tools available to planner"""
        self.add_tool({
            "name": "create_plan",
            "description": "Break down a task into subtasks",
            "parameters": {
                "task": "str",
                "depth": "int"
            }
        })
    
    async def _execute_task(self, task: str) -> str:
        """Create a plan for the given task"""
        # This would call LLM with planner-specific prompt
        prompt = f"""Break down this task into concrete subtasks:
{task}

Format response as JSON with 'subtasks' array"""
        
        # TODO: Call LLM
        return prompt
