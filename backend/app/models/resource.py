import enum

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class ResourceType(str, enum.Enum):
    CHAIR = "chair"
    ROOM = "room"


class Resource(UUIDPKMixin, TimestampMixin, Base):
    """A chair or room an appointment can be attached to, in addition to
    the practitioner — lets a clinic run several chairs/rooms in parallel.
    """

    __tablename__ = "resources"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")