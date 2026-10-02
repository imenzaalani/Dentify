import enum
import uuid

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class BillingDocType(str, enum.Enum):
    QUOTE = "quote"
    INVOICE = "invoice"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CHECK = "check"
    CARD = "card"
    TRANSFER = "transfer"
    OTHER = "other"


class Invoice(UUIDPKMixin, TimestampMixin, Base):
    """A quote or invoice header. Quotes and invoices share one table (as in
    the frontend mock) since a quote becomes an invoice in place — same row,
    new number and status — rather than being copied into a second record.
    """

    __tablename__ = "invoices"

    number: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    doc_type: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=InvoiceStatus.DRAFT.value)

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    treatment_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatment_plans.id", ondelete="SET NULL"), nullable=True
    )

    issue_date: Mapped[str] = mapped_column(String(10), nullable=False)  # ISO date
    due_date: Mapped[str | None] = mapped_column(String(10), nullable=True)

    global_discount_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    paid_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_terms: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient = relationship("Patient", lazy="selectin")
    treatment_plan = relationship("TreatmentPlan", lazy="selectin")
    line_items = relationship(
        "InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan",
        order_by="InvoiceLineItem.position", lazy="selectin",
    )
    payments = relationship(
        "Payment", back_populates="invoice", cascade="all, delete-orphan",
        order_by="Payment.created_at", lazy="selectin",
    )
    payment_plan = relationship(
        "PaymentPlan", back_populates="invoice", uselist=False,
        cascade="all, delete-orphan", lazy="selectin",
    )

    @property
    def balance(self) -> float:
        return max(0.0, float(self.total) - float(self.paid_amount))


class InvoiceLineItem(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "invoice_line_items"

    invoice_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(nullable=False, default=0)
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    tooth: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    discount_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)

    invoice = relationship("Invoice", back_populates="line_items")

    @property
    def line_total(self) -> float:
        return float(self.quantity) * float(self.unit_price) * (1 - float(self.discount_pct) / 100)


class Payment(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "invoice_payments"

    invoice_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    payment_date: Mapped[str] = mapped_column(String(10), nullable=False)  # ISO date
    method: Mapped[str] = mapped_column(String(20), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    invoice = relationship("Invoice", back_populates="payments")