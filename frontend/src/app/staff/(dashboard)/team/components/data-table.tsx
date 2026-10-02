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
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
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

import { StaffFormSheet, type StaffFormValues } from "./staff-form-sheet"

export interface WorkingHourEntry {
  day: string
  start?: string
  end?: string
  off: boolean
}

export type StaffRole = "dentist" | "receptionist"

export interface TeamMember {
  id: string
  role: StaffRole
  firstName: string
  lastName: string
  avatar: string
  avatarUrl?: string | null
  email: string
  phone?: string | null
  // Dentist-only fields
  specialty?: string
  licenseNumber?: string
  bio?: string
  color?: string
  workingHours?: WorkingHourEntry[]
  // Receptionist-only field
  notes?: string
  status: "Active" | "Inactive"
  createdAt: string
  lastLogin?: string
  isVerified: boolean
}

interface DataTableProps {
  members: TeamMember[]
  isLoading?: boolean
  // Which tab is active. Drives which columns/filters actually add value —
  // e.g. a "Role" column is just noise once the tabs have already narrowed
  // the list to a single role.
  scope: "all" | "dentist" | "receptionist"
  onAddMember: (values: StaffFormValues) => void
  onEditMember: (id: string, values: StaffFormValues) => void
  onDeleteMember: (id: string) => void
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
  members,
  isLoading = false,
  scope,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onToggleStatus,
}: DataTableProps) {
  const showRoleColumn = scope === "all"
  const showSpecialtyColumn = scope !== "receptionist"
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }

  const exactFilter = (row: Row<TeamMember>, columnId: string, value: string) =>
    row.getValue(columnId) === value

  const openEdit = (member: TeamMember) => {
    setEditingMember(member)
    setEditSheetOpen(true)
  }

  const handleEditSubmit = (values: StaffFormValues) => {
    if (editingMember) {
      onEditMember(editingMember.id, values)
    }
  }

  const displayName = (member: TeamMember) =>
    member.role === "dentist"
      ? `Dr. ${member.firstName} ${member.lastName}`
      : `${member.firstName} ${member.lastName}`

  const columns: ColumnDef<TeamMember>[] = [
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
      header: "Name",
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-1 ring-border">
              {member.avatarUrl ? (
                <AvatarImage src={member.avatarUrl} alt={displayName(member)} />
              ) : (
                <AvatarFallback
                  className="text-xs font-medium text-white"
                  style={{ backgroundColor: member.color ?? "#64748b" }}
                >
                  {member.avatar}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium leading-tight">{displayName(member)}</span>
              <span className="text-sm text-muted-foreground leading-tight">{member.email}</span>
            </div>
          </div>
        )
      },
    },
    ...(showRoleColumn
      ? [
          {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }: { row: Row<TeamMember> }) => {
              const role = row.getValue("role") as StaffRole
              return (
                <Badge
                  variant="secondary"
                  className={
                    role === "dentist"
                      ? "font-normal text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
                      : "font-normal text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20"
                  }
                >
                  {role === "dentist" ? "Doctor" : "Receptionist"}
                </Badge>
              )
            },
          } satisfies ColumnDef<TeamMember>,
        ]
      : []),
    ...(showSpecialtyColumn
      ? [
          {
            accessorKey: "specialty",
            header: "Specialty",
            cell: ({ row }: { row: Row<TeamMember> }) => {
              const specialty = row.getValue("specialty") as string | undefined
              return specialty ? (
                <Badge variant="secondary" className="font-normal">
                  {specialty}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )
            },
            filterFn: exactFilter,
          } satisfies ColumnDef<TeamMember>,
        ]
      : []),
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">{(row.getValue("phone") as string) || "—"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("createdAt")}</span>
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
        const member = row.original
        return (
          <div className="flex items-center gap-2">
            {member.role === "dentist" ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" asChild>
                <Link href={`/staff/doctors/${member.id}`}>
                  <Eye className="size-4" />
                  <span className="sr-only">View profile</span>
                </Link>
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => openEdit(member)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <EllipsisVertical className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!member.isVerified && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await authApi.staff.resendInvite(member.id)
                        toast.success(`Invite resent to ${member.email}`)
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
                    toast.success(`Password reset email sent to ${member.email}`)
                  }
                >
                  <KeyRound className="mr-2 size-4" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    onToggleStatus(member.id)
                    toast.success(
                      member.status === "Active"
                        ? `${displayName(member)} deactivated`
                        : `${displayName(member)} activated`
                    )
                  }}
                >
                  {member.status === "Active" ? (
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
                  onClick={() => setDeletingMember(member)}
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
    data: members,
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
      toast.info("No staff to export")
      return
    }

    const headers = [
      "First Name",
      "Last Name",
      "Role",
      "Email",
      "Phone",
      "Specialty",
      "License Number",
      "Status",
      "Joined",
    ]
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const lines = [
      headers.join(","),
      ...rows.map((m) =>
        [
          m.firstName,
          m.lastName,
          m.role,
          m.email,
          m.phone ?? "",
          m.specialty ?? "",
          m.licenseNumber ?? "",
          m.status,
          m.createdAt,
        ]
          .map((value) => escape(String(value)))
          .join(",")
      ),
    ]

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `staff-export-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success(`Exported ${rows.length} staff member${rows.length > 1 ? "s" : ""}`)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="cursor-pointer" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <StaffFormSheet mode="create" onSubmitStaff={onAddMember} />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2.5">
          {showSpecialtyColumn ? (
            <Select
              value={specialtyFilter || "all"}
              onValueChange={(value) =>
                table.getColumn("specialty")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="cursor-pointer h-8 w-auto min-w-36 border-none bg-background shadow-none text-sm">
                <SelectValue placeholder="Specialty" />
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
          ) : null}
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer h-8 w-auto min-w-32 border-none bg-background shadow-none text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {(specialtyFilter || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer h-8 px-2 text-sm text-muted-foreground"
              onClick={() => {
                table.getColumn("specialty")?.setFilterValue("")
                table.getColumn("status")?.setFilterValue("")
              }}
            >
              Clear filters
            </Button>
          )}

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild id="column-visibility">
                <Button variant="ghost" size="sm" className="cursor-pointer h-8 text-sm">
                  Columns <ChevronDown className="ml-1.5 size-3.5" />
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

        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                  {columns.map((column, colIndex) => (
                    <TableCell key={`${column.id ?? colIndex}`}>
                      {colIndex === 1 ? (
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      ) : (
                        <Skeleton className="h-4 w-16" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-60 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <UsersRound className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">
                      {globalFilter || statusFilter || specialtyFilter
                        ? "No staff match your filters"
                        : "No staff yet"}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {globalFilter || statusFilter || specialtyFilter
                        ? "Try adjusting your search or filters."
                        : "Add a doctor or receptionist to get your team started."}
                    </p>
                  </div>
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

      {/* Edit sheet — controlled, reopens with the selected member's data */}
      <StaffFormSheet
        mode="edit"
        member={editingMember ?? undefined}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        onSubmitStaff={handleEditSubmit}
      />

      {/* Delete confirmation — no AlertDialog in the component library, so this uses Dialog */}
      <Dialog
        open={deletingMember !== null}
        onOpenChange={(open) => !open && setDeletingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete staff account?</DialogTitle>
            <DialogDescription>
              {deletingMember && (
                <>
                  This will permanently remove {displayName(deletingMember)}&apos;s account
                  {deletingMember.role === "dentist" ? ", including their schedule," : ""}{" "}
                  and login access. This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeletingMember(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer border border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:border-red-400 dark:hover:bg-red-400"
              onClick={() => {
                if (deletingMember) {
                  onDeleteMember(deletingMember.id)
                  toast.success(`${displayName(deletingMember)} was removed`)
                  setDeletingMember(null)
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