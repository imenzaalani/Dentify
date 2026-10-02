import asyncio
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

import app.api.v1.auth as auth_module
from app.api.v1.auth import get_staff_member
from app.core.permissions import normalize_role
from app.models.user import User, UserRole
from app.schemas.auth import UserOut


class FakeScalarResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class FakeAsyncSession:
    def __init__(self, user):
        self.user = user
        self.committed = False

    async def execute(self, stmt):
        return FakeScalarResult(self.user)

    async def commit(self):
        self.committed = True


def test_user_out_serializes_created_at_to_string():
    user = User(
        id=uuid.uuid4(),
        email="dr@example.com",
        first_name="Ada",
        last_name="Lovelace",
        password_hash="hashed",
        role="dentist",
        is_active=True,
        is_verified=True,
        created_at=datetime(2026, 7, 12, 19, 34, 7, tzinfo=timezone.utc),
    )

    payload = UserOut.model_validate(user)

    assert payload.created_at == "2026-07-12T19:34:07+00:00"


def test_get_staff_member_returns_staff_payload():
    user = User(
        id=uuid.uuid4(),
        email="dr@example.com",
        first_name="Ada",
        last_name="Lovelace",
        password_hash="hashed",
        role="dentist",
        is_active=True,
    )
    session = FakeAsyncSession(user)
    current_user = SimpleNamespace(id=uuid.uuid4(), role="owner")

    result = asyncio.run(get_staff_member(user.id, db=session, current_user=current_user))

    assert result.email == "dr@example.com"
    assert result.first_name == "Ada"
    assert result.last_name == "Lovelace"


def test_user_out_normalizes_enum_role_values():
    user = User(
        id=uuid.uuid4(),
        email="owner@example.com",
        password_hash="hashed",
        role=UserRole.OWNER,
        is_active=True,
        is_verified=True,
    )

    payload = UserOut.model_validate(user)

    assert payload.role == "owner"


def test_normalize_role_handles_legacy_and_enum_style_values():
    assert normalize_role("OWNER") == "owner"
    assert normalize_role("UserRole.OWNER") == "owner"
    assert normalize_role(UserRole.OWNER) == "owner"


def test_reset_password_marks_user_verified(monkeypatch):
    user = User(
        id=uuid.uuid4(),
        email="dr@example.com",
        first_name="Ada",
        last_name="Lovelace",
        password_hash="old-hash",
        role="dentist",
        is_active=True,
        is_verified=False,
    )

    class FakeResult:
        def __init__(self, value):
            self._value = value

        def scalar_one_or_none(self):
            return self._value

    class FakeSession:
        def __init__(self, value):
            self.value = value
            self.committed = False

        async def execute(self, stmt):
            return FakeResult(self.value)

        async def commit(self):
            self.committed = True

    monkeypatch.setattr(auth_module, "decode_token", lambda token: {"sub": str(user.id), "type": "reset"})
    monkeypatch.setattr(auth_module, "hash_password", lambda password: "new-hash")
    monkeypatch.setattr(auth_module, "reset_token_matches_current_password", lambda token_payload, password_hash: True)

    response = asyncio.run(
        auth_module.reset_password(
            payload=SimpleNamespace(token="token", new_password="new-pass"),
            db=FakeSession(user),
        )
    )

    assert response["detail"] == "Password updated successfully."
    assert user.is_verified is True
    assert user.password_hash == "new-hash"


def test_resend_staff_invite_sends_email_for_unverified_staff(monkeypatch):
    user = User(
        id=uuid.uuid4(),
        email="dr@example.com",
        first_name="Ada",
        last_name="Lovelace",
        password_hash="hashed",
        role="dentist",
        is_active=True,
        is_verified=False,
    )

    class FakeResult:
        def __init__(self, value):
            self._value = value

        def scalar_one_or_none(self):
            return self._value

    class FakeSession:
        def __init__(self, value):
            self.value = value
            self.committed = False

        async def execute(self, stmt):
            return FakeResult(self.value)

        async def commit(self):
            self.committed = True

    calls = []

    async def fake_send_staff_invite_email(email, token, role):
        calls.append((email, token, role))

    monkeypatch.setattr(auth_module, "send_staff_invite_email", fake_send_staff_invite_email)
    monkeypatch.setattr(auth_module, "create_reset_token", lambda user_id, password_hash: "token")

    response = asyncio.run(
        auth_module.resend_staff_invite(
            request=SimpleNamespace(),
            user_id=user.id,
            db=FakeSession(user),
            current_user=SimpleNamespace(role="owner"),
        )
    )

    assert response.email == "dr@example.com"
    assert len(calls) == 1
    assert calls[0][0] == "dr@example.com"
    assert calls[0][2] == "dentist"
