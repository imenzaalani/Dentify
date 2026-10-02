import secrets
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_access_token_payload, get_current_user, require_roles
from app.core.permissions import Role
from app.core.rate_limit import limiter
from app.core.redis import is_jti_revoked, revoke_jti
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
    hash_password,
    reset_token_matches_current_password,
    verify_password,
)
from app.models.dentist_profile import DentistProfile
from app.models.user import User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    StaffCreateRequest,
    StaffOut,
    StaffRole,
    StaffUpdateRequest,
    TokenResponse,
    UserOut,
    MeUpdateRequest,
    ChangePasswordRequest,
)
from app.services.email import send_password_reset_email, send_staff_invite_email

router = APIRouter(prefix="/auth", tags=["auth"])

STAFF_ROLES = {UserRole.RECEPTIONIST.value, UserRole.DENTIST.value, UserRole.OWNER.value}


def _role_matches_portal(role: str, portal: str | None) -> bool:
    if portal is None:
        return True
    if portal == "staff":
        return role in STAFF_ROLES
    if portal == "patient":
        return role == "patient"
    return True


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")
    if not _role_matches_portal(user.role, payload.portal):
        # Credentials were valid, so this is safe to be specific about —
        # it doesn't leak anything the caller doesn't already know.
        portal_name = "staff" if payload.portal == "staff" else "patient"
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"This account isn't registered for the {portal_name} portal.")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    token_payload = decode_token(payload.refresh_token)
    if token_payload is None or token_payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    if await is_jti_revoked(token_payload.get("jti")):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == UUID(token_payload["sub"])))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: RefreshRequest,
    access_payload: dict = Depends(get_current_access_token_payload),
) -> Response:
    now_ts = datetime.now(timezone.utc).timestamp()

    access_ttl = int(access_payload.get("exp", 0) - now_ts)
    await revoke_jti(access_payload.get("jti"), access_ttl)

    refresh_payload = decode_token(payload.refresh_token)
    if refresh_payload and refresh_payload.get("type") == "refresh":
        refresh_ttl = int(refresh_payload.get("exp", 0) - now_ts)
        await revoke_jti(refresh_payload.get("jti"), refresh_ttl)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def _to_staff_out(user: User) -> StaffOut:
    profile = getattr(user, "dentist_profile", None)
    user_payload = {
        "id": user.id,
        "email": user.email,
        "phone": user.phone,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "is_active": bool(getattr(user, "is_active", True)),
        "is_verified": bool(getattr(user, "is_verified", False) or False),
        "avatar_url": user.avatar_url,
        "created_at": getattr(user, "created_at", None),
    }
    return StaffOut(
        **user_payload,
        dentist_profile=None if profile is None else {
            "specialty": profile.specialty,
            "license_number": profile.license_number,
            "bio": profile.bio,
            "color": profile.color,
            "working_hours": profile.working_hours,
        },
    )


