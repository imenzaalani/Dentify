import calendar
from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Category, Role, can_write
from app.models.invoice import Invoice, InvoiceLineItem, Payment
from app.models.patient import Patient
from app.models.payment_plan import Installment, PaymentPlan
from app.models.treatment import TreatmentPlan
from app.models.user import User
from app.schemas.invoice import (
    CNAM_REIMBURSEMENT_RATE,
    InvoiceCreate,
    InvoiceOut,
    InvoiceUpdate,
    LineItemIn,
    PaymentIn,
)
from app.schemas.payment_plan import MarkInstallmentPaidIn, PaymentPlanCreate

router = APIRouter(prefix="/invoices", tags=["invoices"])

STAFF_ALL = (Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)

NUMBER_PREFIX = {"quote": "DEV", "invoice": "FAC"}


def _has_discount(global_discount_pct: float, line_items: list[LineItemIn]) -> bool:
    return global_discount_pct > 0 or any((li.discount_pct or 0) > 0 for li in line_items)


def _require_billing_write(user: User, *, sensitive: bool) -> None:
    category = Category.BILLING_SENSITIVE if sensitive else Category.BILLING_STANDARD
    if not can_write(Role(user.role), category):
        detail = (
            "Only dentists and owners can apply discounts or void billing documents"
            if sensitive
            else "Not authorized to manage billing"
        )
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail)


async def _next_number(db: AsyncSession, doc_type: str, year: int) -> str:
    prefix = NUMBER_PREFIX[doc_type]
    pattern = f"{prefix}-{year}-%"
    result = await db.execute(
        select(func.count()).select_from(Invoice).where(
            Invoice.doc_type == doc_type, Invoice.number.like(pattern)
        )
    )
    count = result.scalar_one()
    return f"{prefix}-{year}-{str(count + 1).zfill(3)}"


def _recompute_totals(invoice: Invoice) -> None:
    subtotal = sum(li.line_total for li in invoice.line_items)
    invoice.subtotal = round(subtotal, 2)
    invoice.total = round(subtotal * (1 - float(invoice.global_discount_pct) / 100), 2)


def _recompute_status(invoice: Invoice) -> None:
    """Mirrors the frontend's status logic: quotes only move on explicit
    conversion; invoice status is derived from paid_amount vs total (and
    due_date for overdue) except Draft, which nothing here auto-advances —
    same gap as the original UI, which has no "mark as sent" action either.
    """
    if invoice.doc_type == "quote" or invoice.status == "draft":
        return
    if float(invoice.paid_amount) >= float(invoice.total) and float(invoice.total) > 0:
        invoice.status = "paid"
    elif float(invoice.paid_amount) > 0:
        invoice.status = "partially_paid"
    elif invoice.due_date and invoice.due_date < date.today().isoformat():
        invoice.status = "overdue"
    else:
        invoice.status = "sent"


