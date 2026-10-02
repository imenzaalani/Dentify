import { addWeeks, addMonths } from "date-fns"

import type { Installment, PaymentPlan } from "./data-table"

interface PreviewPaymentPlanInput {
  totalAmount: number
  numberOfInstallments: number
  frequency: PaymentPlan["frequency"]
  firstDueDate: Date
}

function nextDueDate(base: Date, frequency: PaymentPlan["frequency"], offset: number): Date {
  switch (frequency) {
    case "weekly":
      return addWeeks(base, offset)
    case "biweekly":
      return addWeeks(base, offset * 2)
    case "monthly":
    default:
      return addMonths(base, offset)
  }
}

// Mirrors the backend's installment-splitting math (see
// _build_installments in app/api/v1/invoices.py) purely so the dialog can
// preview a schedule before submitting. The server recomputes this from
// scratch and is the source of truth — this output is never sent as-is.
export function previewPaymentPlan({
  totalAmount,
  numberOfInstallments,
  frequency,
  firstDueDate,
}: PreviewPaymentPlanInput): PaymentPlan {
  const baseAmount = Math.floor((totalAmount / numberOfInstallments) * 100) / 100
  const installments: Installment[] = Array.from({ length: numberOfInstallments }, (_, i) => {
    const isLast = i === numberOfInstallments - 1
    const amount = isLast
      ? Math.round((totalAmount - baseAmount * (numberOfInstallments - 1)) * 100) / 100
      : baseAmount
    return {
      id: `preview-${i}`,
      index: i + 1,
      due_date: nextDueDate(firstDueDate, frequency, i).toISOString().split("T")[0],
      amount,
      status: "pending" as const,
    }
  })

  return {
    id: "preview",
    frequency,
    installments,
    created_at: new Date().toISOString().split("T")[0],
  }
}

// An installment is overdue if it's still pending and its due date has passed.
// This is derived at render time rather than stored, so it never goes stale.
export function isInstallmentOverdue(installment: Installment): boolean {
  if (installment.status === "paid") return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(installment.due_date) < today
}