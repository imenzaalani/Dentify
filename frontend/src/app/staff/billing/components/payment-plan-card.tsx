"use client"

import { useState } from "react"
import { CalendarClock, CheckCircle2, CircleDashed, PlusCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Installment, Invoice, PaymentPlan, Payment } from "./data-table"
import { formatTND } from "./data-table"
import { isInstallmentOverdue } from "./payment-plan"
import { PaymentPlanDialog } from "./payment-plan-dialog"
import { MarkInstallmentPaidDialog } from "./mark-installment-paid-dialog"

interface PaymentPlanCardProps {
  invoice: Invoice
  onCreatePlan: (plan: PaymentPlan) => void
  onMarkInstallmentPaid: (
    installmentId: string,
    payment: { amount: number; date: Date; method: Payment["method"]; reference?: string }
  ) => void
}

const frequencyLabels: Record<PaymentPlan["frequency"], string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
}

export function PaymentPlanCard({
  invoice,
  onCreatePlan,
  onMarkInstallmentPaid,
}: PaymentPlanCardProps) {
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [payingInstallment, setPayingInstallment] = useState<Installment | null>(
    null
  )

  const plan = invoice.paymentPlan
  const canManagePlan =
    invoice.type === "Invoice" && invoice.status !== "Draft" && invoice.balance > 0

  if (!plan) {
    if (!canManagePlan) return null
    return (
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Payment plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <p className="text-sm font-medium">No installment plan set up</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Split the remaining {formatTND(invoice.balance)} into installments
              for this patient.
            </p>
            <Button
              size="sm"
              className="mt-2 cursor-pointer gap-2"
              onClick={() => setPlanDialogOpen(true)}
            >
              <PlusCircle className="size-4" />
              Set up a payment plan
            </Button>
          </div>
        </CardContent>

        <PaymentPlanDialog
          invoice={invoice}
          open={planDialogOpen}
          onOpenChange={setPlanDialogOpen}
          onCreatePlan={onCreatePlan}
        />
      </Card>
    )
  }

  const paidCount = plan.installments.filter((i) => i.status === "Paid").length

  return (
    <Card className="print:hidden">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Payment plan
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {frequencyLabels[plan.frequency]} · {paidCount}/{plan.installments.length}{" "}
            installments paid
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {plan.installments.map((installment, idx) => {
          const overdue = isInstallmentOverdue(installment)
          return (
            <div key={installment.id}>
              {idx > 0 && <Separator className="my-1" />}
              <div className="flex items-center gap-3 py-1.5">
                {installment.status === "Paid" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400" />
                ) : (
                  <CircleDashed className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Installment #{installment.index}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(installment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-medium shrink-0">
                  {formatTND(installment.amount)}
                </span>
                {installment.status === "Paid" ? (
                  <Badge className="shrink-0 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    Paid
                  </Badge>
                ) : overdue ? (
                  <Badge className="shrink-0 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    Overdue
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0 text-muted-foreground">
                    Pending
                  </Badge>
                )}
                {installment.status !== "Paid" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer shrink-0"
                    onClick={() => setPayingInstallment(installment)}
                  >
                    <CalendarClock className="mr-1.5 size-3.5" />
                    Mark as paid
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>

      <MarkInstallmentPaidDialog
        installment={payingInstallment}
        open={payingInstallment !== null}
        onOpenChange={(open) => !open && setPayingInstallment(null)}
        onConfirm={(payment) => {
          if (payingInstallment) {
            onMarkInstallmentPaid(payingInstallment.id, payment)
          }
          setPayingInstallment(null)
        }}
      />
    </Card>
  )
}