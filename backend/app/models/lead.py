import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    CONVERTED = "converted"    # became a Patient
    REJECTED = "rejected"      # sans suite


class Lead(UUIDPKMixin, TimestampMixin, Base):
    """An unqualified online appointment request — distinct from Patient
    until a receptionist confirms the first visit (architecture v2, section 3)."""
    __tablename__ = "leads"

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    requested_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    preferred_dentist_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("dentists.id"), nullable=True
    )

    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, name="lead_status"), default=LeadStatus.NEW, nullable=False
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    converted_patient_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), nullable=True
    )
    qualified_by: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    preferred_dentist: Mapped["Dentist | None"] = relationship()
    converted_patient: Mapped["Patient | None"] = relationship()
