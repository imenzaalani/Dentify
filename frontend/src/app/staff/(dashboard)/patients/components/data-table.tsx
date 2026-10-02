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
  ArchiveRestore,
  Download,
  Search,
  MailPlus,
  ShieldOff,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useCurrentRole } from "@/lib/rbac"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { patientApi } from "@/lib/api/patients"
import { ApiError, getAssetUrl } from "@/lib/api/client"
import { PatientFormSheet, type PatientFormValues } from "./patient-form-sheet"
import { QuickAppointmentDialog, QuickMessageDialog } from "./quick-action-dialogs"
import {
  type Patient,
  type LifecycleStage,
  getInitials,
  isArchived,
  lifecycleColors,
  lifecycleLabels,
} from "./types"

export type { Patient, LifecycleStage }
export { lifecycleColors, lifecycleLabels }

interface DataTableProps {
  patients: Patient[]
  isLoading?: boolean
  onAddPatient: (patient: PatientFormValues) => void
  onArchiveToggle: (patient: Patient) => void
}

export function DataTable({
  patients,
  isLoading,
  onAddPatient,
  onArchiveToggle,
}: DataTableProps) {
  const currentRole = useCurrentRole()
  const isOwner = currentRole === "owner"

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

  const archivedFilter = (row: Row<Patient>, _columnId: string, value: string) => {
    return (value === "archived") === isArchived(row.original)
  }

  const portalFilter = (row: Row<Patient>, _columnId: string, value: string) => {
    if (value === "all") return true
    return row.original.portal_status === value
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
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
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
              {patient.avatar_url ? (
                <AvatarImage src={getAssetUrl(patient.avatar_url)} alt={`${patient.first_name} ${patient.last_name}`} />
              ) : (
                <AvatarFallback className="text-xs font-medium">
                  {getInitials(patient.first_name, patient.last_name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {patient.first_name} {patient.last_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {patient.patient_number}
              </span>
            </div>
          </Link>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone || "—"}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.email || "—"}
        </span>
      ),
    },
    {
      id: "portalAccount",
      header: "Portal Account",
      filterFn: portalFilter,
      cell: ({ row }) => {
        const status = row.original.portal_status
        if (status === "active") {
          return (
            <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              Active
            </Badge>
          )
        }
        if (status === "pending") {
          return (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400">
              Pending
            </Badge>
          )
        }
        if (status === "revoked") {
          return (
            <Badge variant="outline" className="border-destructive bg-destructive/10 text-destructive">
              Revoked
            </Badge>
          )
        }
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            Not invited
          </Badge>
        )
      },
    },
    {
      accessorKey: "lifecycle_stage",
      header: "Lifecycle",
      filterFn: exactFilter,
      cell: ({ row }) => {
        const stage = row.original.lifecycle_stage
        return (
          <Badge variant="outline" className={lifecycleColors[stage]}>
            {lifecycleLabels[stage]}
          </Badge>
        )
      },
    },
    {
      id: "archiveStatus",
      header: "Status",
      filterFn: archivedFilter,
      cell: ({ row }) =>
        isArchived(row.original) ? (
          <Badge variant="outline" className="text-muted-foreground">
            Archived
          </Badge>
        ) : (
          <Badge className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            Active
          </Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const patient = row.original
        const archived = isArchived(patient)
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" asChild>
              <Link href={`/staff/patients/${patient.id}`}>
                <Eye className="size-4" />
                <span className="sr-only">View record</span>
              </Link>
            </Button>
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
                {patient.portal_status === "not_invited" && patient.email && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await patientApi.invitePatient(patient.id)
                        toast.success(`Portal invite sent to ${patient.email}`)
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : "Couldn't send the invite")
                      }
                    }}
                  >
                    <MailPlus className="mr-2 size-4" />
                    Invite to portal
                  </DropdownMenuItem>
                )}
                {patient.portal_status === "pending" && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await patientApi.resendPatientInvite(patient.id)
                        toast.success(`Invite resent to ${patient.email}`)
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : "Couldn't resend the invite")
                      }
                    }}
                  >
                    <MailPlus className="mr-2 size-4" />
                    Resend invite
                  </DropdownMenuItem>
                )}
                {patient.portal_status === "active" && isOwner && (
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={async () => {
                      try {
                        await patientApi.revokePortalAccess(patient.id)
                        toast.success(`Portal access revoked for ${patient.first_name} ${patient.last_name}`)
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : "Couldn't revoke portal access")
                      }
                    }}
                  >
                    <ShieldOff className="mr-2 size-4" />
                    Revoke portal access
                  </DropdownMenuItem>
                )}
                {patient.portal_status === "revoked" && isOwner && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await patientApi.restorePortalAccess(patient.id)
                        toast.success(`Portal access restored for ${patient.first_name} ${patient.last_name}`)
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : "Couldn't restore portal access")
                      }
                    }}
                  >
                    <ShieldCheck className="mr-2 size-4" />
                    Restore portal access
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onArchiveToggle(patient)}
                >
                  {archived ? (
                    <ArchiveRestore className="mr-2 size-4" />
                  ) : (
                    <Archive className="mr-2 size-4" />
                  )}
                  {archived ? "Unarchive" : "Archive"}
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
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(search) ||
        patient.patient_number.toLowerCase().includes(search) ||
        (patient.phone ?? "").toLowerCase().includes(search) ||
        (patient.email ?? "").toLowerCase().includes(search)
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

  const lifecycleFilterValue = table
    .getColumn("lifecycle_stage")
    ?.getFilterValue() as string
  const archiveFilterValue = table
    .getColumn("archiveStatus")
    ?.getFilterValue() as string
  const portalFilterValue = table
    .getColumn("portalAccount")
    ?.getFilterValue() as string

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  const handleBulkArchive = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    selectedRows.forEach((row) => onArchiveToggle(row.original))
    setRowSelection({})
  }

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original)
    const header = ["First name", "Last name", "Patient #", "Phone", "Email", "Lifecycle", "Status"]
    const csvRows = rows.map((p) =>
      [
        p.first_name,
        p.last_name,
        p.patient_number,
        p.phone ?? "",
        p.email ?? "",
        p.lifecycle_stage,
        isArchived(p) ? "Archived" : "Active",
      ]
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
              placeholder="Search by name, patient #, phone or email..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <Button variant="outline" className="cursor-pointer" onClick={handleBulkArchive}>
              <Archive className="mr-2 size-4" />
              Archive/Unarchive ({selectedCount})
            </Button>
          )}
          <Button variant="outline" className="cursor-pointer" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <PatientFormSheet onAddPatient={onAddPatient} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="lifecycle-filter" className="text-sm font-medium">
            Lifecycle
          </Label>
          <Select
            value={lifecycleFilterValue || ""}
            onValueChange={(value) =>
              table.getColumn("lifecycle_stage")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="lifecycle-filter">
              <SelectValue placeholder="All Lifecycle Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lifecycle Stages</SelectItem>
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
            value={archiveFilterValue || ""}
            onValueChange={(value) =>
              table.getColumn("archiveStatus")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="portal-filter" className="text-sm font-medium">
            Portal Account
          </Label>
          <Select
            value={portalFilterValue || ""}
            onValueChange={(value) =>
              table.getColumn("portalAccount")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="portal-filter">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="not_invited">Not invited</SelectItem>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Loading patients...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
          patientId={apptDialogPatient.id}
          patientName={`${apptDialogPatient.first_name} ${apptDialogPatient.last_name}`}
        />
      )}
      {msgDialogPatient && (
        <QuickMessageDialog
          open={!!msgDialogPatient}
          onOpenChange={(open) => !open && setMsgDialogPatient(null)}
          patientName={`${msgDialogPatient.first_name} ${msgDialogPatient.last_name}`}
        />
      )}
    </div>
  )
}