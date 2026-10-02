"use client"

import {
  FDI_LOWER_LEFT,
  FDI_LOWER_RIGHT,
  FDI_UPPER_LEFT,
  FDI_UPPER_RIGHT,
  conditionColors,
  type ToothRecord,
} from "@/types/dental"

interface OdontogramSvgProps {
  teeth: ToothRecord[]
  selectedTooth: string | null
  onSelectTooth: (toothNumber: string) => void
}

type ToothKind = "incisor" | "canine" | "premolar" | "molar"

function getToothKind(toothNumber: string): ToothKind {
  const pos = Number(toothNumber[1])
  if (pos <= 2) return "incisor"
  if (pos === 3) return "canine"
  if (pos <= 5) return "premolar"
  return "molar"
}

// Anatomical artwork traced from the real per-tooth reference SVGs (incisor,
// canine, premolar, molar). Each tooth is authored "root at top / crown at
// bottom" — root embedded in the pale bone patch, crown hanging free below
// it — which is the natural reading for an UPPER tooth. The lower arch reuses
// the exact same paths flipped vertically, so the crown points up into the
// mouth and the root sits in the bone patch at the bottom of the card.
//
// Every tooth shares the same four layers, in this stacking order:
//  1. bone  — pale patch of alveolar bone the root sits in
//  2. gum   — salmon gumline hugging the neck of the tooth
//  3. tooth — the enamel/root silhouette (single outline, fill + stroke)
//  4. pulp  — the root-canal/pulp-chamber highlight visible through enamel
//  5. beauty — a small white specular highlight on the crown
const TOOTH_ANATOMY: Record<
  ToothKind,
  {
    viewBox: string
    bone: string
    gum: string
    tooth: string
    pulp: { d: string; fill: string }[]
    beauty: string[]
  }
