import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class DocumentType(str, enum.Enum):
    XRAY = "xray"
    PRESCRIPTION = "prescription"
    REPORT = "report"
    QUOTE = "quote"
    INVOICE = "invoice"
    CONSENT = "consent"
    ADMISSION_FORM = "admission_form"
    OTHER = "other"


class Document(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "documents"

    patient_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    uploaded_by: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    type: Mapped[DocumentType] = mapped_column(Enum(DocumentType, name="document_type"), nullable=False)
    filename: Mapped[str] = mapped_column(String(300), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)  # local path (Phase 1) or S3 key
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_visible_to_patient: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    patient: Mapped["Patient"] = relationship(back_populates="documents")


class ConsentType(str, enum.Enum):
    GDPR = "gdpr"
    TREATMENT = "treatment"
    INVASIVE_ACT = "invasive_act"  # extraction, chirurgie, prothèse
    ADMISSION = "admission"


class Consent(UUIDPKMixin, TimestampMixin, Base):
    """Dated, versioned legal consent — section 3 & 5 of the architecture doc.

    Modeled as its own event/entity (not a boolean field) because a medical
    history or a consent to an invasive act needs a real audit trail.
    """
    __tablename__ = "consents"

    patient_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    treatment_step_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatment_steps.id"), nullable=True
    )
    document_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True
    )

    type: Mapped[ConsentType] = mapped_column(Enum(ConsentType, name="consent_type"), nullable=False)
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    signed_by_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_signed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient: Mapped["Patient"] = relationship()
    treatment_step: Mapped["TreatmentStep | None"] = relationship()
    document: Mapped["Document | None"] = relationship()
