from fastapi import APIRouter

from app.api.v1 import (
    appointments,
    auth,
    care_types,
    documents,
    invoices,
    leads,
    patients,
    referrals,
    resources,
    stats,
    treatments,
    waitlist,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(leads.router)
api_router.include_router(patients.router)
api_router.include_router(care_types.router)
api_router.include_router(resources.router)
api_router.include_router(appointments.router)
api_router.include_router(waitlist.router)
api_router.include_router(treatments.router)
api_router.include_router(referrals.router)
api_router.include_router(documents.router)
api_router.include_router(invoices.router)
api_router.include_router(stats.router)
# Next slices to add here, one at a time, each with its own model +
# schema + router + frontend connection before moving to the next:
#   dentists, staff,
#   messages, audit_logs