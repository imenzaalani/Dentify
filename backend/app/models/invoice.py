import enum
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class InvoiceType(str, enum.Enum):
    QUOTE = "quote"      # devis
    INVOICE = "invoice"  # facture


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    VOID = "void"


class Invoice(UUIDPKMixin, TimestampMixin, Base):
    """Billing adapted to per-act payment, per architecture v2 section 6.

    `reimbursable_amount` / `patient_due_amount` anticipate CNAM/insurance
    integration without requiring a later migration.
    """
    __tablename__ = "invoices"

    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    patient_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    dentist_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("dentists.id"), nullable=False
    )
    treatment_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatments.id"), nullable=True
    )
    treatment_step_id: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("treatment_steps.id"), nullable=True
    )

    type: Mapped[InvoiceType] = mapped_column(Enum(InvoiceType, name="invoice_type"), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoice_status"), default=InvoiceStatus.DRAFT, nullable=False
    )

    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    reimbursable_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    patient_due_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)

    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    discount_reason: Mapped[str | None] = mapped_column(Text, nullable=True)  # required, per section 6
    discount_approved_by: Mapped[PG_UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient: Mapped["Patient"] = relationship(back_populates="invoices")
    dentist: Mapped["Dentist"] = relationship()
    treatment: Mapped["Treatment | None"] = relationship(back_populates="invoices")
    items: Mapped[list["InvoiceItem"]] = relationship(back_populates="invoice", cascade="all, delete-orphan")
    payment_plan: Mapped["PaymentPlan | None"] = relationship(back_populates="invoice", uselist=False)


class InvoiceItem(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "invoice_items"

    invoice_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False
    )
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    invoice: Mapped["Invoice"] = relationship(back_populates="items")


class PaymentPlan(UUIDPKMixin, TimestampMixin, Base):
    """Installment schedule for costly treatments (implants, orthodontics)."""
    __tablename__ = "payment_plans"

    invoice_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("invoices.id"), unique=True, nullable=False
    )
    total_installments: Mapped[int] = mapped_column(Integer, nullable=False)
    installment_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    frequency_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    invoice: Mapped["Invoice"] = relationship(back_populates="payment_plan")
    installments: Mapped[list["PaymentPlanInstallment"]] = relationship(
        back_populates="payment_plan", cascade="all, delete-orphan", order_by="PaymentPlanInstallment.due_date"
    )


class PaymentPlanInstallment(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "payment_plan_installments"

    payment_plan_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("payment_plans.id"), nullable=False
    )
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    paid: Mapped[bool] = mapped_column(default=False, nullable=False)
    paid_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    payment_plan: Mapped["PaymentPlan"] = relationship(back_populates="installments")


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    CHECK = "check"
    BANK_TRANSFER = "bank_transfer"


class Payment(UUIDPKMixin, TimestampMixin, Base):
    """A single settlement recorded against an invoice (section 6: cash-at-counter first)."""
    __tablename__ = "payments"

    invoice_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod, name="payment_method"), nullable=False)
    received_by: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    received_at: Mapped[date] = mapped_column(Date, nullable=False)
    receipt_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    invoice: Mapped["Invoice"] = relationship()


class CashRegisterPaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    CHECK = "check"


class DailyCashRegister(UUIDPKMixin, TimestampMixin, Base):
    """End-of-day cash reconciliation, per architecture v2 section 12."""
    __tablename__ = "daily_cash_registers"

    register_date: Mapped[date] = mapped_column(Date, nullable=False)
    closed_by: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    expected_cash: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    counted_cash: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    expected_card: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    expected_check: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    discrepancy_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_closed: Mapped[bool] = mapped_column(default=False, nullable=False)
