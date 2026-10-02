from redis.asyncio import Redis

from app.core.config import settings

# Shared async client. redis-py pools connections internally, so this single
# instance is safe to reuse across requests.
redis_client: Redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

_REVOKED_PREFIX = "revoked_jti:"


async def revoke_jti(jti: str, ttl_seconds: int) -> None:
    """Mark a token's jti as revoked until it would have expired anyway.

    ttl_seconds <= 0 means the token is already expired — nothing to store.
    """
    if not jti or ttl_seconds <= 0:
        return
    await redis_client.set(f"{_REVOKED_PREFIX}{jti}", "1", ex=ttl_seconds)


async def is_jti_revoked(jti: str | None) -> bool:
    if not jti:
        return False
    return bool(await redis_client.exists(f"{_REVOKED_PREFIX}{jti}"))