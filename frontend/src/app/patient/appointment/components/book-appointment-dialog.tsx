"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const APPOINTMENT_TYPES = [
  "Check-up & cleaning",
  "Bracket adjustment",
  "Progress check",
  "Emergency visit",
  "Consultation",
]

// TODO: replace with GET /doctors once that endpoint exists
const PRACTITIONERS = ["Dr. Amine Ben Youssef", "Dr. Sarra Trabelsi"]

export function BookAppointmentDialog({
  onBook,
}: {
  onBook: (values: {
    date: string
    time: string
    type: string
    practitioner: string
  }) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("")
  const [type, setType] = React.useState("")
  const [practitioner, setPractitioner] = React.useState("")

  const isValid = date && time && type && practitioner

  const handleSubmit = () => {
    if (!isValid) return
    onBook({ date, time, type, practitioner })
    toast.success("Appointment request sent", {
      description: "You'll receive a confirmation once the clinic reviews it.",
    })
    setOpen(false)
    setDate("")
    setTime("")
    setType("")
    setPractitioner("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Book an appointment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book an appointment</DialogTitle>
          <DialogDescription>
            Choose a date, time and reason for your visit. The clinic will confirm shortly after.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="appt-date">Date</Label>
              <Input
                id="appt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="appt-time">Time</Label>
              <Input
                id="appt-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Reason for visit</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Practitioner</Label>
            <Select value={practitioner} onValueChange={setPractitioner}>
              <SelectTrigger>
                <SelectValue placeholder="Select a practitioner" />
              </SelectTrigger>
              <SelectContent>
                {PRACTITIONERS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Request appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}