@router.post("/staff", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
async def create_staff(
    payload: StaffCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> StaffOut:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    user = User(
        email=payload.email,
        phone=payload.phone,
        first_name=payload.first_name,
        last_name=payload.last_name,
        password_hash=hash_password(secrets.token_urlsafe(32)),
        role=payload.role.value,
    )
    db.add(user)
    await db.flush()

    if payload.role == StaffRole.DENTIST:
        db.add(
            DentistProfile(
                user_id=user.id,
                specialty=payload.specialty,
                license_number=payload.license_number,
                bio=payload.bio,
                color=payload.color or "#2563eb",
                working_hours=[wh.model_dump() for wh in payload.working_hours or []],
            )
        )

    await db.commit()
    result = await db.execute(select(User).options(selectinload(User.dentist_profile)).where(User.id == user.id))
    user = result.scalar_one()

    token = create_reset_token(user.id, user.password_hash)
    await send_staff_invite_email(user.email, token, payload.role.value)

    return _to_staff_out(user)


@router.post("/staff/{user_id}/resend-invite", response_model=StaffOut)
@limiter.limit("3/minute")
async def resend_staff_invite(
    request: Request,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> StaffOut:
    result = await db.execute(select(User).options(selectinload(User.dentist_profile)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    if user.is_verified:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This account has already been activated.")
    if not user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This account is disabled.")

    token = create_reset_token(user.id, user.password_hash)
    await send_staff_invite_email(user.email, token, user.role)

    return _to_staff_out(user)


@router.post("/staff/{user_id}/avatar", response_model=StaffOut)
async def upload_staff_avatar(
    user_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> StaffOut:
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Avatar must be a JPEG, PNG, or WEBP image.")

    contents = await file.read()
    if len(contents) > settings.AVATAR_MAX_SIZE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Avatar must be 5MB or smaller.")

    extension = Path(file.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        extension = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }.get(file.content_type, ".jpg")

    filename = f"{user_id}-{secrets.token_urlsafe(8)}{extension}"
    avatar_path = Path(settings.AVATARS_DIR) / filename
    avatar_path.parent.mkdir(parents=True, exist_ok=True)

    with open(avatar_path, "wb") as f:
        f.write(contents)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    user.avatar_url = f"{settings.AVATARS_URL_PREFIX}/{filename}"
    await db.commit()

    result = await db.execute(
        select(User).options(selectinload(User.dentist_profile)).where(User.id == user_id)
    )
    user = result.scalar_one()

    return _to_staff_out(user)


@router.post("/me/avatar", response_model=UserOut)
async def upload_my_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Avatar must be a JPEG, PNG, or WEBP image.")

    contents = await file.read()
    if len(contents) > settings.AVATAR_MAX_SIZE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Avatar must be 5MB or smaller.")

    extension = Path(file.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        extension = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }.get(file.content_type, ".jpg")

    filename = f"{current_user.id}-{secrets.token_urlsafe(8)}{extension}"
    avatar_path = Path(settings.AVATARS_DIR) / filename
    avatar_path.parent.mkdir(parents=True, exist_ok=True)

    with open(avatar_path, "wb") as f:
        f.write(contents)

    # update current user
    current_user.avatar_url = f"{settings.AVATARS_URL_PREFIX}/{filename}"
    await db.commit()
    await db.refresh(current_user)

    return UserOut.model_validate(current_user)


@router.get("/staff", response_model=list[StaffOut])
async def list_staff(
    role: StaffRole | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> list[StaffOut]:
    stmt = select(User).options(selectinload(User.dentist_profile))
    if role is not None:
        stmt = stmt.where(User.role == role.value)
    else:
        stmt = stmt.where(User.role != "patient")

    result = await db.execute(stmt.order_by(User.created_at.desc()))
    return [_to_staff_out(user) for user in result.scalars().all()]


@router.get("/staff/{user_id}", response_model=StaffOut)
async def get_staff_member(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> StaffOut:
    result = await db.execute(select(User).options(selectinload(User.dentist_profile)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")
    return _to_staff_out(user)


@router.patch("/staff/{user_id}", response_model=StaffOut)
async def update_staff(
    user_id: UUID,
    payload: StaffUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> StaffOut:
    result = await db.execute(select(User).options(selectinload(User.dentist_profile)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    for field in ("first_name", "last_name", "phone"):
        value = getattr(payload, field)
        if value is not None:
            setattr(user, field, value)

    if user.dentist_profile:
        for field in ("specialty", "license_number", "bio", "color"):
            value = getattr(payload, field)
            if value is not None:
                setattr(user.dentist_profile, field, value)
        if payload.working_hours is not None:
            user.dentist_profile.working_hours = [wh.model_dump() for wh in payload.working_hours]

    await db.commit()
    await db.refresh(user)
    return _to_staff_out(user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: MeUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    # If updating email, ensure it's not already used by another user
    if payload.email and payload.email != current_user.email:
        result = await db.execute(select(User).where(User.email == payload.email))
        if result.scalar_one_or_none() is not None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    for field in ("email", "first_name", "last_name", "phone"):
        value = getattr(payload, field)
        if value is not None:
            setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_my_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    # verify current password
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")

    current_user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"detail": "Password updated"}


@router.post("/staff/{user_id}/toggle-status", response_model=StaffOut)
async def toggle_staff_status(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> StaffOut:
    result = await db.execute(select(User).options(selectinload(User.dentist_profile)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return _to_staff_out(user)


@router.delete("/staff/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff_member(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> Response:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    await db.delete(user)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
async def forgot_password(request: Request, payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is not None and user.is_active and _role_matches_portal(user.role, payload.portal):
        token = create_reset_token(user.id, user.password_hash)
        email_portal = "staff" if user.role in STAFF_ROLES else "patient"
        await send_password_reset_email(user.email, token, email_portal)

    # Always the same response, whether or not an email was actually sent —
    # this avoids leaking account existence or role to the caller.
    return {"detail": "If that email exists, a reset link has been sent."}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_payload = decode_token(payload.token)
    if token_payload is None or token_payload.get("type") != "reset":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired reset token")

    result = await db.execute(select(User).where(User.id == UUID(token_payload["sub"])))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

    # Token is bound to the password hash it was issued against, so it's
    # single-use (redeeming it changes the hash) and auto-invalidates if
    # the password was already changed some other way in the meantime.
    if not reset_token_matches_current_password(token_payload, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired reset token")

    user.password_hash = hash_password(payload.new_password)
    # This is the invite-acceptance flow (the token came from a staff/patient
    # invite email) as well as the generic "forgot password" flow — either
    # way, successfully redeeming it proves the person controls the email,
    # so mark the account verified. Patient.portal_status (and the staff
    # "already activated" check above) both key off this flag; leaving it
    # unset meant Portal Account stayed "Pending" forever even after the
    # patient signed in.
    user.is_verified = True
    await db.commit()
    return {"detail": "Password updated successfully."}