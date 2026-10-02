import enum
import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ARRIVED = "arrived"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class ConfirmationDeliveryStatus(str, enum.Enum):
    """Tracks the confirmation *email*, independent of AppointmentStatus.

    status="confirmed" means staff (or the patient, via the portal) marked
    the appointment confirmed. This tracks the separate, narrower question
    of what happened when we tried to notify the patient: NOT_REQUESTED
    (send_confirmation was false), SENT (SMTP accepted it), or FAILED (the
    send raised — appointment still exists, staff need to follow up
    manually, e.g. by phone).
    """

    NOT_REQUESTED = "not_requested"
    SENT = "sent"
    FAILED = "failed"


class Appointment(UUIDPKMixin, TimestampMixin, Base):
    """One patient, one dentist, one care type, at most one resource
    (chair/room), optionally tied to one TreatmentStep it fulfills."""

    __tablename__ = "appointments"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    # RESTRICT, not SET NULL/CASCADE — a dentist user should never be hard-
    # deleted (deactivate via is_active instead), so this should never fire.
    dentist_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    # RESTRICT — forces "deactivate, don't delete" for in-use care types.
    # care_types.py's delete endpoint catches the resulting IntegrityError.
    care_type_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("care_types.id", ondelete="RESTRICT"), nullable=False
    )
    # SET NULL — unlinking (or deleting) the treatment step shouldn't take
    # the appointment down with it; the visit still happened/is scheduled
    # regardless of whether it's tracked against a plan.
    treatment_step_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatment_steps.id", ondelete="SET NULL"), nullable=True
    )
    resource_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("resources.id", ondelete="SET NULL"), nullable=True
    )
    # SET NULL, not CASCADE — deleting/forgetting the series shouldn't take
    # the individual appointments (and their history/notes) down with it.
    series_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("appointment_series.id", ondelete="SET NULL"), nullable=True
    )
    # 1-based position within the series ("2nd of this recurring set"),
    # null for one-off appointments. Purely informational — occurrences are
    # otherwise ordered by scheduled_at like any other appointment.
    series_occurrence_index: Mapped[int | None] = mapped_column(Integer, nullable=True)

    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    send_confirmation: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    # Set right after we attempt (or skip) the confirmation email — see
    # ConfirmationDeliveryStatus for what each value means. Distinct from
    # `status`, which is the patient-facing appointment lifecycle state.
    confirmation_delivery_status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="not_requested"
    )
    confirmation_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")

    prep_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    cancellation_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )