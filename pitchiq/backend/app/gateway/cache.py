"""pgvector semantic cache for responses"""

from typing import Optional
from sqlalchemy import text
from app.db.session import get_db
from app.config import settings

class SemanticCache:
    """Cache responses using pgvector semantic similarity"""
    
    def __init__(self):
        self.enabled = settings.CACHE_ENABLED
        self.ttl = settings.CACHE_TTL
        self.similarity_threshold = 0.95
    
    async def get(self, query_embedding: list, db=None) -> Optional[str]:
        """Get cached response by semantic similarity"""
        if not self.enabled or db is None:
            return None
        
        # SQL query using pgvector similarity search
        query = text("""
            SELECT response 
            FROM cache_entries 
            WHERE embedding <-> :embedding < :threshold
            AND created_at > NOW() - INTERVAL '1 hour'
            LIMIT 1
        """)
        
        try:
            result = await db.execute(
                query,
                {"embedding": query_embedding, "threshold": 1 - self.similarity_threshold}
            )
            row = result.first()
            return row[0] if row else None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    async def set(self, query_embedding: list, response: str, db=None) -> bool:
        """Cache response with embedding"""
        if not self.enabled or db is None:
            return False
        
        try:
            # Insert into cache with pgvector embedding
            insert_query = text("""
                INSERT INTO cache_entries (embedding, response, created_at)
                VALUES (:embedding, :response, NOW())
            """)
            await db.execute(
                insert_query,
                {"embedding": query_embedding, "response": response}
            )
            await db.commit()
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