> = {
  incisor: {
    viewBox: "0 0 39.7 70.8",
    bone: "M39.6,17.5l-2.8,1.3c-2.6,1.5,0,9.3-2,11.7,0,4.8-4.6,3.8-5.9,3.7-3.9-.2-13.2,0-17.6,0s-5-3.1-5.1-3c-2.1,0-2.2-12.3-2.2-12.3l-1.5-2.2c-.2-.4-2.3-1-2.3-1.5V0h39.6v17.5h-.1Z",
    gum: "M39.1,19.1c-1.1,1-2.7,1.7-3.2,3.1-1.1,3.6-.2,7.7-1.6,11.2-2.1,5.2-6,.4-9.9.5-3.9,0-8.2-.2-11.9.5-2.3.6-4.6,2.6-7,1.2-5.7-3.8-1.8-12.8-4-17.9-.2-.9-2.1-2.3-1.1-2.9,1.1-.5,4.1,1,4.5,2.2,2.1,3.8-1.9,14.1,3.5,15.5,2.6.3,8.3-.6,13.2-.9,3.7-.6,9.4.9,11.4-2.3,2.1-3.3-.1-8.2,2.5-11.3,2.6-3.1,5.5-1.2,3.8.9h0v.2h-.1Z",
    tooth: "M18.5,3.1c-2.4,4.5-3.3,9.5-3.6,14.5-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.6,3.5-3.1,8.2-3.3,12.3-.3,6,2,11.1,8.1,11.1s16.5,1.1,16.5-4.3-.3-11.8-2.3-17-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.2-7.1-4.2-9.4",
    pulp: [
      {
        d: "M20.8,3.4c.5,0,.7,3,.3,5-.3,2.3-.1,8.6.1,11.1.4,5.8.1,5.2.3,11.3s1.7,8.7,1.2,10.6c-.6,2.9-4.9,3.3-5.1.4s1.1-7.8,1.5-12.5-.2-9.7,0-10.9c.4-3.3.1-7.5-.1-10.4s-.9-3.5,0-4.3c0,0-.6-1,1.9-.4h0Z",
        fill: "#fcc5bc",
      },
    ],
    beauty: [
      "M15.7,59.5c2-.7,3.5-1,5.1-.6,2.5.3,4.1,1.5,5.5,3-1.5-.5-3.1-.6-4.9-.4-2.1.3-3.6.6-5.2,0-.6-.3-.9-1.2-.5-1.9h0Z",
    ],
  },
  canine: {
    viewBox: "0 0 40.3 71",
    bone: "M39.2,17.2l-2.7,1.3c-2.5,1.5,0,9.1-2,11.5,0,4.7-4.5,3.7-5.8,3.6-3.8-.2-12.9,0-17.4,0s-4.9-3.1-5.1-3c-2.1,0-2.2-12.1-2.2-12.1l-1.4-2.1c-.2-.4-2.3-1-2.3-1.5V0h39v17.2h-.1Z",
    gum: "M39.7,18.3c-1.1,1.1-2.7,1.8-3.3,3.2-1.1,3.7-.2,8.1-1.6,11.7-2.1,5.4-6.2.4-10.1.5-4,0-8.4-.2-12.1.5-2.3.6-4.7,2.8-7.1,1.3C-.4,31.6,3.6,22.1,1.4,16.8c-.2-1-2.1-2.4-1.1-3,1.1-.5,4.2,1.1,4.6,2.3,2.1,3.9-2,14.8,3.5,16.2,2.6.3,8.5-.6,13.4-1,3.7-.6,9.6,1,11.5-2.4,2.1-3.4-.1-8.6,2.5-11.8s5.6-1.3,3.8,1h0v.2h0Z",
    tooth: "M18.3,4.4c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.7,6.7-3.6,11.9-4.6,18.3-.7,4.1.9,7.7,2.3,11.5,1.4,5.1,4.2,13.2,10.3,11,4.9-2.1,8.4-11.8,9.1-16.8.5-3.6.5-7.8-1.2-11.2s-3-4.9-3.3-8.1c-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4",
    pulp: [
      {
        d: "M20.4,6.4c0,2.6-.5,5.3-.3,8,.1,3.9.1,9.1.4,13.2,0,2.6,1.1,4.8,1.6,7.6.4,2.7-.3,6.4-1.4,9.2-1.8,3.7-3.4-5.6-3.4-6.6-.2-3.2,1.3-6.7,1.6-9.6.2-4.2-.2-8.8.2-13.1.1-2.4.2-4.9-.4-7.7-.3-1.5-1.2-4,.2-4.9,1.8-.7,1.5,2.3,1.6,3.6v.2h-.1Z",
        fill: "#fcc5bc",
      },
    ],
    beauty: [
      "M27.3,54.3c-.3,2.2-2.2,4.4-3.7,6.1-1,1.1-2,1.7-1.7.9v-.3c1.4-2.2,2.8-5.5,4.3-7.4.5-.4.9.2,1,.6h.1Z",
    ],
  },
  premolar: {
    viewBox: "0 0 39.8 71.2",
    bone: "M39.6,18.2l-2.8,1.3c-2.6,1.6,0,9.7-2,12.1,0,4.9-4.5,3.9-5.9,3.8-3.9-.2-13.1,0-17.7,0s-5-3.3-5.2-3.1c-2.1,0-2.2-12.8-2.2-12.8l-1.5-2.2c-.2-.4-2.3-1-2.3-1.6V0h39.7v18.2h-.1Z",
    gum: "M39.2,20c-1.1,1-2.7,1.7-3.2,3-1.1,3.5-.2,7.6-1.7,11-2,5.1-6.1.4-10,.5-3.9,0-8.2-.2-11.9.5-2.3.6-4.6,2.6-7,1.2-5.7-3.7-1.8-12.6-3.9-17.6-.2-.9-2-2.3-1.1-2.8,1.1-.5,4.2,1,4.5,2.2,2,3.7-1.9,13.9,3.5,15.2,2.6.3,8.3-.6,13.2-.9,3.7-.6,9.4.9,11.4-2.3,2-3.2-.1-8.1,2.5-11.1s5.5-1.2,3.8.9h0v.2h-.1Z",
    tooth: "M17.1,22.4c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4,1.8,8,7.5,21.1-2,24.4-1.4.2-2.9-.5-4.5-.9-3-1-5.1,1-8,1.5-8.9,1.4-6.7-14.5-4.9-19.4.9-2.3,1.9-4.7,2.1-7.3.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6,0,0,0,.2,0,.2Z",
    pulp: [
      {
        d: "M14.7,10.8c.7,1.6,0,4,.2,5.8.2,4,.7,9.8,3.7,12.7,1.3,1,3,.7,4.2-.4,3-3.2,3.9-12.1,4.5-16.6.3-1.1.8.4.9.8.9,3.7-.9,7.7-1.6,11.2-.9,3-1.9,6.8-1.2,10.6.7,4.3,4,10.9-3.7,7.2-1.3-.6-2.9,0-4.2.5-1.1.4-2.2,1.6-3.1,1-.5-.4-1.3-1.3-1.3-2s.2-1.3.3-1.9c.9-3.8,1.1-7.8.8-11.7,0-1.3-2.3-16.9.3-17.3h.2Z",
        fill: "#fcc5bc",
      },
      {
        d: "M16.8,32.1c.3-.7,0-1.7,0-2.5.4,1.9.7,4.9.5,7,0,.5-.3,1.6-.4,2,0,.2,0,0,.2-.5s.4-.9.7-1.1c.2,0,.4-.2.5-.3,0-.2,0-.4-.2-.6-.6-1.3-.7-2.8-.7-4.4s0-1.7,1-.5c1.9,1.9,2.9,0,4.4-.9.4,0,0,2.5,0,3.6s-.5,2-1,2.8h0c.6-.2,1,.2,1.3.9.2.5.3.9.3.7-.6-3.3-.6-6.9.6-10.1,0,.9-.3,2.9-.2,4.1-.2,2.5,1.9,7.2,0,8.4-1,.4-2.5-1-4-.9-1.2,0-2.5,1.2-3.6.5-1.7-1.7-.2-6.2.4-8.1h.2Z",
        fill: "#f6a09b",
      },
    ],
    beauty: [
      "M30,52.7s0-.2.1-.2v.2c0,1.4,0,2.8-.2,4.2s-1.2,3.2-2.3,4.1-.5.3-.8.2c.1-.4.3-.5.5-.8,1.3-2.2,2.2-4.7,2.6-7.6h0Z",
      "M16.2,59.9c1.7-.8,4.5-1.2,6.1.6-1.5-.4-2.9-.4-4.4,0l-2.2.8c-.8.3-1.6.4-2.3,0l2.9-1.4s-.1,0,0,0c0,0-.1,0-.1,0Z",
    ],
  },
  molar: {
    viewBox: "0 0 42.9 70.9",
    bone: "M42.4,18.2l-3.1,1.3c-2.7,1.6,0,9.7-2.1,12.1,0,4.9-4.9,3.9-6.3,3.8-4.2-.2-14,0-19,0s-5.4-3.3-5.5-3.1c-2.2,0-2.3-12.8-2.3-12.8l-1.6-2.2c-.2-.4-2.5-1-2.5-1.6V0h42.5v18.2h-.1Z",
    gum: "M42,20.8c-1.1,1-2.9,1.7-3.5,3-1.1,3.5-.2,7.6-1.7,11-2.1,5.1-6.5.4-10.7.5-4.2,0-8.7-.2-12.7.5-2.4.6-5,2.6-7.5,1.2-6.1-3.7-1.8-12.6-4.2-17.6-.2-.9-2.1-2.3-1.1-2.8,1.1-.5,4.5,1,4.8,2.2,2.1,3.7-2,13.9,3.7,15.2,2.7.3,8.8-.6,14-.9,4-.6,10.1.9,12.2-2.3,2.1-3.2,0-8.1,2.6-11.1s5.8-1.2,4.1.9h0v.2h0Z",
    tooth: "M21.3,27.7c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4,2.2,8,9.3,21.1-2.6,24.4-1.7.2-3.6-.5-5.6-.9-3.7-1-6.4,1-10,1.5-11.1,1.4-8.4-14.5-6-19.4,1.1-2.3,2.4-4.7,2.6-7.3.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.3,4.5,3.4,5.5Z",
    pulp: [
      {
        d: "M14.7,9.9c.8,1.6,0,3.8.2,5.8.1,3.9.8,8.8,3.4,11.8,2.9,3.3,4.3,2.7,7.4.1,2.7-1.9,3.6-9,4-12.7.1-1.1.2-2.7.6-3.6.1-.3.3-.5.4-.4.9.8,1,2.4,1,3.5-.4,4.4-2.8,9.1-3.3,13.8-.3,4,.8,8.7,1.6,12.6.6,2.1,0,3.2-2.2,2.4-5-1.7-5.9-3.9-11.6-.5-1,.5-2.1,1.6-3.1,1.1-.9-.9-.3-2.7,0-3.9,3.6-8.9-.7-16.1-.2-26,.2-1.6.1-3.6,1.5-4.3h.1l.2.2h0Z",
        fill: "#fcc5bc",
      },
      {
        d: "M17.5,32.7c.4-.7,0-1.6,0-2.3.5,1.7.9,4.5.6,6.4,0,.5-.4,1.5-.5,1.8,0,.2,0,0,.2-.5.2-.4.5-.8.9-1,.2,0,.5-.2.6-.2,0-.2,0-.3-.2-.6-.7-1.2-.9-2.6-.9-4s0-1.6,1.2-.4c2.4,1.7,3.6,0,5.5-.8.5,0,0,2.3,0,3.3s-.6,1.8-1.2,2.6h0c.7-.2,1.2.2,1.6.8.2.5.4.8.4.7-.7-3-.7-6.3.7-9.2,0,.8-.4,2.7-.2,3.7-.2,2.3,2.4,6.6,0,7.7-1.2.3-3.1-.9-5-.8-1.5,0-3.1,1.1-4.5.4-2.1-1.6-.2-5.7.5-7.4h.3v-.2Z",
        fill: "#f6a09b",
      },
    ],
    beauty: [
      "M34.2,52.7v-.2.2c0,1.4,0,2.8-.2,4.2s-1.5,3.2-2.9,4.1-.6.3-1,.2c.1-.4.4-.5.6-.8,1.6-2.2,2.7-4.7,3.2-7.6h.3Z",
      "M16.9,59.9c2.1-.8,5.6-1.2,7.6.6-1.9-.4-3.6-.4-5.5,0l-2.7.8c-1,.3-2,.4-2.9,0l3.6-1.4h0Z",
    ],
  },
}

