"""
Import every model module here so that `Base.metadata` is fully populated
before Alembic autogenerate or `create_all` runs, and so that string-based
relationship() references (e.g. Mapped["Patient"]) resolve correctly.
"""
from app.core.database import Base  # noqa: F401

from app.models.user import User, UserRole  # noqa: F401
from app.models.patient import Patient, PatientLifecycleStatus  # noqa: F401
from app.models.dentist import Dentist  # noqa: F401
from app.models.staff import StaffProfile  # noqa: F401
from app.models.resource import Resource, ResourceType  # noqa: F401
from app.models.appointment import (  # noqa: F401
    Appointment,
    AppointmentStatus,
    AppointmentSource,
)
from app.models.treatment import (  # noqa: F401
    Treatment,
    TreatmentStatus,
    TreatmentStep,
    TreatmentStepStatus,
)
from app.models.invoice import (  # noqa: F401
    Invoice,
    InvoiceType,
    InvoiceStatus,
    InvoiceItem,
    PaymentPlan,
    PaymentPlanInstallment,
    Payment,
    PaymentMethod,
    DailyCashRegister,
    CashRegisterPaymentMethod,
)
from app.models.lead import Lead, LeadStatus  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.document import Document, DocumentType, Consent, ConsentType  # noqa: F401
from app.models.referral import Referral  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401

__all__ = [
    "Base",
    "User", "UserRole",
    "Patient", "PatientLifecycleStatus",
    "Dentist",
    "StaffProfile",
    "Resource", "ResourceType",
    "Appointment", "AppointmentStatus", "AppointmentSource",
    "Treatment", "TreatmentStatus", "TreatmentStep", "TreatmentStepStatus",
    "Invoice", "InvoiceType", "InvoiceStatus", "InvoiceItem",
    "PaymentPlan", "PaymentPlanInstallment", "Payment", "PaymentMethod",
    "DailyCashRegister", "CashRegisterPaymentMethod",
    "Lead", "LeadStatus",
    "Message",
    "Document", "DocumentType", "Consent", "ConsentType",
    "Referral",
    "AuditLog",
]
