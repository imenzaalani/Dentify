"use client"

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  MoreHorizontal,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  Menu,
  Printer,
  CalendarCheck,
  ListTodo,
} from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { type Appointment, type CareType, type Patient, type WaitlistEntry, statusColors, statusLabels } from "../types"
import { WaitlistPanel } from "./waitlist-panel"

interface PlanningMainProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onMenuClick?: () => void
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
  onCheckIn?: (appointmentId: number) => void
  waitlistEntries: WaitlistEntry[]
  careTypes: CareType[]
  patients: Patient[]
  onAddToWaitlist: (entry: Omit<WaitlistEntry, "id" | "createdAt" | "status">) => void
  onMarkWaitlistContacted: (id: string) => void
  onScheduleFromWaitlist: (entry: WaitlistEntry) => void
  onRemoveFromWaitlist: (id: string) => void
}

export function PlanningMain({
  selectedDate,
  onDateSelect,
  onMenuClick,
  appointments,
  onAppointmentClick,
  onCheckIn,
  waitlistEntries,
  careTypes,
  patients,
  onAddToWaitlist,
  onMarkWaitlistContacted,
  onScheduleFromWaitlist,
  onRemoveFromWaitlist,
}: PlanningMainProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [viewMode, setViewMode] = useState<"month" | "list" | "waitlist">("month")
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments
    const q = searchQuery.toLowerCase()
    return appointments.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.dentistName.toLowerCase().includes(q) ||
        a.careLabel.toLowerCase().includes(q)
    )
  }, [appointments, searchQuery])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())

  const calendarEnd = new Date(monthEnd)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()))

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getAppointmentsForDay = (date: Date) => {
    return filteredAppointments.filter((a) => isSameDay(a.date, date))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment)
    } else {
      setSelectedAppointment(appointment)
      setShowDetailDialog(true)
    }
  }

  const renderCalendarGrid = () => {
    const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

    return (
      <div className="flex-1 bg-background">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((day) => {
            const dayAppointments = getAppointmentsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors",
                  isCurrentMonth ? "bg-background hover:bg-accent/50" : "bg-muted/30 text-muted-foreground",
                  isSelected && "ring-2 ring-primary ring-inset",
                  isDayToday && "bg-accent/20"
                )}
                onClick={() => onDateSelect?.(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isDayToday && "bg-primary text-primary-foreground rounded-md w-6 h-6 flex items-center justify-center text-xs"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayAppointments.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{dayAppointments.length - 2}</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "text-xs p-1 rounded-sm text-white cursor-pointer truncate",
                        appointment.color
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAppointmentClick(appointment)
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{appointment.time} · {appointment.patientName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const upcoming = filteredAppointments
      .filter((a) => a.date >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return (
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {upcoming.map((appointment) => (
            <Card
              key={appointment.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleAppointmentClick(appointment)}
            >
              <CardContent className="px-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn("w-3 h-3 rounded-full mt-1.5 shrink-0", appointment.color)} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{appointment.patientName}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {format(appointment.date, "d MMM yyyy", { locale: fr })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appointment.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Stethoscope className="w-4 h-4" />
                          {appointment.dentistName}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className={cn("text-white", statusColors[appointment.status])}>
                      {statusLabels[appointment.status]}
                    </Badge>
                    {(appointment.status === "pending" || appointment.status === "confirmed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCheckIn?.(appointment.id)
                        }}
                      >
                        <CalendarCheck className="w-4 h-4" />
                        Arrivé
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aucun rendez-vous à venir pour cette recherche.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col flex-wrap gap-4 p-6 border-b md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" size="sm" className="xl:hidden cursor-pointer" onClick={onMenuClick}>
            <Menu className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="cursor-pointer">
              Aujourd'hui
            </Button>
          </div>

          <h1 className="text-2xl font-semibold capitalize">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h1>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un patient, un praticien..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Mode Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                {viewMode === "month" && <Grid3X3 className="w-4 h-4 mr-2" />}
                {viewMode === "list" && <List className="w-4 h-4 mr-2" />}
                {viewMode === "waitlist" && <ListTodo className="w-4 h-4 mr-2" />}
                {viewMode === "month" ? "Mois" : viewMode === "list" ? "Liste" : "Liste d'attente"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode("month")} className="cursor-pointer">
                <Grid3X3 className="w-4 h-4 mr-2" />
                Mois
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("list")} className="cursor-pointer">
                <List className="w-4 h-4 mr-2" />
                Liste
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("waitlist")} className="cursor-pointer">
                <ListTodo className="w-4 h-4 mr-2" />
                Liste d&apos;attente
                {waitlistEntries.filter((w) => w.status === "waiting").length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {waitlistEntries.filter((w) => w.status === "waiting").length}
                  </Badge>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="cursor-pointer" title="Imprimer le planning">
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "month" && renderCalendarGrid()}
      {viewMode === "list" && renderListView()}
      {viewMode === "waitlist" && (
        <WaitlistPanel
          entries={waitlistEntries}
          careTypes={careTypes}
          patients={patients}
          onAdd={onAddToWaitlist}
          onMarkContacted={onMarkWaitlistContacted}
          onSchedule={onScheduleFromWaitlist}
          onRemove={onRemoveFromWaitlist}
        />
      )}

      {/* Appointment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAppointment?.patientName || "Détail du rendez-vous"}</DialogTitle>
            <DialogDescription>{selectedAppointment?.careLabel}</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span>{format(selectedAppointment.date, "EEEE d MMMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{selectedAppointment.time} ({selectedAppointment.duration})</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-muted-foreground" />
                <span>{selectedAppointment.dentistName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">{selectedAppointment.patientInitials}</AvatarFallback>
                </Avatar>
                <span>{selectedAppointment.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn("text-white", statusColors[selectedAppointment.status])}>
                  {statusLabels[selectedAppointment.status]}
                </Badge>
              </div>
              {selectedAppointment.prepNotes && (
                <p className="text-sm text-muted-foreground">{selectedAppointment.prepNotes}</p>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setShowDetailDialog(false)
                    onAppointmentClick?.(selectedAppointment)
                  }}
                >
                  Modifier
                </Button>
                <Button variant="destructive" className="flex-1 cursor-pointer" onClick={() => setShowDetailDialog(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}