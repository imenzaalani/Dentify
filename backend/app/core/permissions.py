"""
Category-based RBAC, mirroring dentapp-architecture-v2.md section 2.2.

Permissions are defined per *data category*, not just per role, because the
architecture explicitly separates "who can see a patient's phone number" from
"who can see a patient's clinical notes" even though both look like
"the patient's record" from a UI perspective.

Roles (matches frontend `src/lib/rbac.ts` StaffRole + "patient"):
    - patient        : the authenticated patient themself
    - receptionist    : front-desk / secretary — full administrative access, zero clinical access
    - dentist         : clinical + administrative access, scoped to their own patients
    - owner           : full access (manager / super-admin in the French docs)
"""
from enum import Enum


class Role(str, Enum):
    PATIENT = "patient"
    RECEPTIONIST = "receptionist"
    DENTIST = "dentist"
    OWNER = "owner"


STAFF_ROLES = {Role.RECEPTIONIST, Role.DENTIST, Role.OWNER}


class Category(str, Enum):
    IDENTITY = "identity"              # name, phone, email, address
    PLANNING = "planning"              # appointments, resources, waitlist
    BILLING_STANDARD = "billing_std"   # invoices, standard payments/quotes
    BILLING_SENSITIVE = "billing_sen"  # discounts, voiding invoices
    CLINICAL_READ = "clinical_read"    # allergies, history, diagnosis, steps
    CLINICAL_WRITE = "clinical_write"  # writing clinical notes / treatment plans
    CONFIG = "config"                  # clinic settings, care types, staff accounts
    AUDIT = "audit"                    # audit log access
    STATS_OPERATIONAL = "stats_op"     # fill rate, no-show rate
    STATS_FULL = "stats_full"          # revenue & consolidated stats

# Read permissions per category
READ_MATRIX: dict[Category, set[Role]] = {
    Category.IDENTITY: {Role.RECEPTIONIST, Role.DENTIST, Role.OWNER},
    Category.PLANNING: {Role.RECEPTIONIST, Role.DENTIST, Role.OWNER},
    Category.BILLING_STANDARD: {Role.RECEPTIONIST, Role.DENTIST, Role.OWNER},
    Category.BILLING_SENSITIVE: {Role.DENTIST, Role.OWNER},
    Category.CLINICAL_READ: {Role.DENTIST, Role.OWNER},
    Category.CLINICAL_WRITE: {Role.DENTIST, Role.OWNER},
    Category.CONFIG: {Role.OWNER},
    Category.AUDIT: {Role.OWNER},
    Category.STATS_OPERATIONAL: {Role.RECEPTIONIST, Role.DENTIST, Role.OWNER},
    Category.STATS_FULL: {Role.OWNER},
}

# Write permissions per category (subset of read, generally stricter)
WRITE_MATRIX: dict[Category, set[Role]] = {
    Category.IDENTITY: {Role.RECEPTIONIST, Role.DENTIST, Role.OWNER},
    Category.PLANNING: {Role.RECEPTIONIST, Role.DENTIST, Role.OWNER},
    Category.BILLING_STANDARD: {Role.RECEPTIONIST, Role.DENTIST, Role.OWNER},
    Category.BILLING_SENSITIVE: {Role.DENTIST, Role.OWNER},
    Category.CLINICAL_READ: set(),  # read-only category, no direct writes
    Category.CLINICAL_WRITE: {Role.DENTIST, Role.OWNER},
    Category.CONFIG: {Role.OWNER},
    Category.AUDIT: set(),  # system only, never user-writable
    Category.STATS_OPERATIONAL: set(),
    Category.STATS_FULL: set(),
}


def can_read(role: Role, category: Category) -> bool:
    return role in READ_MATRIX.get(category, set())


def can_write(role: Role, category: Category) -> bool:
    return role in WRITE_MATRIX.get(category, set())
