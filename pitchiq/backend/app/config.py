"""Configuration and environment variables for PitchIQ"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pitchiq"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # API Keys
    GROQ_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    JINA_API_KEY: str = ""
    TAVILY_API_KEY: str = ""

    # JWT (for future auth)
    SECRET_KEY: str = "changeme"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Embedding model (Jina AI API)
    EMBEDDING_MODEL: str = "jina-embeddings-v3"

    # Cache settings
    CACHE_ENABLED: bool = True
    CACHE_SIMILARITY_THRESHOLD: float = 0.92

    # Model identifiers
    # Both tiers use Groq for now. To enable Claude for premium,
    # change PREMIUM_MODEL to "claude-sonnet-4-20250514".
    GROQ_CHEAP_MODEL: str = "llama-3.1-8b-instant"
    CLAUDE_QUALITY_MODEL: str = "claude-sonnet-4-20250514"
    PREMIUM_MODEL: str = "llama-3.1-8b-instant"

    # Iterative refinement
    MAX_CRITIC_ITERATIONS: int = 5
    PREMIUM_QUALITY_THRESHOLD: float = 8.5

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
