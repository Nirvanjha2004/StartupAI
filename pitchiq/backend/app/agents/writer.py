"""Writer agent - generates email drafts"""

from app.agents.base import BaseAgent

class WriterAgent(BaseAgent):
    """Agent that generates personalized email drafts"""
    
    def __init__(self):
        super().__init__(name="Writer", model="claude")
        self._setup_tools()
    
    def _setup_tools(self):
        """Register tools available to writer"""
        self.add_tool({
            "name": "generate_email",
            "description": "Generate personalized email draft",
            "parameters": {
                "recipient": "str",
                "company": "str",
                "context": "str",
                "tone": "str"
            }
        })
        self.add_tool({
            "name": "refine_email",
            "description": "Refine existing email draft",
            "parameters": {
                "draft": "str",
                "feedback": "str"
            }
        })
    
    async def _execute_task(self, task: str) -> str:
        """Generate email draft based on context"""
        prompt = f"""Generate a personalized email draft:
{task}

Make it professional, personalized, and compelling."""
        
        # TODO: Call LLM with writing tools
        return prompt
