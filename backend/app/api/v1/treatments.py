from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Role
from app.models.patient import Patient
from app.models.treatment import TreatmentPlan, TreatmentStep
from app.models.user import User
from app.schemas.treatment import (
    TreatmentPlanCreate,
    TreatmentPlanOut,
    TreatmentPlanStatusUpdate,
    TreatmentPlanUpdate,
    TreatmentStepStatusUpdate,
)

router = APIRouter(prefix="/treatments", tags=["treatments"])

STAFF_CLINICAL = (Role.DENTIST, Role.OWNER)
STAFF_ALL = (Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)


async def _get_plan_or_404(db: AsyncSession, plan_id: UUID) -> TreatmentPlan:
    result = await db.execute(
        select(TreatmentPlan)
        .options(selectinload(TreatmentPlan.steps))
        .where(TreatmentPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    return plan


def _apply_steps(plan: TreatmentPlan, steps_payload: list) -> None:
    """Replace plan.steps from a create/update payload.

    Existing steps are matched to the incoming list by position so an edit
    that only tweaks wording keeps each step's id/status/consent trail —
    same behavior as the frontend's handleEditPlan. depends_on_index is
    resolved to a real step object only after all steps exist below.
    """
    existing_by_position = {s.position: s for s in sorted(plan.steps, key=lambda s: s.position)}
    new_steps: list[TreatmentStep] = []

    for index, step_in in enumerate(steps_payload):
        existing = existing_by_position.get(index)
        if existing:
            existing.label = step_in.label
            existing.tooth = step_in.tooth
            existing.est_duration_minutes = step_in.est_duration_minutes
            existing.requires_consent = step_in.requires_consent
            existing.position = index
            new_steps.append(existing)
        else:
            new_steps.append(
                TreatmentStep(
                    label=step_in.label,
                    tooth=step_in.tooth,
                    est_duration_minutes=step_in.est_duration_minutes,
                    requires_consent=step_in.requires_consent,
                    position=index,
                    status="pending",
                )
            )

    plan.steps = new_steps

    # Second pass: resolve depends_on_index -> depends_on_step_id now that
    # every step in this batch has an object (even if not yet flushed).
    for index, step_in in enumerate(steps_payload):
        if step_in.depends_on_index is not None and 0 <= step_in.depends_on_index < len(new_steps):
            new_steps[index].depends_on_step_id = new_steps[step_in.depends_on_index].id


async def _get_own_patient_or_404(db: AsyncSession, user: User) -> Patient:
    result = await db.execute(select(Patient).where(Patient.user_id == user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="No patient record linked to this account")
    return patient


@router.get("", response_model=list[TreatmentPlanOut])
async def list_treatment_plans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> list[TreatmentPlan]:
    result = await db.execute(
        select(TreatmentPlan)
        .options(selectinload(TreatmentPlan.steps))
        .order_by(TreatmentPlan.created_at.desc())
    )
    return result.scalars().unique().all()


@router.get("/me", response_model=list[TreatmentPlanOut])
async def list_my_treatment_plans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.PATIENT)),
) -> list[TreatmentPlan]:
    patient = await _get_own_patient_or_404(db, current_user)
    result = await db.execute(
        select(TreatmentPlan)
        .options(selectinload(TreatmentPlan.steps))
        .where(TreatmentPlan.patient_id == patient.id)
        .order_by(TreatmentPlan.created_at.desc())
    )
    return result.scalars().unique().all()


@router.get("/{plan_id}", response_model=TreatmentPlanOut)
async def get_treatment_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL, Role.PATIENT)),
) -> TreatmentPlan:
    plan = await _get_plan_or_404(db, plan_id)
    if Role(current_user.role) == Role.PATIENT:
        patient = await _get_own_patient_or_404(db, current_user)
        if plan.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized for this action")
    return plan


@router.post("", response_model=TreatmentPlanOut, status_code=status.HTTP_201_CREATED)
async def create_treatment_plan(
    payload: TreatmentPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_CLINICAL)),
) -> TreatmentPlan:
    patient = await db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    plan = TreatmentPlan(
        patient_id=payload.patient_id,
        title=payload.title,
        diagnosis=payload.diagnosis,
        start_date=payload.start_date,
        end_date=payload.end_date,
        notes=payload.notes,
        status="planned",
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    plan.steps = []
    db.add(plan)
    _apply_steps(plan, payload.steps)

    await db.commit()
    return await _get_plan_or_404(db, plan.id)


@router.patch("/{plan_id}", response_model=TreatmentPlanOut)
async def update_treatment_plan(
    plan_id: UUID,
    payload: TreatmentPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_CLINICAL)),
) -> TreatmentPlan:
    plan = await _get_plan_or_404(db, plan_id)

    updates = payload.model_dump(exclude_unset=True, exclude={"steps"})
    for field, value in updates.items():
        setattr(plan, field, value)

    if payload.steps is not None:
        _apply_steps(plan, payload.steps)

    plan.updated_by = current_user.id
    await db.commit()
    return await _get_plan_or_404(db, plan.id)


@router.patch("/{plan_id}/status", response_model=TreatmentPlanOut)
async def update_treatment_plan_status(
    plan_id: UUID,
    payload: TreatmentPlanStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_CLINICAL)),
) -> TreatmentPlan:
    plan = await _get_plan_or_404(db, plan_id)
    plan.status = payload.status.value
    plan.updated_by = current_user.id
    await db.commit()
    return await _get_plan_or_404(db, plan.id)


@router.patch("/{plan_id}/steps/{step_id}", response_model=TreatmentPlanOut)
async def update_treatment_step_status(
    plan_id: UUID,
    step_id: UUID,
    payload: TreatmentStepStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_CLINICAL)),
) -> TreatmentPlan:
    plan = await _get_plan_or_404(db, plan_id)
    step = next((s for s in plan.steps if s.id == step_id), None)
    if not step:
        raise HTTPException(status_code=404, detail="Step not found on this plan")

    if payload.status.value == "completed":
        if step.depends_on_step_id is not None:
            dependency = next((s for s in plan.steps if s.id == step.depends_on_step_id), None)
            if dependency and dependency.status != "completed":
                raise HTTPException(
                    status_code=400,
                    detail="The step this depends on must be completed first",
                )
        if step.requires_consent and step.consent_signed_at is None:
            raise HTTPException(
                status_code=400,
                detail="This step requires a signed consent before it can be completed",
            )

    step.status = payload.status.value
    plan.updated_by = current_user.id

    # Auto-progress the plan's own status: first step completed moves a
    # freshly-planned plan into progress; all steps completed finishes it.
    statuses = [s.status for s in plan.steps]
    if plan.status == "planned" and "completed" in statuses:
        plan.status = "in_progress"
    elif statuses and all(s == "completed" for s in statuses):
        plan.status = "completed"

    await db.commit()
    return await _get_plan_or_404(db, plan.id)
