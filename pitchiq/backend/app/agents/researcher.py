"""Researcher agent - performs web search using Tavily"""

from app.agents.base import BaseAgent
from app.config import settings
import httpx

class ResearcherAgent(BaseAgent):
    """Agent that researches topics using web search"""
    
    def __init__(self):
        super().__init__(name="Researcher", model="claude")
        self.tavily_api_key = settings.TAVILY_API_KEY
        self._setup_tools()
    
    def _setup_tools(self):
        """Register tools available to researcher"""
        self.add_tool({
            "name": "web_search",
            "description": "Search the web for information using Tavily",
            "parameters": {
                "query": "str",
                "max_results": "int"
            }
        })
    
    async def web_search(self, query: str, max_results: int = 10) -> list:
        """Call Tavily web search API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": self.tavily_api_key,
                    "query": query,
                    "max_results": max_results,
                    "include_answer": True
                }
            )
            return response.json()
    
    async def _execute_task(self, task: str) -> str:
        """Research a topic"""
        # Extract search query from task
        prompt = f"""Research this topic and provide findings:
{task}

Use web search to gather current information."""
        
        # TODO: Call LLM with web search tool
        return prompt
