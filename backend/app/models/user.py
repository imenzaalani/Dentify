import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    RECEPTIONIST = "receptionist"
    DENTIST = "dentist"
    OWNER = "owner"


class User(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relative URL path (e.g. "/avatars/<uuid>.jpg") pointing at a file saved
    # under settings.AVATARS_DIR and served via the /avatars static mount.
    # NULL means "no photo uploaded yet" — frontend falls back to initials.
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Set only for logins created via a staff-sent invite tied to an
    # existing Patient (§ patient portal invite flow). A User is NEVER
    # created standalone/self-serve — this is how we enforce that at the
    # data-model level: if this is NULL, something's wrong upstream.
    invited_by_patient_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"), nullable=True
    )

    dentist_profile = relationship(
        "DentistProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )