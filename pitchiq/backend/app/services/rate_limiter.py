"""Redis-based rate limiting"""

import redis
from typing import Tuple
from app.config import settings

class RateLimiter:
    """Rate limiter using Redis"""
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.default_limit = 100  # requests per hour
        self.default_window = 3600  # 1 hour
    
    def is_allowed(
        self,
        user_id: str,
        limit: int = None,
        window: int = None
    ) -> Tuple[bool, dict]:
        """Check if request is allowed"""
        limit = limit or self.default_limit
        window = window or self.default_window
        
        key = f"rate_limit:{user_id}"
        
        try:
            current = self.redis_client.incr(key)
            
            if current == 1:
                self.redis_client.expire(key, window)
            
            remaining = max(0, limit - current)
            allowed = current <= limit
            
            return allowed, {
                "limit": limit,
                "remaining": remaining,
                "reset_at": self.redis_client.ttl(key)
            }
        except Exception as e:
            print(f"Rate limiter error: {e}")
            # Allow request if Redis is down
            return True, {"limit": limit}
    
    def reset(self, user_id: str) -> bool:
        """Reset rate limit for a user"""
        key = f"rate_limit:{user_id}"
        self.redis_client.delete(key)
        return True
