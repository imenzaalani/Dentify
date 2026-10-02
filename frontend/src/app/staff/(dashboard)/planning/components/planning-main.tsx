"use client"

import { useEffect, useMemo, useState } from "react"
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
  Menu,
  Printer,
  CalendarCheck,
  CircleCheck,
  UserX,
  Ban,
  ListTodo,
  CalendarDays,
  CalendarRange,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react"
import { format, addMonths, subMonths, addDays, subDays, addWeeks, subWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { type Appointment, type BlockedSlot, type CareType, type Patient, type Practitioner, type Resource, type WaitlistEntry, type PlanningViewMode, type CareCategory, statusColors, statusLabels, categoryCardStyles, categoryColors, categoryLabels, mutedCardStyle } from "../types"
import { computeFirstVisitIds } from "../conflicts"
import { cardA11yProps } from "../a11y"
import { WaitlistPanel } from "./waitlist-panel"
import { DayView } from "./day-view"
import { WeekView } from "./week-view"

// Overflow menu for the actions that don't get their own dedicated button
// (check-in already has one everywhere it appears) — shared by the list
// view and the appointment preview dialog so both stay in sync instead of
// each carrying its own half-wired copy.
function AppointmentActionsMenu({
  appointment,
  onMarkCompleted,
  onMarkNoShow,
  onCancelAppointment,
}: {
  appointment: Appointment
  onMarkCompleted?: (id: string) => void
  onMarkNoShow?: (id: string) => void
  onCancelAppointment?: (id: string, reason?: string) => void
}) {
  if (appointment.status === "completed" || appointment.status === "cancelled") return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer"
          onClick={(e) => e.stopPropagation()}
          title="Autres actions"
          aria-label="Autres actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {onMarkCompleted && (
          <DropdownMenuItem className="cursor-pointer" onClick={() => onMarkCompleted(appointment.id)}>
            <CircleCheck className="w-4 h-4 mr-2" />
            Marquer comme terminé
          </DropdownMenuItem>
        )}
        {onMarkNoShow && (
          <DropdownMenuItem className="cursor-pointer" onClick={() => onMarkNoShow(appointment.id)}>
            <UserX className="w-4 h-4 mr-2" />
            Marquer absence
          </DropdownMenuItem>
        )}
        {onCancelAppointment && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onCancelAppointment(appointment.id)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Annuler le RDV
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Color key for the 5 care-category colors used on appointment cards across
// day/week/month/list — otherwise staff have to learn "pink = esthétique"
// by memory. Kept visible in print too (no print:hidden) since a printed
// day sheet needs the same key to make sense of the card colors on paper.
const LEGEND_CATEGORIES = Object.keys(categoryLabels) as CareCategory[]

function CareCategoryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-6 py-2 border-b bg-muted/20 text-xs text-muted-foreground">
      {LEGEND_CATEGORIES.map((category) => (
        <span key={category} className="flex items-center gap-1.5">
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", categoryColors[category])} />
          {categoryLabels[category]}
        </span>
      ))}
    </div>
  )
}

interface PlanningMainProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onMenuClick?: () => void
  appointments: Appointment[]
  blockedSlots?: BlockedSlot[]
  // Opens the reservation detail panel — the single entry point for
  // acting on an appointment (edit, check-in, cancel, and the clinical
  // checkup/record flows all live there now).
  onOpenReservation?: (appointment: Appointment) => void
  onCheckIn?: (appointmentId: string) => void
  onMarkCompleted?: (appointmentId: string) => void
  onMarkNoShow?: (appointmentId: string) => void
  onCancelAppointment?: (appointmentId: string, reason?: string) => void
  onRemoveBlockedSlot?: (id: string) => void
  waitlistEntries: WaitlistEntry[]
  careTypes: CareType[]
  patients: Patient[]
  practitioners: Practitioner[]
  resources?: Resource[]
  onAddToWaitlist: (entry: Omit<WaitlistEntry, "id" | "createdAt" | "status">) => void
  onMarkWaitlistContacted: (id: string) => void
  onScheduleFromWaitlist: (entry: WaitlistEntry) => void
  onRemoveFromWaitlist: (id: string) => void
  onSlotClick?: (date: Date, time: string, dentistId: string) => void
  // Drag-and-drop reschedule, passed straight through to DayView.
  onReschedule?: (appointmentId: string, date: Date, time: string, dentistId: string) => void
  // Desktop sidebar show/hide (xl breakpoint only — the mobile sheet is
  // controlled separately via onMenuClick).
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  // View is controlled from the parent so the sidebar's waitlist widget can
  // jump straight to the waitlist tab.
  viewMode: PlanningViewMode
  onViewModeChange: (view: PlanningViewMode) => void
}

