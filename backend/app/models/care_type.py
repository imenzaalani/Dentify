import enum
from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class CareCategory(str, enum.Enum):
    SOINS_COURANTS = "soins_courants"
    CHIRURGIE = "chirurgie"
    ORTHODONTIE = "orthodontie"
    ESTHETIQUE = "esthetique"
    URGENCE = "urgence"


class CareType(UUIDPKMixin, TimestampMixin, Base):
    """A billable/schedulable service the clinic offers (consultation,
    extraction, implant...). Referenced by Appointment.care_type_id once
    that model exists — kept as its own table so price/duration/color can
    change without touching historical appointments.
    """

    __tablename__ = "care_types"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    default_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str] = mapped_column(String(30), nullable=False, server_default="bg-blue-500")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    reimbursable_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)