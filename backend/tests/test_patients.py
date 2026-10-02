import asyncio
import uuid
from types import SimpleNamespace

from app.api.v1.patients import create_patient
from app.schemas.patient import PatientCreate


class FakeResult:
    def __init__(self, value):
        self._value = value

    def scalars(self):
        return self

    def all(self):
        return [self._value]


class FakeAsyncSession:
    def __init__(self):
        self.added = []
        self.committed = False
        self.refreshed = []

    async def execute(self, stmt):
        return FakeResult(0)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.committed = True

    async def refresh(self, obj):
        self.refreshed.append(obj)


def test_create_patient_uses_async_session():
    session = FakeAsyncSession()
    current_user = SimpleNamespace(id=uuid.uuid4())
    payload = PatientCreate(
        first_name="Ada",
        last_name="Lovelace",
        dob="1815-12-10",
        email="ada@example.com",
    )

    patient = asyncio.run(create_patient(payload=payload, db=session, current_user=current_user))

    assert patient.patient_number == "P-000002"
    assert patient.first_name == "Ada"
    assert session.committed is True
    assert len(session.added) == 1
