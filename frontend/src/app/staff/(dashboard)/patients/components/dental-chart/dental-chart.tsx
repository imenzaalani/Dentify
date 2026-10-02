"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OdontogramSvg } from "./odontogram-svg"
import { ArchLoop } from "./arch-loop"
import { ToothDetailSheet } from "./tooth-detail-sheet"
import { ConditionSummaryChart } from "./condition-summary-chart"
import { ConditionLegend, ToothRecordList } from "./tooth-record-list"
import type { ToothCondition, ToothRecord } from "@/types/dental"

// TODO(backend): no dental/odontogram endpoints exist yet — mock data only,
// same as Billing/Documents/Treatments were before they got wired up.
// Swap for `dentalApi.get(patientId)` once the backend route exists.
const MOCK_TEETH: ToothRecord[] = [
  {
    id: "1", toothNumber: "25", condition: "implantation",
    doctor: "Dr. Jeeves Wooster", lastManipulationDate: "2026-06-17",
    notes: "Implantation surgery was performed as planned without complications. The patient received recommendations.",
    surgicalKit: "Nobel Replace Tapered", implantManufacturer: "Nobel Replace Select",
    implantModel: "Nobel Replace Tapered", implantSizesNeeded: "1 x 3.5mm x 10mm, 3 x 4.3mm x 11.5mm",
  },
  { id: "2", toothNumber: "11", condition: "removal", doctor: "Dr. Jeeves Wooster", lastManipulationDate: "2026-09-06" },
  { id: "3", toothNumber: "16", condition: "caries", doctor: "Dr. Jeeves Wooster", lastManipulationDate: "2026-03-12" },
  { id: "4", toothNumber: "36", condition: "periodontitis" },
  { id: "5", toothNumber: "46", condition: "gingivitis" },
]

const LEGEND_CONDITIONS: ToothCondition[] = [
  "caries", "surgery", "implantation", "gingivitis", "periodontitis", "removal", "periostitis",
]

interface DentalChartProps { patientId: string }

export function DentalChart({ patientId }: DentalChartProps) {
  const [teeth] = useState<ToothRecord[]>(MOCK_TEETH)
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleSelectTooth = (toothNumber: string) => {
    setSelectedTooth(toothNumber)
    setSheetOpen(true)
  }

  const selectedRecord = teeth.find((t) => t.toothNumber === selectedTooth) ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      {/* Left column */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Arch overview</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <ArchLoop teeth={teeth} selectedTooth={selectedTooth} onSelectTooth={handleSelectTooth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Tooth records</CardTitle></CardHeader>
          <CardContent className="max-h-[320px] overflow-y-auto pr-1">
            <ToothRecordList teeth={teeth} onSelectTooth={handleSelectTooth} />
          </CardContent>
        </Card>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Odontogram</CardTitle>
            <ConditionLegend conditions={LEGEND_CONDITIONS} />
          </CardHeader>
          <CardContent className="flex justify-center overflow-x-auto py-6">
            <OdontogramSvg teeth={teeth} selectedTooth={selectedTooth} onSelectTooth={handleSelectTooth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Chart</CardTitle></CardHeader>
          <CardContent><ConditionSummaryChart teeth={teeth} /></CardContent>
        </Card>
      </div>

      <ToothDetailSheet tooth={selectedRecord} toothNumber={selectedTooth} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}