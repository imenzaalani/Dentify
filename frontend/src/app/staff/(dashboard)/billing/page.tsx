"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "./components/data-table"
import { BillingStatCards } from "./components/billing-stat-cards"
import type { InvoiceFormValues } from "./components/invoice-form-sheet"

import { invoiceApi } from "@/lib/api/invoices"
import { ApiError } from "@/lib/api/client"
import type { Invoice, InvoiceCreateInput, PaymentInput } from "@/types/invoice"

type ActiveTab = "all" | "quotes" | "invoices" | "unpaid"

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>("all")

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    invoiceApi
      .listInvoices()
      .then((data) => {
        if (!cancelled) setInvoices(data)
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load billing documents")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    return {
      all: invoices.length,
      quotes: invoices.filter((inv) => inv.doc_type === "quote").length,
      invoices: invoices.filter((inv) => inv.doc_type === "invoice").length,
      unpaid: invoices.filter(
        (inv) => inv.status !== "paid" && inv.status !== "draft"
      ).length,
    }
  }, [invoices])

  const handleAddInvoice = async (data: InvoiceFormValues) => {
    const payload: InvoiceCreateInput = {
      doc_type: data.type === "Quote" ? "quote" : "invoice",
      patient_id: data.patientId,
      treatment_plan_id: data.treatmentPlanId || null,
      issue_date: data.issueDate.toISOString().split("T")[0],
      due_date: data.dueDate ? data.dueDate.toISOString().split("T")[0] : null,
      global_discount_pct: data.globalDiscountPct ?? 0,
      notes: data.notes,
      payment_terms: data.paymentTerms,
      line_items: data.lineItems.map((line) => ({
        description: line.description,
        tooth: line.tooth,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        discount_pct: line.discountPct,
      })),
    }

    try {
      const newInvoice = await invoiceApi.createInvoice(payload)
      setInvoices((prev) => [newInvoice, ...prev])
      toast.success(`${data.type} ${newInvoice.number} created`, {
        description: `Assigned to ${newInvoice.patient_name}.`,
      })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create document")
      throw err
    }
  }

  const handleConvertToInvoice = async (id: string) => {
    try {
      const updated = await invoiceApi.convertToInvoice(id)
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)))
      toast.success("Quote converted to invoice")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to convert quote")
    }
  }

  const handleDuplicateInvoice = async (id: string) => {
    try {
      const duplicate = await invoiceApi.duplicateInvoice(id)
      setInvoices((prev) => [duplicate, ...prev])
      toast.success(`Duplicated as ${duplicate.number}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to duplicate document")
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    try {
      await invoiceApi.deleteInvoice(id)
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
      toast.success("Document deleted")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete document")
    }
  }

  const handleRecordPayment = async (id: string, payment: PaymentInput) => {
    try {
      const updated = await invoiceApi.recordPayment(id, payment)
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)))
      toast.success("Payment recorded")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to record payment")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Billing{" "}
            <span className="text-muted-foreground font-normal">
              ({invoices.length})
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Quotes, invoices, and payments across your patients.
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <BillingStatCards invoices={invoices} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6 flex flex-col gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ActiveTab)}
        >
          <TabsList>
            <TabsTrigger value="all" className="cursor-pointer">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="quotes" className="cursor-pointer">
              Quotes ({counts.quotes})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="cursor-pointer">
              Invoices ({counts.invoices})
            </TabsTrigger>
            <TabsTrigger value="unpaid" className="cursor-pointer">
              Unpaid ({counts.unpaid})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <DataTable
          invoices={invoices}
          activeTab={activeTab}
          isLoading={isLoading}
          onAddInvoice={handleAddInvoice}
          onConvertToInvoice={handleConvertToInvoice}
          onDuplicateInvoice={handleDuplicateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onRecordPayment={handleRecordPayment}
        />
      </div>
    </div>
  )
}
