"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  Download,
  Send,
  Repeat,
  Wallet,
  Copy,
  Trash2,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  InvoiceFormSheet,
  type InvoiceFormValues,
} from "./invoice-form-sheet"
import { RecordPaymentDialog } from "./record-payment-dialog"
import patientsData from "../../patients/data.json"

const patients = patientsData as {
  id: number
  firstName: string
  lastName: string
  avatar: string
  email?: string
}[]

export interface InvoiceLineItem {
  id: string
  description: string
  tooth?: string
  quantity: number
  unitPrice: number
  discountPct?: number
  lineTotal: number
}

export interface Payment {
  id: string
  amount: number
  date: string
  method: "Cash" | "Check" | "Card" | "Transfer" | "Other"
  reference?: string
  notes?: string
}

export interface Installment {
  id: string
  index: number // 1-based position in the schedule
  dueDate: string // ISO date
  amount: number
  status: "Pending" | "Paid"
  paidAt?: string
  paymentId?: string // links back to the Payment recorded when settled
}

export interface PaymentPlan {
  id: string
  frequency: "weekly" | "biweekly" | "monthly"
  installments: Installment[]
  createdAt: string
}

export interface Invoice {
  id: number
  number: string
  type: "Quote" | "Invoice"
  patientId: number
  patientName: string
  patientAvatar: string
  treatmentPlanId: number | null
  treatmentPlanTitle?: string
  issueDate: string
  dueDate: string | null
  lineItems: InvoiceLineItem[]
  globalDiscountPct?: number
  subtotal: number
  total: number
  paidAmount: number
  balance: number
  // CNAM anticipation (architecture v2.0 §12) — split even without a live CNAM
  // integration yet, to avoid a data migration once it's wired up.
  reimbursableAmount?: number // portion potentially covered by CNAM
  patientDueAmount?: number   // portion remaining at the patient's own charge
  status: "Draft" | "Sent" | "Partially Paid" | "Paid" | "Overdue"
  notes?: string
  paymentTerms?: string
  payments: Payment[]
  paymentPlan?: PaymentPlan
  createdAt: string
}

interface DataTableProps {
  invoices: Invoice[]
  activeTab: "all" | "quotes" | "invoices" | "unpaid"
  onAddInvoice: (invoice: InvoiceFormValues) => void
  onConvertToInvoice: (id: number) => void
  onDuplicateInvoice: (id: number) => void
  onDeleteInvoice: (id: number) => void
  onRecordPayment: (
    id: number,
    payment: { amount: number; date: Date; method: Payment["method"]; reference?: string; notes?: string }
  ) => void
}

export const formatTND = (amount: number) =>
  `${amount.toLocaleString("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`

export const statusBadge = (status: Invoice["status"]) => {
  switch (status) {
    case "Paid":
      return (
        <Badge className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
          Paid
        </Badge>
      )
    case "Partially Paid":
      return (
        <Badge className="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
          Partially Paid
        </Badge>
      )
    case "Sent":
      return (
        <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          Sent
        </Badge>
      )
    case "Overdue":
      return (
        <Badge className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Overdue
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          Draft
        </Badge>
      )
  }
}

