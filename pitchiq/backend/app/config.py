"""Configuration and environment variables"""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/pitchiq"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # API Keys
    GROQ_API_KEY: str
    ANTHROPIC_API_KEY: str
    TAVILY_API_KEY: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Gateway settings
    SIMPLE_QUERY_THRESHOLD: int = 3  # lines of context
    
    # Embeddings
    EMBEDDINGS_MODEL: str = "text-embedding-3-small"
    
    # Cache settings
    CACHE_ENABLED: bool = True
    CACHE_TTL: int = 3600  # 1 hour
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
