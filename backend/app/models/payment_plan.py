import enum
import uuid

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class PlanFrequency(str, enum.Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class InstallmentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"


class PaymentPlan(UUIDPKMixin, TimestampMixin, Base):
    """An installment schedule against an invoice's remaining balance.

    One plan per invoice (enforced at the route level — setting up a new
    plan replaces any existing one — rather than as a DB constraint, since
    that's a business rule that may loosen later). Cascade-deletes with the
    parent invoice, and its installments cascade-delete with it, mirroring
    Invoice -> line_items.
    """

    __tablename__ = "payment_plans"

    invoice_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )
    frequency: Mapped[str] = mapped_column(String(10), nullable=False)

    invoice = relationship("Invoice", back_populates="payment_plan")
    installments = relationship(
        "Installment", back_populates="plan", cascade="all, delete-orphan",
        order_by="Installment.position", lazy="selectin",
    )


class Installment(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "payment_plan_installments"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("payment_plans.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(nullable=False, default=0)
    due_date: Mapped[str] = mapped_column(String(10), nullable=False)  # ISO date
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(10), nullable=False, default=InstallmentStatus.PENDING.value)
    paid_at: Mapped[str | None] = mapped_column(String(10), nullable=True)  # ISO date
    payment_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("invoice_payments.id", ondelete="SET NULL"), nullable=True
    )

    plan = relationship("PaymentPlan", back_populates="installments")
    payment = relationship("Payment", lazy="selectin")