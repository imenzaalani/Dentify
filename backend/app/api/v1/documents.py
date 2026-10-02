import secrets
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Category, Role, can_read, can_write
from app.models.document import Document, DocumentCategory
from app.models.patient import Patient
from app.models.user import User
from app.schemas.document import DocumentOut, DocumentUpdate

router = APIRouter(prefix="/documents", tags=["documents"])

STAFF_ALL = (Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)

# Same clinical/administrative split the rest of the backend enforces
# (see core/permissions.py) applied to document categories: imaging and
# lab reports are clinical, invoices are billing, consent forms are
# treated as ordinary administrative paperwork every staff role can see.
CATEGORY_PERMISSION: dict[str, Category] = {
    DocumentCategory.IMAGING.value: Category.CLINICAL_READ,
    DocumentCategory.LAB_REPORT.value: Category.CLINICAL_READ,
    DocumentCategory.INVOICE.value: Category.BILLING_STANDARD,
    DocumentCategory.CONSENT_FORM.value: Category.IDENTITY,
}

ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/dicom": "dicom",
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".dicom", ".dcm"}


def _category_or_400(value: str) -> DocumentCategory:
    try:
        return DocumentCategory(value)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid document category") from None


def _require_category_read(user: User, category: str) -> None:
    permission = CATEGORY_PERMISSION.get(category)
    if permission and not can_read(Role(user.role), permission):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to view this document category")


def _require_category_write(user: User, category: str) -> None:
    permission = CATEGORY_PERMISSION.get(category)
    if permission and not can_write(Role(user.role), permission):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to manage this document category")


def _infer_extension(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix in ALLOWED_EXTENSIONS:
        return "dicom" if suffix == ".dcm" else suffix.lstrip(".")
    mapped = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if mapped:
        return mapped
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported file type")


def _to_document_out(doc: Document) -> DocumentOut:
    patient = doc.patient
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else ""
    patient_avatar = (
        f"{patient.first_name[:1]}{patient.last_name[:1]}".upper() if patient else ""
    )
    uploader = doc.uploader
    uploaded_by_name = (
        f"{uploader.first_name} {uploader.last_name}".strip() if uploader and uploader.first_name else "Staff"
    )

    return DocumentOut(
        id=doc.id,
        patient_id=doc.patient_id,
        patient_name=patient_name,
        patient_avatar=patient_avatar,
        file_name=doc.file_name,
        category=doc.category,
        file_type=doc.file_type,
        file_size_kb=doc.file_size_kb,
        notes=doc.notes,
        uploaded_by_name=uploaded_by_name,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


async def _get_doc_or_404(db: AsyncSession, document_id: UUID) -> Document:
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return doc


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    patient_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> list[DocumentOut]:
    query = select(Document).order_by(Document.created_at.desc())
    if patient_id is not None:
        query = query.where(Document.patient_id == patient_id)
    result = await db.execute(query)
    docs = result.scalars().all()
    visible = [d for d in docs if can_read(Role(current_user.role), CATEGORY_PERMISSION.get(d.category, Category.IDENTITY))]
    return [_to_document_out(d) for d in visible]


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    patient_id: UUID = Form(...),
    category: str = Form(...),
    notes: str | None = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> DocumentOut:
    category_enum = _category_or_400(category)
    _require_category_write(current_user, category_enum.value)

    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")

    contents = await file.read()
    if len(contents) > settings.DOCUMENT_MAX_SIZE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File must be 20MB or smaller.")

    file_type = _infer_extension(file)
    stored_name = f"{patient_id}-{secrets.token_urlsafe(8)}.{file_type}"
    documents_dir = Path(settings.DOCUMENTS_DIR)
    documents_dir.mkdir(parents=True, exist_ok=True)
    (documents_dir / stored_name).write_bytes(contents)

    doc = Document(
        patient_id=patient_id,
        file_name=file.filename or stored_name,
        category=category_enum.value,
        file_type=file_type,
        file_size_kb=max(1, round(len(contents) / 1024)),
        storage_path=stored_name,
        notes=notes,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.commit()

    doc = await _get_doc_or_404(db, doc.id)
    return _to_document_out(doc)


@router.get("/{document_id}/file")
async def download_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> FileResponse:
    doc = await _get_doc_or_404(db, document_id)
    _require_category_read(current_user, doc.category)

    file_path = Path(settings.DOCUMENTS_DIR) / doc.storage_path
    if not file_path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File is no longer available on disk")

    return FileResponse(file_path, filename=doc.file_name)


@router.patch("/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: UUID,
    payload: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> DocumentOut:
    doc = await _get_doc_or_404(db, document_id)
    _require_category_write(current_user, doc.category)

    updates = payload.model_dump(exclude_unset=True)
    if "category" in updates:
        new_category = _category_or_400(updates["category"])
        _require_category_write(current_user, new_category.value)
        doc.category = new_category.value
    if "notes" in updates:
        doc.notes = updates["notes"]

    await db.commit()
    doc = await _get_doc_or_404(db, document_id)
    return _to_document_out(doc)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> None:
    doc = await _get_doc_or_404(db, document_id)
    _require_category_write(current_user, doc.category)

    file_path = Path(settings.DOCUMENTS_DIR) / doc.storage_path
    if file_path.exists():
        file_path.unlink()

    await db.delete(doc)
    await db.commit()