export function DataTable({
  invoices,
  activeTab,
  onAddInvoice,
  onConvertToInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onRecordPayment,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [paymentDialogInvoice, setPaymentDialogInvoice] = useState<Invoice | null>(
    null
  )

  const handleDownloadPdf = (inv: Invoice) => {
    // No backend PDF renderer yet — open the printable detail view in a new
    // tab and auto-trigger the browser's print dialog (Save as PDF).
    window.open(`/staff/billing/${inv.id}?print=1`, "_blank")
    toast.info(`Opening printable view for ${inv.number}…`)
  }

  const handleSendEmail = (inv: Invoice) => {
    const patient = patients.find((p) => p.id === inv.patientId)
    const subject = encodeURIComponent(`${inv.type} ${inv.number}`)
    const body = encodeURIComponent(
      `Hello ${inv.patientName},\n\nPlease find your ${inv.type.toLowerCase()} ${inv.number} for ${formatTND(
        inv.total
      )}.\n\nView it here: ${window.location.origin}/staff/billing/${inv.id}\n\nThank you.`
    )
    // No backend mailer yet — opens the user's own mail client prefilled instead.
    window.location.href = `mailto:${patient?.email ?? ""}?subject=${subject}&body=${body}`
    toast.success(`Opening your email client for ${inv.patientName}`)
  }

  const tabFiltered = useMemo(() => {
    switch (activeTab) {
      case "quotes":
        return invoices.filter((inv) => inv.type === "Quote")
      case "invoices":
        return invoices.filter((inv) => inv.type === "Invoice")
      case "unpaid":
        return invoices.filter(
          (inv) => inv.status !== "Paid" && inv.status !== "Draft"
        )
      default:
        return invoices
    }
  }, [invoices, activeTab])

  const columns: ColumnDef<Invoice>[] = [
    {
      id: "number",
      accessorFn: (row) => row.number,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="cursor-pointer px-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Number
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link href={`/staff/billing/${row.original.id}`} className="hover:underline">
          <span className="font-mono text-sm font-medium">
            {row.original.number}
          </span>
        </Link>
      ),
    },
    {
      id: "patient",
      accessorFn: (row) => row.patientName,
      header: "Patient",
      cell: ({ row }) => {
        const inv = row.original
        return (
          <Link
            href={`/staff/patients/${inv.patientId}`}
            className="flex items-center gap-2 hover:underline"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[11px] font-medium">
                {inv.patientAvatar}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{inv.patientName}</span>
          </Link>
        )
      },
    },
    {
      id: "issueDate",
      accessorFn: (row) => row.issueDate,
      header: "Issued",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.issueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "dueDate",
      accessorFn: (row) => row.dueDate,
      header: "Due",
      cell: ({ row }) => {
        const due = row.original.dueDate
        return (
          <span className="text-sm text-muted-foreground">
            {due ? new Date(due).toLocaleDateString() : "—"}
          </span>
        )
      },
    },
    {
      id: "total",
      accessorFn: (row) => row.total,
      header: "Total",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatTND(row.original.total)}
        </span>
      ),
    },
    {
      id: "paidAmount",
      accessorFn: (row) => row.paidAmount,
      header: "Paid",
      cell: ({ row }) => (
        <span className="text-sm">{formatTND(row.original.paidAmount)}</span>
      ),
    },
    {
      id: "balance",
      accessorFn: (row) => row.balance,
      header: "Balance",
      cell: ({ row }) => {
        const balance = row.original.balance
        return (
          <span
            className={
              balance > 0
                ? "text-sm font-semibold text-foreground"
                : "text-sm text-muted-foreground"
            }
          >
            {formatTND(balance)}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: (row, columnId, value) => row.getValue(columnId) === value,
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const inv = row.original
        const canRecordPayment =
          inv.type === "Invoice" && inv.status !== "Paid" && inv.status !== "Draft"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                <ChevronDown className="size-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={`/staff/billing/${inv.id}`}>
                  <Eye className="mr-2 size-4" />
                  View detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleDownloadPdf(inv)}
              >
                <Download className="mr-2 size-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleSendEmail(inv)}
              >
                <Send className="mr-2 size-4" />
                Send by email
              </DropdownMenuItem>
              {inv.type === "Quote" && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => onConvertToInvoice(inv.id)}
                >
                  <Repeat className="mr-2 size-4" />
                  Convert to invoice
                </DropdownMenuItem>
              )}
              {canRecordPayment && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setPaymentDialogInvoice(inv)}
                >
                  <Wallet className="mr-2 size-4" />
                  Record payment
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onDuplicateInvoice(inv.id)}
              >
                <Copy className="mr-2 size-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => onDeleteInvoice(inv.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Cancel / Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: tabFiltered,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const inv = row.original
      return (
        inv.number.toLowerCase().includes(search) ||
        inv.patientName.toLowerCase().includes(search)
      )
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  const statusFilter = table.getColumn("status")?.getFilterValue() as string

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by number or patient..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
          <div className="w-44">
            <Select
              value={statusFilter || ""}
              onValueChange={(value) =>
                table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="cursor-pointer w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <InvoiceFormSheet onAddInvoice={onAddInvoice} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="page-size" className="text-sm font-medium">
            Show
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20 cursor-pointer" id="page-size">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2 hidden sm:block">
            <p className="text-sm font-medium">Page</p>
            <strong className="text-sm">
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </strong>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="cursor-pointer"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <RecordPaymentDialog
        invoice={paymentDialogInvoice}
        open={paymentDialogInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setPaymentDialogInvoice(null)
        }}
        onRecordPayment={(payment) => {
          if (paymentDialogInvoice) {
            onRecordPayment(paymentDialogInvoice.id, payment)
          }
          setPaymentDialogInvoice(null)
        }}
      />
    </div>
  )
}