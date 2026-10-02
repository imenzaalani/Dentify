import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class TreatmentPlanStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TreatmentStepStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class TreatmentPlan(UUIDPKMixin, TimestampMixin, Base):
    """A course of care for one patient, made up of ordered TreatmentSteps.

    Referenced (not yet, per app/models/appointment.py's docstring) by a
    future Appointment.treatment_step_id once that migration lands.
    """

    __tablename__ = "treatment_plans"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    diagnosis: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="planned")
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    steps = relationship(
        "TreatmentStep",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="TreatmentStep.position",
    )


class TreatmentStep(UUIDPKMixin, TimestampMixin, Base):
    """One procedure within a TreatmentPlan. Ordered via `position` rather
    than relying on insertion order, since steps can be reordered in the
    plan editor (mirrors the frontend's useFieldArray `move`).
    """

    __tablename__ = "treatment_steps"

    treatment_plan_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatment_plans.id", ondelete="CASCADE"), nullable=False
    )

    label: Mapped[str] = mapped_column(String(255), nullable=False)
    tooth: Mapped[str | None] = mapped_column(String(50), nullable=True)
    est_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    # A step can require the prior completion of another step in the same
    # plan (e.g. crown placement depends on canal filling). SET NULL, not
    # CASCADE — deleting the dependency shouldn't take this step down too.
    depends_on_step_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatment_steps.id", ondelete="SET NULL"), nullable=True
    )

    # Invasive acts (extraction, surgery, prosthesis...) require a signed
    # consent doc before the step can be marked completed.
    requires_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    consent_signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    plan = relationship("TreatmentPlan", back_populates="steps")
