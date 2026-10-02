"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, CalendarOff } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { practitionerSwatch } from "../data"
import { minutesToTime } from "../availability"
import { type BlockedSlot, type BlockReason, type Practitioner, blockReasonLabels } from "../types"

interface BlockSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practitioners: Practitioner[]
  defaultDate?: Date
  onSave: (slot: Omit<BlockedSlot, "id">) => void
}

// 8h00 → 19h00, half-hour steps — matches the day view's working window.
const TIME_OPTIONS = Array.from({ length: 23 }, (_, i) => minutesToTime(8 * 60 + i * 30))

export function BlockSlotDialog({ open, onOpenChange, practitioners, defaultDate, onSave }: BlockSlotDialogProps) {
  const [dentistId, setDentistId] = useState<string>("")
  const [date, setDate] = useState<Date>(defaultDate ?? new Date())
  const [startTime, setStartTime] = useState<string>("8h00")
  const [endTime, setEndTime] = useState<string>("9h00")
  const [reason, setReason] = useState<BlockReason>("conge")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (open) {
      setDentistId(practitioners.find((p) => p.visible)?.id ?? practitioners[0]?.id ?? "")
      setDate(defaultDate ?? new Date())
      setStartTime("8h00")
      setEndTime("9h00")
      setReason("conge")
      setNote("")
    }
  }, [open, defaultDate, practitioners])

  const startMinutes = TIME_OPTIONS.indexOf(startTime)
  const endMinutes = TIME_OPTIONS.indexOf(endTime)
  const rangeInvalid = endMinutes <= startMinutes

  const handleSubmit = () => {
    if (!dentistId || rangeInvalid) return
    onSave({ dentistId, date, startTime, endTime, reason, note: note.trim() || undefined })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="w-4 h-4" />
            Bloquer un créneau
          </DialogTitle>
          <DialogDescription>
            Réserve une plage horaire pour un praticien — congé, pause, formation — pour qu&apos;elle
            n&apos;apparaisse plus comme disponible dans le planning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Praticien *</Label>
            <Select value={dentistId} onValueChange={setDentistId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un praticien" />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2.5 h-2.5 rounded-full", practitionerSwatch(p.color).className)}
                        style={practitionerSwatch(p.color).style}
                      />
                      Dr. {p.firstName} {p.lastName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal cursor-pointer">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(date, "EEEE d MMMM yyyy", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heure de début *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Heure de fin *</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {rangeInvalid && (
            <p className="text-xs text-destructive -mt-2">L&apos;heure de fin doit être après l&apos;heure de début.</p>
          )}

          <div className="space-y-2">
            <Label>Motif *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as BlockReason)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(blockReasonLabels) as BlockReason[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {blockReasonLabels[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Note (optionnel)</Label>
            <Textarea
              placeholder="Précision visible par l'équipe..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="cursor-pointer" disabled={!dentistId || rangeInvalid} onClick={handleSubmit}>
            Bloquer le créneau
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
