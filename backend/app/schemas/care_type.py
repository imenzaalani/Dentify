from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CareTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: str
    default_duration_minutes: int
    color: str
    active: bool
    price: Decimal
    reimbursable_amount: Decimal | None
    created_at: datetime
    updated_at: datetime


class CareTypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., max_length=30)
    default_duration_minutes: int = Field(..., gt=0)
    color: str = Field(default="bg-blue-500", max_length=30)
    price: Decimal = Field(..., ge=0)
    reimbursable_amount: Decimal | None = Field(None, ge=0)


class CareTypeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    category: str | None = Field(None, max_length=30)
    default_duration_minutes: int | None = Field(None, gt=0)
    color: str | None = Field(None, max_length=30)
    active: bool | None = None
    price: Decimal | None = Field(None, ge=0)
    reimbursable_amount: Decimal | None = Field(None, ge=0)

    model_config = ConfigDict(extra="forbid")