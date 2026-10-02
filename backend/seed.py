"""
Bootstraps the first owner account so someone can log in before any other
accounts exist. Run from the backend/ directory with the venv active:

    python seed.py
"""
import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from backend.app.models.patient import User, UserRole


async def seed_owner() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == settings.SEED_OWNER_EMAIL))
        existing = result.scalar_one_or_none()
        if existing is not None:
            print(f"Owner account already exists: {settings.SEED_OWNER_EMAIL}")
            return

        owner = User(
            email=settings.SEED_OWNER_EMAIL,
            password_hash=hash_password(settings.SEED_OWNER_PASSWORD),
            role=UserRole.OWNER,
            is_active=True,
            is_verified=True,
        )
        db.add(owner)
        await db.commit()

        print(f"Created owner account: {settings.SEED_OWNER_EMAIL}")
        print("Change the password after first login (this is a seed default).")


if __name__ == "__main__":
    asyncio.run(seed_owner())
