# test_email.py — run once, then delete
from pathlib import Path
import sys
import asyncio

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.email import send_password_reset_email


async def main() -> None:
    await send_password_reset_email("your.own.email@gmail.com", "test-token-123")


if __name__ == "__main__":
    asyncio.run(main())