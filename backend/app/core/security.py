import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def _create_token(subject: str, expires_delta: timedelta, token_type: str, extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        # Unique per token so a single access/refresh token can be revoked
        # (logout, reuse detection) without invalidating every other token
        # issued to the user.
        "jti": uuid.uuid4().hex,
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: UUID, role: str) -> str:
    return _create_token(
        subject=str(user_id),
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access",
        extra_claims={"role": role},
    )


RESET_TOKEN_EXPIRE_MINUTES = 30


def _password_fingerprint(password_hash: str) -> str:
    # Never embed the bcrypt hash itself in a JWT. This fingerprint changes
    # the moment the password changes (or the token is redeemed, since
    # redeeming it sets a new hash) — so it doubles as single-use +
    # auto-invalidate-on-password-change, with no token blacklist needed.
    return hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:32]


def create_reset_token(user_id: UUID, current_password_hash: str) -> str:
    return _create_token(
        subject=str(user_id),
        expires_delta=timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        token_type="reset",
        extra_claims={"pwh": _password_fingerprint(current_password_hash)},
    )


def reset_token_matches_current_password(payload: dict[str, Any], current_password_hash: str) -> bool:
    return payload.get("pwh") == _password_fingerprint(current_password_hash)


def create_refresh_token(user_id: UUID) -> str:
    return _create_token(
        subject=str(user_id),
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None