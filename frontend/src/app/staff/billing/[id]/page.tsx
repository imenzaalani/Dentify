"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Download,
  Repeat,
  Send,
  Trash2,
  Wallet,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import initialInvoicesData from "../data.json"
import patientsData from "../../patients/data.json"
import {
  statusBadge,
  formatTND,
  type Invoice,
  type Payment,
  type PaymentPlan,
} from "../components/data-table"
import { RecordPaymentDialog } from "../components/record-payment-dialog"
import { PaymentPlanCard } from "../components/payment-plan-card"

const patients = patientsData as {
  id: number
  firstName: string
  lastName: string
  avatar: string
  email?: string
}[]

const invoicesSeed = initialInvoicesData as Invoice[]

export default function InvoicePreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = Number(params.id)

  const [invoice, setInvoice] = useState<Invoice | null>(
    () => invoicesSeed.find((inv) => inv.id === invoiceId) ?? null
  )
  const [paymentOpen, setPaymentOpen] = useState(false)

  // Auto-print when arriving via "Download PDF" (?print=1) so the browser's
  // native print dialog can be used to save as PDF — no backend renderer yet.
  useEffect(() => {
    if (searchParams.get("print") === "1") {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  if (!invoice) {
    return (
      <div className="@container/main px-4 lg:px-6 py-16 flex flex-col items-center gap-3 text-center">
        <h1 className="text-xl font-semibold">Document not found</h1>
        <p className="text-sm text-muted-foreground">
          This quote or invoice may have been removed.
        </p>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/staff/billing">
            <ArrowLeft className="mr-2 size-4" />
            Back to Billing
          </Link>
        </Button>
      </div>
    )
  }

  const canRecordPayment =
    invoice.type === "Invoice" && invoice.status !== "Paid" && invoice.status !== "Draft"

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = () => {
    const patient = patients.find((p) => p.id === invoice.patientId)
    const subject = encodeURIComponent(`${invoice.type} ${invoice.number}`)
    const body = encodeURIComponent(
      `Hello ${invoice.patientName},\n\nPlease find your ${invoice.type.toLowerCase()} ${invoice.number} for ${formatTND(
        invoice.total
      )}.\n\nThank you.`
    )
    window.location.href = `mailto:${patient?.email ?? ""}?subject=${subject}&body=${body}`
    toast.success(`Opening your email client for ${invoice.patientName}`)
  }

  const handleConvertToInvoice = () => {
    setInvoice((prev) => {
      if (!prev) return prev
      const year = new Date().getFullYear()
      return {
        ...prev,
        type: "Invoice" as const,
        number: `FAC-${year}-${String(prev.id).padStart(3, "0")}`,
        status: "Sent" as const,
        issueDate: new Date().toISOString().split("T")[0],
      }
    })
    toast.success("Quote converted to invoice")
  }

  const handleRecordPayment = (payment: {
    amount: number
    date: Date
    method: Payment["method"]
    reference?: string
    notes?: string
  }) => {
    setInvoice((prev) => {
      if (!prev) return prev
      const newPayment: Payment = {
        id: `p${prev.id}-${Date.now()}`,
        amount: payment.amount,
        date: payment.date.toISOString().split("T")[0],
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
      }
      const paidAmount = prev.paidAmount + payment.amount
      const balance = Math.max(0, prev.total - paidAmount)
      const status = balance <= 0 ? "Paid" : ("Partially Paid" as Invoice["status"])
      return { ...prev, payments: [...prev.payments, newPayment], paidAmount, balance, status }
    })
    toast.success("Payment recorded")
    setPaymentOpen(false)
  }

  const handleDelete = () => {
    toast.success("Document deleted")
    router.push("/staff/billing")
  }

  const handleCreatePlan = (plan: PaymentPlan) => {
    setInvoice((prev) => (prev ? { ...prev, paymentPlan: plan } : prev))
    toast.success(
      `Payment plan created — ${plan.installments.length} installments`
    )
  }

  const handleMarkInstallmentPaid = (
    installmentId: string,
    payment: {
      amount: number
      date: Date
      method: Payment["method"]
      reference?: string
    }
  ) => {
    setInvoice((prev) => {
      if (!prev || !prev.paymentPlan) return prev
      const installment = prev.paymentPlan.installments.find(
        (i) => i.id === installmentId
      )
      if (!installment || installment.status === "Paid") return prev

      const newPayment: Payment = {
        id: `p${prev.id}-${Date.now()}`,
        amount: payment.amount,
        date: payment.date.toISOString().split("T")[0],
        method: payment.method,
        reference: payment.reference,
        notes: `Installment ${installment.index}/${prev.paymentPlan.installments.length}`,
      }
      const paidAmount = prev.paidAmount + payment.amount
      const balance = Math.max(0, prev.total - paidAmount)
      const status = balance <= 0 ? "Paid" : ("Partially Paid" as Invoice["status"])
      const installments = prev.paymentPlan.installments.map((i) =>
        i.id === installmentId
          ? {
              ...i,
              status: "Paid" as const,
              paidAt: newPayment.date,
              paymentId: newPayment.id,
            }
          : i
      )

      return {
        ...prev,
        payments: [...prev.payments, newPayment],
        paidAmount,
        balance,
        status,
        paymentPlan: { ...prev.paymentPlan, installments },
      }
    })
    toast.success("Installment marked as paid")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="w-fit cursor-pointer -ml-2">
            <Link href="/staff/billing">
              <ArrowLeft className="mr-2 size-4" />
              Back to Billing
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold font-mono">{invoice.number}</h1>
            {statusBadge(invoice.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.type} · Issued {new Date(invoice.issueDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.type === "Quote" && (
            <Button variant="outline" className="cursor-pointer" onClick={handleConvertToInvoice}>
              <Repeat className="mr-2 size-4" />
              Convert to invoice
            </Button>
          )}
          {canRecordPayment && (
            <Button variant="outline" className="cursor-pointer" onClick={() => setPaymentOpen(true)}>
              <Wallet className="mr-2 size-4" />
              Record payment
            </Button>
          )}
          <Button variant="outline" className="cursor-pointer" onClick={handleSendEmail}>
            <Send className="mr-2 size-4" />
            Send by email
          </Button>
          <Button variant="outline" className="cursor-pointer" onClick={handlePrint}>
            <Download className="mr-2 size-4" />
            Download PDF
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="cursor-pointer text-destructive hover:text-destructive">
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this document?</DialogTitle>
                <DialogDescription>
                  This permanently removes {invoice.number} for {invoice.patientName}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="cursor-pointer">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className="cursor-pointer bg-destructive hover:bg-destructive/90"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground font-medium">Patient</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Link
                href={`/staff/patients/${invoice.patientId}`}
                className="flex items-center gap-3 hover:underline"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-medium">
                    {invoice.patientAvatar}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{invoice.patientName}</span>
              </Link>
              <Separator />
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Issue date</span>
                  <span className="text-foreground">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Due date</span>
                  <span className="text-foreground">
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
                  </span>
                </div>
                {invoice.treatmentPlanTitle && (
                  <div className="flex justify-between gap-2">
                    <span>Treatment plan</span>
                    <Link
                      href={`/staff/treatments/${invoice.treatmentPlanId}`}
                      className="text-foreground hover:underline text-right"
                    >
                      {invoice.treatmentPlanTitle}
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <PaymentPlanCard
            invoice={invoice}
            onCreatePlan={handleCreatePlan}
            onMarkInstallmentPaid={handleMarkInstallmentPaid}
          />
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">Line items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Tooth</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Disc.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.description}</TableCell>
                    <TableCell className="text-muted-foreground">{line.tooth ?? "—"}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{formatTND(line.unitPrice)}</TableCell>
                    <TableCell className="text-right">
                      {line.discountPct ? `${line.discountPct}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatTND(line.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator />

            <div className="ml-auto flex w-full max-w-xs flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatTND(invoice.subtotal)}</span>
              </div>
              {!!invoice.globalDiscountPct && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Global discount</span>
                  <span>{invoice.globalDiscountPct}%</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatTND(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Paid</span>
                <span>{formatTND(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Balance</span>
                <span>{formatTND(invoice.balance)}</span>
              </div>
            </div>

            {invoice.payments.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Payment history</h3>
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(p.date).toLocaleDateString()} · {p.method}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </span>
                      <span className="font-medium">{formatTND(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(invoice.notes || invoice.paymentTerms) && (
              <>
                <Separator />
                {invoice.notes && (
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                )}
                {invoice.paymentTerms && (
                  <p className="text-xs text-muted-foreground">{invoice.paymentTerms}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <RecordPaymentDialog
        invoice={invoice}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onRecordPayment={handleRecordPayment}
      />
    </div>
  )
}