"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DataTable,
  type Invoice,
  type InvoiceLineItem,
  type Payment,
} from "./components/data-table"
import { BillingStatCards } from "./components/billing-stat-cards"
import type { InvoiceFormValues } from "./components/invoice-form-sheet"

import initialInvoicesData from "./data.json"
import patientsData from "../patients/data.json"
import treatmentsData from "../treatments/data.json"

const patients = patientsData as {
  id: number
  firstName: string
  lastName: string
  avatar: string
}[]

const treatmentPlans = treatmentsData as {
  id: number
  patientId: number
  title: string
}[]

type ActiveTab = "all" | "quotes" | "invoices" | "unpaid"

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(
    initialInvoicesData as Invoice[]
  )
  const [activeTab, setActiveTab] = useState<ActiveTab>("all")

  const counts = useMemo(() => {
    return {
      all: invoices.length,
      quotes: invoices.filter((inv) => inv.type === "Quote").length,
      invoices: invoices.filter((inv) => inv.type === "Invoice").length,
      unpaid: invoices.filter(
        (inv) => inv.status !== "Paid" && inv.status !== "Draft"
      ).length,
    }
  }, [invoices])

  const handleAddInvoice = (data: InvoiceFormValues) => {
    const patient = patients.find((p) => p.id === Number(data.patientId))
    const plan = treatmentPlans.find(
      (p) => String(p.id) === data.treatmentPlanId
    )

    const globalDiscountPct = data.globalDiscountPct ?? 0

    const lineItems: InvoiceLineItem[] = data.lineItems.map((line, index) => {
      const discountPct = line.discountPct ?? 0
      const lineTotal = line.quantity * line.unitPrice * (1 - discountPct / 100)
      return {
        id: `new-${Date.now()}-${index}`,
        description: line.description,
        tooth: line.tooth,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPct: line.discountPct,
        lineTotal,
      }
    })

    const subtotal = lineItems.reduce((sum, line) => sum + line.lineTotal, 0)
    const total = subtotal * (1 - globalDiscountPct / 100)

    const newInvoice: Invoice = {
      id: Math.max(0, ...invoices.map((inv) => inv.id)) + 1,
      number: data.number,
      type: data.type,
      patientId: Number(data.patientId),
      patientName: patient
        ? `${patient.firstName} ${patient.lastName}`
        : "",
      patientAvatar: patient?.avatar ?? "",
      treatmentPlanId: plan?.id ?? null,
      treatmentPlanTitle: plan?.title,
      issueDate: data.issueDate.toISOString().split("T")[0],
      dueDate: data.dueDate ? data.dueDate.toISOString().split("T")[0] : null,
      lineItems,
      globalDiscountPct,
      subtotal,
      total,
      paidAmount: 0,
      balance: total,
      status: "Draft",
      notes: data.notes,
      paymentTerms: data.paymentTerms,
      payments: [],
      createdAt: new Date().toISOString().split("T")[0],
    }

    setInvoices((prev) => [newInvoice, ...prev])
    toast.success(
      `${data.type === "Quote" ? "Quote" : "Invoice"} ${data.number} created`,
      { description: `Assigned to ${newInvoice.patientName}.` }
    )
  }

  const handleConvertToInvoice = (id: number) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv
        const nextInvoiceCount =
          prev.filter((i) => i.type === "Invoice").length + 1
        const year = new Date().getFullYear()
        return {
          ...inv,
          type: "Invoice" as const,
          number: `FAC-${year}-${String(nextInvoiceCount).padStart(3, "0")}`,
          status: "Sent" as const,
          issueDate: new Date().toISOString().split("T")[0],
        }
      })
    )
    toast.success("Quote converted to invoice")
  }

  const handleDuplicateInvoice = (id: number) => {
    setInvoices((prev) => {
      const source = prev.find((inv) => inv.id === id)
      if (!source) return prev
      const newId = Math.max(0, ...prev.map((inv) => inv.id)) + 1
      const duplicate: Invoice = {
        ...source,
        id: newId,
        number: `${source.number}-COPY`,
        status: "Draft",
        paidAmount: 0,
        balance: source.total,
        payments: [],
        createdAt: new Date().toISOString().split("T")[0],
      }
      toast.success(`Duplicated as ${duplicate.number}`)
      return [duplicate, ...prev]
    })
  }

  const handleDeleteInvoice = (id: number) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    toast.success("Document deleted")
  }

  const handleRecordPayment = (
    id: number,
    payment: {
      amount: number
      date: Date
      method: Payment["method"]
      reference?: string
      notes?: string
    }
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv
        const newPayment: Payment = {
          id: `p${id}-${Date.now()}`,
          amount: payment.amount,
          date: payment.date.toISOString().split("T")[0],
          method: payment.method,
          reference: payment.reference,
          notes: payment.notes,
        }
        const paidAmount = inv.paidAmount + payment.amount
        const balance = Math.max(0, inv.total - paidAmount)
        const status =
          balance <= 0 ? "Paid" : ("Partially Paid" as Invoice["status"])
        return {
          ...inv,
          payments: [...inv.payments, newPayment],
          paidAmount,
          balance,
          status,
        }
      })
    )
    toast.success("Payment recorded")
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