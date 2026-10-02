import enum
import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, ForeignKey, String, func, select
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.core.database import Base
from app.models.appointment import Appointment
from app.models.base import TimestampMixin, UUIDPKMixin


class LifecycleStage(str, enum.Enum):
    NEW = "new"
    ACTIVE = "active"
    RECALL = "recall"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class CreatedVia(str, enum.Enum):
    ONLINE_FORM = "online_form"
    PHONE_CALL = "phone_call"
    WALK_IN = "walk_in"


class PreferredContactMethod(str, enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"
    PHONE = "phone"


class Patient(UUIDPKMixin, TimestampMixin, Base):
    """The real clinical/administrative record — what staff search and work
    from. Distinct from `Lead` (an unqualified booking-form inquiry, not a
    clinical record) and `User` (a portal login, which most patients never
    have).
    """

    __tablename__ = "patients"

    patient_number: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)

    first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dob: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    legal_sex: Mapped[str | None] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String(30), nullable=True)
    
    # NULL for the large majority of patients, who never get a portal login.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")

    @property
    def portal_status(self) -> str:
        if self.user_id is None:
            return "not_invited"
        if self.user is None:
            return "not_invited"
        if not self.user.is_active:
            return "revoked"
        if self.user.is_verified:
            return "active"
        return "pending"

    @property
    def avatar_url(self) -> str | None:
        # Photo lives on User (uploaded from the patient portal's own
        # profile page via /auth/me/avatar) — Patient has no avatar
        # column of its own, same reasoning as portal_status above.
        if self.user is None:
            return None
        return self.user.avatar_url
    # For dependents who can't have their own login. Resolved lazily —
    # never set at record-creation/conversion time.
    primary_contact_user_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    preferred_contact_method: Mapped[str | None] = mapped_column(String(20), nullable=True)

    lifecycle_stage: Mapped[str] = mapped_column(String(30), nullable=False, server_default="new")
    created_via: Mapped[str] = mapped_column(String(50), nullable=False, server_default="online_form")

    allergies: Mapped[list[str] | None] = mapped_column(ARRAY(String(255)), nullable=True)
    medical_history: Mapped[str | None] = mapped_column(String(4000), nullable=True)
    current_medications: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    archived_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


# Computed, not stored — a stored counter would need incrementing/
# decrementing at every place an appointment's status can flip to/from
# no_show (create, update, the /no-show endpoint, series cancel, etc.),
# and any missed spot means silent drift. This subquery is always correct,
# at the cost of one extra count per patient row fetched.
Patient.no_show_count = column_property(
    select(func.count(Appointment.id))
    .where(Appointment.patient_id == Patient.id, Appointment.status == "no_show")
    .correlate_except(Appointment)
    .scalar_subquery()
)