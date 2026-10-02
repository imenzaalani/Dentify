"use client"

import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { PeriodPreset, PeriodRange } from "../lib/aggregate"

interface PeriodSelectorProps {
  preset: PeriodPreset
  customRange?: PeriodRange
  onPresetChange: (preset: PeriodPreset) => void
  onCustomRangeChange: (range: PeriodRange) => void
}

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "year", label: "This year" },
]

export function PeriodSelector({
  preset,
  customRange,
  onPresetChange,
  onCustomRangeChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={preset === p.value ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onPresetChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={preset === "custom" ? "default" : "outline"}
            className={cn("cursor-pointer justify-start text-left font-normal")}
          >
            <CalendarIcon className="mr-1.5 size-3.5" />
            {preset === "custom" && customRange
              ? `${format(customRange.start, "PP")} – ${format(customRange.end, "PP")}`
              : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={customRange?.start}
            selected={
              customRange
                ? { from: customRange.start, to: customRange.end }
                : undefined
            }
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onCustomRangeChange({ start: range.from, end: range.to })
                onPresetChange("custom")
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
