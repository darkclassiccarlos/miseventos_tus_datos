from redis import Redis
from app.core.config import settings

redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

def set_token_session(jti: str, user_id: str, expires_in_seconds: int):
    """
    Store JTI in Redis with user identity and TTL
    """
    redis_client.setex(f"token:{jti}", expires_in_seconds, user_id)

def is_token_valid(jti: str) -> bool:
    """
    Check if JTI exists in Redis
    """
    return redis_client.exists(f"token:{jti}") > 0

def remove_token_session(jti: str):
    """
    Remove JTI from Redis (Logout)
    """
    redis_client.delete(f"token:{jti}")
