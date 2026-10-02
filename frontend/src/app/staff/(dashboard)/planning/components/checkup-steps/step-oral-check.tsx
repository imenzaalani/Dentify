"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  occlusionLabels,
  torusPalatinusLabels,
  torusMandibularisLabels,
  palatumLabels,
  type OcclusionType,
  type TorusPalatinusType,
  type TorusMandibularisType,
  type PalatumType,
} from "@/types/dental"

export interface OralCheckFormState {
  occlusion: OcclusionType
  torusPalatinus: TorusPalatinusType
  torusMandibularis: TorusMandibularisType
  palatum: PalatumType
  diastema: string
}

export const EMPTY_ORAL_CHECK: OralCheckFormState = {
  occlusion: "normal",
  torusPalatinus: "no",
  torusMandibularis: "no",
  palatum: "no",
  diastema: "",
}

function OptionRow<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string
  options: T[]
  labels: Record<T, string>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
              value === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  )
}

interface StepOralCheckProps {
  value: OralCheckFormState
  onChange: (value: OralCheckFormState) => void
}

export function StepOralCheck({ value, onChange }: StepOralCheckProps) {
  return (
    <div className="space-y-5">
      <OptionRow
        label="Occlusion"
        options={["normal", "cross", "steep"] as OcclusionType[]}
        labels={occlusionLabels}
        value={value.occlusion}
        onChange={(occlusion) => onChange({ ...value, occlusion })}
      />
      <OptionRow
        label="Torus palatin"
        options={["no", "small", "medium", "large", "multiple"] as TorusPalatinusType[]}
        labels={torusPalatinusLabels}
        value={value.torusPalatinus}
        onChange={(torusPalatinus) => onChange({ ...value, torusPalatinus })}
      />
      <OptionRow
        label="Torus mandibulaire"
        options={["no", "left", "right", "both"] as TorusMandibularisType[]}
        labels={torusMandibularisLabels}
        value={value.torusMandibularis}
        onChange={(torusMandibularis) => onChange({ ...value, torusMandibularis })}
      />
      <OptionRow
        label="Fente palatine"
        options={["no", "left", "right", "both"] as PalatumType[]}
        labels={palatumLabels}
        value={value.palatum}
        onChange={(palatum) => onChange({ ...value, palatum })}
      />
      <div className="space-y-2">
        <Label>Diastème</Label>
        <Input
          placeholder="Localisation, largeur estimée…"
          value={value.diastema}
          onChange={(e) => onChange({ ...value, diastema: e.target.value })}
        />
      </div>
    </div>
  )
}
