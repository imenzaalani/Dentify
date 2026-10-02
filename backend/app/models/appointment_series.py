import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class RecurrenceFrequency(str, enum.Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class AppointmentSeries(UUIDPKMixin, TimestampMixin, Base):
    """The recurrence rule + shared template for a set of generated
    Appointment rows. Individual Appointments carry the real, editable
    data (an occurrence can be rescheduled/reassigned/cancelled on its own
    without touching the series); this table only exists so the group can
    be found, displayed, and bulk-cancelled together.
    """

    __tablename__ = "appointment_series"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    dentist_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    care_type_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("care_types.id", ondelete="RESTRICT"), nullable=False
    )
    resource_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("resources.id", ondelete="SET NULL"), nullable=True
    )

    frequency: Mapped[str] = mapped_column(String(20), nullable=False)
    # Nullable — a series ends on whichever of the two the client sent
    # (schema-level validation requires exactly one); kept as separate
    # columns rather than folded into one so "why did generation stop"
    # stays legible from the row alone.
    occurrence_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    until: Mapped[date | None] = mapped_column(Date, nullable=True)

    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    send_confirmation: Mapped[bool] = mapped_column(nullable=False, server_default="true")
    prep_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
