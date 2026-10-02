"use client"

import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  appointmentDates?: Array<{ date: Date; count: number }>
}

export function DatePicker({ selectedDate, onDateSelect, appointmentDates = [] }: DatePickerProps) {
  // Fully controlled by `selectedDate` — previously this held its own copy
  // of the date that only ever got set on mount, so switching views (week
  // nav, "Aujourd'hui", picking a day in month view) moved the rest of the
  // planning page but left this calendar frozen on whatever day it opened on.
  const date = selectedDate ?? new Date()

  // react-day-picker tracks which month page is visible separately from
  // `selected` — without this it won't jump there on its own when the
  // selected date changes from outside (it only reacts to clicks inside
  // itself), so the sidebar could show a check mark on the right day while
  // still displaying last month's grid.
  const [month, setMonth] = useState<Date>(date)
  useEffect(() => {
    setMonth(date)
  }, [date.getFullYear(), date.getMonth(), date.getDate()])

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      onDateSelect?.(selected)
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
        month={month}
        onMonthChange={setMonth}
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
