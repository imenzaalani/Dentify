from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class Dentist(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "dentists"

    user_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    speciality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    bio: Mapped[str | None] = mapped_column(String, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    working_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    color_code: Mapped[str | None] = mapped_column(String(7), nullable=True)
    is_visible_in_calendar: Mapped[bool] = mapped_column(default=True, nullable=False)

    user: Mapped["User"] = relationship(back_populates="dentist_profile", foreign_keys=[user_id])
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="dentist")
    treatments: Mapped[list["Treatment"]] = relationship(back_populates="dentist")

    @property
    def full_name(self) -> str:
        return f"Dr. {self.first_name} {self.last_name}"
