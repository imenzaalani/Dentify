"use client"

import { useState } from "react"
import Link from "next/link"
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
  CalendarPlus,
  MessageSquare,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PatientFormSheet, type PatientFormValues } from "./patient-form-sheet"
import { QuickAppointmentDialog, QuickMessageDialog } from "./quick-action-dialogs"

export interface Patient {
  id: number
  firstName: string
  lastName: string
  avatar: string
  phone: string
  phoneSecondary?: string
  email: string
  address?: string
  dob: string
  gender: string
  bloodType?: string
  allergies?: string[]
  chronicConditions?: string
  currentMedications?: string
  medicalHistory?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  lastAppointment: string | null
  nextAppointment: { date: string; type: string } | null
  activeTreatment: { active: boolean; name?: string }
  accountStatus: "active" | "no_account"
  status: "Active" | "Archived" // drives the archive/unarchive toggle in the UI
  // Full patient lifecycle per architecture v2.0 — richer than the Active/Archived
  // toggle above, which only tracks whether the record is archived from the list.
  patientStatus: "lead" | "new" | "active" | "recall" | "inactive" | "archived"
  preferredChannel?: "whatsapp" | "email" | "sms"
  createdAt: string
}

interface DataTableProps {
  patients: Patient[]
  onAddPatient: (patient: PatientFormValues) => void
  onArchivePatient: (id: number) => void
  onChangePatientStatus: (id: number, patientStatus: Patient["patientStatus"]) => void
  onCreateAppointment: (
    patientId: number,
    appointment: { date: string; type: string }
  ) => void
}

