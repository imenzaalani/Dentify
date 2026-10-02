from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class TreatmentPlanStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TreatmentStepStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class TreatmentStepCreate(BaseModel):
    label: str = Field(..., min_length=2, max_length=255)
    tooth: str | None = Field(None, max_length=50)
    est_duration_minutes: int | None = Field(None, ge=0)
    requires_consent: bool = False
    # Index (0-based, within this same request's steps list) of the step
    # this one depends on. Resolved to a real UUID after insert, since the
    # dependency's own id doesn't exist yet on create.
    depends_on_index: int | None = None


class TreatmentStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str
    tooth: str | None
    est_duration_minutes: int | None
    status: TreatmentStepStatus
    position: int
    depends_on_step_id: uuid.UUID | None
    requires_consent: bool
    consent_signed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TreatmentPlanCreate(BaseModel):
    patient_id: uuid.UUID
    title: str = Field(..., min_length=3, max_length=255)
    diagnosis: str | None = Field(None, max_length=2000)
    start_date: date
    end_date: date | None = None
    notes: str | None = Field(None, max_length=2000)
    steps: list[TreatmentStepCreate] = Field(..., min_length=1)


class TreatmentPlanUpdate(BaseModel):
    """General-info + full step-list edit, mirroring the frontend's editor
    (which re-submits the whole steps array on every save). Steps matched
    by position to the existing plan keep their id/status; extra steps are
    appended as new, missing ones are dropped — same semantics as
    page.tsx's handleEditPlan.
    """

    title: str | None = Field(None, min_length=3, max_length=255)
    diagnosis: str | None = Field(None, max_length=2000)
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = Field(None, max_length=2000)
    steps: list[TreatmentStepCreate] | None = None


class TreatmentPlanStatusUpdate(BaseModel):
    status: TreatmentPlanStatus


class TreatmentStepStatusUpdate(BaseModel):
    status: TreatmentStepStatus


class TreatmentPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    title: str
    diagnosis: str | None
    start_date: date
    end_date: date | None
    status: TreatmentPlanStatus
    notes: str | None
    steps: list[TreatmentStepOut]
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
