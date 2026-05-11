"""Model routing logic (simple→Groq, complex→Claude)"""

from enum import Enum

class ModelRouter:
    """Routes queries to appropriate LLM based on complexity"""
    
    SIMPLE_MODEL = "groq"
    COMPLEX_MODEL = "claude"
    
    @staticmethod
    def is_simple_query(context_lines: int, query_length: int) -> bool:
        """Determine if query is simple based on heuristics"""
        # Simple if context is small and query is straightforward
        return context_lines < 3 and query_length < 200
    
    @staticmethod
    def route(context: str, query: str) -> str:
        """Route query to appropriate model"""
        context_lines = len(context.split("\n"))
        query_length = len(query)
        
        if ModelRouter.is_simple_query(context_lines, query_length):
            return ModelRouter.SIMPLE_MODEL
        return ModelRouter.COMPLEX_MODEL