const daysSince = (dateStr: string | null) => {
  if (!dateStr) return Infinity
  const diffMs = new Date().getTime() - new Date(dateStr).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

const lastAppointmentBucket = (dateStr: string | null) => {
  if (!dateStr) return "never"
  const days = daysSince(dateStr)
  if (days < 30) return "lt30"
  if (days <= 90) return "30to90"
  return "gt90"
}

export const lifecycleColors: Record<Patient["patientStatus"], string> = {
  lead: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-400",
  new: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-400",
  active: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400",
  recall: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/40 dark:bg-purple-900/20 dark:text-purple-400",
  inactive: "border-muted bg-muted text-muted-foreground",
  archived: "border-muted bg-muted text-muted-foreground",
}

export function DataTable({
  patients,
  onAddPatient,
  onArchivePatient,
  onChangePatientStatus,
  onCreateAppointment,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [apptDialogPatient, setApptDialogPatient] = useState<Patient | null>(null)
  const [msgDialogPatient, setMsgDialogPatient] = useState<Patient | null>(null)

  const exactFilter = (row: Row<Patient>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }

  const lastApptFilter = (row: Row<Patient>, _columnId: string, value: string) => {
    return lastAppointmentBucket(row.original.lastAppointment) === value
  }

  const treatmentFilter = (row: Row<Patient>, _columnId: string, value: string) => {
    const active = row.original.activeTreatment.active
    return value === "yes" ? active : !active
  }

  const columns: ColumnDef<Patient>[] = [
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
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="cursor-pointer px-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Patient
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const patient = row.original
        return (
          <Link
            href={`/staff/patients/${patient.id}`}
            className="flex items-center gap-3 hover:underline"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-medium">
                {patient.avatar}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {patient.firstName} {patient.lastName}
            </span>
          </Link>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("phone")}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("email")}
        </span>
      ),
    },
    {
      id: "lastAppointment",
      accessorFn: (row) => row.lastAppointment,
      header: "Last Appointment",
      filterFn: lastApptFilter,
      cell: ({ row }) => {
        const date = row.original.lastAppointment
        return (
          <span className="text-sm">
            {date ? new Date(date).toLocaleDateString() : "—"}
          </span>
        )
      },
    },
    {
      id: "nextAppointment",
      header: "Next Appointment",
      cell: ({ row }) => {
        const next = row.original.nextAppointment
        if (!next) {
          return <span className="text-sm text-muted-foreground">None</span>
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {new Date(next.date).toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground">{next.type}</span>
          </div>
        )
      },
    },
    {
      id: "activeTreatment",
      header: "Active Treatment",
      filterFn: treatmentFilter,
      cell: ({ row }) => {
        const treatment = row.original.activeTreatment
        if (!treatment.active) {
          return (
            <Badge variant="secondary" className="text-muted-foreground">
              No
            </Badge>
          )
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                Yes
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{treatment.name}</TooltipContent>
          </Tooltip>
        )
      },
    },
    {
      accessorKey: "accountStatus",
      header: "Patient Account",
      filterFn: exactFilter,
      cell: ({ row }) => {
        const status = row.getValue("accountStatus") as string
        return status === "active" ? (
          <Badge className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-muted-foreground">
            No Account
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: exactFilter,
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return status === "Active" ? (
          <Badge className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Archived
          </Badge>
        )
      },
    },
    {
      accessorKey: "patientStatus",
      header: "Lifecycle",
      filterFn: exactFilter,
      cell: ({ row }) => {
        const patient = row.original
        return (
          <Select
            value={patient.patientStatus}
            onValueChange={(value) =>
              onChangePatientStatus(patient.id, value as Patient["patientStatus"])
            }
          >
            <SelectTrigger
              className={`h-7 w-[110px] cursor-pointer text-xs ${lifecycleColors[patient.patientStatus]}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="recall">Recall</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const patient = row.original
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" asChild>
                  <Link href={`/staff/patients/${patient.id}`}>
                    <Eye className="size-4" />
                    <span className="sr-only">View record</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View record</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <ChevronDown className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/staff/patients/${patient.id}`}>
                    <Eye className="mr-2 size-4" />
                    View record
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setApptDialogPatient(patient)}
                >
                  <CalendarPlus className="mr-2 size-4" />
                  New appointment
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setMsgDialogPatient(patient)}
                >
                  <MessageSquare className="mr-2 size-4" />
                  Send message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onArchivePatient(patient.id)}
                >
                  <Archive className="mr-2 size-4" />
                  {patient.status === "Active" ? "Archive" : "Unarchive"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: patients,
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
      const patient = row.original
      return (
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(search) ||
        patient.phone.toLowerCase().includes(search) ||
        patient.email.toLowerCase().includes(search)
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

  const statusFilter = table.getColumn("status")?.getFilterValue() as string
  const treatmentFilterValue = table
    .getColumn("activeTreatment")
    ?.getFilterValue() as string
  const lastApptFilterValue = table
    .getColumn("lastAppointment")
    ?.getFilterValue() as string
  const lifecycleFilterValue = table
    .getColumn("patientStatus")
    ?.getFilterValue() as string

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  const handleBulkArchive = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    selectedRows.forEach((row) => onArchivePatient(row.original.id))
    setRowSelection({})
    toast.success(`${selectedRows.length} patient(s) archived`)
  }

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original)
    const header = [
      "First name",
      "Last name",
      "Phone",
      "Email",
      "Last appointment",
      "Status",
    ]
    const csvRows = rows.map((p) =>
      [p.firstName, p.lastName, p.phone, p.email, p.lastAppointment ?? "", p.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = [header.join(","), ...csvRows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "patients.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Patient list exported")
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone or email..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleBulkArchive}
            >
              <Archive className="mr-2 size-4" />
              Archive ({selectedCount})
            </Button>
          )}
          <Button variant="outline" className="cursor-pointer" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <PatientFormSheet onAddPatient={onAddPatient} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="lifecycle-filter" className="text-sm font-medium">
            Lifecycle
          </Label>
          <Select
            value={lifecycleFilterValue || ""}
            onValueChange={(value) =>
              table.getColumn("patientStatus")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="lifecycle-filter">
              <SelectValue placeholder="All Lifecycle Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lifecycle Stages</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="recall">Recall</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={statusFilter || ""}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="treatment-filter" className="text-sm font-medium">
            Active Treatment
          </Label>
          <Select
            value={treatmentFilterValue || ""}
            onValueChange={(value) =>
              table
                .getColumn("activeTreatment")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="treatment-filter">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-appt-filter" className="text-sm font-medium">
            Last Appointment
          </Label>
          <Select
            value={lastApptFilterValue || ""}
            onValueChange={(value) =>
              table
                .getColumn("lastAppointment")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="last-appt-filter">
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              <SelectItem value="lt30">Less than 30 days</SelectItem>
              <SelectItem value="30to90">30 to 90 days</SelectItem>
              <SelectItem value="gt90">More than 90 days</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
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
                  No patients found.
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

      {apptDialogPatient && (
        <QuickAppointmentDialog
          open={!!apptDialogPatient}
          onOpenChange={(open) => !open && setApptDialogPatient(null)}
          patientName={`${apptDialogPatient.firstName} ${apptDialogPatient.lastName}`}
          onCreate={(data) => onCreateAppointment(apptDialogPatient.id, data)}
        />
      )}
      {msgDialogPatient && (
        <QuickMessageDialog
          open={!!msgDialogPatient}
          onOpenChange={(open) => !open && setMsgDialogPatient(null)}
          patientName={`${msgDialogPatient.firstName} ${msgDialogPatient.lastName}`}
        />
      )}
    </div>
  )
}