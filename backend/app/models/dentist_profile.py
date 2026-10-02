import uuid
from typing import Any

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class DentistProfile(UUIDPKMixin, TimestampMixin, Base):
    """Dentist-specific fields, kept off User since receptionists/owners
    never need them. One row per dentist, one-to-one via user_id.
    """

    __tablename__ = "dentist_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    license_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    bio: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    color: Mapped[str] = mapped_column(String(20), nullable=False, server_default="#2563eb")
    working_hours: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)

    user = relationship("User", back_populates="dentist_profile")