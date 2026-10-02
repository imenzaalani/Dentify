import enum
import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class ReferralStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Referral(UUIDPKMixin, TimestampMixin, Base):
    """A referral of a patient to an external specialist outside the
    clinic (unlike Appointment, which is for in-house dentists) — so the
    specialist is free text, not a FK to users.
    """

    __tablename__ = "referrals"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )

    specialist_name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str] = mapped_column(String(2000), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
