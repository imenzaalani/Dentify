import { addWeeks, addMonths } from "date-fns"

import type { Installment, PaymentPlan } from "./data-table"

interface BuildPaymentPlanInput {
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

// Splits totalAmount evenly across numberOfInstallments (2 decimal places),
// pushing any rounding remainder onto the last installment so the sum always
// matches totalAmount exactly.
export function buildPaymentPlan({
  totalAmount,
  numberOfInstallments,
  frequency,
  firstDueDate,
}: BuildPaymentPlanInput): PaymentPlan {
  const baseAmount = Math.floor((totalAmount / numberOfInstallments) * 100) / 100
  const installments: Installment[] = Array.from({ length: numberOfInstallments }, (_, i) => {
    const isLast = i === numberOfInstallments - 1
    const amount = isLast
      ? Math.round((totalAmount - baseAmount * (numberOfInstallments - 1)) * 100) / 100
      : baseAmount
    return {
      id: `inst-${Date.now()}-${i}`,
      index: i + 1,
      dueDate: nextDueDate(firstDueDate, frequency, i).toISOString().split("T")[0],
      amount,
      status: "Pending" as const,
    }
  })

  return {
    id: `plan-${Date.now()}`,
    frequency,
    installments,
    createdAt: new Date().toISOString().split("T")[0],
  }
}

// An installment is overdue if it's still pending and its due date has passed.
// This is derived at render time rather than stored, so it never goes stale.
export function isInstallmentOverdue(installment: Installment): boolean {
  if (installment.status === "Paid") return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(installment.dueDate) < today
}