export function PlanningMain({
  selectedDate,
  onDateSelect,
  onMenuClick,
  appointments,
  blockedSlots = [],
  onOpenReservation,
  onCheckIn,
  onMarkCompleted,
  onMarkNoShow,
  onCancelAppointment,
  onRemoveBlockedSlot,
  waitlistEntries,
  careTypes,
  patients,
  practitioners,
  resources = [],
  onAddToWaitlist,
  onMarkWaitlistContacted,
  onScheduleFromWaitlist,
  onRemoveFromWaitlist,
  onSlotClick,
  onReschedule,
  sidebarCollapsed = false,
  onToggleSidebar,
  viewMode,
  onViewModeChange,
}: PlanningMainProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (selectedDate) setCurrentDate(selectedDate)
  }, [selectedDate])

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

  // Based on the full, unfiltered appointment list (not filteredAppointments)
  // so a search query never hides an appointment's true first-visit status.
  const firstVisitAppointmentIds = useMemo(() => computeFirstVisitIds(appointments), [appointments])

  const waitingCount = useMemo(
    () => waitlistEntries.filter((w) => w.status === "waiting").length,
    [waitlistEntries]
  )

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

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
    const next = direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
    setCurrentDate(next)
    onDateSelect?.(next)
  }

  const navigateDay = (direction: "prev" | "next") => {
    const next = direction === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1)
    setCurrentDate(next)
    onDateSelect?.(next)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const next = direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1)
    setCurrentDate(next)
    onDateSelect?.(next)
  }

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "day") navigateDay(direction)
    else if (viewMode === "week") navigateWeek(direction)
    else navigateMonth(direction)
  }

  const handleSelectDayFromWeek = (day: Date) => {
    setCurrentDate(day)
    onDateSelect?.(day)
    onViewModeChange("day")
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateSelect?.(today)
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    onOpenReservation?.(appointment)
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
                  "min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                  isCurrentMonth ? "bg-background hover:bg-accent/50" : "bg-muted/30 text-muted-foreground",
                  isSelected && "ring-2 ring-primary ring-inset",
                  isDayToday && "bg-accent/20"
                )}
                onClick={() => onDateSelect?.(day)}
                {...cardA11yProps(
                  `${format(day, "EEEE d MMMM yyyy", { locale: fr })}${dayAppointments.length > 0 ? `, ${dayAppointments.length} rendez-vous` : ""}`,
                  () => onDateSelect?.(day)
                )}
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
                  {dayAppointments.slice(0, 2).map((appointment) => {
                    const isMuted = appointment.status === "cancelled" || appointment.status === "no_show"
                    const style = isMuted ? mutedCardStyle : categoryCardStyles[appointment.category]
                    return (
                      <div
                        key={appointment.id}
                        className={cn(
                          "text-xs px-1.5 py-1 rounded-sm border-l-2 cursor-pointer truncate outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          style.bg,
                          style.accent,
                          style.text,
                          isMuted && "line-through decoration-muted-foreground/50"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAppointmentClick(appointment)
                        }}
                        {...cardA11yProps(
                          `${appointment.time} · ${appointment.patientName} · ${appointment.careLabel}`,
                          () => handleAppointmentClick(appointment)
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">{appointment.time} · {appointment.patientName}</span>
                        </div>
                      </div>
                    )
                  })}
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
              className="cursor-pointer hover:shadow-md transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              onClick={() => handleAppointmentClick(appointment)}
              {...cardA11yProps(
                `${format(appointment.date, "d MMM yyyy", { locale: fr })} · ${appointment.time} · ${appointment.patientName} · ${appointment.dentistName}`,
                () => handleAppointmentClick(appointment)
              )}
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
                    <AppointmentActionsMenu
                      appointment={appointment}
                      onMarkCompleted={onMarkCompleted}
                      onMarkNoShow={onMarkNoShow}
                      onCancelAppointment={onCancelAppointment}
                    />
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
    <div className="planning-page-root flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 border-b">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="xl:hidden cursor-pointer print:hidden"
              onClick={onMenuClick}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-4 h-4" />
            </Button>

            {onToggleSidebar && (
              <Button
                variant="outline"
                size="sm"
                className="hidden xl:inline-flex cursor-pointer print:hidden"
                onClick={onToggleSidebar}
                title={sidebarCollapsed ? "Afficher le calendrier" : "Masquer le calendrier"}
                aria-label={sidebarCollapsed ? "Afficher le calendrier" : "Masquer le calendrier"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </Button>
            )}

            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("prev")}
                className="cursor-pointer"
                aria-label="Période précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("next")}
                className="cursor-pointer"
                aria-label="Période suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="cursor-pointer">
                Aujourd'hui
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative min-w-0 flex-1 lg:flex-none print:hidden">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un patient, un praticien..."
                aria-label="Rechercher un patient ou un praticien"
                className="pl-10 w-full lg:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer print:hidden shrink-0"
              title="Imprimer le planning"
              aria-label="Imprimer le planning"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-semibold capitalize">
          {viewMode === "day" && format(currentDate, "EEEE d MMMM yyyy", { locale: fr })}
          {viewMode === "week" &&
            (isSameMonth(weekStart, weekEnd)
              ? `${format(weekStart, "d", { locale: fr })} – ${format(weekEnd, "d MMMM yyyy", { locale: fr })}`
              : `${format(weekStart, "d MMM", { locale: fr })} – ${format(weekEnd, "d MMM yyyy", { locale: fr })}`)}
          {(viewMode === "month" || viewMode === "list" || viewMode === "waitlist") &&
            format(currentDate, "MMMM yyyy", { locale: fr })}
        </h1>

        {/* View Tabs — front and center so switching views doesn't take a click-to-open menu */}
        <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as PlanningViewMode)} className="print:hidden">
          <TabsList className="w-full justify-start overflow-x-auto md:w-auto">
            <TabsTrigger value="day" className="cursor-pointer gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Jour
            </TabsTrigger>
            <TabsTrigger value="week" className="cursor-pointer gap-1.5">
              <CalendarRange className="w-4 h-4" />
              Semaine
            </TabsTrigger>
            <TabsTrigger value="month" className="cursor-pointer gap-1.5">
              <Grid3X3 className="w-4 h-4" />
              Mois
            </TabsTrigger>
            <TabsTrigger value="list" className="cursor-pointer gap-1.5">
              <List className="w-4 h-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="waitlist" className="cursor-pointer gap-1.5">
              <ListTodo className="w-4 h-4" />
              Liste d&apos;attente
              {waitingCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {waitingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Waitlist visibility banner — surfaces waiting patients no matter which
          view is currently open, so it doesn't get lost behind a tab click. */}
      {waitingCount > 0 && viewMode !== "waitlist" && (
        <button
          type="button"
          onClick={() => onViewModeChange("waitlist")}
          className="flex items-center gap-2 px-6 py-2 border-b bg-amber-50 text-amber-900 text-sm hover:bg-amber-100 transition-colors cursor-pointer text-left dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50 print:hidden"
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>
            <strong>{waitingCount}</strong> patient{waitingCount > 1 ? "s" : ""} en liste d&apos;attente
          </span>
          <span className="ml-auto underline underline-offset-2">Voir la liste</span>
        </button>
      )}

      {viewMode !== "waitlist" && <CareCategoryLegend />}

      {/* Content */}
      {viewMode === "day" && (
        <DayView
          date={currentDate}
          practitioners={practitioners}
          appointments={filteredAppointments}
          blockedSlots={blockedSlots}
          resources={resources}
          firstVisitAppointmentIds={firstVisitAppointmentIds}
          onAppointmentClick={handleAppointmentClick}
          onCheckIn={onCheckIn}
          onSlotClick={onSlotClick}
          onRemoveBlockedSlot={onRemoveBlockedSlot}
          onReschedule={onReschedule}
        />
      )}
      {viewMode === "week" && (
        <WeekView
          date={currentDate}
          practitioners={practitioners}
          appointments={filteredAppointments}
          blockedSlots={blockedSlots}
          firstVisitAppointmentIds={firstVisitAppointmentIds}
          onAppointmentClick={handleAppointmentClick}
          onSelectDay={handleSelectDayFromWeek}
        />
      )}
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
    </div>
  )
}