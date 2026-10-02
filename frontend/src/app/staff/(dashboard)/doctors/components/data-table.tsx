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
  ChevronDown,
  EllipsisVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  Search,
  KeyRound,
  Ban,
  CircleCheck,
  MailPlus,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"

import { DoctorFormSheet, type DoctorFormValues } from "./doctor-form-sheet"

export interface WorkingHourEntry {
  day: string
  start?: string
  end?: string
  off: boolean
}

export interface Doctor {
  id: string
  firstName: string
  lastName: string
  avatar: string
  avatarUrl?: string | null
  email: string
  phone?: string | null
  specialty: string
  licenseNumber: string
  bio?: string
  color: string
  workingHours: WorkingHourEntry[]
  status: "Active" | "Inactive"
  createdAt: string
  lastLogin?: string
  isVerified: boolean
}

interface DataTableProps {
  doctors: Doctor[]
  isLoading?: boolean
  onAddDoctor: (values: DoctorFormValues) => void
  onEditDoctor: (id: string, values: DoctorFormValues) => void
  onDeleteDoctor: (id: string) => void
  onToggleStatus: (id: string) => void
}

const SPECIALTY_OPTIONS = [
  "Généraliste",
  "Orthodontiste",
  "Implantologue",
  "Pédodontiste",
  "Endodontiste",
  "Parodontologue",
  "Prothésiste",
  "Chirurgien-dentiste",
]

export function DataTable({
  doctors,
  isLoading = false,
  onAddDoctor,
  onEditDoctor,
  onDeleteDoctor,
  onToggleStatus,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      case "Inactive":
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }

  const exactFilter = (row: Row<Doctor>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }

  const openEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setEditSheetOpen(true)
  }

  const handleEditSubmit = (values: DoctorFormValues) => {
    if (editingDoctor) {
      onEditDoctor(editingDoctor.id, values)
    }
  }

  const columns: ColumnDef<Doctor>[] = [
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
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "name",
      header: "Doctor",
      cell: ({ row }) => {
        const doctor = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {doctor.avatarUrl ? (
                <AvatarImage src={doctor.avatarUrl} alt={`${doctor.firstName} ${doctor.lastName}`} />
              ) : (
                <AvatarFallback
                  className="text-xs font-medium text-white"
                  style={{ backgroundColor: doctor.color }}
                >
                  {doctor.avatar}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                Dr. {doctor.firstName} {doctor.lastName}
              </span>
              <span className="text-sm text-muted-foreground">{doctor.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "specialty",
      header: "Specialty",
      cell: ({ row }) => {
        const specialty = row.getValue("specialty") as string
        return (
          <Badge variant="secondary" className="font-normal">
            {specialty}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      accessorKey: "licenseNumber",
      header: "License #",
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.getValue("licenseNumber")}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("createdAt")}
        </span>
      ),
    },
    {
      accessorKey: "lastLogin",
      header: "Last login",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {(row.getValue("lastLogin") as string) || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={getStatusColor(status)}>
            {status}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const doctor = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              asChild
            >
              <Link href={`/staff/doctors/${doctor.id}`}>
                <Eye className="size-4" />
                <span className="sr-only">View profile</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => openEdit(doctor)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit doctor</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <EllipsisVertical className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!doctor.isVerified && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await authApi.staff.resendInvite(doctor.id)
                        toast.success(`Invite resent to ${doctor.email}`)
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : "Couldn't resend the invite")
                      }
                    }}
                  >
                    <MailPlus className="mr-2 size-4" />
                    Resend Invite
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() =>
                    toast.success(`Password reset email sent to ${doctor.email}`)
                  }
                >
                  <KeyRound className="mr-2 size-4" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    onToggleStatus(doctor.id)
                    toast.success(
                      doctor.status === "Active"
                        ? `Dr. ${doctor.lastName} deactivated`
                        : `Dr. ${doctor.lastName} activated`
                    )
                  }}
                >
                  {doctor.status === "Active" ? (
                    <>
                      <Ban className="mr-2 size-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CircleCheck className="mr-2 size-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => setDeletingDoctor(doctor)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: doctors,
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const specialtyFilter = table.getColumn("specialty")?.getFilterValue() as string
  const statusFilter = table.getColumn("status")?.getFilterValue() as string

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original)
    if (rows.length === 0) {
      toast.info("No doctors to export")
      return
    }

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Specialty",
      "License Number",
      "Status",
      "Joined",
      "Last Login",
    ]
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const lines = [
      headers.join(","),
      ...rows.map((d) =>
        [
          d.firstName,
          d.lastName,
          d.email,
          d.specialty,
          d.licenseNumber,
          d.status,
          d.createdAt,
          d.lastLogin ?? "",
        ]
          .map((value) => escape(String(value)))
          .join(",")
      ),
    ]

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `doctors-export-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success(`Exported ${rows.length} doctor${rows.length > 1 ? "s" : ""}`)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search doctors..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handleExport}
          >
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <DoctorFormSheet mode="create" onSubmitDoctor={onAddDoctor} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialty-filter" className="text-sm font-medium">
            Specialty
          </Label>
          <Select
            value={specialtyFilter || ""}
            onValueChange={(value) =>
              table.getColumn("specialty")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="specialty-filter">
              <SelectValue placeholder="Select Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {SPECIALTY_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
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
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading doctors...
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
                  No results.
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
              {[10, 20, 30, 40, 50].map((pageSize) => (
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
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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

      {/* Edit sheet — controlled, reopens with the selected doctor's data */}
      <DoctorFormSheet
        mode="edit"
        doctor={editingDoctor ?? undefined}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        onSubmitDoctor={handleEditSubmit}
      />

      {/* Delete confirmation — no AlertDialog in the component library, so this uses Dialog */}
      <Dialog
        open={deletingDoctor !== null}
        onOpenChange={(open) => !open && setDeletingDoctor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete doctor account?</DialogTitle>
            <DialogDescription>
              {deletingDoctor && (
                <>
                  This will permanently remove Dr. {deletingDoctor.firstName}{" "}
                  {deletingDoctor.lastName}&apos;s account, including their schedule
                  and login access. This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeletingDoctor(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer border border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:border-red-400 dark:hover:bg-red-400"
              onClick={() => {
                if (deletingDoctor) {
                  onDeleteDoctor(deletingDoctor.id)
                  toast.success(
                    `Dr. ${deletingDoctor.firstName} ${deletingDoctor.lastName} was removed`
                  )
                  setDeletingDoctor(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
