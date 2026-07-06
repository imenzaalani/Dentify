"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  appointmentDates?: Array<{ date: Date; count: number }>
}

export function DatePicker({ selectedDate, onDateSelect, appointmentDates = [] }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date())

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      onDateSelect?.(selectedDate)
    }
  }

  // Map of dates with appointments for styling
  const datesWithAppointments = appointmentDates.reduce((acc, item) => {
    const dateKey = item.date.toDateString()
    acc[dateKey] = item.count
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex justify-center">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
        className="w-full [&_[role=gridcell]_button]:cursor-pointer [&_button]:cursor-pointer"
        modifiers={{
          hasAppointments: (date) => {
            const count = datesWithAppointments[date.toDateString()]
            return Boolean(count && count > 0)
          },
        }}
        modifiersClassNames={{
          hasAppointments:
            "relative after:absolute after:bottom-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full",
        }}
      />
    </div>
  )
}
