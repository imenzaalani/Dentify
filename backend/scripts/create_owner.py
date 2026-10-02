# scripts/create_owner.py
import asyncio
import getpass

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


async def main() -> None:
    email = input("Owner email: ").strip()
    password = getpass.getpass("Owner password: ")

    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.email == email))
        if existing is not None:
            print(f"Owner already exists: {email}")
            return

        user = User(email=email, password_hash=hash_password(password), role=UserRole.OWNER.value)
        db.add(user)
        await db.commit()
        print(f"Owner created: {email}")


if __name__ == "__main__":
    asyncio.run(main())