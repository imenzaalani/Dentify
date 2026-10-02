import { apiRequest } from "./client"
import type {
  Invoice,
  InvoiceCreateInput,
  MarkInstallmentPaidInput,
  PaymentInput,
  PaymentPlanCreateInput,
} from "@/types/invoice"

export interface InvoiceListParams {
  patient_id?: string
}

export const invoiceApi = {
  async listInvoices(params?: InvoiceListParams): Promise<Invoice[]> {
    const search = new URLSearchParams()
    if (params?.patient_id) search.set("patient_id", params.patient_id)
    const qs = search.toString()
    return apiRequest<Invoice[]>(`/invoices/${qs ? `?${qs}` : ""}`)
  },

  async getInvoice(id: string): Promise<Invoice> {
    return apiRequest<Invoice>(`/invoices/${id}`)
  },

  async createInvoice(payload: InvoiceCreateInput): Promise<Invoice> {
    return apiRequest<Invoice>(`/invoices/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async convertToInvoice(id: string): Promise<Invoice> {
    return apiRequest<Invoice>(`/invoices/${id}/convert`, {
      method: "POST",
    })
  },

  async duplicateInvoice(id: string): Promise<Invoice> {
    return apiRequest<Invoice>(`/invoices/${id}/duplicate`, {
      method: "POST",
    })
  },

  async deleteInvoice(id: string): Promise<void> {
    return apiRequest<void>(`/invoices/${id}`, {
      method: "DELETE",
    })
  },

  async recordPayment(id: string, payload: PaymentInput): Promise<Invoice> {
    return apiRequest<Invoice>(`/invoices/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async createPaymentPlan(id: string, payload: PaymentPlanCreateInput): Promise<Invoice> {
    return apiRequest<Invoice>(`/invoices/${id}/payment-plan`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async markInstallmentPaid(
    id: string,
    installmentId: string,
    payload: MarkInstallmentPaidInput
  ): Promise<Invoice> {
    return apiRequest<Invoice>(`/invoices/${id}/payment-plan/installments/${installmentId}/pay`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}