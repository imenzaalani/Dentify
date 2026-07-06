import {
  TreatmentProgressSummary,
  type TreatmentSummary,
} from "./components/treatment-progress-summary"
import { TreatmentTimeline, type TreatmentStep } from "./components/treatment-timeline"

import treatmentData from "./data.json"

export default function PatientTreatmentPage() {
  const { treatment, steps } = treatmentData as {
    treatment: TreatmentSummary
    steps: TreatmentStep[]
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <h1 className="text-2xl font-semibold">My Treatment</h1>
        <p className="text-sm text-muted-foreground">
          A timeline of your care journey, from first consultation to completion.
        </p>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <TreatmentProgressSummary treatment={treatment} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        {steps.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No treatment plan on file yet.
          </div>
        ) : (
          <TreatmentTimeline steps={steps} />
        )}
      </div>
    </div>
  )
}
