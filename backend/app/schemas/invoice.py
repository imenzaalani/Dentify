from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

# CNAM anticipation (architecture v2.0 §12) — same flat split used by the
# frontend mock data, kept here until a live CNAM integration replaces it
# with a real per-treatment reimbursement lookup.
CNAM_REIMBURSEMENT_RATE = 0.2


class BillingDocType(str, Enum):
    QUOTE = "quote"
    INVOICE = "invoice"


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CHECK = "check"
    CARD = "card"
    TRANSFER = "transfer"
    OTHER = "other"


class LineItemIn(BaseModel):
    description: str = Field(min_length=2, max_length=300)
    tooth: str | None = None
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    discount_pct: float = Field(default=0, ge=0, le=100)


class LineItemOut(LineItemIn):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    line_total: float


class PaymentIn(BaseModel):
    amount: float = Field(gt=0)
    payment_date: date
    method: PaymentMethod
    reference: str | None = None
    notes: str | None = None


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    amount: float
    payment_date: str
    method: PaymentMethod
    reference: str | None
    notes: str | None


class InvoiceCreate(BaseModel):
    doc_type: BillingDocType
    patient_id: uuid.UUID
    treatment_plan_id: uuid.UUID | None = None
    issue_date: date
    due_date: date | None = None
    global_discount_pct: float = Field(default=0, ge=0, le=100)
    notes: str | None = None
    payment_terms: str | None = None
    line_items: list[LineItemIn] = Field(min_length=1)

    @field_validator("line_items")
    @classmethod
    def _non_empty(cls, v: list[LineItemIn]) -> list[LineItemIn]:
        if not v:
            raise ValueError("Add at least one line item.")
        return v


class InvoiceUpdate(BaseModel):
    notes: str | None = None
    payment_terms: str | None = None
    due_date: date | None = None


class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    number: str
    doc_type: BillingDocType
    status: InvoiceStatus
    patient_id: uuid.UUID
    patient_name: str
    patient_avatar: str
    patient_email: str | None
    treatment_plan_id: uuid.UUID | None
    treatment_plan_title: str | None
    issue_date: str
    due_date: str | None
    line_items: list[LineItemOut]
    global_discount_pct: float
    subtotal: float
    total: float
    paid_amount: float
    balance: float
    reimbursable_amount: float
    patient_due_amount: float
    notes: str | None
    payment_terms: str | None
    payments: list[PaymentOut]
    created_at: datetime
