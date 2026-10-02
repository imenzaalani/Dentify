from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class WaitlistEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    care_type_id: uuid.UUID
    desired_from: date
    desired_to: date
    priority: str
    status: str
    notes: str | None
    appointment_id: uuid.UUID | None
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class WaitlistEntryCreate(BaseModel):
    patient_id: uuid.UUID
    care_type_id: uuid.UUID
    desired_from: date
    desired_to: date
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    notes: str | None = Field(None, max_length=1000)


class WaitlistEntryUpdate(BaseModel):
    # Status changes go through the dedicated action endpoints below
    # (contacted/schedule), same convention as AppointmentUpdate.
    care_type_id: uuid.UUID | None = None
    desired_from: date | None = None
    desired_to: date | None = None
    priority: str | None = Field(None, pattern="^(low|medium|high)$")
    notes: str | None = Field(None, max_length=1000)

    model_config = ConfigDict(extra="forbid")


class WaitlistScheduleRequest(BaseModel):
    appointment_id: uuid.UUID