const BONE_FILL = "#fdecc5"
const GUM_FILL = "#f79f9a"
const TOOTH_FILL = "#ebebeb"
const TOOTH_STROKE = "#c8c9c9"

function ToothGraphic({ kind, upper, selected }: { kind: ToothKind; upper: boolean; selected: boolean }) {
  const a = TOOTH_ANATOMY[kind]
  const strokeColor = selected ? "var(--primary)" : TOOTH_STROKE

  return (
    <svg viewBox={a.viewBox} className="h-full w-full overflow-visible" aria-hidden="true">
      <g transform={upper ? undefined : `translate(0, ${a.viewBox.split(" ")[3]}) scale(1, -1)`}>
        <path d={a.bone} fill={BONE_FILL} />
        <path d={a.gum} fill={GUM_FILL} />
        <path
          d={a.tooth}
          fill={TOOTH_FILL}
          stroke={strokeColor}
          strokeWidth={selected ? 1.4 : 0.75}
          strokeLinejoin="round"
        />
        {a.pulp.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
        {a.beauty.map((d, i) => (
          <path key={i} d={d} fill="#fefefe" />
        ))}
      </g>
    </svg>
  )
}

function ToothCell({
  toothNumber,
  record,
  selected,
  upper,
  onClick,
}: {
  toothNumber: string
  record: ToothRecord | undefined
  selected: boolean
  upper: boolean
  onClick: () => void
}) {
  const kind = getToothKind(toothNumber)
  const hasCondition = record && record.condition !== "healthy"
  const conditionColor = record ? conditionColors[record.condition] : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hasCondition ? `Tooth ${toothNumber} — ${record!.condition}` : `Tooth ${toothNumber}`}
      className="group relative aspect-[40/71] w-full overflow-hidden rounded-md border bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        borderColor: selected ? "var(--primary)" : hasCondition ? conditionColor : "var(--border)",
        borderWidth: selected ? 1.5 : 1,
      }}
    >
      <ToothGraphic kind={kind} upper={upper} selected={selected} />
      {hasCondition && (
        <span
          className="absolute right-1 top-1 h-2 w-2 rounded-full ring-1 ring-white"
          style={{ backgroundColor: conditionColor }}
        />
      )}
    </button>
  )
}

