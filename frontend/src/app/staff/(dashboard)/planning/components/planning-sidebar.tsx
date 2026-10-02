"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, CalendarOff, Users, ChevronRight } from "lucide-react"

import { Practitioners } from "./practitioners"
import { DatePicker } from "./date-picker"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type Practitioner, type WaitlistEntry, type CareType, type WaitlistPriority } from "../types"

const priorityRank: Record<WaitlistPriority, number> = { high: 0, medium: 1, low: 2 }

const priorityDot: Record<WaitlistPriority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-muted-foreground/40",
}

interface PlanningSidebarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onBlockSlot?: () => void
  onNewAppointment?: () => void
  appointmentDates?: Array<{ date: Date; count: number }>
  practitioners: Practitioner[]
  onPractitionerToggle: (id: string) => void
  // Compact waitlist widget, shown under the practitioners list — the full
  // list with its actions (contact, schedule, remove) still lives in the
  // "Liste d'attente" tab; this is just enough to see who's waiting and jump
  // there.
  waitlistEntries?: WaitlistEntry[]
  careTypes?: CareType[]
  onViewWaitlist?: () => void
  className?: string
}

export function PlanningSidebar({
  selectedDate,
  onDateSelect,
  onBlockSlot,
  onNewAppointment,
  appointmentDates = [],
  practitioners,
  onPractitionerToggle,
  waitlistEntries = [],
  careTypes = [],
  onViewWaitlist,
  className,
}: PlanningSidebarProps) {
  const router = useRouter()

  const careTypeMap = useMemo(() => new Map(careTypes.map((c) => [c.id, c])), [careTypes])

  const topWaiting = useMemo(
    () =>
      waitlistEntries
        .filter((w) => w.status === "waiting")
        .sort((a, b) => {
          const rankDiff = priorityRank[a.priority] - priorityRank[b.priority]
          if (rankDiff !== 0) return rankDiff
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }),
    [waitlistEntries]
  )

  return (
    <div className={`flex flex-col h-full bg-background rounded-lg ${className}`}>
      {/* Add New Appointment Button */}
      <div className="p-6 border-b">
        <Button className="w-full cursor-pointer" onClick={onNewAppointment}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      {/* Date Picker */}
      <DatePicker
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        appointmentDates={appointmentDates}
      />

      <Separator />

      {/* Practitioners */}
      <div className="flex-1 p-4 overflow-y-auto">
        <Practitioners
          practitioners={practitioners}
          onPractitionerToggle={onPractitionerToggle}
          onPractitionerEdit={(id) => router.push(`/staff/doctors/${id}`)}
        />
      </div>

      {/* Waitlist widget — quick glance at who's waiting, full list/actions
          are in the "Liste d'attente" tab */}
      {onViewWaitlist && (
        <>
          <Separator />
          <div className="p-4">
            <button
              type="button"
              onClick={onViewWaitlist}
              className="flex w-full items-center justify-between mb-2 cursor-pointer group"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4 text-muted-foreground" />
                Liste d&apos;attente
                {topWaiting.length > 0 && (
                  <Badge variant="secondary" className="ml-0.5">
                    {topWaiting.length}
                  </Badge>
                )}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </button>

            {topWaiting.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun patient en attente.</p>
            ) : (
              <div className="space-y-1">
                {topWaiting.slice(0, 3).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={onViewWaitlist}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted cursor-pointer"
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityDot[entry.priority])} />
                    <span className="truncate flex-1">{entry.patientName}</span>
                    <span className="text-muted-foreground truncate max-w-[80px]">
                      {careTypeMap.get(entry.careTypeId)?.name ?? ""}
                    </span>
                  </button>
                ))}
                {topWaiting.length > 3 && (
                  <button
                    type="button"
                    onClick={onViewWaitlist}
                    className="w-full text-xs text-muted-foreground hover:text-foreground text-left px-2 py-1 cursor-pointer"
                  >
                    +{topWaiting.length - 3} de plus…
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start cursor-pointer"
          onClick={onBlockSlot}
        >
          <CalendarOff className="w-4 h-4 mr-2" />
          Bloquer un créneau
        </Button>
      </div>
    </div>
  )
}