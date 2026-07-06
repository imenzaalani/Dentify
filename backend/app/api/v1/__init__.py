from fastapi import APIRouter

from app.api.v1 import (
    appointments,
    audit_logs,
    auth,
    dentists,
    documents,
    invoices,
    leads,
    messages,
    patients,
    referrals,
    resources,
    staff,
    treatments,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(dentists.router)
api_router.include_router(staff.router)
api_router.include_router(resources.router)
api_router.include_router(appointments.router)
api_router.include_router(treatments.router)
api_router.include_router(invoices.router)
api_router.include_router(leads.router)
api_router.include_router(messages.router)
api_router.include_router(documents.router)
api_router.include_router(referrals.router)
api_router.include_router(audit_logs.router)
