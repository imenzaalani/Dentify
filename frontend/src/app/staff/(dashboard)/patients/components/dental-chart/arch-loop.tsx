"use client"

import { Odontogram, type ToothDetail } from "react-odontogram"
import "react-odontogram/style.css"
import { conditionColors, type ToothRecord } from "@/types/dental"

interface ArchLoopProps {
  teeth: ToothRecord[]
  selectedTooth: string | null
  onSelectTooth: (toothNumber: string) => void
}

export function ArchLoop({ teeth, selectedTooth, onSelectTooth }: ArchLoopProps) {
  // Group tooth records by condition so react-odontogram can paint each
  // group with the same color your OdontogramSvg / legend already use.
  const teethConditions = Object.entries(
    teeth.reduce<Record<string, string[]>>((groups, record) => {
      const key = record.condition
      groups[key] = groups[key] ?? []
      groups[key].push(`teeth-${record.toothNumber}`)
      return groups
    }, {})
  ).map(([condition, teethIds]) => ({
    label: condition,
    teeth: teethIds,
    fillColor: conditionColors[condition as keyof typeof conditionColors],
    outlineColor: conditionColors[condition as keyof typeof conditionColors],
  }))

  const handleChange = (selected: ToothDetail[]) => {
    const tooth = selected[0]
    if (tooth) onSelectTooth(tooth.notations.fdi)
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 220 }}>
      <Odontogram
        // remounts when selection changes externally (e.g. from the
        // records list) since the library only supports an *initial*
        // selection, not a controlled one — see caveat below
        key={selectedTooth ?? "none"}
        defaultSelected={selectedTooth ? [`teeth-${selectedTooth}`] : []}
        singleSelect
        layout="circle"
        notation="FDI"
        readOnly={false}
        showLabels={false}
        teethConditions={teethConditions}
        onChange={handleChange}
      />
    </div>
  )
}