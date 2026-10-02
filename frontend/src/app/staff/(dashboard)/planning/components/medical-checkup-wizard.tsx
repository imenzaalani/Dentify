"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { checkupApi } from "@/lib/api/checkups"
import type { MedicalCheckup, MedicalCheckupSubmitRequest, ToothRecord } from "@/types/dental"

import { StepMedicalData, EMPTY_MEDICAL_DATA, type MedicalDataFormState } from "./checkup-steps/step-medical-data"
import { StepTreatmentPlan } from "./checkup-steps/step-treatment-plan"
import { StepOralCheck, EMPTY_ORAL_CHECK, type OralCheckFormState } from "./checkup-steps/step-oral-check"
import { StepAgreement } from "./checkup-steps/step-agreement"

const STEPS = [
  { key: "medical-data", label: "Données médicales" },
  { key: "treatment-plan", label: "Schéma dentaire" },
  { key: "oral-check", label: "Examen buccal" },
  { key: "agreement", label: "Accord patient" },
] as const

interface MedicalCheckupWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  patientId: string
  /** Pre-fill when resuming a checkup that was already started ("En cours — à reprendre"). */
  existingCheckup?: MedicalCheckup | null
  onSaved?: (checkup: MedicalCheckup) => void
}

function buildSubmission(
  patientId: string,
  medicalData: MedicalDataFormState,
  toothUpdates: ToothRecord[],
  oralCheck: OralCheckFormState,
  status: "in_progress" | "completed"
): MedicalCheckupSubmitRequest {
  const conditions = medicalData.conditionsOther
    ? [...medicalData.conditions, medicalData.conditionsOther]
    : medicalData.conditions

  return {
    patient_id: patientId,
    blood_pressure_systolic: medicalData.bloodPressureSystolic
      ? Number(medicalData.bloodPressureSystolic)
      : null,
    blood_pressure_diastolic: medicalData.bloodPressureDiastolic
      ? Number(medicalData.bloodPressureDiastolic)
      : null,
    conditions,
    conditions_other: medicalData.conditionsOther || null,
    allergies: medicalData.allergies || null,
    tooth_updates: toothUpdates.map((t) => ({ tooth_number: t.toothNumber, condition: t.condition })),
    occlusion: oralCheck.occlusion,
    torus_palatinus: oralCheck.torusPalatinus,
    torus_mandibularis: oralCheck.torusMandibularis,
    palatum: oralCheck.palatum,
    diastema: oralCheck.diastema || null,
    status,
  }
}

export function MedicalCheckupWizard({
  open,
  onOpenChange,
  appointmentId,
  patientId,
  existingCheckup,
  onSaved,
}: MedicalCheckupWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [medicalData, setMedicalData] = useState<MedicalDataFormState>(EMPTY_MEDICAL_DATA)
  // Only teeth touched in this checkup, not the patient's whole chart — no
  // dental/odontogram GET endpoint exists yet to preload the rest (see
  // dental-chart.tsx's own TODO), so the wizard starts blank rather than
  // pretending to know the patient's existing chart.
  const [toothUpdates, setToothUpdates] = useState<ToothRecord[]>([])
  const [oralCheck, setOralCheck] = useState<OralCheckFormState>(EMPTY_ORAL_CHECK)
  const [consentGiven, setConsentGiven] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-sync from the existing checkup (or reset) every time the dialog
  // opens — same reason ReservationDetailPanel re-fetches the patient on
  // open: this component stays mounted, so stale state would otherwise
  // leak between appointments.
  useEffect(() => {
    if (!open) return
    setStepIndex(0)
    setError(null)
    setConsentGiven(false)
    setToothUpdates([])
    if (existingCheckup) {
      setMedicalData({
        bloodPressureSystolic: existingCheckup.blood_pressure_systolic?.toString() ?? "",
        bloodPressureDiastolic: existingCheckup.blood_pressure_diastolic?.toString() ?? "",
        conditions: existingCheckup.conditions,
        conditionsOther: existingCheckup.conditions_other ?? "",
        allergies: existingCheckup.allergies ?? "",
      })
      setOralCheck({
        occlusion: existingCheckup.occlusion,
        torusPalatinus: existingCheckup.torus_palatinus,
        torusMandibularis: existingCheckup.torus_mandibularis,
        palatum: existingCheckup.palatum,
        diastema: existingCheckup.diastema ?? "",
      })
    } else {
      setMedicalData(EMPTY_MEDICAL_DATA)
      setOralCheck(EMPTY_ORAL_CHECK)
    }
  }, [open, existingCheckup])

  const isLastStep = stepIndex === STEPS.length - 1
  const canGoNext = !isLastStep || consentGiven

  const persist = async (status: "in_progress" | "completed") => {
    setSaving(true)
    setError(null)
    try {
      const submission = buildSubmission(patientId, medicalData, toothUpdates, oralCheck, status)
      const saved = await checkupApi.saveCheckup(appointmentId, submission)
      onSaved?.(saved)
      return saved
    } catch {
      setError("Échec de l'enregistrement. Réessayez.")
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    // Save progress as the user advances so a checkup closed midway shows
    // "En cours — à reprendre" in the panel instead of vanishing.
    const saved = await persist("in_progress")
    if (!saved) return
    if (isLastStep) {
      onOpenChange(false)
      return
    }
    setStepIndex((i) => i + 1)
  }

  const handleFinish = async () => {
    const saved = await persist("completed")
    if (saved) onOpenChange(false)
  }

  const handleBack = () => {
    if (stepIndex === 0) {
      onOpenChange(false)
      return
    }
    setStepIndex((i) => i - 1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="p-5 pb-4 border-b">
          <DialogTitle>Bilan médical</DialogTitle>
          <DialogDescription className="sr-only">
            Bilan médical en 4 étapes avant la prise en charge du patient
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                    i < stepIndex
                      ? "bg-primary text-primary-foreground"
                      : i === stepIndex
                      ? "bg-primary/15 text-primary border border-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs whitespace-nowrap hidden sm:inline",
                    i === stepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {stepIndex === 0 && <StepMedicalData value={medicalData} onChange={setMedicalData} />}
          {stepIndex === 1 && <StepTreatmentPlan value={toothUpdates} onChange={setToothUpdates} />}
          {stepIndex === 2 && <StepOralCheck value={oralCheck} onChange={setOralCheck} />}
          {stepIndex === 3 && (
            <StepAgreement
              medicalData={medicalData}
              toothUpdates={toothUpdates}
              oralCheck={oralCheck}
              consentGiven={consentGiven}
              onConsentChange={setConsentGiven}
            />
          )}
        </div>

        <DialogFooter className="p-4 border-t flex-row items-center justify-between sm:justify-between">
          {error && <p className="text-xs text-destructive mr-auto">{error}</p>}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" className="cursor-pointer" onClick={handleBack} disabled={saving}>
              {stepIndex === 0 ? "Annuler" : "Précédent"}
            </Button>
            {isLastStep ? (
              <Button className="cursor-pointer" onClick={handleFinish} disabled={saving || !canGoNext}>
                Valider le bilan
              </Button>
            ) : (
              <Button className="cursor-pointer" onClick={handleNext} disabled={saving}>
                Suivant
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
