from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Role
from app.models.care_type import CareType
from app.models.user import User
from app.schemas.care_type import CareTypeCreate, CareTypeOut, CareTypeUpdate

from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/care-types", tags=["care-types"])

# NOTE: permissions.py's CONFIG category is owner-only read+write, but its
# docstring lists care types under CONFIG even though every staff role needs
# to read them to book an appointment. Same divergence as patients.py's
# list/detail: GET is open to any staff role; create/update/delete stay
# owner-only per WRITE_MATRIX[CONFIG].


@router.get("/", response_model=list[CareTypeOut])
async def list_care_types(
    include_inactive: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> list[CareType]:
    stmt = select(CareType)
    if not include_inactive:
        stmt = stmt.where(CareType.active.is_(True))
    stmt = stmt.order_by(CareType.category, CareType.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=CareTypeOut, status_code=status.HTTP_201_CREATED)
async def create_care_type(
    payload: CareTypeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> CareType:
    care_type = CareType(**payload.model_dump())
    db.add(care_type)
    await db.commit()
    await db.refresh(care_type)
    return care_type


@router.patch("/{care_type_id}", response_model=CareTypeOut)
async def update_care_type(
    care_type_id: UUID,
    payload: CareTypeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> CareType:
    care_type = await db.get(CareType, care_type_id)
    if not care_type:
        raise HTTPException(status_code=404, detail="Care type not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(care_type, field, value)

    await db.commit()
    await db.refresh(care_type)
    return care_type


@router.delete("/{care_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_care_type(
    care_type_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> None:
    care_type = await db.get(CareType, care_type_id)
    if not care_type:
        raise HTTPException(status_code=404, detail="Care type not found")

    try:
        await db.delete(care_type)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This care type is used by existing appointments — deactivate it instead of deleting.",
        )