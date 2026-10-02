from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Role
from app.core.redis import is_jti_revoked
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_access_token_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    """Decodes + validates the bearer access token, including revocation.

    Exposed separately from get_current_user so endpoints that need the raw
    claims (jti, exp) — like /auth/logout — don't have to re-decode.
    """
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    if await is_jti_revoked(payload.get("jti")):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has been revoked")

    return payload


async def get_current_user(
    payload: dict[str, Any] = Depends(get_current_access_token_payload),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

    return user


def require_roles(*roles: Role):
    """Dependency factory: restricts an endpoint to specific roles.

    Category-based require_read/require_write dependencies (permission
    checks per data-category, e.g. CLINICAL_READ) will come back once
    resource endpoints that need them exist — no point wiring checks for
    data categories with no routes yet.
    """

    async def checker(user: User = Depends(get_current_user)) -> User:
        if Role(user.role) not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized for this action")
        return user

    return checker