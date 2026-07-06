import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class AppointmentStatus(str, enum.Enum):
    """dentapp-architecture-v2.md section 4.4."""
    PENDING = "pending"          # Demandé
    CONFIRMED = "confirmed"      # Confirmé
    CHECKED_IN = "checked_in"    # Arrivé (check-in accueil)
    IN_PROGRESS = "in_progress"  # En cours
    COMPLETED = "completed"      # Terminé
    INVOICED = "invoiced"        # Facturé
    CANCELLED = "cancelled"      # Annulé
    NO_SHOW = "no_show"          # Absent


class AppointmentSource(str, enum.Enum):
    ONLINE_FORM = "online_form"
    PHONE = "phone"
    WALK_IN = "walk_in"
    PATIENT_SELF_SERVICE = "patient_self_service"


class Appointment(UUIDPKMixin, TimestampMixin, Base):
    """Reserves a practitioner AND a resource (chair/room) — section 4.1."""
    __tablename__ = "appointments"

    patient_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    dentist_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("dentists.id"), nullable=False
    )
    resource_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("resources.id"), nullable=True
    )
    treatment_step_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatment_steps.id"), nullable=True
    )

    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, name="appointment_status"),
        default=AppointmentStatus.PENDING,
        nullable=False,
    )
    source: Mapped[AppointmentSource] = mapped_column(
        Enum(AppointmentSource, name="appointment_source"),
        default=AppointmentSource.PHONE,
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    reminder_whatsapp_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_sms_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    dentist: Mapped["Dentist"] = relationship(back_populates="appointments")
    resource: Mapped["Resource | None"] = relationship(back_populates="appointments")
    treatment_step: Mapped["TreatmentStep | None"] = relationship(back_populates="appointments")
