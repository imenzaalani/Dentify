"use client"

import { useState } from "react"
import { Loader2, MessageCircle, Send, UserCheck } from "lucide-react"
import { toast } from "sonner"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Lead } from "./types"

interface ContactLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadName: string
  onSent: () => void
}

export function ContactLeadDialog({
  open,
  onOpenChange,
  leadName,
  onSent,
}: ContactLeadDialogProps) {
  const [channel, setChannel] = useState("whatsapp")
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (!message.trim()) return
    toast.success(`Message sent to ${leadName}`, {
      description: channel === "whatsapp" ? "Sent via WhatsApp." : "Sent via SMS.",
    })
    onSent()
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact {leadName}</DialogTitle>
          <DialogDescription>
            Reach out to follow up on this lead. This also marks the lead as contacted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </span>
                </SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>
        </div>

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

interface ConvertToPatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  // Returns a Promise now — converting hits the real API and creates a
  // Patient record, so this dialog needs to know when it's actually done
  // (and whether it failed) instead of assuming success immediately.
  onConfirm: () => Promise<void>
}

export function ConvertToPatientDialog({
  open,
  onOpenChange,
  lead,
  onConfirm,
}: ConvertToPatientDialogProps) {
  const [isConverting, setIsConverting] = useState(false)

  const handleConfirm = async () => {
    setIsConverting(true)
    try {
      await onConfirm()
      // Success/error toasts are owned by the caller (it knows the real
      // patient number / error message) — this dialog just closes once the
      // request has actually finished, so it never reports a result it
      // hasn't confirmed.
      onOpenChange(false)
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isConverting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to patient</DialogTitle>
          <DialogDescription>
            This creates a patient record from the lead's information below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-md border p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">
              {lead.patient_first_name} {lead.patient_last_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span>{lead.contact_phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{lead.contact_email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Requested service</span>
            <span>{lead.requested_service}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button className="cursor-pointer" onClick={handleConfirm} disabled={isConverting}>
            {isConverting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <UserCheck className="mr-2 size-4" />
            )}
            {isConverting ? "Converting…" : "Confirm & convert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}