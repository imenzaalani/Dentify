import enum
import uuid
from datetime import date as date_

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class WaitlistPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class WaitlistStatus(str, enum.Enum):
    WAITING = "waiting"
    CONTACTED = "contacted"
    SCHEDULED = "scheduled"
    CANCELLED = "cancelled"


class WaitlistEntry(UUIDPKMixin, TimestampMixin, Base):
    """A patient waiting for an earlier/better slot than what was free when
    they asked. Not an appointment itself — the /schedule action turns it
    into one and links appointment_id back here for traceability, same
    convention as Appointment.cancelled_by/cancelled_at.
    """

    __tablename__ = "waitlist_entries"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    # RESTRICT, same reasoning as Appointment.care_type_id — forces
    # deactivate-not-delete for in-use care types.
    care_type_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("care_types.id", ondelete="RESTRICT"), nullable=False
    )
    desired_from: Mapped[date_] = mapped_column(Date, nullable=False)
    desired_to: Mapped[date_] = mapped_column(Date, nullable=False)

    priority: Mapped[str] = mapped_column(String(10), nullable=False, server_default="medium")
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="waiting")
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Set once /schedule is called. SET NULL (not CASCADE) so deleting the
    # appointment later doesn't erase the waitlist history that led to it.
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )