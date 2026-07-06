from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class Referral(UUIDPKMixin, TimestampMixin, Base):
    """External referral to a specialist who is not a platform user.

    dentapp-architecture-v2.md section 12: 'référencement externe vers un
    spécialiste non-utilisateur de la plateforme' — kept intentionally simple
    in v1 (free text + external practitioner name), with room to evolve into
    a full partner directory later (section 13).
    """
    __tablename__ = "referrals"

    patient_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )

    external_practitioner_name: Mapped[str] = mapped_column(String(150), nullable=False)
    speciality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_info: Mapped[str | None] = mapped_column(String(255), nullable=True)

    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    referral_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_by: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    patient: Mapped["Patient"] = relationship(back_populates="referrals")
