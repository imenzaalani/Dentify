from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DocumentCategory(str, Enum):
    IMAGING = "imaging"
    CONSENT_FORM = "consent_form"
    INVOICE = "invoice"
    LAB_REPORT = "lab_report"


class DocumentUpdate(BaseModel):
    category: DocumentCategory | None = None
    notes: str | None = Field(None, max_length=2000)


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: str
    patient_avatar: str
    file_name: str
    category: DocumentCategory
    file_type: str
    file_size_kb: int
    notes: str | None
    uploaded_by_name: str
    created_at: datetime
    updated_at: datetime
