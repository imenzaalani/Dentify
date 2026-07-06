import enum
from datetime import date

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class TreatmentStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TreatmentStepStatus(str, enum.Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class Treatment(UUIDPKMixin, TimestampMixin, Base):
    """A multi-phase treatment plan — dentapp-architecture-v2.md section 5."""
    __tablename__ = "treatments"

    patient_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    dentist_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("dentists.id"), nullable=False
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[TreatmentStatus] = mapped_column(
        Enum(TreatmentStatus, name="treatment_status"), default=TreatmentStatus.PLANNED, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient: Mapped["Patient"] = relationship(back_populates="treatments")
    dentist: Mapped["Dentist"] = relationship(back_populates="treatments")
    steps: Mapped[list["TreatmentStep"]] = relationship(
        back_populates="treatment", order_by="TreatmentStep.step_number", cascade="all, delete-orphan"
    )
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="treatment")


class TreatmentStep(UUIDPKMixin, TimestampMixin, Base):
    """A single act within a treatment plan.

    `depends_on_step_id` implements the dependency rule from
    dentapp-architecture-v2.md section 5 (e.g. a root canal must be
    completed before a crown can be scheduled).
    """
    __tablename__ = "treatment_steps"

    treatment_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatments.id"), nullable=False
    )
    depends_on_step_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatment_steps.id"), nullable=True
    )

    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    act_name: Mapped[str] = mapped_column(String(200), nullable=False)
    act_code: Mapped[str | None] = mapped_column(String(50), nullable=True)  # future CNAM nomenclature
    tooth_number: Mapped[str | None] = mapped_column(String(10), nullable=True)  # ISO notation

    planned_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[TreatmentStepStatus] = mapped_column(
        Enum(TreatmentStepStatus, name="treatment_step_status"),
        default=TreatmentStepStatus.PENDING,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    visible_to_patient: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    treatment: Mapped["Treatment"] = relationship(back_populates="steps", foreign_keys=[treatment_id])
    depends_on: Mapped["TreatmentStep | None"] = relationship(remote_side="TreatmentStep.id")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="treatment_step")
