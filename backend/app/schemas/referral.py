from __future__ import annotations

import uuid
from datetime import date as Date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ReferralStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ReferralCreate(BaseModel):
    patient_id: uuid.UUID
    specialist_name: str = Field(..., min_length=2, max_length=255)
    specialty: str = Field(..., min_length=1, max_length=100)
    reason: str = Field(..., min_length=3, max_length=2000)
    date: Date
    notes: str | None = Field(None, max_length=2000)


class ReferralUpdate(BaseModel):
    specialist_name: str | None = Field(None, min_length=2, max_length=255)
    specialty: str | None = Field(None, min_length=1, max_length=100)
    reason: str | None = Field(None, min_length=3, max_length=2000)
    date: Date | None = None
    notes: str | None = Field(None, max_length=2000)


class ReferralStatusUpdate(BaseModel):
    status: ReferralStatus


class ReferralOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    specialist_name: str
    specialty: str
    reason: str
    date: Date
    status: ReferralStatus
    notes: str | None
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
