import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class LeadStatus(str, enum.Enum):
    PENDING = "pending"
    CONVERTED = "converted"
    REJECTED = "rejected"
    NO_RESPONSE = "no_response"


class BookingFor(str, enum.Enum):
    MYSELF = "myself"
    DEPENDENT = "dependent"
    SOMEONE_ELSE = "someone_else"


class HearAboutUs(str, enum.Enum):
    GOOGLE = "google"
    INSTAGRAM_FACEBOOK = "instagram_facebook"
    YELP = "yelp"
    FAMILY_FRIEND = "family_friend"
    WALK_BY = "walk_by"
    OTHER = "other"


class Lead(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "leads"

    requested_service: Mapped[str] = mapped_column(String(255), nullable=False)
    requested_datetime: Mapped[str] = mapped_column(String(50), nullable=False)

    booking_for: Mapped[str] = mapped_column(String(20), nullable=False)

    patient_first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    patient_last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    patient_legal_sex: Mapped[str | None] = mapped_column(String(50), nullable=True)
    patient_dob: Mapped[str] = mapped_column(String(50), nullable=False)
    patient_zip: Mapped[str | None] = mapped_column(String(30), nullable=True)

    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    sms_consent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    comments: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    hear_about_us: Mapped[str | None] = mapped_column(String(50), nullable=True)

    source: Mapped[str] = mapped_column(String(50), nullable=False, server_default="online_form")
    status: Mapped[str] = mapped_column(String(30), nullable=False, server_default="pending")
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    converted_to_patient_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"), nullable=True
    )