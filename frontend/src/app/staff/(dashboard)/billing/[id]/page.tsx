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

import { statusBadge, formatTND } from "../components/data-table"
import { RecordPaymentDialog } from "../components/record-payment-dialog"
import { PaymentPlanCard } from "../components/payment-plan-card"

import { invoiceApi } from "@/lib/api/invoices"
import { ApiError } from "@/lib/api/client"
import type { Invoice, MarkInstallmentPaidInput, PaymentInput, PaymentPlanCreateInput } from "@/types/invoice"

export default function InvoicePreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = params.id

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    invoiceApi
      .getInvoice(invoiceId)
      .then((data) => {
        if (!cancelled) setInvoice(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          toast.error(err instanceof ApiError ? err.message : "Failed to load document")
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [invoiceId])

  // Auto-print when arriving via "Download PDF" (?print=1) so the browser's
  // native print dialog can be used to save as PDF — no backend renderer yet.
  useEffect(() => {
    if (searchParams.get("print") === "1" && invoice) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [searchParams, invoice])

  if (isLoading) {
    return (
      <div className="@container/main px-4 lg:px-6 py-16 flex flex-col items-center gap-3 text-center text-muted-foreground">
        Loading document...
      </div>
    )
  }

  if (notFound || !invoice) {
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
    invoice.doc_type === "invoice" && invoice.status !== "paid" && invoice.status !== "draft"

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`${invoice.doc_type === "quote" ? "Quote" : "Invoice"} ${invoice.number}`)
    const body = encodeURIComponent(
      `Hello ${invoice.patient_name},\n\nPlease find your ${invoice.doc_type} ${invoice.number} for ${formatTND(
        invoice.total
      )}.\n\nThank you.`
    )
    window.location.href = `mailto:${invoice.patient_email ?? ""}?subject=${subject}&body=${body}`
    toast.success(`Opening your email client for ${invoice.patient_name}`)
  }

  const handleConvertToInvoice = async () => {
    try {
      const updated = await invoiceApi.convertToInvoice(invoice.id)
      setInvoice(updated)
      toast.success("Quote converted to invoice")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to convert quote")
    }
  }

  const handleRecordPayment = async (payment: PaymentInput) => {
    try {
      const updated = await invoiceApi.recordPayment(invoice.id, payment)
      setInvoice(updated)
      toast.success("Payment recorded")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to record payment")
    } finally {
      setPaymentOpen(false)
    }
  }

  const handleDelete = async () => {
    try {
      await invoiceApi.deleteInvoice(invoice.id)
      toast.success("Document deleted")
      router.push("/staff/billing")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete document")
    }
  }

  const handleCreatePlan = async (input: PaymentPlanCreateInput) => {
    try {
      const updated = await invoiceApi.createPaymentPlan(invoice.id, input)
      setInvoice(updated)
      toast.success(
        `Payment plan created — ${updated.payment_plan?.installments.length ?? 0} installments`
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create payment plan")
    }
  }

  const handleMarkInstallmentPaid = async (
    installmentId: string,
    payment: MarkInstallmentPaidInput
  ) => {
    try {
      const updated = await invoiceApi.markInstallmentPaid(invoice.id, installmentId, payment)
      setInvoice(updated)
      toast.success("Installment marked as paid")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to record installment payment")
    }
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
            {invoice.doc_type === "quote" ? "Quote" : "Invoice"} · Issued{" "}
            {new Date(invoice.issue_date).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.doc_type === "quote" && (
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
                  This permanently removes {invoice.number} for {invoice.patient_name}.
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
                href={`/staff/patients/${invoice.patient_id}`}
                className="flex items-center gap-3 hover:underline"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-medium">
                    {invoice.patient_avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{invoice.patient_name}</span>
              </Link>
              <Separator />
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Issue date</span>
                  <span className="text-foreground">
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Due date</span>
                  <span className="text-foreground">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                  </span>
                </div>
                {invoice.treatment_plan_title && (
                  <div className="flex justify-between gap-2">
                    <span>Treatment plan</span>
                    <Link
                      href={`/staff/treatments/${invoice.treatment_plan_id}`}
                      className="text-foreground hover:underline text-right"
                    >
                      {invoice.treatment_plan_title}
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
                {invoice.line_items.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.description}</TableCell>
                    <TableCell className="text-muted-foreground">{line.tooth ?? "—"}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{formatTND(line.unit_price)}</TableCell>
                    <TableCell className="text-right">
                      {line.discount_pct ? `${line.discount_pct}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatTND(line.line_total)}
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
              {!!invoice.global_discount_pct && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Global discount</span>
                  <span>{invoice.global_discount_pct}%</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatTND(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Paid</span>
                <span>{formatTND(invoice.paid_amount)}</span>
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
                        {new Date(p.payment_date).toLocaleDateString()} · {p.method}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </span>
                      <span className="font-medium">{formatTND(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(invoice.notes || invoice.payment_terms) && (
              <>
                <Separator />
                {invoice.notes && (
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                )}
                {invoice.payment_terms && (
                  <p className="text-xs text-muted-foreground">{invoice.payment_terms}</p>
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