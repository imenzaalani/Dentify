"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { OdontogramSvg } from "@/app/staff/(dashboard)/patients/components/dental-chart/odontogram-svg"
import { conditionLabels, CONDITIONS_REQUIRING_TREATMENT_STEP, type ToothRecord } from "@/types/dental"
import type { MedicalDataFormState } from "./step-medical-data"
import type { OralCheckFormState } from "./step-oral-check"

interface StepAgreementProps {
  medicalData: MedicalDataFormState
  toothUpdates: ToothRecord[]
  oralCheck: OralCheckFormState
  consentGiven: boolean
  onConsentChange: (value: boolean) => void
}

const OCCLUSION_SUMMARY_LABEL: Record<OralCheckFormState["occlusion"], string> = {
  normal: "Normale",
  cross: "Croisée",
  steep: "Profonde",
}

export function StepAgreement({
  medicalData,
  toothUpdates,
  oralCheck,
  consentGiven,
  onConsentChange,
}: StepAgreementProps) {
  const stepsToCreate = [...toothUpdates]
    .filter((t) => CONDITIONS_REQUIRING_TREATMENT_STEP.includes(t.condition))
    .sort((a, b) => a.toothNumber.localeCompare(b.toothNumber))

  return (
    <div className="space-y-5">
      {/* Read-only here — selecting a tooth just highlights it, there's no
          condition editor on this step (that's step 2's job). */}
      <div className="overflow-x-auto">
        <OdontogramSvg teeth={toothUpdates} selectedTooth={null} onSelectTooth={() => {}} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Étapes de traitement à créer
        </Label>
        {stepsToCreate.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune — aucune dent ne nécessite de suivi.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {stepsToCreate.map((tooth) => (
              <li key={tooth.toothNumber} className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground w-6">{tooth.toothNumber}</span>
                {conditionLabels[tooth.condition]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        {medicalData.bloodPressureSystolic && medicalData.bloodPressureDiastolic && (
          <p>
            Tension : {medicalData.bloodPressureSystolic}/{medicalData.bloodPressureDiastolic} mmHg
          </p>
        )}
        {medicalData.conditions.length > 0 && <p>Antécédents : {medicalData.conditions.join(", ")}</p>}
        {medicalData.allergies && <p>Allergies : {medicalData.allergies}</p>}
        <p>Occlusion : {OCCLUSION_SUMMARY_LABEL[oralCheck.occlusion]}</p>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer">
        <Checkbox
          checked={consentGiven}
          onCheckedChange={(checked) => onConsentChange(checked === true)}
          className="mt-0.5 shrink-0 cursor-pointer"
        />
        <span className="text-sm">
          Le patient a été informé du bilan et du plan de traitement proposé, et donne son accord pour
          la prise en charge.
        </span>
      </label>
    </div>
  )
}
