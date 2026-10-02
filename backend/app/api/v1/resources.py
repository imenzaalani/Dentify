from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Role
from app.models.resource import Resource
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceOut, ResourceUpdate

router = APIRouter(prefix="/resources", tags=["resources"])

# PLANNING category: read+write for all staff roles, no divergence needed.
STAFF = (Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)


@router.get("/", response_model=list[ResourceOut])
async def list_resources(
    include_inactive: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> list[Resource]:
    stmt = select(Resource)
    if not include_inactive:
        stmt = stmt.where(Resource.active.is_(True))
    stmt = stmt.order_by(Resource.type, Resource.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=ResourceOut, status_code=status.HTTP_201_CREATED)
async def create_resource(
    payload: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Resource:
    resource = Resource(**payload.model_dump())
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


@router.patch("/{resource_id}", response_model=ResourceOut)
async def update_resource(
    resource_id: UUID,
    payload: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Resource:
    resource = await db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)

    await db.commit()
    await db.refresh(resource)
    return resource


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> None:
    resource = await db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    await db.delete(resource)
    await db.commit()