export type BillingDocType = "quote" | "invoice"
export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue"
export type PaymentMethod = "cash" | "check" | "card" | "transfer" | "other"
export type PlanFrequency = "weekly" | "biweekly" | "monthly"
export type InstallmentStatus = "pending" | "paid"

export interface InvoiceLineItem {
  id: string
  description: string
  tooth?: string | null
  quantity: number
  unit_price: number
  discount_pct: number
  line_total: number
}

export interface InvoicePayment {
  id: string
  amount: number
  payment_date: string
  method: PaymentMethod
  reference?: string | null
  notes?: string | null
}

export interface Installment {
  id: string
  index: number
  due_date: string
  amount: number
  status: InstallmentStatus
  paid_at?: string | null
  payment_id?: string | null
}

export interface PaymentPlan {
  id: string
  frequency: PlanFrequency
  installments: Installment[]
  created_at: string
}

export interface Invoice {
  id: string
  number: string
  doc_type: BillingDocType
  status: InvoiceStatus
  patient_id: string
  patient_name: string
  patient_avatar: string
  patient_email: string | null
  treatment_plan_id: string | null
  treatment_plan_title: string | null
  issue_date: string
  due_date: string | null
  line_items: InvoiceLineItem[]
  global_discount_pct: number
  subtotal: number
  total: number
  paid_amount: number
  balance: number
  reimbursable_amount: number
  patient_due_amount: number
  notes?: string | null
  payment_terms?: string | null
  payments: InvoicePayment[]
  payment_plan?: PaymentPlan | null
  created_at: string
}

export interface InvoiceLineItemInput {
  description: string
  tooth?: string
  quantity: number
  unit_price: number
  discount_pct?: number
}

export interface InvoiceCreateInput {
  doc_type: BillingDocType
  patient_id: string
  treatment_plan_id?: string | null
  issue_date: string
  due_date?: string | null
  global_discount_pct?: number
  notes?: string
  payment_terms?: string
  line_items: InvoiceLineItemInput[]
}

export interface PaymentInput {
  amount: number
  payment_date: string
  method: PaymentMethod
  reference?: string
  notes?: string
}

export interface PaymentPlanCreateInput {
  number_of_installments: number
  frequency: PlanFrequency
  first_due_date: string
}

export interface MarkInstallmentPaidInput {
  amount: number
  payment_date: string
  method: PaymentMethod
  reference?: string
}

export const docTypeLabels: Record<BillingDocType, string> = {
  quote: "Quote",
  invoice: "Invoice",
}

export const statusLabels: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
}