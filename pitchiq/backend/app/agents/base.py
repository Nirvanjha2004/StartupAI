"""BaseAgent class with tools, memory, and retry logic"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import json

class BaseAgent(ABC):
    """Base class for all agents with common functionality"""
    
    def __init__(self, name: str, model: str = "claude"):
        self.name = name
        self.model = model
        self.tools: List[Dict[str, Any]] = []
        self.memory: List[Dict[str, str]] = []
        self.max_retries = 3
        self.retry_count = 0
    
    def add_tool(self, tool: Dict[str, Any]) -> None:
        """Register a tool the agent can use"""
        self.tools.append(tool)
    
    def remember(self, key: str, value: str) -> None:
        """Store information in agent memory"""
        self.memory.append({"key": key, "value": value})
    
    def get_memory(self, key: str) -> Optional[str]:
        """Retrieve information from agent memory"""
        for item in self.memory:
            if item["key"] == key:
                return item["value"]
        return None
    
    async def execute(self, task: str) -> str:
        """Execute agent on a task with retry logic"""
        for attempt in range(self.max_retries):
            try:
                self.retry_count = attempt
                result = await self._execute_task(task)
                return result
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                print(f"Attempt {attempt + 1} failed: {e}. Retrying...")
    
    @abstractmethod
    async def _execute_task(self, task: str) -> str:
        """Subclass implementation of task execution"""
        pass
    
    def _format_tools(self) -> str:
        """Format tools as JSON for LLM"""
        return json.dumps(self.tools, indent=2)
