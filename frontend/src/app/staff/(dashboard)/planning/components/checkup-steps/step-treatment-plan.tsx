"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
// Reused as-is from the patients dental chart — same anatomical odontogram,
// same ToothRecord/ToothCondition shape, so a tooth flagged here shows up
// identically on the patient's own chart once the backend wires it through.
import { OdontogramSvg } from "@/app/staff/(dashboard)/patients/components/dental-chart/odontogram-svg"
import {
  conditionLabels,
  CONDITIONS_REQUIRING_TREATMENT_STEP,
  type ToothCondition,
  type ToothRecord,
} from "@/types/dental"

interface StepTreatmentPlanProps {
  /** Only teeth touched during this checkup — not the patient's full chart. */
  value: ToothRecord[]
  onChange: (value: ToothRecord[]) => void
}

const SELECTABLE_CONDITIONS = (Object.keys(conditionLabels) as ToothCondition[])

export function StepTreatmentPlan({ value, onChange }: StepTreatmentPlanProps) {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)

  const setCondition = (toothNumber: string, condition: ToothCondition) => {
    if (condition === "healthy") {
      onChange(value.filter((t) => t.toothNumber !== toothNumber))
      return
    }
    const existing = value.find((t) => t.toothNumber === toothNumber)
    if (existing) {
      onChange(value.map((t) => (t.toothNumber === toothNumber ? { ...t, condition } : t)))
    } else {
      onChange([
        ...value,
        { id: crypto.randomUUID(), toothNumber, condition },
      ])
    }
  }

  const flagged = [...value].sort((a, b) => a.toothNumber.localeCompare(b.toothNumber))
  const stepCount = flagged.filter((t) => CONDITIONS_REQUIRING_TREATMENT_STEP.includes(t.condition)).length
  const selectedRecord = value.find((t) => t.toothNumber === selectedTooth)

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <OdontogramSvg teeth={value} selectedTooth={selectedTooth} onSelectTooth={setSelectedTooth} />
      </div>

      {selectedTooth !== null && (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Label className="shrink-0">Dent {selectedTooth}</Label>
          <Select
            value={selectedRecord?.condition ?? "healthy"}
            onValueChange={(condition) => setCondition(selectedTooth, condition as ToothCondition)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="healthy">Saine</SelectItem>
              {SELECTABLE_CONDITIONS.filter((c) => c !== "healthy").map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {conditionLabels[condition]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Dents signalées
          </Label>
          {stepCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {stepCount} étape{stepCount > 1 ? "s" : ""} de traitement à créer
            </span>
          )}
        </div>
        {flagged.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cliquez une dent sur le schéma pour lui assigner un état.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {flagged.map((tooth) => (
              <Badge
                key={tooth.toothNumber}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer"
                onClick={() => setSelectedTooth(tooth.toothNumber)}
              >
                {tooth.toothNumber} · {conditionLabels[tooth.condition]}
                <button
                  type="button"
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCondition(tooth.toothNumber, "healthy")
                    if (selectedTooth === tooth.toothNumber) setSelectedTooth(null)
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
