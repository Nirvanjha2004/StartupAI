"""Text to vector embeddings for semantic cache"""

from typing import List
import httpx
from app.config import settings

class EmbeddingsService:
    """Generate embeddings for semantic caching"""
    
    def __init__(self, model: str = None):
        self.model = model or settings.EMBEDDINGS_MODEL
        self.api_key = settings.ANTHROPIC_API_KEY  # Using Claude's embedding API
    
    async def embed_text(self, text: str) -> List[float]:
        """Convert text to embedding vector"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {settings.ANTHROPIC_API_KEY}"},
                json={
                    "input": text,
                    "model": self.model
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Embedding API error: {response.text}")
            
            data = response.json()
            return data["data"][0]["embedding"]
    
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Convert multiple texts to embeddings"""
        embeddings = []
        for text in texts:
            embedding = await self.embed_text(text)
            embeddings.append(embedding)
        return embeddings
    
    @staticmethod
    async def similarity(vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a ** 2 for a in vec1) ** 0.5
        magnitude2 = sum(b ** 2 for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
