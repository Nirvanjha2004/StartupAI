"""Enricher agent - finds and enriches decision-maker information"""

from app.agents.base import BaseAgent

class EnricherAgent(BaseAgent):
    """Agent that enriches contact information and finds decision makers"""
    
    def __init__(self):
        super().__init__(name="Enricher", model="claude")
        self._setup_tools()
    
    def _setup_tools(self):
        """Register tools available to enricher"""
        self.add_tool({
            "name": "find_contact",
            "description": "Find contact information and decision maker",
            "parameters": {
                "company": "str",
                "role": "str",
                "industry": "str"
            }
        })
        self.add_tool({
            "name": "enrich_profile",
            "description": "Get additional info about a person",
            "parameters": {
                "name": "str",
                "company": "str"
            }
        })
    
    async def _execute_task(self, task: str) -> str:
        """Enrich target contact information"""
        prompt = f"""Find and enrich decision-maker information:
{task}

Return structured contact data with enrichment details."""
        
        # TODO: Call LLM with enrichment tools
        return prompt
