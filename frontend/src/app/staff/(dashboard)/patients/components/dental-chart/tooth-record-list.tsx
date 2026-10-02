"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  archLabel, conditionColors, conditionLabels, positionInArch,
  type ToothCondition, type ToothRecord,
} from "@/types/dental"

interface ToothRecordListProps {
  teeth: ToothRecord[]
  onSelectTooth: (toothNumber: string) => void
}

export function ConditionLegend({ conditions }: { conditions: ToothCondition[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {conditions.map((c) => (
        <div key={c} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: conditionColors[c] }} />
          {conditionLabels[c]}
        </div>
      ))}
    </div>
  )
}

export function ToothRecordList({ teeth, onSelectTooth }: ToothRecordListProps) {
  const sorted = [...teeth].sort((a, b) => a.toothNumber.localeCompare(b.toothNumber))
  if (sorted.length === 0) {
    return <p className="text-muted-foreground text-sm">No dental records for this patient yet.</p>
  }
  return (
    <div className="space-y-2">
      {sorted.map((t) => (
        <Card key={t.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => onSelectTooth(t.toothNumber)}>
          <CardContent className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{archLabel(t.toothNumber)} {positionInArch(t.toothNumber)}</p>
              <p className="text-muted-foreground text-xs">Issue <span className="font-medium">{conditionLabels[t.condition]}</span></p>
            </div>
            <div className="text-right">
              <span className="mb-1 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: conditionColors[t.condition] }} />
              {t.lastManipulationDate && <p className="text-muted-foreground text-xs">{t.lastManipulationDate}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}