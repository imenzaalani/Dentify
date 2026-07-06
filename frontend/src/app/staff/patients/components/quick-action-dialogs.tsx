"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Send } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const careTypes = [
  "Consultation",
  "Cleaning",
  "Extraction",
  "Root Canal",
  "Whitening",
  "Orthodontic Adjustment",
  "Emergency",
]

const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
]

interface QuickAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
  onCreate: (data: { date: string; type: string }) => void
}

export function QuickAppointmentDialog({
  open,
  onOpenChange,
  patientName,
  onCreate,
}: QuickAppointmentDialogProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState(timeSlots[2])
  const [type, setType] = useState(careTypes[0])
  const [showCalendar, setShowCalendar] = useState(false)

  const handleCreate = () => {
    onCreate({ date: date.toISOString().split("T")[0], type })
    toast.success(`Appointment scheduled for ${patientName}`, {
      description: `${format(date, "PPP")} at ${time} — ${type}`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for {patientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal cursor-pointer">
                    <CalendarIcon className="mr-2 size-4" />
                    {format(date, "PP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d)
                        setShowCalendar(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type of care</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {careTypes.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="cursor-pointer" onClick={handleCreate}>
            Create appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface QuickMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
}

export function QuickMessageDialog({ open, onOpenChange, patientName }: QuickMessageDialogProps) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (!message.trim()) return
    toast.success(`Message sent to ${patientName}`)
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {patientName}</DialogTitle>
          <DialogDescription>
            This opens a direct conversation with the patient.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="cursor-pointer" onClick={handleSend} disabled={!message.trim()}>
            <Send className="mr-2 size-4" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}