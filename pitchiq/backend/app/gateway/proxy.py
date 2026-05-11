"""Actual LLM API calls"""

from typing import Optional
import groq
import anthropic
from app.config import settings

class LLMProxy:
    """Proxy for calling various LLM APIs"""
    
    def __init__(self):
        self.groq_client = groq.Groq(api_key=settings.GROQ_API_KEY)
        self.anthropic_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    async def call_groq(self, messages: list, model: str = "mixtral-8x7b-32768") -> str:
        """Call Groq API"""
        response = self.groq_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=2048
        )
        return response.choices[0].message.content
    
    async def call_claude(self, messages: list, model: str = "claude-3-opus-20240229") -> str:
        """Call Anthropic Claude API"""
        response = self.anthropic_client.messages.create(
            model=model,
            max_tokens=2048,
            messages=messages
        )
        return response.content[0].text
    
    async def call(self, model_type: str, messages: list) -> str:
        """Route to appropriate LLM"""
        if model_type == "groq":
            return await self.call_groq(messages)
        elif model_type == "claude":
            return await self.call_claude(messages)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
