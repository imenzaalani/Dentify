"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Row,
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
  MessageSquare,
  UserCheck,
  Archive,
  Download,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LeadFormSheet, type LeadFormValues } from "./lead-form-sheet"
import { LeadDetailsSheet } from "./lead-details-sheet"
import { ContactLeadDialog, ConvertToPatientDialog } from "./quick-action-dialogs"
import {
  type Lead,
  type LeadStatus,
  getInitials,
  statusColors,
  statusLabels,
} from "./types"

export type { Lead, LeadStatus }
export { statusColors, statusLabels }

// "converted" is deliberately excluded — it's never set via a plain status
// change, only through the dedicated convert flow (see the Select cell and
// the "Convert to patient" menu item below, both of which go through
// onConvertToPatient instead).
type ManualStatus = Exclude<LeadStatus, "converted">

interface DataTableProps {
  leads: Lead[]
  onAddLead: (lead: LeadFormValues) => void
  onChangeStatus: (id: string, status: ManualStatus) => void
  onConvertToPatient: (id: string) => Promise<void>
}

export function DataTable({
  leads,
  onAddLead,
  onChangeStatus,
  onConvertToPatient,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null)
  const [contactLead, setContactLead] = useState<Lead | null>(null)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)

  const exactFilter = (row: Row<Lead>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }

  const columns: ColumnDef<Lead>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      id: "name",
      accessorFn: (row) => `${row.patient_first_name} ${row.patient_last_name}`,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="cursor-pointer px-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Lead
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const lead = row.original
        return (
          <button
            onClick={() => setDetailsLead(lead)}
            className="flex items-center gap-3 hover:underline cursor-pointer text-left"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-medium">
                {getInitials(lead.patient_first_name, lead.patient_last_name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {lead.patient_first_name} {lead.patient_last_name}
            </span>
          </button>
        )
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div className="flex flex-col">
            <span className="text-sm">{lead.contact_phone}</span>
            <span className="text-xs text-muted-foreground">
              {lead.contact_email}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "requested_service",
      header: "Requested Service",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("requested_service")}</span>
      ),
    },
    {
      id: "requested_datetime",
      accessorFn: (row) => row.requested_datetime,
      header: "Requested For",
      cell: ({ row }) => {
        const value = row.original.requested_datetime
        const date = new Date(value)
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {date.toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "source",
      header: "Source",
      filterFn: exactFilter,
      cell: ({ row }) => {
        const source = row.getValue("source") as string
        return <Badge variant="outline" className="capitalize">{source.replace(/_/g, " ")}</Badge>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: exactFilter,
      cell: ({ row }) => {
        const lead = row.original
        return (
          <Select
            value={lead.status}
            onValueChange={(value) => {
              // Picking "Converted" from this dropdown can't just PATCH the
              // status — it needs to create the patient record too, and it
              // needs the user to confirm what they're doing. Route it
              // through the same confirm dialog as the "Convert to patient"
              // menu action instead of changing anything here.
              if (value === "converted") {
                setConvertLead(lead)
                return
              }
              onChangeStatus(lead.id, value as ManualStatus)
            }}
          >
            <SelectTrigger
              className={`h-7 w-[130px] cursor-pointer text-xs ${statusColors[lead.status]}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="no_response">No response</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: "created_at",
      accessorFn: (row) => row.created_at,
      header: "Received",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const lead = row.original
        const isClosed = lead.status === "converted" || lead.status === "rejected"
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => setDetailsLead(lead)}
            >
              <Eye className="size-4" />
              <span className="sr-only">View details</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <ChevronDown className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setDetailsLead(lead)}
                >
                  <Eye className="mr-2 size-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setContactLead(lead)}
                >
                  <MessageSquare className="mr-2 size-4" />
                  Contact lead
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={isClosed}
                  onClick={() => setConvertLead(lead)}
                >
                  <UserCheck className="mr-2 size-4" />
                  Convert to patient
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  disabled={lead.status === "rejected"}
                  onClick={() => onChangeStatus(lead.id, "rejected")}
                >
                  <Archive className="mr-2 size-4" />
                  Mark as rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: leads,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const lead = row.original
      return (
        `${lead.patient_first_name} ${lead.patient_last_name}`
          .toLowerCase()
          .includes(search) ||
        lead.contact_phone.toLowerCase().includes(search) ||
        lead.contact_email.toLowerCase().includes(search) ||
        lead.requested_service.toLowerCase().includes(search)
      )
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const statusFilterValue = table.getColumn("status")?.getFilterValue() as string
  const sourceFilterValue = table.getColumn("source")?.getFilterValue() as string

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  const handleBulkReject = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    selectedRows.forEach((row) => onChangeStatus(row.original.id, "rejected"))
    setRowSelection({})
    toast.success(`${selectedRows.length} lead(s) marked as rejected`)
  }

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original)
    const header = [
      "First name",
      "Last name",
      "Phone",
      "Email",
      "Requested service",
      "Source",
      "Status",
      "Received",
    ]
    const csvRows = rows.map((l) =>
      [
        l.patient_first_name,
        l.patient_last_name,
        l.contact_phone,
        l.contact_email,
        l.requested_service,
        l.source,
        statusLabels[l.status],
        l.created_at,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = [header.join(","), ...csvRows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leads.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Lead list exported")
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email or service..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <Button variant="outline" className="cursor-pointer" onClick={handleBulkReject}>
              <Archive className="mr-2 size-4" />
              Mark rejected ({selectedCount})
            </Button>
          )}
          <Button variant="outline" className="cursor-pointer" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <LeadFormSheet onAddLead={onAddLead} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={statusFilterValue || ""}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="no_response">No response</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source-filter" className="text-sm font-medium">
            Source
          </Label>
          <Select
            value={sourceFilterValue || ""}
            onValueChange={(value) =>
              table.getColumn("source")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="source-filter">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="online_form">Online form</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="walk_in">Walk-in</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2 lg:col-span-1 lg:col-start-4">
          <Label htmlFor="column-visibility" className="text-sm font-medium">
            Column Visibility
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild id="column-visibility">
              <Button variant="outline" className="cursor-pointer w-full">
                Columns <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                  No leads found.
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
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
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

      {detailsLead && (
        <LeadDetailsSheet
          lead={detailsLead}
          open={!!detailsLead}
          onOpenChange={(open) => !open && setDetailsLead(null)}
          onContact={() => {
            setContactLead(detailsLead)
            setDetailsLead(null)
          }}
          onConvert={() => {
            setConvertLead(detailsLead)
            setDetailsLead(null)
          }}
        />
      )}
      {contactLead && (
        <ContactLeadDialog
          open={!!contactLead}
          onOpenChange={(open) => !open && setContactLead(null)}
          leadName={`${contactLead.patient_first_name} ${contactLead.patient_last_name}`}
          onSent={() => {}}
        />
      )}
      {convertLead && (
        <ConvertToPatientDialog
          open={!!convertLead}
          onOpenChange={(open) => !open && setConvertLead(null)}
          lead={convertLead}
          onConfirm={() => onConvertToPatient(convertLead.id)}
        />
      )}
    </div>
  )
}