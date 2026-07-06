"use client"

import { Plus, CalendarOff } from "lucide-react"

import { Practitioners } from "./practitioners"
import { DatePicker } from "./date-picker"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type Practitioner } from "../types"

interface PlanningSidebarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onBlockSlot?: () => void
  onNewAppointment?: () => void
  appointmentDates?: Array<{ date: Date; count: number }>
  practitioners: Practitioner[]
  className?: string
}

export function PlanningSidebar({
  selectedDate,
  onDateSelect,
  onBlockSlot,
  onNewAppointment,
  appointmentDates = [],
  practitioners,
  className,
}: PlanningSidebarProps) {
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
      <div className="flex-1 p-4">
        <Practitioners
          practitioners={practitioners}
          onPractitionerToggle={(id, visible) => {
            console.log(`Praticien ${id} visibilité: ${visible}`)
          }}
          onPractitionerEdit={(id) => {
            console.log(`Voir le profil du praticien: ${id}`)
          }}
        />
      </div>

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
