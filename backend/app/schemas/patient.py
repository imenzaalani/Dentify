import enum
from datetime import date

from sqlalchemy import ARRAY, Boolean, Date, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class PatientLifecycleStatus(str, enum.Enum):
    """Cycle de vie du patient — dentapp-architecture-v2.md section 3."""
    NEW = "new"                  # nouveau patient (1er RDV honoré)
    ACTIVE = "active"            # traitement en cours / suivi régulier
    MAINTENANCE = "maintenance"  # traitement terminé, rappel de contrôle
    INACTIVE = "inactive"        # > 18-24 mois sans visite
    ARCHIVED = "archived"        # archivage définitif (RGPD / départ)


class Patient(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "patients"

    user_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=True
    )

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)

    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone_secondary: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_channel: Mapped[str | None] = mapped_column(String(20), nullable=True)  # whatsapp/email/sms

    # --- Clinical (category: clinical_read / clinical_write) ---
    blood_type: Mapped[str | None] = mapped_column(String(5), nullable=True)
    allergies: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    chronic_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_history: Mapped[str | None] = mapped_column(Text, nullable=True)

    emergency_contact_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    notes_private: Mapped[str | None] = mapped_column(Text, nullable=True)  # never patient-visible

    lifecycle_status: Mapped[PatientLifecycleStatus] = mapped_column(
        Enum(PatientLifecycleStatus, name="patient_lifecycle_status"),
        default=PatientLifecycleStatus.NEW,
        nullable=False,
    )
    no_show_count: Mapped[int] = mapped_column(default=0, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_by: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="patient_profile", foreign_keys=[user_id])

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="patient")
    treatments: Mapped[list["Treatment"]] = relationship(back_populates="patient")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="patient")
    documents: Mapped[list["Document"]] = relationship(back_populates="patient")
    referrals: Mapped[list["Referral"]] = relationship(back_populates="patient")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
