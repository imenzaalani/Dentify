"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { COMMON_MEDICAL_CONDITIONS } from "@/types/dental"

export interface MedicalDataFormState {
  bloodPressureSystolic: string
  bloodPressureDiastolic: string
  conditions: string[]
  conditionsOther: string
  allergies: string
}

export const EMPTY_MEDICAL_DATA: MedicalDataFormState = {
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  conditions: [],
  conditionsOther: "",
  allergies: "",
}

interface StepMedicalDataProps {
  value: MedicalDataFormState
  onChange: (value: MedicalDataFormState) => void
}

export function StepMedicalData({ value, onChange }: StepMedicalDataProps) {
  const toggleCondition = (condition: string) => {
    const next = value.conditions.includes(condition)
      ? value.conditions.filter((c) => c !== condition)
      : [...value.conditions, condition]
    onChange({ ...value, conditions: next })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Tension artérielle</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Systolique"
            value={value.bloodPressureSystolic}
            onChange={(e) => onChange({ ...value, bloodPressureSystolic: e.target.value })}
            className="w-28"
          />
          <span className="text-muted-foreground">/</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Diastolique"
            value={value.bloodPressureDiastolic}
            onChange={(e) => onChange({ ...value, bloodPressureDiastolic: e.target.value })}
            className="w-28"
          />
          <span className="text-sm text-muted-foreground">mmHg</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Antécédents médicaux</Label>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_MEDICAL_CONDITIONS.map((condition) => {
            const checked = value.conditions.includes(condition)
            return (
              <button
                key={condition}
                type="button"
                onClick={() => toggleCondition(condition)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                  checked
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                )}
              >
                {condition}
              </button>
            )
          })}
        </div>
        <Input
          placeholder="Autre antécédent…"
          value={value.conditionsOther}
          onChange={(e) => onChange({ ...value, conditionsOther: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Allergies</Label>
        <Textarea
          placeholder="Pénicilline, latex…"
          value={value.allergies}
          onChange={(e) => onChange({ ...value, allergies: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  )
}