function NumberLabel({
  toothNumber,
  selected,
  onClick,
}: {
  toothNumber: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-center text-xs tabular-nums transition-colors"
      style={{
        fontWeight: selected ? 700 : 500,
        color: selected ? "var(--primary)" : "var(--muted-foreground)",
      }}
    >
      {toothNumber}
    </button>
  )
}

export function OdontogramSvg({ teeth, selectedTooth, onSelectTooth }: OdontogramSvgProps) {
  // Continuous left-to-right rows, no quadrant divider — one arch reads as
  // one unbroken row, matching the reference chart.
  const upperNumbers = [...FDI_UPPER_RIGHT].reverse().concat(FDI_UPPER_LEFT)
  const lowerNumbers = [...FDI_LOWER_RIGHT].reverse().concat(FDI_LOWER_LEFT)
  const cols = upperNumbers.length
  // Flexible tracks, but now bounded by the container's own width (`w-full`,
  // not content-sized) rather than by nothing — so columns shrink evenly to
  // fit whatever space is available, and only fall back to horizontal
  // scroll (via the parent's overflow-x-auto) once they hit the floor.
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(2.25rem, 1fr))` }

  return (
    <div className="w-full rounded-2xl border bg-muted/20 p-3 sm:p-4">
      <div className="grid gap-x-1 gap-y-1" style={gridStyle}>
        {upperNumbers.map((n) => (
          <NumberLabel key={`ln-${n}`} toothNumber={n} selected={selectedTooth === n} onClick={() => onSelectTooth(n)} />
        ))}

        {upperNumbers.map((n) => {
          const record = teeth.find((t) => t.toothNumber === n)
          return (
            <ToothCell
              key={`u-${n}`}
              toothNumber={n}
              record={record}
              selected={selectedTooth === n}
              upper
              onClick={() => onSelectTooth(n)}
            />
          )
        })}

        {lowerNumbers.map((n) => {
          const record = teeth.find((t) => t.toothNumber === n)
          return (
            <ToothCell
              key={`l-${n}`}
              toothNumber={n}
              record={record}
              selected={selectedTooth === n}
              upper={false}
              onClick={() => onSelectTooth(n)}
            />
          )
        })}

        {lowerNumbers.map((n) => (
          <NumberLabel key={`ld-${n}`} toothNumber={n} selected={selectedTooth === n} onClick={() => onSelectTooth(n)} />
        ))}
      </div>
    </div>
  )
}