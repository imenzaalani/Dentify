from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

# Mirrors PaymentMethod in app/schemas/invoice.py — kept as its own copy
# rather than a cross-module import, matching how that file already
# re-declares its enums separately from app/models/invoice.py.
class PaymentMethod(str, Enum):
    CASH = "cash"
    CHECK = "check"
    CARD = "card"
    TRANSFER = "transfer"
    OTHER = "other"


class PlanFrequency(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class InstallmentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"


class PaymentPlanCreate(BaseModel):
    number_of_installments: int = Field(ge=2, le=36)
    frequency: PlanFrequency
    first_due_date: date


class MarkInstallmentPaidIn(BaseModel):
    amount: float = Field(gt=0)
    payment_date: date
    method: PaymentMethod
    reference: str | None = None


class InstallmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    index: int
    due_date: str
    amount: float
    status: InstallmentStatus
    paid_at: str | None
    payment_id: uuid.UUID | None


class PaymentPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    frequency: PlanFrequency
    installments: list[InstallmentOut]
    created_at: datetime