import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class ResourceType(str, enum.Enum):
    CHAIR = "chair"
    ROOM = "room"


class Resource(UUIDPKMixin, TimestampMixin, Base):
    """A chair or room that gets booked alongside a dentist for an appointment.

    See dentapp-architecture-v2.md section 4.1: appointments reserve a
    *resource* AND a *practitioner*, not one or the other.
    """
    __tablename__ = "resources"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[ResourceType] = mapped_column(Enum(ResourceType, name="resource_type"), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="resource")
