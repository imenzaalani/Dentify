from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Category, Role, can_read, can_write
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

    return user


def require_roles(*roles: Role):
    """Dependency factory: restricts an endpoint to specific roles."""

    async def checker(user: User = Depends(get_current_user)) -> User:
        if Role(user.role) not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized for this action")
        return user

    return checker


def require_read(category: Category):
    """Dependency factory: restricts an endpoint by data-category read access."""

    async def checker(user: User = Depends(get_current_user)) -> User:
        if not can_read(Role(user.role), category):
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Cannot read '{category.value}' data")
        return user

    return checker


def require_write(category: Category):
    """Dependency factory: restricts an endpoint by data-category write access."""

    async def checker(user: User = Depends(get_current_user)) -> User:
        if not can_write(Role(user.role), category):
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Cannot write '{category.value}' data")
        return user

    return checker


async def get_current_patient_profile(user: User = Depends(get_current_user)):
    """Ensures the caller is a patient and returns their linked patient profile."""
    if Role(user.role) != Role.PATIENT or user.patient_profile is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Patient account required")
    return user.patient_profile


async def get_current_dentist_profile(user: User = Depends(get_current_user)):
    """Ensures the caller is a dentist and returns their linked dentist profile."""
    if Role(user.role) != Role.DENTIST or user.dentist_profile is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Dentist account required")
    return user.dentist_profile


async def ensure_dentist_scope(user: User, dentist_id: UUID) -> None:
    """A dentist may only act on records tied to themself; owner/receptionist unrestricted.

    Per architecture v2 section 2.1: 'Dentiste ... acces clinique + administratif
    sur ses propres patients uniquement'.
    """
    if Role(user.role) == Role.DENTIST:
        if user.dentist_profile is None or user.dentist_profile.id != dentist_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your patient/record")
