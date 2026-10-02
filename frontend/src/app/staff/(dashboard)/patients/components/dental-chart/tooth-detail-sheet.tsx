"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { archLabel, conditionLabels, positionInArch, type ToothRecord } from "@/types/dental"

interface ToothDetailSheetProps {
  tooth: ToothRecord | null
  toothNumber: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground col-span-1">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  )
}

export function ToothDetailSheet({ tooth, toothNumber, open, onOpenChange }: ToothDetailSheetProps) {
  if (!toothNumber) return null
  const displayName = `${archLabel(toothNumber)} ${positionInArch(toothNumber)}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader><SheetTitle>{displayName}</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 pb-4">
          {tooth ? (
            <>
              <Badge variant="secondary">{conditionLabels[tooth.condition]}</Badge>
              {tooth.notes && <p className="text-sm">{tooth.notes}</p>}
              <div className="space-y-2 border-t pt-4">
                <Field label="Doctor" value={tooth.doctor} />
                <Field label="Last manipulation" value={tooth.lastManipulationDate} />
                <Field label="Surgical Kit" value={tooth.surgicalKit} />
                <Field label="Implant Manufacturer" value={tooth.implantManufacturer} />
                <Field label="Implant Model" value={tooth.implantModel} />
                <Field label="Implant Sizes Needed" value={tooth.implantSizesNeeded} />
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No records for this tooth yet — healthy.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}