def _add_months(base: date, months: int) -> date:
    month_index = base.month - 1 + months
    year = base.year + month_index // 12
    month = month_index % 12 + 1
    day = min(base.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _next_due_date(base: date, frequency: str, offset: int) -> date:
    if frequency == "weekly":
        return base + timedelta(weeks=offset)
    if frequency == "biweekly":
        return base + timedelta(weeks=offset * 2)
    return _add_months(base, offset)  # monthly (default)


def _build_installments(
    total_amount: float, number_of_installments: int, frequency: str, first_due_date: date
) -> list[Installment]:
    """Splits total_amount evenly across installments (2 decimal places),
    pushing any rounding remainder onto the last one so the sum always
    matches total_amount exactly — same approach as the frontend's old
    client-side preview builder, now the single source of truth.
    """
    base_amount = int(total_amount / number_of_installments * 100) / 100
    installments: list[Installment] = []
    for i in range(number_of_installments):
        is_last = i == number_of_installments - 1
        amount = (
            round(total_amount - base_amount * (number_of_installments - 1), 2)
            if is_last
            else base_amount
        )
        installments.append(
            Installment(
                position=i,
                due_date=_next_due_date(first_due_date, frequency, i).isoformat(),
                amount=amount,
                status="pending",
            )
        )
    return installments


def _to_invoice_out(inv: Invoice) -> InvoiceOut:
    patient = inv.patient
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else ""
    patient_avatar = f"{patient.first_name[:1]}{patient.last_name[:1]}".upper() if patient else ""
    plan = inv.treatment_plan

    return InvoiceOut(
        id=inv.id,
        number=inv.number,
        doc_type=inv.doc_type,
        status=inv.status,
        patient_id=inv.patient_id,
        patient_name=patient_name,
        patient_avatar=patient_avatar,
        patient_email=patient.email if patient else None,
        treatment_plan_id=inv.treatment_plan_id,
        treatment_plan_title=plan.title if plan else None,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        line_items=[
            {
                "id": li.id,
                "description": li.description,
                "tooth": li.tooth,
                "quantity": float(li.quantity),
                "unit_price": float(li.unit_price),
                "discount_pct": float(li.discount_pct),
                "line_total": li.line_total,
            }
            for li in inv.line_items
        ],
        global_discount_pct=float(inv.global_discount_pct),
        subtotal=float(inv.subtotal),
        total=float(inv.total),
        paid_amount=float(inv.paid_amount),
        balance=inv.balance,
        reimbursable_amount=round(float(inv.total) * CNAM_REIMBURSEMENT_RATE, 2),
        patient_due_amount=round(float(inv.total) * (1 - CNAM_REIMBURSEMENT_RATE), 2),
        notes=inv.notes,
        payment_terms=inv.payment_terms,
        payments=[
            {
                "id": p.id,
                "amount": float(p.amount),
                "payment_date": p.payment_date,
                "method": p.method,
                "reference": p.reference,
                "notes": p.notes,
            }
            for p in inv.payments
        ],
        payment_plan=(
            {
                "id": inv.payment_plan.id,
                "frequency": inv.payment_plan.frequency,
                "created_at": inv.payment_plan.created_at,
                "installments": [
                    {
                        "id": i.id,
                        "index": i.position + 1,
                        "due_date": i.due_date,
                        "amount": float(i.amount),
                        "status": i.status,
                        "paid_at": i.paid_at,
                        "payment_id": i.payment_id,
                    }
                    for i in inv.payment_plan.installments
                ],
            }
            if inv.payment_plan
            else None
        ),
        created_at=inv.created_at,
    )


async def _get_invoice_or_404(db: AsyncSession, invoice_id: UUID) -> Invoice:
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Quote/invoice not found")
    return inv


def _build_line_items(payload: list[LineItemIn]) -> list[InvoiceLineItem]:
    return [
        InvoiceLineItem(
            position=index,
            description=li.description,
            tooth=li.tooth,
            quantity=li.quantity,
            unit_price=li.unit_price,
            discount_pct=li.discount_pct or 0,
        )
        for index, li in enumerate(payload)
    ]


@router.get("/", response_model=list[InvoiceOut])
async def list_invoices(
    patient_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> list[InvoiceOut]:
    query = select(Invoice).order_by(Invoice.created_at.desc())
    if patient_id is not None:
        query = query.where(Invoice.patient_id == patient_id)
    result = await db.execute(query)
    invoices = result.scalars().all()
    return [_to_invoice_out(inv) for inv in invoices]


@router.post("/", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    payload: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> InvoiceOut:
    _require_billing_write(
        current_user, sensitive=_has_discount(payload.global_discount_pct, payload.line_items)
    )

    patient = await db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")

    if payload.treatment_plan_id:
        plan = await db.get(TreatmentPlan, payload.treatment_plan_id)
        if not plan:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Treatment plan not found")

    number = await _next_number(db, payload.doc_type.value, payload.issue_date.year)

    invoice = Invoice(
        number=number,
        doc_type=payload.doc_type.value,
        status="draft",
        patient_id=payload.patient_id,
        treatment_plan_id=payload.treatment_plan_id,
        issue_date=payload.issue_date.isoformat(),
        due_date=payload.due_date.isoformat() if payload.due_date else None,
        global_discount_pct=payload.global_discount_pct or 0,
        notes=payload.notes,
        payment_terms=payload.payment_terms,
        paid_amount=0,
    )
    invoice.line_items = _build_line_items(payload.line_items)
    _recompute_totals(invoice)

    db.add(invoice)
    await db.commit()

    invoice = await _get_invoice_or_404(db, invoice.id)
    return _to_invoice_out(invoice)


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> InvoiceOut:
    invoice = await _get_invoice_or_404(db, invoice_id)
    return _to_invoice_out(invoice)


@router.patch("/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(
    invoice_id: UUID,
    payload: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> InvoiceOut:
    _require_billing_write(current_user, sensitive=False)
    invoice = await _get_invoice_or_404(db, invoice_id)

    updates = payload.model_dump(exclude_unset=True)
    if "notes" in updates:
        invoice.notes = updates["notes"]
    if "payment_terms" in updates:
        invoice.payment_terms = updates["payment_terms"]
    if "due_date" in updates:
        invoice.due_date = updates["due_date"].isoformat() if updates["due_date"] else None

    await db.commit()
    invoice = await _get_invoice_or_404(db, invoice_id)
    return _to_invoice_out(invoice)


@router.post("/{invoice_id}/convert", response_model=InvoiceOut)
async def convert_to_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> InvoiceOut:
    _require_billing_write(current_user, sensitive=False)
    invoice = await _get_invoice_or_404(db, invoice_id)

    if invoice.doc_type != "quote":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only quotes can be converted to invoices")

    today = date.today()
    invoice.doc_type = "invoice"
    invoice.status = "sent"
    invoice.issue_date = today.isoformat()
    invoice.number = await _next_number(db, "invoice", today.year)

    await db.commit()
    invoice = await _get_invoice_or_404(db, invoice_id)
    return _to_invoice_out(invoice)


@router.post("/{invoice_id}/duplicate", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
async def duplicate_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> InvoiceOut:
    source = await _get_invoice_or_404(db, invoice_id)
    _require_billing_write(
        current_user,
        sensitive=_has_discount(float(source.global_discount_pct), [
            LineItemIn(
                description=li.description, tooth=li.tooth, quantity=float(li.quantity),
                unit_price=float(li.unit_price), discount_pct=float(li.discount_pct),
            )
            for li in source.line_items
        ]),
    )

    today = date.today()
    number = await _next_number(db, source.doc_type, today.year)

    duplicate = Invoice(
        number=number,
        doc_type=source.doc_type,
        status="draft",
        patient_id=source.patient_id,
        treatment_plan_id=source.treatment_plan_id,
        issue_date=today.isoformat(),
        due_date=source.due_date,
        global_discount_pct=source.global_discount_pct,
        notes=source.notes,
        payment_terms=source.payment_terms,
        paid_amount=0,
    )
    duplicate.line_items = [
        InvoiceLineItem(
            position=li.position, description=li.description, tooth=li.tooth,
            quantity=li.quantity, unit_price=li.unit_price, discount_pct=li.discount_pct,
        )
        for li in source.line_items
    ]
    _recompute_totals(duplicate)

    db.add(duplicate)
    await db.commit()

    duplicate = await _get_invoice_or_404(db, duplicate.id)
    return _to_invoice_out(duplicate)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> None:
    # Voiding a billing document is a sensitive action regardless of whether
    # this particular document happens to carry a discount.
    _require_billing_write(current_user, sensitive=True)
    invoice = await _get_invoice_or_404(db, invoice_id)
    await db.delete(invoice)
    await db.commit()


@router.post("/{invoice_id}/payments", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
async def record_payment(
    invoice_id: UUID,
    payload: PaymentIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> InvoiceOut:
    _require_billing_write(current_user, sensitive=False)
    invoice = await _get_invoice_or_404(db, invoice_id)

    if invoice.doc_type != "invoice" or invoice.status in ("draft", "paid"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Payments can only be recorded on sent, partially paid, or overdue invoices",
        )

    payment = Payment(
        invoice_id=invoice.id,
        amount=payload.amount,
        payment_date=payload.payment_date.isoformat(),
        method=payload.method.value,
        reference=payload.reference,
        notes=payload.notes,
        recorded_by=current_user.id,
    )
    db.add(payment)
    invoice.paid_amount = float(invoice.paid_amount) + payload.amount
    _recompute_status(invoice)

    await db.commit()
    invoice = await _get_invoice_or_404(db, invoice_id)
    return _to_invoice_out(invoice)


@router.post("/{invoice_id}/payment-plan", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
async def create_payment_plan(
    invoice_id: UUID,
    payload: PaymentPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> InvoiceOut:
    """Splits the invoice's remaining balance into installments. Setting up
    a new plan replaces any existing one, same as the previous client-side
    behavior — installments already marked paid there are simply gone, since
    a plan only ever covers the balance still owed at creation time.
    """
    _require_billing_write(current_user, sensitive=False)
    invoice = await _get_invoice_or_404(db, invoice_id)

    if invoice.doc_type != "invoice" or invoice.status == "draft":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Payment plans can only be set up on sent, partially paid, or overdue invoices",
        )
    if invoice.balance <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This invoice has no remaining balance to split")

    plan = PaymentPlan(frequency=payload.frequency.value)
    plan.installments = _build_installments(
        total_amount=invoice.balance,
        number_of_installments=payload.number_of_installments,
        frequency=payload.frequency.value,
        first_due_date=payload.first_due_date,
    )
    invoice.payment_plan = plan  # cascade="all, delete-orphan" replaces any prior plan

    await db.commit()
    invoice = await _get_invoice_or_404(db, invoice_id)
    return _to_invoice_out(invoice)


@router.post(
    "/{invoice_id}/payment-plan/installments/{installment_id}/pay",
    response_model=InvoiceOut,
)
async def pay_installment(
    invoice_id: UUID,
    installment_id: UUID,
    payload: MarkInstallmentPaidIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> InvoiceOut:
    _require_billing_write(current_user, sensitive=False)
    invoice = await _get_invoice_or_404(db, invoice_id)

    if not invoice.payment_plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This invoice has no payment plan")

    installment = next(
        (i for i in invoice.payment_plan.installments if i.id == installment_id), None
    )
    if not installment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Installment not found")
    if installment.status == "paid":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This installment is already paid")

    payment = Payment(
        invoice_id=invoice.id,
        amount=payload.amount,
        payment_date=payload.payment_date.isoformat(),
        method=payload.method.value,
        reference=payload.reference,
        notes=f"Installment {installment.position + 1}/{len(invoice.payment_plan.installments)}",
        recorded_by=current_user.id,
    )
    db.add(payment)
    await db.flush()  # assign payment.id before linking it to the installment

    installment.status = "paid"
    installment.paid_at = payload.payment_date.isoformat()
    installment.payment_id = payment.id

    invoice.paid_amount = float(invoice.paid_amount) + payload.amount
    _recompute_status(invoice)

    await db.commit()
    invoice = await _get_invoice_or_404(db, invoice_id)
    return _to_invoice_out(invoice)