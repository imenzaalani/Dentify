import enum
import uuid

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class DocumentCategory(str, enum.Enum):
    IMAGING = "imaging"
    CONSENT_FORM = "consent_form"
    INVOICE = "invoice"
    LAB_REPORT = "lab_report"


class Document(UUIDPKMixin, TimestampMixin, Base):
    """A file attached to a patient's record (X-ray, signed consent,
    invoice PDF, lab report...). The binary itself lives on disk under
    settings.DOCUMENTS_DIR; this row is the metadata + access-control
    boundary, mirroring the avatar upload pattern in api/v1/auth.py but
    kept behind an authenticated download endpoint rather than a public
    static mount, since these files are clinical/financial records rather
    than profile photos.
    """

    __tablename__ = "documents"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_size_kb: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # Path on disk, relative to settings.DOCUMENTS_DIR — never exposed
    # directly to the frontend, which only ever sees /documents/{id}/file.
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)

    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    patient = relationship("Patient", lazy="selectin")
    uploader = relationship("User", foreign_keys=[uploaded_by], lazy="selectin")
