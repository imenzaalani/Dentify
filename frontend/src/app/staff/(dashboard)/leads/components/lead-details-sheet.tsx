"use client"

import { MessageSquare, UserCheck } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Lead, getInitials, statusColors, statusLabels, hearAboutUsLabels } from "./types"

interface LeadDetailsSheetProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onContact: () => void
  onConvert: () => void
}

const bookingForLabels: Record<Lead["booking_for"], string> = {
  myself: "Myself",
  dependent: "A dependent",
  someone_else: "Someone else",
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value && value.length > 0 ? value : "—"}</p>
    </div>
  )
}

export function LeadDetailsSheet({
  lead,
  open,
  onOpenChange,
  onContact,
  onConvert,
}: LeadDetailsSheetProps) {
  const isClosed = lead.status === "converted" || lead.status === "rejected"
  const requested = new Date(lead.requested_datetime)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full p-0 flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-medium">
                {getInitials(lead.patient_first_name, lead.patient_last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>
                {lead.patient_first_name} {lead.patient_last_name}
              </SheetTitle>
              <SheetDescription>
                Lead received {new Date(lead.created_at).toLocaleDateString()}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="flex flex-col gap-6 pb-6">
            <div className="flex items-center gap-2">
              <Badge className={statusColors[lead.status]} variant="outline">
                {statusLabels[lead.status]}
              </Badge>
              <Badge variant="outline">{lead.source}</Badge>
              {lead.sms_consent && (
                <Badge variant="secondary">SMS consent</Badge>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" value={lead.contact_phone} />
                <Field label="Email" value={lead.contact_email} />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Request
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Requested service" value={lead.requested_service} />
                <Field
                  label="Requested for"
                  value={`${requested.toLocaleDateString()} at ${requested.toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )}`}
                />
                <Field label="Booking for" value={bookingForLabels[lead.booking_for]} />
                <Field
                  label="Heard about us via"
                  value={lead.hear_about_us ? hearAboutUsLabels[lead.hear_about_us] : null}
                />
              </div>
              <Field label="Comments" value={lead.comments} />
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Patient Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of birth" value={lead.patient_dob} />
                <Field label="Legal sex" value={lead.patient_legal_sex} />
                <Field label="ZIP code" value={lead.patient_zip} />
              </div>
            </div>

            {lead.notes && (
              <>
                <Separator />
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Internal Notes
                  </h3>
                  <p className="text-sm">{lead.notes}</p>
                </div>
              </>
            )}

            {lead.converted_to_patient_id && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  Converted to patient record #{lead.converted_to_patient_id}.
                </p>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onContact}>
            <MessageSquare className="mr-2 size-4" />
            Contact
          </Button>
          <Button
            className="flex-1 cursor-pointer"
            disabled={isClosed}
            onClick={onConvert}
          >
            <UserCheck className="mr-2 size-4" />
            Convert to patient
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}